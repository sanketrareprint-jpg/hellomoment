import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAdmin } from '@/lib/session';

// ONE-OFF admin data fix: any FlyerTemplate created via /api/templates/seed-starter
// before the STARTER/CUSTOM `source` split shipped (see that route's own comments)
// was backfilled to source="CUSTOM" by the schema migration's column default,
// so it wrongly shows up under "My templates" instead of "Starter templates"
// on the dashboard, even though its name still starts with "Starter — ".
// This reclassifies every such row, across every business, in one pass.
// Safe to delete after running once.
export async function POST(req: NextRequest) {
  const denied = requireApiAdmin(req);
  if (denied) return denied;

  const result = await prisma.flyerTemplate.updateMany({
    where: { name: { startsWith: 'Starter — ' }, source: { not: 'STARTER' } },
    data: { source: 'STARTER' },
  });

  return NextResponse.json({ fixed: result.count });
}
