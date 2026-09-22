import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { isTemplateUsableBy } from '@/lib/messageTemplates';
import { inputVariables, parseVariables, templateFitsOccasion } from '@/lib/messageTemplateVars';

const schema = z.object({
  occasion: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL']),
  messageTemplateId: z.string().min(1).nullable(),
  variableValues: z.record(z.string().max(200)).optional(),
});

/**
 * Sets (or clears, with messageTemplateId: null) which message template this
 * business sends with its flyers for one occasion, plus its typed values
 * for the template's "filled in by the business" variables.
 */
export async function PUT(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { occasion, messageTemplateId, variableValues = {} } = parsed.data;

  if (!messageTemplateId) {
    await prisma.messageTemplateSelection.deleteMany({ where: { businessId: business.id, occasion } });
    return NextResponse.json({ ok: true });
  }

  const template = await prisma.messageTemplate.findUnique({ where: { id: messageTemplateId } });
  if (!template || !isTemplateUsableBy(template, business.id)) {
    return NextResponse.json({ error: 'This template is not available to use yet.' }, { status: 400 });
  }
  if (!templateFitsOccasion(template.occasion, occasion)) {
    return NextResponse.json({ error: 'This template is not meant for that occasion.' }, { status: 400 });
  }

  const inputs = inputVariables(parseVariables(template.variables));
  const cleanValues: Record<string, string> = {};
  for (const v of inputs) {
    const value = variableValues[String(v.index)]?.trim() ?? '';
    if (!value) return NextResponse.json({ error: `Fill in "${v.label}".` }, { status: 400 });
    cleanValues[String(v.index)] = value;
  }

  await prisma.messageTemplateSelection.upsert({
    where: { businessId_occasion: { businessId: business.id, occasion } },
    create: { businessId: business.id, occasion, messageTemplateId, variableValues: JSON.stringify(cleanValues) },
    update: { messageTemplateId, variableValues: JSON.stringify(cleanValues) },
  });
  return NextResponse.json({ ok: true });
}
