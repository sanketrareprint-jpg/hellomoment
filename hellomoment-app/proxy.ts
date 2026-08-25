// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior, new name).
// This is an optimistic check only (JWT cookie, no DB call) to gate
// /dashboard for a nicer redirect UX — the dashboard page itself still
// re-checks the real session via auth().
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
