import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status') || 'all';
  const statusClause = status !== 'all' ? `WHERE i.status = '${status.replace(/'/g, '')}'` : '';

  const issues = (await prisma.$queryRawUnsafe(
    `SELECT i.id, i.title, i.description, i.severity, i.status, i.priority,
            i.location, i.created_at, u.name AS author_name
     FROM issues i LEFT JOIN users u ON u.id = i.user_id
     ${statusClause}
     ORDER BY i.created_at DESC LIMIT 500`
  )) as Record<string, unknown>[];

  return NextResponse.json({ success: true, data: issues });
}
