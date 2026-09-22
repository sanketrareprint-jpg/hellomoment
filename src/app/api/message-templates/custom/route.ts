import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiBusiness } from '@/lib/session';
import { customTemplateSchema } from '@/lib/messageTemplates';
import { validateTemplateBody } from '@/lib/messageTemplateVars';

/** Creates a business's own custom message template as a DRAFT — it's paid for and submitted separately (see ./[id]/submit). */
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const json = await req.json().catch(() => null);
  const parsed = customTemplateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { name, occasion, body, variables } = parsed.data;
  const bodyError = validateTemplateBody(body, variables);
  if (bodyError) return NextResponse.json({ error: bodyError }, { status: 400 });

  const template = await prisma.messageTemplate.create({
    data: {
      businessId: business.id,
      category: 'CUSTOM',
      status: 'DRAFT',
      name,
      occasion,
      body,
      variables: JSON.stringify(variables),
    },
  });
  return NextResponse.json({ template }, { status: 201 });
}
