/**
 * Pure (client-safe) helpers for WhatsApp text message templates — see the
 * MessageTemplate model in prisma/schema.prisma. No Prisma/Node imports here
 * so both the dashboard/admin UI and the server can share one definition of
 * how {{n}} variables are parsed, validated, previewed and filled.
 */

export type MessageTemplateCategory = 'GENERAL' | 'SPECIAL' | 'CUSTOM';
export type MessageTemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type MessageTemplateOccasion = 'ANY' | 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL';
export type SendOccasion = 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL';

export const SEND_OCCASIONS: SendOccasion[] = ['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL'];
export const TEMPLATE_OCCASIONS: MessageTemplateOccasion[] = ['ANY', 'BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL'];

export const OCCASION_LABELS: Record<MessageTemplateOccasion, string> = {
  ANY: 'Any occasion',
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

// Where each {{n}} gets its value at send time. Everything except INPUT is
// filled automatically per contact; INPUT is typed by the business when it
// picks the template (e.g. the offer, a coupon code).
export type MessageVariableSource = 'CONTACT_NAME' | 'OCCASION' | 'BUSINESS_NAME' | 'DATE' | 'INPUT';

export const VARIABLE_SOURCE_LABELS: Record<MessageVariableSource, string> = {
  CONTACT_NAME: "Contact's name (auto)",
  OCCASION: 'Occasion / festival name (auto)',
  BUSINESS_NAME: 'Your business name (auto)',
  DATE: 'Date (auto)',
  INPUT: 'Filled in by the business',
};

export interface MessageVariable {
  index: number; // 1-based, matches {{index}} in the body
  label: string; // e.g. "Offer", "Coupon code"
  source: MessageVariableSource;
  sample?: string; // example value — shown in previews and sent to WhatsApp for approval
}

export interface SendContext {
  contactName: string;
  occasionWord: string;
  businessName: string;
  dateText: string;
}

const VAR_RE = /\{\{\s*(\d+)\s*\}\}/g;

/** Distinct {{n}} indexes used in a body, sorted ascending. */
export function extractVariableIndexes(body: string): number[] {
  const set = new Set<number>();
  for (const m of body.matchAll(VAR_RE)) set.add(Number(m[1]));
  return Array.from(set).sort((a, b) => a - b);
}

export function parseVariables(json: string | null | undefined): MessageVariable[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as MessageVariable[]) : [];
  } catch {
    return [];
  }
}

export function parseVariableValues(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * Keeps the variable list in step with the body as it's typed: one entry per
 * {{n}} found, reusing whatever label/source/sample was already set for that
 * index. New variables default to INPUT.
 */
export function syncVariablesWithBody(body: string, existing: MessageVariable[]): MessageVariable[] {
  return extractVariableIndexes(body).map((index) => {
    const prev = existing.find((v) => v.index === index);
    return prev ?? { index, label: `Variable ${index}`, source: 'INPUT', sample: '' };
  });
}

/**
 * Returns an error message, or null if the body/variables are valid:
 * variables must be numbered {{1}}..{{n}} with no gaps (WhatsApp's rule) and
 * each must have a matching definition.
 */
export function validateTemplateBody(body: string, variables: MessageVariable[]): string | null {
  if (!body.trim()) return 'Message text is required.';
  if (body.length > 1024) return 'Message text must be 1024 characters or fewer (WhatsApp limit).';
  const indexes = extractVariableIndexes(body);
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== i + 1) return 'Variables must be numbered in order with no gaps: {{1}}, {{2}}, {{3}}…';
  }
  if (variables.length !== indexes.length) return 'Every {{n}} in the message needs a matching variable definition.';
  for (const idx of indexes) {
    const v = variables.find((x) => x.index === idx);
    if (!v) return `Variable {{${idx}}} is not defined.`;
    if (!v.label.trim()) return `Give variable {{${idx}}} a name.`;
  }
  return null;
}

export function inputVariables(variables: MessageVariable[]): MessageVariable[] {
  return variables.filter((v) => v.source === 'INPUT');
}

function valueFor(v: MessageVariable, ctx: SendContext, values: Record<string, string>): string {
  switch (v.source) {
    case 'CONTACT_NAME':
      return ctx.contactName;
    case 'OCCASION':
      return ctx.occasionWord;
    case 'BUSINESS_NAME':
      return ctx.businessName;
    case 'DATE':
      return ctx.dateText;
    case 'INPUT':
    default:
      return values[String(v.index)]?.trim() || v.sample?.trim() || '';
  }
}

/** The ordered templateParams array AiSensy expects ({{1}} first). */
export function buildTemplateParams(
  variables: MessageVariable[],
  ctx: SendContext,
  values: Record<string, string>
): string[] {
  return [...variables]
    .sort((a, b) => a.index - b.index)
    // WhatsApp rejects empty parameters outright, so never send a blank.
    .map((v) => valueFor(v, ctx, values) || '-');
}

export const SAMPLE_CONTEXT: SendContext = {
  contactName: 'Priya',
  occasionWord: 'Diwali',
  businessName: 'Your Business',
  dateText: '25 August',
};

/** The message as a contact would read it, for previews. */
export function renderPreview(
  body: string,
  variables: MessageVariable[],
  values: Record<string, string> = {},
  ctx: SendContext = SAMPLE_CONTEXT
): string {
  return body.replace(VAR_RE, (whole, n) => {
    const v = variables.find((x) => x.index === Number(n));
    if (!v) return whole;
    return valueFor(v, ctx, values) || `[${v.label}]`;
  });
}

export function templateFitsOccasion(templateOccasion: string, occasion: SendOccasion): boolean {
  return templateOccasion === 'ANY' || templateOccasion === occasion;
}

/**
 * The text of the original approved "hellomomentwishes" AiSensy template —
 * what goes out when a business hasn't picked a message template for an
 * occasion (see sendWish.ts: {{1}} contact name, {{2}} occasion word,
 * {{3}} business name). Used only for previews; if that approved template's
 * text changes in AiSensy, update this to match.
 */
export const DEFAULT_WISH_BODY =
  '🎉 Warm Wishes, {{1}}! 🎉\n\nWishing you a very Happy {{2}}! 💐\n\nMay this special occasion bring you happiness, success, good health and wonderful memories. ✨\n\nWarm wishes from {{3}} ❤️';

export const DEFAULT_WISH_VARIABLES: MessageVariable[] = [
  { index: 1, label: 'Contact name', source: 'CONTACT_NAME' },
  { index: 2, label: 'Occasion', source: 'OCCASION' },
  { index: 3, label: 'Business name', source: 'BUSINESS_NAME' },
];
