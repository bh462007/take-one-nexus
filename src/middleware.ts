import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_EMAILS = [
  'aarushgupta289@gmail.com',
  'alok.r25012@csds.rishihood.edu.in'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/?login=required', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      const userEmail = payload.email as string;
      const userRole = payload.role as string;

      // Authorization check
      const isAuthorized = ADMIN_EMAILS.includes(userEmail) || userRole === 'admin';

      if (!isAuthorized) {
        return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware JWT verification failed:', error);
      return NextResponse.redirect(new URL('/?login=expired', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
