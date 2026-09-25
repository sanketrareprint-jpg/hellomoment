import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { validateTemplateBody } from '@/lib/messageTemplateVars';
import { customTemplateSchema } from '@/lib/messageTemplates';

async function loadOwnedCustom(businessId: string, id: string) {
  const t = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!t || t.category !== 'CUSTOM' || t.businessId !== businessId) return null;
  return t;
}

/** Edits a custom template — only while it's a DRAFT or was REJECTED (pending/approved text is locked). */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const existing = await loadOwnedCustom(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
    return NextResponse.json({ error: 'This template is already submitted and can no longer be edited.' }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = customTemplateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { name, occasion, body, variables } = parsed.data;
  const bodyError = validateTemplateBody(body, variables);
  if (bodyError) return NextResponse.json({ error: bodyError }, { status: 400 });

  const template = await prisma.messageTemplate.update({
    where: { id: existing.id },
    data: { name, occasion, body, variables: JSON.stringify(variables) },
  });
  return NextResponse.json({ template });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;
  const existing = await loadOwnedCustom(business.id, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.messageTemplate.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
