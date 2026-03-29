import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const PROTECTED_PREFIXES = ['/admin'];
const LOGIN_PAGE = '/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('election_session')?.value;
  const session = token ? await decrypt(token) : null;

  if (!session) {
    const loginUrl = new URL(LOGIN_PAGE, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only SUPER_ADMIN can access /admin
  if (pathname.startsWith('/admin') && session.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
