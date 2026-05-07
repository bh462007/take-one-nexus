import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod'
);

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
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
      // Re-throw as a standardized DB failure for the Error Boundary
      throw new Error(`DATABASE_CONNECTION_FAILURE: ${error?.code || 'CONN_LOST'}`);
    }
    
    // 3. For generic Auth errors (expired token, etc.), return null to force login
    return null;
  }
}
