import { z } from 'zod';
import { prisma } from './db';
import {
  buildTemplateParams,
  inputVariables,
  validateTemplateBody,
  parseVariableValues,
  parseVariables,
  templateFitsOccasion,
  type SendContext,
  type SendOccasion,
} from './messageTemplateVars';

/**
 * Server-side helpers for WhatsApp text message templates (see the
 * MessageTemplate / MessageTemplateSelection / AppSetting models). Pure
 * parsing/preview helpers live in messageTemplateVars.ts so the UI can share
 * them.
 */

export const CUSTOM_TEMPLATE_PRICE_KEY = 'customMessageTemplatePricePaise';

/** Price (paise) a business pays to submit one custom message template for approval — set by admin. */
export async function getCustomTemplatePricePaise(): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key: CUSTOM_TEMPLATE_PRICE_KEY } });
  const n = row ? Number(row.value) : 0;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export async function setCustomTemplatePricePaise(pricePaise: number): Promise<void> {
  const value = String(Math.max(0, Math.round(pricePaise)));
  await prisma.appSetting.upsert({
    where: { key: CUSTOM_TEMPLATE_PRICE_KEY },
    create: { key: CUSTOM_TEMPLATE_PRICE_KEY, value },
    update: { value },
  });
}

export const variableSchema = z.object({
  index: z.number().int().positive(),
  label: z.string().trim().min(1).max(60),
  source: z.enum(['CONTACT_NAME', 'OCCASION', 'BUSINESS_NAME', 'DATE', 'INPUT']),
  sample: z.string().max(200).optional(),
});

export const occasionSchema = z.enum(['ANY', 'BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL']);

/** Body shape for a business creating/editing its own CUSTOM template. */
export const customTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required').max(80),
  occasion: occasionSchema,
  body: z.string(),
  variables: z.array(variableSchema),
});

/** Body shape for admin creating/editing a GENERAL/SPECIAL template. */
export const adminTemplateSchema = customTemplateSchema.extend({
  category: z.enum(['GENERAL', 'SPECIAL']),
  aisensyCampaignName: z.string().trim().min(1, 'AiSensy campaign name is required'),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

/**
 * Admin-made templates offered to every business are either GENERAL (all
 * variables auto-filled) or SPECIAL (at least one variable the business
 * fills in, e.g. an offer). Returns an error message, or null if valid.
 */
export function adminTemplateError(data: z.infer<typeof adminTemplateSchema>): string | null {
  const bodyError = validateTemplateBody(data.body, data.variables);
  if (bodyError) return bodyError;
  const inputs = inputVariables(data.variables).length;
  if (data.category === 'SPECIAL' && inputs === 0) {
    return 'A special template needs at least one variable "Filled in by the business" (e.g. the offer).';
  }
  if (data.category === 'GENERAL' && inputs > 0) {
    return 'A general template can only use auto-filled variables — make it a special template instead.';
  }
  return null;
}

/**
 * Whether a business may use this template right now: admin-made ones must
 * be active with a campaign configured; custom ones must belong to this
 * business and be approved.
 */
export function isTemplateUsableBy(
  t: { businessId: string | null; category: string; status: string; isActive: boolean; aisensyCampaignName: string | null },
  businessId: string
): boolean {
  if (!t.aisensyCampaignName) return false;
  if (t.category === 'CUSTOM') return t.businessId === businessId && t.status === 'APPROVED';
  return t.businessId === null && t.isActive && t.status === 'APPROVED';
}

export interface ResolvedMessageTemplate {
  campaignName: string;
  buildParams: (ctx: SendContext) => string[];
}

/**
 * The message template a business picked for this occasion (Dashboard →
 * Message templates), if any and still usable — used by sendWish.ts in
 * place of the default campaign and its fixed 3-variable text.
 */
export async function resolveMessageTemplateForSend(
  businessId: string,
  occasion: SendOccasion
): Promise<ResolvedMessageTemplate | null> {
  const selection = await prisma.messageTemplateSelection.findUnique({
    where: { businessId_occasion: { businessId, occasion } },
    include: { messageTemplate: true },
  });
  if (!selection) return null;
  const t = selection.messageTemplate;
  if (!isTemplateUsableBy(t, businessId) || !templateFitsOccasion(t.occasion, occasion)) return null;

  const variables = parseVariables(t.variables);
  const values = parseVariableValues(selection.variableValues);
  return {
    campaignName: t.aisensyCampaignName!,
    buildParams: (ctx) => buildTemplateParams(variables, ctx, values),
  };
}
