import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
export const SESSION_COOKIE = 'hm_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  businessId: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded && 'businessId' in decoded) {
      return { businessId: String((decoded as Record<string, unknown>).businessId) };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// --- Admin session (Vrushali's own "signed-up businesses" dashboard at
// /admin) — gated by a single shared password in the ADMIN_PASSWORD env
// var, not a Business account, since this view spans every tenant. ---
export const ADMIN_SESSION_COOKIE = 'hm_admin_session';
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function signAdminSession(): string {
  return jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS });
}

export function verifyAdminSessionToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return typeof decoded === 'object' && decoded !== null && (decoded as Record<string, unknown>).admin === true;
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};
