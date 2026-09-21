import path from 'node:path';
import { v4 as uuid } from 'uuid';
import type { Business, Contact, Festival, FlyerTemplate } from '@prisma/client';
import { prisma } from './db';
import { generateFlyer, TextPlaceholder, PhotoPlaceholder, LogoPlaceholder } from './flyer';
import { sendAisensyCampaign } from './aisensy';
import { servedUrlToAbsolutePath, STORAGE_DIR } from './uploads';
import { formatDateForDisplay } from './dateUtils';
import { COINS_PER_SEND } from './pricing';
import { getWalletOwner } from './businessFamily';
import { frameLayoutFor, scaleLogoPlaceholder, scaleTextPlaceholder } from './framePlaceholders';

/**
 * The single place that turns "it's Priya's birthday" (or a festival) into
 * a generated flyer + an AiSensy WhatsApp send + a SendLog row. Used by
 * both the daily cron trigger and (optionally) a "send now" test button.
 */

// SQLite (this project's default connector) doesn't support native Prisma
// enums, so `occasion`/`status` are plain String columns in the DB — this
// union type is the app-level source of truth for the valid literal values.
export type Occasion = 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL';

// Approved AiSensy campaign used to notify the business owner that a
// wish went out, separate from the contact-facing campaign (see
// sendWishForContact below). Same 3 body variables as the contact template.
const ADMIN_UPDATE_CAMPAIGN = 'userupdate';

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

  // Both the ₹ wallet and trial coins are shared across every company
  // under the same login (see getWalletOwner).
  const walletOwner = await getWalletOwner(business);

  // Spending gate: a send is covered either by trial coins (spent first —
  // see COINS_PER_SEND in src/lib/pricing.ts) or by the shared wallet's
  // walletRatePaise (locked in at its last recharge). If neither can cover
  // one more message, skip it rather than sending for free — the business
  // sees exactly why in their Send logs / this contact's timeline.
  const useCoins = walletOwner.trialCoins >= COINS_PER_SEND;
  if (!useCoins && walletOwner.walletBalancePaise < walletOwner.walletRatePaise) {
    await prisma.sendLog.create({
      data: {
        businessId: business.id,
        contactId: contact.id,
        templateId: template.id,
        occasion,
        status: 'SKIPPED',
        errorMessage: insufficientBalanceMessage(walletOwner),
      },
    });
    return;
  }

  const relevantDate = occasion === 'BIRTHDAY' ? contact.dob! : contact.anniversary!;
  const dateText = formatDateForDisplay(relevantDate);
  const occasionWord = occasion === 'BIRTHDAY' ? 'Birthday' : 'Anniversary';
  const fromName = brandFirmNameText(business) || business.name;
  // Anniversary flyers use the contact's dedicated anniversary photo (e.g. a
  // couple's photo) when they have one, falling back to their regular photo
  // otherwise — birthdays always use the regular photo.
  const photoForFlyer = occasion === 'ANNIVERSARY' ? contact.anniversaryPhotoUrl || contact.photoUrl : contact.photoUrl;

  const flyerUrl = await renderFlyer(business, template, contact.name, dateText, photoForFlyer, contact.title, contact.designation);

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

    // The business owner gets notified on a separate approved AiSensy
    // campaign ("userupdate") whose approved body has 5 variables:
    // "Hello {{1}} — Today is {{2}}'s {{3}}! Don't forget to wish them
    // Happy {{4}}. Here's their WhatsApp number: {{5}}" — confirmed from
    // the live template in the AiSensy dashboard (Test Campaign panel).
    // {{1}} business name, {{2}} contact name, {{3}}/{{4}} the occasion
    // word (used twice), {{5}} the contact's WhatsApp number.
    const ownerTemplateParams = [fromName, contact.name, occasionWord, occasionWord, contact.whatsapp];
    const ownerResult = await sendAisensyCampaign({
      apiKey,
      campaignName: ADMIN_UPDATE_CAMPAIGN,
      destination: business.ownerWhatsapp,
      userName: business.name,
      templateParams: ownerTemplateParams,
      media,
    });
    sentToOwner = ownerResult.ok;
    aisensyResponse = { ...((aisensyResponse as object) ?? {}), toOwner: ownerResult.body };
    if (!ownerResult.ok && status === 'SUCCESS') {
      // Sending to the contact succeeded even if notifying the owner failed —
      // don't mark the whole send as FAILED for that, but do note it. Include
      // AiSensy's own response body (truncated) so the real rejection reason
      // (bad campaign name, wrong param count, template not live, etc.) shows
      // up directly in Settings > Send logs instead of just an HTTP code.
      const bodySnippet = JSON.stringify(ownerResult.body ?? {}).slice(0, 300);
      errorMessage = `Sent to contact, but notifying the business owner failed (HTTP ${ownerResult.status}): ${bodySnippet}`;
    }
  }

  const sendLog = await prisma.sendLog.create({
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

  if (status === 'SUCCESS') {
    await chargeForSend(business, walletOwner, sendLog.id, `${occasionWord} wish sent to ${contact.name}`, useCoins);
  }
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

  // Both the ₹ wallet and trial coins are shared across every company
  // under the same login (see getWalletOwner in businessFamily.ts).
  const walletOwner = await getWalletOwner(business);

  // Tracked locally rather than re-reading from the DB every iteration —
  // this loop runs sequentially in one process, so running totals are
  // enough to stop sending once neither pool can cover the next message,
  // even mid-batch. Trial coins are spent first, same as sendWishForContact.
  let remainingBalance = walletOwner.walletBalancePaise;
  let remainingCoins = walletOwner.trialCoins;

  for (const contact of contacts) {
    const useCoins = remainingCoins >= COINS_PER_SEND;
    if (!useCoins && remainingBalance < walletOwner.walletRatePaise) {
      await prisma.sendLog.create({
        data: {
          businessId: business.id,
          contactId: contact.id,
          festivalId: festival.id,
          templateId: template.id,
          occasion: 'FESTIVAL',
          status: 'SKIPPED',
          errorMessage: insufficientBalanceMessage(walletOwner),
        },
      });
      continue;
    }

    const flyerUrl = await renderFlyer(business, template, contact.name, dateText, contact.photoUrl, contact.title, contact.designation);

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

    const sendLog = await prisma.sendLog.create({
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

    if (status === 'SUCCESS') {
      if (useCoins) {
        remainingCoins -= COINS_PER_SEND;
      } else {
        remainingBalance -= walletOwner.walletRatePaise;
      }
      await chargeForSend(business, walletOwner, sendLog.id, `${festival.name} wish sent to ${contact.name}`, useCoins);
    }
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
export function brandFirmNameText(business: Business): string | null {
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
  photoUrl: string | null,
  title?: string | null,
  designation?: string | null
): Promise<string> {
  const outputName = `${uuid()}.jpg`;
  const outputPath = path.join(STORAGE_DIR, 'generated', outputName);

  const designationPlaceholder = template.designationPlaceholder ? JSON.parse(template.designationPlaceholder) : null;

  // A business's default Frame (see the Frame/BusinessFrame models and
  // /dashboard/frames) — when set, its branding placement/styling and
  // overlay graphic are used on *every* flyer this business sends, instead
  // of the FlyerTemplate's own logo/firmName/phone/email/address/website/
  // products placeholders below. This is what lets a business set up their
  // branding once and have it apply across every template/occasion, rather
  // than repeating the setup per template. Falls back to the template's own
  // placeholders (unchanged behavior) when no default frame is set.
  const defaultFrame = await prisma.businessFrame.findFirst({ where: { businessId: business.id, isDefault: true } });

  let logoPlaceholder: LogoPlaceholder | null = template.logoPlaceholder ? JSON.parse(template.logoPlaceholder) : null;
  let firmNamePlaceholder: TextPlaceholder | null = template.firmNamePlaceholder
    ? JSON.parse(template.firmNamePlaceholder)
    : null;
  let phonePlaceholder: TextPlaceholder | null = template.phonePlaceholder ? JSON.parse(template.phonePlaceholder) : null;
  let emailPlaceholder: TextPlaceholder | null = template.emailPlaceholder ? JSON.parse(template.emailPlaceholder) : null;
  let addressPlaceholder: TextPlaceholder | null = template.addressPlaceholder
    ? JSON.parse(template.addressPlaceholder)
    : null;
  let websitePlaceholder: TextPlaceholder | null = template.websitePlaceholder
    ? JSON.parse(template.websitePlaceholder)
    : null;
  let productsPlaceholder: TextPlaceholder | null = template.productsPlaceholder
    ? JSON.parse(template.productsPlaceholder)
    : null;
  let overlayPath: string | null = null;

  if (defaultFrame) {
    // The frame's placeholders were positioned against its own canvas size
    // (frame.canvasWidth/Height, the overlay graphic's own native pixel
    // size) — scale uniformly by width (never stretching the banner's own
    // aspect ratio) and anchor to this template's bottom edge, the same way
    // its overlay graphic renders below. See frameLayoutFor's own comment.
    const { scale: frameScale, topOffset: frameTopOffset } = frameLayoutFor(
      template.canvasWidth,
      template.canvasHeight,
      defaultFrame.canvasWidth,
      defaultFrame.canvasHeight
    );

    logoPlaceholder = defaultFrame.logoPlaceholder
      ? scaleLogoPlaceholder(JSON.parse(defaultFrame.logoPlaceholder), frameScale, frameTopOffset)
      : null;
    firmNamePlaceholder = defaultFrame.firmNamePlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.firmNamePlaceholder), frameScale, frameTopOffset)
      : null;
    phonePlaceholder = defaultFrame.phonePlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.phonePlaceholder), frameScale, frameTopOffset)
      : null;
    emailPlaceholder = defaultFrame.emailPlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.emailPlaceholder), frameScale, frameTopOffset)
      : null;
    addressPlaceholder = defaultFrame.addressPlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.addressPlaceholder), frameScale, frameTopOffset)
      : null;
    websitePlaceholder = defaultFrame.websitePlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.websitePlaceholder), frameScale, frameTopOffset)
      : null;
    productsPlaceholder = defaultFrame.productsPlaceholder
      ? scaleTextPlaceholder(JSON.parse(defaultFrame.productsPlaceholder), frameScale, frameTopOffset)
      : null;
    overlayPath = defaultFrame.overlayUrl ? servedUrlToAbsolutePath(defaultFrame.overlayUrl) : null;
  }

  // A contact's Title (e.g. "Mr.", "Dr.") is shown as part of the name line
  // itself, not as a separately positioned placeholder — contacts without
  // one just show their plain name.
  const displayName = title ? `${title} ${name}` : name;

  // This template's own phone/email/address/website/products text
  // override, if it has one (see FlyerTemplate.phoneTextOverride etc. and
  // TemplatePlaceholderEditor.tsx) — falls back to the shared Business
  // field otherwise. Ignored while a default Frame is active: the Frame
  // already overrides this template's own *placeholders* above regardless
  // of what's configured here, so its *text* stays on the one shared
  // source too, instead of silently picking up a per-template override it
  // was never shown or asked about.
  const phoneText = (!defaultFrame && template.phoneTextOverride) || business.phoneDisplay || null;
  const emailText = (!defaultFrame && template.emailTextOverride) || business.emailDisplay || null;
  const addressText = (!defaultFrame && template.addressTextOverride) || business.addressText || null;
  const websiteText = (!defaultFrame && template.websiteTextOverride) || business.websiteUrl || null;
  const productsText = (!defaultFrame && template.productsTextOverride) || business.productsText || null;

  await generateFlyer({
    backgroundPath: servedUrlToAbsolutePath(template.backgroundUrl),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    overlayPath,
    namePlaceholder: template.namePlaceholder ? (JSON.parse(template.namePlaceholder) as TextPlaceholder) : null,
    name: displayName,
    designationPlaceholder: designationPlaceholder as TextPlaceholder | null,
    designationText: designation || null,
    datePlaceholder: template.datePlaceholder ? (JSON.parse(template.datePlaceholder) as TextPlaceholder) : null,
    dateText,
    photoPlaceholder: template.photoPlaceholder ? (JSON.parse(template.photoPlaceholder) as PhotoPlaceholder) : null,
    photoPath: photoUrl ? servedUrlToAbsolutePath(photoUrl) : null,
    logoPlaceholder,
    logoPath: business.logoUrl ? servedUrlToAbsolutePath(business.logoUrl) : null,
    firmNamePlaceholder,
    firmNameText: brandFirmNameText(business),
    phonePlaceholder,
    phoneText,
    emailPlaceholder,
    emailText,
    addressPlaceholder,
    addressText,
    websitePlaceholder,
    websiteText,
    productsPlaceholder,
    productsText,
    outputPath,
  });

  return `/api/files/generated/${outputName}`;
}

