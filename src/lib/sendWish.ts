import path from 'node:path';
import { v4 as uuid } from 'uuid';
import type { Business, Contact, Festival, FlyerTemplate } from '@prisma/client';
import { prisma } from './db';
import { generateFlyer, TextPlaceholder, PhotoPlaceholder } from './flyer';
import { sendAisensyCampaign } from './aisensy';
import { servedUrlToAbsolutePath, STORAGE_DIR } from './uploads';
import { formatDateForDisplay } from './dateUtils';

/**
 * The single place that turns "it's Priya's birthday" (or a festival) into
 * a generated flyer + an AiSensy WhatsApp send + a SendLog row. Used by
 * both the daily cron trigger and (optionally) a "send now" test button.
 */

// SQLite (this project's default connector) doesn't support native Prisma
// enums, so `occasion`/`status` are plain String columns in the DB — this
// union type is the app-level source of truth for the valid literal values.
export type Occasion = 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL';

interface SendWishParams {
  business: Business;
  occasion: Occasion;
  template: FlyerTemplate;
  contact?: Contact | null; // set for BIRTHDAY/ANNIVERSARY
  festival?: Festival | null; // set for FESTIVAL
  todayYear: number;
}

export async function sendWishForContact(params: {
  business: Business;
  contact: Contact;
  template: FlyerTemplate;
  occasion: 'BIRTHDAY' | 'ANNIVERSARY';
  todayYear: number;
}) {
  const { business, contact, template, occasion } = params;

  const relevantDate = occasion === 'BIRTHDAY' ? contact.dob! : contact.anniversary!;
  const dateText = formatDateForDisplay(relevantDate);
  const occasionWord = occasion === 'BIRTHDAY' ? 'Birthday' : 'Anniversary';
  const fromName = brandFirmNameText(business) || business.name;

  const flyerUrl = await renderFlyer(business, template, contact.name, dateText, contact.photoUrl);

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let errorMessage: string | null = null;
  let aisensyResponse: unknown = null;
  let sentToContact = false;
  let sentToOwner = false;

  const campaignName = template.aisensyCampaignName || defaultCampaignFor(business, occasion);
  const apiKey = resolveAisensyApiKey(business);

  if (!apiKey || !campaignName) {
    status = 'FAILED';
    errorMessage = 'AiSensy API key or campaign name is not configured. Add it in Settings.';
  } else {
    const media = { url: absoluteUrlFor(business, flyerUrl), filename: 'flyer.jpg' };
    // Matches the approved "hellomomentwishes" AiSensy template's 3 body
    // variables in order: {{1}} the contact's name, {{2}} the occasion word
    // ("Birthday"/"Anniversary"), {{3}} who it's from (the business's own
    // name). If the approved template text ever changes, this must change
    // to match it — AiSensy fills these blanks literally, it doesn't know
    // what they're "supposed" to mean.
    const templateParams = [contact.name, occasionWord, fromName];

    const contactResult = await sendAisensyCampaign({
      apiKey,
      campaignName,
      destination: contact.whatsapp,
      userName: contact.name,
      templateParams,
      media,
    });
    sentToContact = contactResult.ok;
    aisensyResponse = { toContact: contactResult.body };
    if (!contactResult.ok) {
      status = 'FAILED';
      errorMessage = `AiSensy rejected the send to the contact (HTTP ${contactResult.status}).`;
    }

    const ownerResult = await sendAisensyCampaign({
      apiKey,
      campaignName,
      destination: business.ownerWhatsapp,
      userName: business.name,
      templateParams,
      media,
    });
    sentToOwner = ownerResult.ok;
    aisensyResponse = { ...((aisensyResponse as object) ?? {}), toOwner: ownerResult.body };
    if (!ownerResult.ok && status === 'SUCCESS') {
      // Sending to the contact succeeded even if notifying the owner failed —
      // don't mark the whole send as FAILED for that, but do note it.
      errorMessage = `Sent to contact, but notifying the business owner failed (HTTP ${ownerResult.status}).`;
    }
  }

  await prisma.sendLog.create({
    data: {
      businessId: business.id,
      contactId: contact.id,
      templateId: template.id,
      occasion,
      status,
      flyerUrl,
      sentToContact,
      sentToOwner,
      aisensyResponse: aisensyResponse ? JSON.stringify(aisensyResponse) : null,
      errorMessage,
    },
  });
}

