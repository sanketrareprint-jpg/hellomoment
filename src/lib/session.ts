import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './db';
import { verifySessionToken, SESSION_COOKIE, verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from './auth';
import type { Business } from '@prisma/client';

/** For server components/pages: returns the logged-in business, or null. */
export async function getCurrentBusiness(): Promise<Business | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session) return null;
  return prisma.business.findUnique({ where: { id: session.businessId } });
}

/**
 * For API route handlers: returns the logged-in business, or a ready-to-return
 * 401 NextResponse. Usage:
 *   const result = await requireApiBusiness(req);
 *   if (result instanceof NextResponse) return result;
 *   const business = result;
 */
export async function requireApiBusiness(req: NextRequest): Promise<Business | NextResponse> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return business;
}

/**
 * For admin API route handlers (the /admin dashboard, listing every signed-up
 * business): returns nothing on success, or a ready-to-return 401
 * NextResponse. Usage:
 *   const denied = requireApiAdmin(req);
 *   if (denied) return denied;
 */
export function requireApiAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return null;
}
