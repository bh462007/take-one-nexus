import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Routes to protect
  const isProfileRoute = pathname.startsWith('/profile');
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Skip middleware for API routes and static assets
  if (!isProfileRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    // If trying to access admin without token, redirect home
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Profile route is allowed to load and show the "Profile Locked" gate
    return NextResponse.next();
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    
    // Admin routes protection
    if (isAdminRoute) {
      const role = String(payload.role || '').toLowerCase();
      const isAdmin = role === 'admin' || role === 'developer' || role === 'moderator';
      
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/profile', request.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Token is invalid/expired
    const response = NextResponse.redirect(new URL('/?auth=login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*'
  ],
};
