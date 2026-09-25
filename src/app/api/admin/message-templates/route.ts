import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { adminTemplateError, adminTemplateSchema } from '@/lib/messageTemplates';

export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const json = await req.json().catch(() => null);
  const parsed = adminTemplateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const error = adminTemplateError(parsed.data);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { variables, ...rest } = parsed.data;
  const template = await prisma.messageTemplate.create({
    data: { ...rest, variables: JSON.stringify(variables), businessId: null, status: 'APPROVED' },
  });
  return NextResponse.json({ template }, { status: 201 });
}
