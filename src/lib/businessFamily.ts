import type { Business } from '@prisma/client';
import { prisma } from './db';

export interface FamilyMember {
  id: string;
  name: string;
  isRoot: boolean;
}

/**
 * A "family" is one login (the root business) plus every additional
 * "company" created under it (see /api/business) — each a full,
 * independent Business row (own contacts/templates/wallet/coins), just
 * linked so the same login can switch between them without a password.
 * For every existing/standalone business (ownerBusinessId null and no
 * members) this is just [that business] — nothing changes for them.
 */
export async function getFamilyBusinesses(business: Pick<Business, 'id' | 'ownerBusinessId'>): Promise<FamilyMember[]> {
  const rootId = business.ownerBusinessId ?? business.id;
  const [root, members] = await Promise.all([
    prisma.business.findUnique({ where: { id: rootId }, select: { id: true, name: true, createdAt: true } }),
    prisma.business.findMany({
      where: { ownerBusinessId: rootId },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const result: FamilyMember[] = [];
  if (root) result.push({ id: root.id, name: root.name, isRoot: true });
  for (const m of members) result.push({ id: m.id, name: m.name, isRoot: false });
  return result;
}

/** Resolves the root business id for any business in a family (itself, if it already is the root). */
export function rootIdOf(business: Pick<Business, 'id' | 'ownerBusinessId'>): string {
  return business.ownerBusinessId ?? business.id;
}
