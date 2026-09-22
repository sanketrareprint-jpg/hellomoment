import { NextRequest, NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/session';
import { setBannerSlideSeconds } from '@/lib/bannerTiming';

// Sets how many seconds each banner shows before a slider moves to the next one.
export async function PATCH(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const placement = body.placement === 'DASHBOARD' || body.placement === 'LANDING' ? body.placement : null;
  const device = body.device === 'DESKTOP' || body.device === 'MOBILE' ? body.device : null;
  const seconds = Number(body.seconds);
  if (!placement || !device || !Number.isFinite(seconds)) {
    return NextResponse.json({ error: 'Invalid timing' }, { status: 400 });
  }
  await setBannerSlideSeconds(placement, device, seconds);
  return NextResponse.json({ ok: true });
}
