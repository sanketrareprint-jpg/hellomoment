import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { adminTemplateError, adminTemplateSchema } from '@/lib/messageTemplates';

async function loadAdminTemplate(id: string) {
  const t = await prisma.messageTemplate.findUnique({ where: { id } });
  return t && t.category !== 'CUSTOM' ? t : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;
  if (!(await loadAdminTemplate(params.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = adminTemplateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const error = adminTemplateError(parsed.data);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { variables, ...rest } = parsed.data;
  const template = await prisma.messageTemplate.update({
    where: { id: params.id },
    data: { ...rest, variables: JSON.stringify(variables) },
  });
  return NextResponse.json({ template });
}

/** Deletes any message template (admin-made, or a business's custom one); businesses using it fall back to the default message. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;
  const existing = await prisma.messageTemplate.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.messageTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