export async function sendWishForFestival(params: {
  business: Business;
  festival: Festival;
  template: FlyerTemplate;
  contacts: Contact[];
}) {
  const { business, festival, template, contacts } = params;
  const dateText = formatDateForDisplay(festival.date);
  const campaignName = template.aisensyCampaignName || business.aisensyFestivalCampaign;
  const apiKey = resolveAisensyApiKey(business);
  const fromName = brandFirmNameText(business) || business.name;

  for (const contact of contacts) {
    const flyerUrl = await renderFlyer(business, template, contact.name, dateText, contact.photoUrl);

    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | null = null;
    let aisensyResponse: unknown = null;
    let sentToContact = false;

    if (!apiKey || !campaignName) {
      status = 'FAILED';
      errorMessage = 'AiSensy API key or campaign name is not configured for festivals.';
    } else {
      const media = { url: absoluteUrlFor(business, flyerUrl), filename: 'flyer.jpg' };
      // Same 3-variable shape as sendWishForContact: {{1}} name, {{2}} the
      // occasion word (here, the festival's own name), {{3}} who it's from.
      const templateParams = [contact.name, festival.name, fromName];
      const result = await sendAisensyCampaign({
        apiKey,
        campaignName,
        destination: contact.whatsapp,
        userName: contact.name,
        templateParams,
        media,
      });
      sentToContact = result.ok;
      aisensyResponse = result.body;
      if (!result.ok) {
        status = 'FAILED';
        errorMessage = `AiSensy rejected the send (HTTP ${result.status}).`;
      }
    }

    await prisma.sendLog.create({
      data: {
        businessId: business.id,
        contactId: contact.id,
        festivalId: festival.id,
        templateId: template.id,
        occasion: 'FESTIVAL',
        status,
        flyerUrl,
        sentToContact,
        sentToOwner: false,
        aisensyResponse: aisensyResponse ? JSON.stringify(aisensyResponse) : null,
        errorMessage,
      },
    });
  }
}

/**
 * Renders the business's own brand name for the flyer footer, per their
 * Settings → Brand kit choice: English is force-uppercased (per the
 * business's request for capital English letters), Marathi is used
 * verbatim as typed (Marathi script has no letter-casing concept, and
 * auto-transliteration from the English name isn't reliable enough to do
 * automatically).
 */
function brandFirmNameText(business: Business): string | null {
  if (business.firmNameScript === 'MARATHI') {
    return business.firmNameMarathi || business.name || null;
  }
  return business.name ? business.name.toUpperCase() : null;
}

async function renderFlyer(
  business: Business,
  template: FlyerTemplate,
  name: string,
  dateText: string,
  photoUrl: string | null
): Promise<string> {
  const outputName = `${uuid()}.jpg`;
  const outputPath = path.join(STORAGE_DIR, 'generated', outputName);

  const logoPlaceholder = template.logoPlaceholder ? JSON.parse(template.logoPlaceholder) : null;
  const firmNamePlaceholder = template.firmNamePlaceholder ? JSON.parse(template.firmNamePlaceholder) : null;
  const phonePlaceholder = template.phonePlaceholder ? JSON.parse(template.phonePlaceholder) : null;
  const addressPlaceholder = template.addressPlaceholder ? JSON.parse(template.addressPlaceholder) : null;
  const productsPlaceholder = template.productsPlaceholder ? JSON.parse(template.productsPlaceholder) : null;

  await generateFlyer({
    backgroundPath: servedUrlToAbsolutePath(template.backgroundUrl),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    namePlaceholder: JSON.parse(template.namePlaceholder) as TextPlaceholder,
    name,
    datePlaceholder: template.datePlaceholder ? (JSON.parse(template.datePlaceholder) as TextPlaceholder) : null,
    dateText,
    photoPlaceholder: template.photoPlaceholder ? (JSON.parse(template.photoPlaceholder) as PhotoPlaceholder) : null,
    photoPath: photoUrl ? servedUrlToAbsolutePath(photoUrl) : null,
    logoPlaceholder,
    logoPath: business.logoUrl ? servedUrlToAbsolutePath(business.logoUrl) : null,
    firmNamePlaceholder,
    firmNameText: brandFirmNameText(business),
    phonePlaceholder,
    phoneText: business.phoneDisplay || null,
    addressPlaceholder,
    addressText: business.addressText || null,
    productsPlaceholder,
    productsText: business.productsText || null,
    outputPath,
  });

  return `/api/files/generated/${outputName}`;
}

function defaultCampaignFor(business: Business, occasion: 'BIRTHDAY' | 'ANNIVERSARY'): string | null {
  return occasion === 'BIRTHDAY' ? business.aisensyBirthdayCampaign : business.aisensyAnniversaryCampaign;
}

/**
 * B2B platform model: hellomoment.in holds one shared AiSensy account/API
 * key (set as the AISENSY_API_KEY env var on Railway) so a business can
 * register and start sending without ever creating their own AiSensy
 * account. A business's own key, if they've entered one in Settings
 * (Advanced), always takes priority — this keeps any existing per-business
 * setup (like the very first account on this platform) working unchanged.
 */
function resolveAisensyApiKey(business: Business): string | null {
  return business.aisensyApiKey || process.env.AISENSY_API_KEY || null;
}

function absoluteUrlFor(business: Business, relativeUrl: string): string {
  const base = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  return `${base}${relativeUrl}`;
}
