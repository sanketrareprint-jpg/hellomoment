import path from 'node:path';
import { v4 as uuid } from 'uuid';
import type { Business, Contact, Festival, FlyerTemplate, Occasion } from '@prisma/client';
import { prisma } from './db';
import { generateFlyer, TextPlaceholder, PhotoPlaceholder } from './flyer';
import { sendAisensyCampaign } from './aisensy';
import { servedUrlToAbsolutePath, STORAGE_DIR } from './uploads';
import { calculateAge, calculateYears, formatDateForDisplay, ordinal } from './dateUtils';

/**
 * The single place that turns "it's Priya's birthday" (or a festival) into
 * a generated flyer + an AiSensy WhatsApp send + a SendLog row. Used by
 * both the daily cron trigger and (optionally) a "send now" test button.
 */

interface SendWishParams {
  business: Business;
  occasion: Occasion;
  template: FlyerTemplate;
  contact?: Contact | null; // set for BIRTHDAY/ANNIVERSARY
  festival?: Festival | null; // set for FESTIVAL
  todayYear: number;
}

function buildCaption(occasion: Occasion, name: string, business: Business, extra?: string): string {
  if (occasion === 'BIRTHDAY') return `🎉 Happy Birthday, ${name}! Warm wishes from ${business.name}.${extra ? ` ${extra}` : ''}`;
  if (occasion === 'ANNIVERSARY') return `🎊 Happy Anniversary, ${name}! Warm wishes from ${business.name}.${extra ? ` ${extra}` : ''}`;
  return `${extra || `Happy ${name}!`} — from ${business.name}.`;
}

export async function sendWishForContact(params: {
  business: Business;
  contact: Contact;
  template: FlyerTemplate;
  occasion: 'BIRTHDAY' | 'ANNIVERSARY';
  todayYear: number;
}) {
  const { business, contact, template, occasion, todayYear } = params;

  const relevantDate = occasion === 'BIRTHDAY' ? contact.dob! : contact.anniversary!;
  const dateText = formatDateForDisplay(relevantDate);

  let extra: string | undefined;
  if (occasion === 'BIRTHDAY') {
    const age = calculateAge(relevantDate, todayYear);
    if (age && age > 0) extra = `Wishing you a fantastic ${ordinal(age)} year ahead!`;
  } else {
    const years = calculateYears(relevantDate, todayYear);
    if (years && years > 0) extra = `Celebrating ${ordinal(years)} years together!`;
  }

  const caption = buildCaption(occasion, contact.name, business, extra);
  const flyerUrl = await renderFlyer(template, contact.name, dateText, contact.photoUrl);

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let errorMessage: string | null = null;
  let aisensyResponse: unknown = null;
  let sentToContact = false;
  let sentToOwner = false;

  const campaignName = template.aisensyCampaignName || defaultCampaignFor(business, occasion);

  if (!business.aisensyApiKey || !campaignName) {
    status = 'FAILED';
    errorMessage = 'AiSensy API key or campaign name is not configured. Add it in Settings.';
  } else {
    const media = { url: absoluteUrlFor(business, flyerUrl), filename: 'flyer.jpg' };
    const templateParams = [contact.name, dateText, caption];

    const contactResult = await sendAisensyCampaign({
      apiKey: business.aisensyApiKey,
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
      apiKey: business.aisensyApiKey,
      campaignName,
      destination: business.ownerWhatsapp,
      userName: business.name,
      templateParams: [contact.name, dateText, caption],
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

  for (const contact of contacts) {
    const caption = festival.caption || `Wishing you a very happy ${festival.name}!`;
    const flyerUrl = await renderFlyer(template, contact.name, dateText, contact.photoUrl);

    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | null = null;
    let aisensyResponse: unknown = null;
    let sentToContact = false;

    if (!business.aisensyApiKey || !campaignName) {
      status = 'FAILED';
      errorMessage = 'AiSensy API key or campaign name is not configured for festivals.';
    } else {
      const media = { url: absoluteUrlFor(business, flyerUrl), filename: 'flyer.jpg' };
      const result = await sendAisensyCampaign({
        apiKey: business.aisensyApiKey,
        campaignName,
        destination: contact.whatsapp,
        userName: contact.name,
        templateParams: [contact.name, dateText, caption],
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

async function renderFlyer(
  template: FlyerTemplate,
  name: string,
  dateText: string,
  photoUrl: string | null
): Promise<string> {
  const outputName = `${uuid()}.jpg`;
  const outputPath = path.join(STORAGE_DIR, 'generated', outputName);

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
    outputPath,
  });

  return `/api/files/generated/${outputName}`;
}

function defaultCampaignFor(business: Business, occasion: 'BIRTHDAY' | 'ANNIVERSARY'): string | null {
  return occasion === 'BIRTHDAY' ? business.aisensyBirthdayCampaign : business.aisensyAnniversaryCampaign;
}

function absoluteUrlFor(business: Business, relativeUrl: string): string {
  const base = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  return `${base}${relativeUrl}`;
}
