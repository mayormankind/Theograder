import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ]
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for auth routes and public API routes
  if (pathname.startsWith('/auth/') || 
      pathname.startsWith('/api/auth/') ||
      pathname === '/api/test-db') {
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (!session.isLoggedIn || !session.userId) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For dashboard routes, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // User is authenticated, allow access
  return NextResponse.next();
}
