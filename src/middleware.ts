import { NextResponse, type NextRequest } from 'next/server';

// raregreet.com is the site's official address. The same app is also reachable
// at (app.)hellomoment.in, which Google was treating as the main copy and
// showing in search instead of raregreet.com. This keeps hellomoment.in working
// for anything still using it, but tells search engines not to list it, and
// marks every raregreet.com page as the canonical (official) version.
const CANONICAL_ORIGIN = 'https://raregreet.com';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const host = (request.headers.get('host') || '').toLowerCase();

  if (host.includes('hellomoment')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else if (host === 'raregreet.com') {
    response.headers.set('Link', `<${CANONICAL_ORIGIN}${request.nextUrl.pathname}>; rel="canonical"`);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
