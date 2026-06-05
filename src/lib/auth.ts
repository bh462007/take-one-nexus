import { cookies } from 'next/headers';
import { cache } from 'react';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    if (!payload.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      include: {
        scripts: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    return user;
  } catch (error: any) {
    // 1. Log the full error in development for debugging
    console.error('[AUTH_LAYER_FAILURE]:', {
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
    
    // 2. Identify critical Database connection failures
    const isPrismaError = error?.code?.startsWith('P');
    const isConnError = error?.message?.toLowerCase().includes('connection') || 
                        error?.message?.toLowerCase().includes('reach') ||
                        error?.message?.toLowerCase().includes('network');

    if (isPrismaError || isConnError) {
      console.error('[CRITICAL_DB_FAILURE]: Returning null to prevent SSR crash.');
      return null;
    }
    
    // 3. For generic Auth errors (expired token, etc.), return null to force login
    return null;
  }
});
