import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';
import { STARTERS } from '@/app/api/templates/seed-starter/route';

/**
 * ONE-OFF admin cleanup: seed-starter/route.ts's STARTERS list was reduced
 * from 68 designs (birthday, anniversary, and every festival) down to 8
 * (4 birthday, 4 anniversary) — the original balloon/heart designs and all
 * festival starters were removed from the bundled art and the STARTERS
 * list, but businesses that had already run "Add starter flyer designs"
 * still have FlyerTemplate rows for the removed ones sitting in the
 * database (deleting the source files/list entries doesn't touch rows
 * already created). This deletes every such row, across every business,
 * regardless of isDefault/in-use status — any WishLog referencing a
 * deleted template keeps its send history but its templateId is set to
 * null (see schema's onDelete: SetNull). Custom (non-STARTER) templates,
 * including any business's own uploaded festival flyers, are untouched.
 * Safe to delete this route after running it once.
 */
export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const currentNames = STARTERS.map((s) => s.name);

  const result = await prisma.flyerTemplate.deleteMany({
    where: {
      source: 'STARTER',
      name: { notIn: currentNames },
    },
  });

  return NextResponse.json({ deleted: result.count });
}
