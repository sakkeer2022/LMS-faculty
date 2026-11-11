import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
// Same cheap gate as amentorz-admin src/middleware.ts, no secret needed: a missing or expired access
// cookie goes to sign-in with the full destination kept (the login page then renews it from the
// refresh cookie). The signed-in user and role are verified against the backend (GET /auth/me) in
// the portal layout (src/lib/auth/server.ts).
// The backend scopes each portal's cookies by name (a shared host shares cookies between ports); a token
// that was issued for another portal counts as no session here
const PORTAL = 'faculty';
function unusable(token: string) {
  try {
    const { exp, portal } = decodeJwt(token);
    return portal !== PORTAL || (typeof exp === 'number' && exp * 1000 <= Date.now());
  } catch {
    return true;
  }
}
export function middleware(request: NextRequest) {
  const destination = request.nextUrl.pathname + request.nextUrl.search;
  const token = request.cookies.get(`${PORTAL}_accessToken`)?.value;
  if (!token || unusable(token)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('redirect', destination);
    return NextResponse.redirect(login);
  }
  const headers = new Headers(request.headers);
  headers.set('x-pathname', destination);
  return NextResponse.next({ request: { headers } });
}
// The signed-in portal (src/components/layout/faculty-nav.ts) plus /home and /consent
export const config = {
  matcher: [
    '/home',
    '/consent',
    '/dashboard/:path*',
    '/availability/:path*',
    '/bookings/:path*',
    '/sessions/:path*',
    '/daily-logs/:path*',
    '/homework/:path*',
    '/library/:path*',
    '/progress/:path*',
    '/performance/:path*',
    '/earnings/:path*',
    '/reviews/:path*',
    '/profile/:path*',
  ],
};
