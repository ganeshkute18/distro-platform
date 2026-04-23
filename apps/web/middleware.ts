import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_ROUTES: Record<string, string[]> = {
  OWNER:    ['/owner'],
  STAFF:    ['/staff'],
  CUSTOMER: ['/catalog', '/cart', '/orders', '/profile'],
};

const PUBLIC_ROUTES = ['/login', '/logout', '/unauthorized'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next();

  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const role: string = session.role;

    // Check access
    for (const [r, prefixes] of Object.entries(ROLE_ROUTES)) {
      if (prefixes.some((p) => pathname.startsWith(p))) {
        if (role !== r) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
