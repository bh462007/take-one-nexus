import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const { id } = await params;
  const issueId = Number(id);
  const body = await req.json();
  const { status, priority, assigned_admin } = body;

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (assigned_admin !== undefined) updateData.assigned_admin = assigned_admin ? Number(assigned_admin) : null;
  if (status === 'resolved') updateData.resolved_at = new Date();
  else if (status && status !== 'resolved') updateData.resolved_at = null;

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: updated });
}
