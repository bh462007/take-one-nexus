import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_EMAILS = [
  'aarushgupta289@gmail.com',
  'alok.r25012@csds.rishihood.edu.in'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes for all authenticated users
  const isProtectedRoute = pathname.startsWith('/chat') || pathname.startsWith('/profile');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isProtectedRoute || isAdminRoute) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/?auth=login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Additional authorization for admin routes
      if (isAdminRoute) {
        const userEmail = payload.email as string;
        const userRole = payload.role as string;
        const isAuthorized = ADMIN_EMAILS.includes(userEmail) || userRole === 'admin';

        if (!isAuthorized) {
          return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware JWT verification failed:', error);
      return NextResponse.redirect(new URL('/?auth=login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/chat/:path*', '/profile/:path*'],
};
