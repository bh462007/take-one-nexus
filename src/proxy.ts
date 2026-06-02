import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_EMAILS = [
  'aarushgupta289@gmail.com',
  'alok.r25012@csds.rishihood.edu.in'
];

const DEVELOPER_EMAILS = [
  'aarushgupta289@gmail.com',
  'alok.r25012@csds.rishihood.edu.in'
];

/**
 * Routes that require authentication AND email verification
 * (messaging is gated behind verification to prevent spam)
 */
const VERIFIED_ONLY_ROUTES = [
  '/chat',
  '/leaderboard',
  '/crew.htm',
  '/project.htm',
  '/scripts.htm'
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes for all authenticated users
  const isProtectedRoute =
    pathname.startsWith('/chat') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/developer');

  const isAdminRoute = pathname.startsWith('/admin');

  if (isProtectedRoute || isAdminRoute) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to login, preserve the intended destination
      const loginUrl = new URL('/?auth=login', request.url);
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);

      const userEmail = (payload.email as string || '').toLowerCase();
      const userRole = (payload.role as string || '').toLowerCase();
      const isAdminEmail = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);
      const isDeveloperEmail = DEVELOPER_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

      // Admin route: require admin email or admin role
      if (isAdminRoute) {
        const isAuthorized = isAdminEmail || userRole === 'admin';
        if (!isAuthorized) {
          return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
        }
      }

      // Developer route: require developer/admin email or role
      if (pathname.startsWith('/developer')) {
        const isAuthorized =
          isDeveloperEmail ||
          isAdminEmail ||
          userRole === 'developer' ||
          userRole === 'admin';

        if (!isAuthorized) {
          return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
        }
      }

      // Email verification gate: chat requires verified email
      // Admin/developer emails bypass this check (always trusted)
      const isVerifiedRoute = VERIFIED_ONLY_ROUTES.some(r => pathname.startsWith(r));
      if (isVerifiedRoute && !isAdminEmail) {
        const emailVerified = payload.email_verified as boolean | undefined;
        // Only grant access when email_verified is explicitly true.
        // Legacy tokens lacking the field (undefined/null) are also blocked.
        if (emailVerified !== true) {
          const url = new URL('/', request.url);
          url.searchParams.set('verify', 'required');
          return NextResponse.redirect(url);
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware JWT verification failed:', error);
      // Token invalid/expired — clear stale cookie and redirect to login
      const response = NextResponse.redirect(new URL('/?auth=login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/chat/:path*', 
    '/profile/:path*', 
    '/developer/:path*',
    '/leaderboard/:path*',
    '/crew.htm',
    '/project.htm',
    '/scripts.htm'
  ],
};
