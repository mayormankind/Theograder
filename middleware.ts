import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Sliding-window counter keyed by IP + route pathname.
// Note: resets per cold-start / per Vercel serverless instance. For robust
// multi-region protection upgrade to Upstash Redis + @upstash/ratelimit.
const _rlStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000; // 1-minute window
const RL_MAX_PER_WINDOW = 10; // max auth requests per IP per window

function isRateLimited(ip: string, pathname: string): boolean {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = _rlStore.get(key);

  if (!entry || now >= entry.resetAt) {
    _rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }

  if (entry.count >= RL_MAX_PER_WINDOW) return true;

  entry.count++;
  return false;
} 

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
      pathname.startsWith('/api/auth/') ) {

    // Rate-limit auth API endpoints to prevent brute-force / OTP spam
    if (pathname.startsWith('/api/auth/')) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        '127.0.0.1';

      if (isRateLimited(ip, pathname)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } },
        );
      }
    }

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
