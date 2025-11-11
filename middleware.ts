import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionUser = req.cookies.get('sessionUser');
  const isApi = pathname.startsWith('/api');
  const isAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/public');
  const allowlistApi = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/openapi'];

  // Always allow assets and the login page
  if (isAsset || pathname === '/login') {
    return NextResponse.next();
  }

  // API gating: return JSON errors rather than redirects
  if (isApi) {
    if (allowlistApi.includes(pathname)) {
      return NextResponse.next();
    }
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Rewrite legacy /_edit/* to /edit/*
  if (pathname.startsWith('/_edit/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace('/_edit/', '/edit/');
    return NextResponse.redirect(url);
  }

  if (sessionUser && sessionUser.value) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/', '/edit/:path*', '/spec/:path*', '/apis', '/api/:path*'],
};