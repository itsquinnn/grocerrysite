import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, static assets, and the root status page to pass through
  if (
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // If a user navigates to a store/dashboard page on port 3002 (e.g. /admin, /orders, /shop),
  // redirect them gracefully to the storefront on port 8080
  const frontendUrl = new URL(request.url);
  frontendUrl.port = '8080';
  return NextResponse.redirect(frontendUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
