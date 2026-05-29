import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { hashToken, isExpired } from '@/lib/email-tokens';
import { checkRateLimit, getClientIP, buildRateLimitKey } from '@/lib/rate-limiter';
import { RATE_LIMITS } from '@/lib/rate-limit-config';
import { captureError } from '@/lib/sentry';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * POST /api/auth/reset-password
 * Validates reset token and updates user password.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limit by IP — prevents brute force token guessing
  const rl = checkRateLimit(buildRateLimitKey('reset-password', ip), RATE_LIMITS.resetPassword);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, message: 'Too many reset attempts. Please wait before trying again.', retryAfter: rl.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { token, password } = body || {};

    // Input validation
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json({ success: false, message: 'Invalid reset token.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, message: 'Password is required.' }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ success: false, message: 'Password is too long.' }, { status: 400 });
    }

    // Check password strength: must have at least 1 letter and 1 number
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least one letter and one number.' },
        { status: 400 }
      );
    }

    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: { reset_token: hashedToken },
      select: { id: true, email: true, reset_token_expires: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or already-used reset link.' }, { status: 400 });
    }

    if (isExpired(user.reset_token_expires)) {
      // Clear the expired token
      await prisma.user.update({
        where: { id: user.id },
        data: { reset_token: null, reset_token_expires: null },
      });
      return NextResponse.json({ success: false, message: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Hash new password and clear reset token (single-use)
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,          // invalidate — prevents token reuse
        reset_token_expires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (error) {
    captureError(error, { endpoint: 'POST /api/auth/reset-password', action: 'update_password' });
    return NextResponse.json({ success: false, message: 'Failed to reset password. Please try again.' }, { status: 500 });
  }
}
