/**
 * Thin wrapper around AiSensy's Campaign API (v2).
 *
 * Docs: https://wiki.aisensy.com/en/articles/11501889-api-reference-docs
 *   POST https://backend.aisensy.com/campaign/t1/api/v2
 *   { apiKey, campaignName, destination, userName, templateParams: string[],
 *     media?: { url, filename }, source?, tags?, attributes? }
 *
 * `campaignName` must already exist in the business's AiSensy dashboard
 * with status "Live" — hellomoment.in does not create WhatsApp templates on
 * their behalf, it only triggers already-approved campaigns with the right
 * per-contact variables.
 */

const AISENSY_ENDPOINT = 'https://backend.aisensy.com/campaign/t1/api/v2';

export interface AisensySendParams {
  apiKey: string;
  campaignName: string;
  destination: string; // WhatsApp number, e.g. +919876543210
  userName: string;
  templateParams?: string[];
  media?: { url: string; filename: string };
  source?: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface AisensySendResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export async function sendAisensyCampaign(params: AisensySendParams): Promise<AisensySendResult> {
  const payload: Record<string, unknown> = {
    apiKey: params.apiKey,
    campaignName: params.campaignName,
    destination: normalizeWhatsappNumber(params.destination),
    userName: params.userName,
  };
  if (params.templateParams) payload.templateParams = params.templateParams;
  if (params.media) payload.media = params.media;
  if (params.source) payload.source = params.source;
  if (params.tags) payload.tags = params.tags;
  if (params.attributes) payload.attributes = params.attributes;

  const res = await fetch(AISENSY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // AiSensy may return an empty/non-JSON body on some errors; that's fine.
  }

  return { ok: res.ok, status: res.status, body };
}

/**
 * AiSensy expects a number with country code and no leading "+"/spaces for
 * most accounts (Indian 10-digit numbers are auto-prefixed with 91). We
 * normalize defensively so businesses can type numbers however feels
 * natural in the contact form.
 */
export function normalizeWhatsappNumber(raw: string): string {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10) digits = `91${digits}`; // bare Indian mobile number
  return digits;
}
