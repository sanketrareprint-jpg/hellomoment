import { prisma } from './db';

// How long each banner stays on screen before the slider moves on, set by
// admin per slider (placement + device) and stored in AppSetting.

export type BannerPlacement = 'DASHBOARD' | 'LANDING';
export type BannerDevice = 'DESKTOP' | 'MOBILE';

export const DEFAULT_BANNER_SLIDE_SECONDS = 5;
export const MIN_BANNER_SLIDE_SECONDS = 1;
export const MAX_BANNER_SLIDE_SECONDS = 60;

function key(placement: BannerPlacement, device: BannerDevice) {
  return `bannerSlideSeconds.${placement}.${device}`;
}

function parseSeconds(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= MIN_BANNER_SLIDE_SECONDS && n <= MAX_BANNER_SLIDE_SECONDS
    ? n
    : DEFAULT_BANNER_SLIDE_SECONDS;
}

/** Slide seconds for every placement/device, keyed as `${placement}.${device}`. */
export async function getAllBannerSlideSeconds(): Promise<Record<string, number>> {
  const rows = await prisma.appSetting.findMany({ where: { key: { startsWith: 'bannerSlideSeconds.' } } });
  const result: Record<string, number> = {};
  for (const placement of ['DASHBOARD', 'LANDING'] as const) {
    for (const device of ['DESKTOP', 'MOBILE'] as const) {
      result[`${placement}.${device}`] = parseSeconds(rows.find((r) => r.key === key(placement, device))?.value);
    }
  }
  return result;
}

export async function setBannerSlideSeconds(placement: BannerPlacement, device: BannerDevice, seconds: number) {
  const value = String(Math.min(MAX_BANNER_SLIDE_SECONDS, Math.max(MIN_BANNER_SLIDE_SECONDS, Math.round(seconds))));
  await prisma.appSetting.upsert({
    where: { key: key(placement, device) },
    create: { key: key(placement, device), value },
    update: { value },
  });
}
