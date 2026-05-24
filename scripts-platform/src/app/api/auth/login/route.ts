import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + (process.env.AUTH_SECRET || '')).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    // Look up user in the shared DB
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Only allow Admin / Developer roles
    const allowedRoles = ['Admin', 'Developer'];
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Access denied — admin only' }, { status: 403 });
    }

    // Verify password (bcrypt used in main app; we compare via same hashing)
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signAdminToken({ id: user.id, email: user.email, role: user.role });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 });
  }
}
