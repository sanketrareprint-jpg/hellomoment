import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';

type RawRow = Record<string, unknown>;

const RELATIONSHIP_VALUES = ['CUSTOMER', 'FRIEND', 'FAMILY', 'OTHER'];

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

// Accepts a handful of common header spellings so businesses don't have to
// reformat their existing spreadsheet just to match our exact column names.
const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  fullname: 'name',
  customername: 'name',
  whatsapp: 'whatsapp',
  whatsappnumber: 'whatsapp',
  phone: 'whatsapp',
  phonenumber: 'whatsapp',
  mobile: 'whatsapp',
  mobilenumber: 'whatsapp',
  dob: 'dob',
  dateofbirth: 'dob',
  birthday: 'dob',
  birthdate: 'dob',
  anniversary: 'anniversary',
  anniversarydate: 'anniversary',
  weddinganniversary: 'anniversary',
  relationship: 'relationship',
  type: 'relationship',
  notes: 'notes',
  note: 'notes',
};

function mapRow(row: RawRow): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const norm = normalizeKey(key);
    const field = HEADER_ALIASES[norm];
    if (field && value != null && String(value).trim() !== '') {
      mapped[field] = String(value).trim();
    }
  }
  return mapped;
}

/** Parses a date cell that might be "YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY", or an Excel serial date number. */
function parseDateCell(value: string | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    // Excel serial date (days since 1899-12-30)
    const serial = Number(trimmed);
    const ms = Math.round((serial - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
  }
  return null;
}

export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';

  let rawRows: RawRow[] = [];
  try {
    if (isCsv) {
      rawRows = parse(buffer, { columns: true, skip_empty_lines: true, trim: true }) as RawRow[];
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as RawRow[];
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not read that file. Please upload a valid CSV or XLSX file.' },
      { status: 400 }
    );
  }

  if (rawRows.length === 0) {
    return NextResponse.json({ error: 'The file has no rows to import.' }, { status: 400 });
  }
  if (rawRows.length > 5000) {
    return NextResponse.json({ error: 'Please import at most 5,000 contacts at a time.' }, { status: 400 });
  }

  const errors: { row: number; message: string }[] = [];
  const toCreate: {
    name: string;
    whatsapp: string;
    dob: Date | null;
    anniversary: Date | null;
    relationship: 'CUSTOMER' | 'FRIEND' | 'FAMILY' | 'OTHER';
    notes: string | null;
  }[] = [];

  rawRows.forEach((raw, i) => {
    const rowNum = i + 2; // account for header row, 1-indexed
    const row = mapRow(raw);

    if (!row.name) {
      errors.push({ row: rowNum, message: 'Missing name' });
      return;
    }
    if (!row.whatsapp) {
      errors.push({ row: rowNum, message: 'Missing WhatsApp number' });
      return;
    }

    const dob = row.dob ? parseDateCell(row.dob) : null;
    if (row.dob && !dob) {
      errors.push({ row: rowNum, message: `Could not parse date of birth "${row.dob}"` });
      return;
    }
    const anniversary = row.anniversary ? parseDateCell(row.anniversary) : null;
    if (row.anniversary && !anniversary) {
      errors.push({ row: rowNum, message: `Could not parse anniversary "${row.anniversary}"` });
      return;
    }

    const relationshipRaw = (row.relationship || 'CUSTOMER').toUpperCase();
    const relationship = (RELATIONSHIP_VALUES.includes(relationshipRaw) ? relationshipRaw : 'CUSTOMER') as
      | 'CUSTOMER'
      | 'FRIEND'
      | 'FAMILY'
      | 'OTHER';

    toCreate.push({
      name: row.name,
      whatsapp: row.whatsapp,
      dob,
      anniversary,
      relationship,
      notes: row.notes || null,
    });
  });

  let created = 0;
  if (toCreate.length > 0) {
    const result = await prisma.contact.createMany({
      data: toCreate.map((c) => ({ ...c, businessId: business.id })),
    });
    created = result.count;
  }

  return NextResponse.json({
    totalRows: rawRows.length,
    created,
    skipped: errors.length,
    errors: errors.slice(0, 50), // cap response size for very messy files
  });
}
