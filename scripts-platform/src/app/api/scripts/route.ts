import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status') || 'all';

  const where = status !== 'all' ? { approval_status: status } : {};

  const scripts = (await prisma.$queryRawUnsafe(
    `SELECT s.id, s.title, s.genre, s.work_type, s.approval_status, s.created_at,
            s.synopsis, s.media_links, s.moderation_notes,
            u.name AS author_name, u.email AS author_email
     FROM scripts s
     LEFT JOIN users u ON u.id = s.user_id
     ${status !== 'all' ? `WHERE s.approval_status = '${status.replace(/'/g, '')}'` : ''}
     ORDER BY s.created_at DESC
     LIMIT 200`
  )) as Record<string, unknown>[];

  return NextResponse.json({ success: true, data: scripts });
}
