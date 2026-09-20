import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// The in-app library of WhatsApp message templates (the actual text AiSensy
// sends) — managed only from the admin panel (Vrushali's own dashboard), the
// same pattern as /api/admin/banners and /api/admin/starter-templates. A
// business never creates these themselves; they just pick one while editing
// a flyer template to see what it says and fill in the campaign name field.

const OCCASIONS = new Set(['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL', 'ALL']);

export async function GET(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const templates = await prisma.messageTemplate.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const campaignName = typeof body?.campaignName === 'string' ? body.campaignName.trim() : '';
  const bodyText = typeof body?.bodyText === 'string' ? body.bodyText.trim() : '';
  const occasion = typeof body?.occasion === 'string' && OCCASIONS.has(body.occasion) ? body.occasion : 'ALL';

  if (!name || !campaignName || !bodyText) {
    return NextResponse.json({ error: 'Name, AiSensy campaign name and message text are all required.' }, { status: 400 });
  }

  const maxOrder = await prisma.messageTemplate.aggregate({ _max: { order: true } });
  const template = await prisma.messageTemplate.create({
    data: { name, occasion, campaignName, bodyText, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json({ template }, { status: 201 });
}
