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
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      const userEmail = (payload.email as string || '').toLowerCase();
      const userRole = (payload.role as string || '').toLowerCase();
      const isAdminEmail = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);
      const isDeveloperEmail = DEVELOPER_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

      // Admin route: require admin email or admin role
      if (isAdminRoute) {
        const isAuthorized =
          isAdminEmail ||
          userRole === 'admin';

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
  matcher: ['/admin/:path*', '/chat/:path*', '/profile/:path*', '/developer/:path*'],
};
