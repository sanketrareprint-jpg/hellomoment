import { NextRequest, NextResponse } from 'next/server';
import { requireApiBusiness } from '@/lib/session';
import { seedStarterTemplatesForBusiness } from '@/lib/seedStarterTemplates';

/**
 * One-click starter set of ready-made flyer designs (background art + all
 * placeholders already positioned) so a business doesn't have to design or
 * upload anything before they can send their first wish. The designs
 * themselves come from the admin-curated StarterTemplate library (see
 * /admin/templates and src/app/api/admin/starter-templates/*). New
 * businesses/companies get this seeded automatically on creation (see
 * src/app/api/auth/register/route.ts and src/app/api/business/route.ts);
 * this route exists so they can also re-run it later to pick up new or
 * updated designs added to the library since.
 */
export async function POST(req: NextRequest) {
  const business = await requireApiBusiness(req);
  if (business instanceof NextResponse) return business;

  const result = await seedStarterTemplatesForBusiness(business.id);
  return NextResponse.json(result);
}