function insufficientBalanceMessage(business: Business): string {
  return (
    `Wallet balance too low (₹${(business.walletBalancePaise / 100).toFixed(2)}) to send at ` +
    `₹${(business.walletRatePaise / 100).toFixed(2)}/message — recharge your wallet to resume automatic sends.`
  );
}

/**
 * Charges one send against whichever pool covers it — trial coins first
 * (see COINS_PER_SEND in src/lib/pricing.ts), the ₹ wallet otherwise —
 * logging to the matching transaction table so each balance keeps its own
 * clean history.
 */
async function chargeForSend(
  business: Business,
  walletOwner: Business,
  sendLogId: string,
  description: string,
  useCoins: boolean
): Promise<void> {
  // Note which company this send was for when it's paid from another
  // company's shared pool — otherwise the root account's history would just
  // show identical-looking debits with no way to tell them apart.
  const fullDescription = walletOwner.id === business.id ? description : `${description} — ${business.name}`;

  if (useCoins) {
    await prisma.$transaction([
      prisma.business.update({
        where: { id: walletOwner.id },
        data: { trialCoins: { decrement: COINS_PER_SEND } },
      }),
      prisma.trialCoinTransaction.create({
        data: {
          businessId: walletOwner.id,
          type: 'DEBIT',
          coins: COINS_PER_SEND,
          description: fullDescription,
          sendLogId,
        },
      }),
    ]);
    return;
  }
  await debitWallet(walletOwner, sendLogId, fullDescription);
}

/** Deducts one message's cost from the wallet owner's ₹ balance and logs the debit, tied to the SendLog it paid for. */
async function debitWallet(walletOwner: Business, sendLogId: string, description: string): Promise<void> {
  await prisma.$transaction([
    prisma.business.update({
      where: { id: walletOwner.id },
      data: { walletBalancePaise: { decrement: walletOwner.walletRatePaise } },
    }),
    prisma.walletTransaction.create({
      data: {
        businessId: walletOwner.id,
        type: 'DEBIT',
        amountPaise: walletOwner.walletRatePaise,
        description,
        sendLogId,
      },
    }),
  ]);
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
