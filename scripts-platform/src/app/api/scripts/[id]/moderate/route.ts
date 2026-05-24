import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { Resend } from 'resend';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const { id } = await params;
  const scriptId = Number(id);
  const { action, moderation_notes } = await req.json();

  const allowed = ['approved', 'rejected', 'pending'];
  if (!allowed.includes(action)) {
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  }

  // Fetch script with author info
  const script = (await prisma.$queryRawUnsafe(
    `SELECT s.*, u.email AS author_email, u.name AS author_name
     FROM scripts s LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = ? LIMIT 1`,
    scriptId
  )) as Record<string, unknown>[];

  if (!script.length) {
    return NextResponse.json({ success: false, message: 'Script not found' }, { status: 404 });
  }

  const now = action === 'approved' ? new Date() : null;

  await prisma.$executeRawUnsafe(
    `UPDATE scripts SET approval_status = ?, approved_by = ?, approved_at = ?, moderation_notes = ?, updated_at = NOW() WHERE id = ?`,
    action, session.id, now, moderation_notes || null, scriptId
  );

  // Send rejection email
  const s = script[0];
  if (action === 'rejected' && s.author_email && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'TAKE ONE Nexus <noreply@takeone-nexus.net.in>',
        to: s.author_email as string,
        subject: `Your submission "${s.title}" — Moderation Update`,
        html: `
          <div style="font-family:monospace;background:#0a0a0a;color:#e8e8e0;padding:32px;border-radius:8px;max-width:560px;">
            <div style="color:#ff6b00;font-size:12px;letter-spacing:3px;margin-bottom:16px;">TAKE ONE NEXUS</div>
            <h2 style="color:#e8e8e0;margin:0 0 16px;">Moderation Update</h2>
            <p>Hi ${s.author_name || 'Creator'},</p>
            <p>Your submission <strong>${s.title}</strong> was reviewed and requires changes before it can go live on the platform.</p>
            ${moderation_notes ? `<div style="background:#1a1a1a;border-left:3px solid #ff6b00;padding:12px 16px;margin:16px 0;"><strong>Moderator Notes:</strong><br/>${moderation_notes}</div>` : ''}
            <p>You can edit and resubmit from your profile. If you have questions, reply to this email.</p>
            <p style="color:rgba(232,232,224,0.4);font-size:11px;margin-top:24px;">TAKE ONE Nexus · Empowering Independent Film Crews</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Rejection email error:', err);
    }
  }

  return NextResponse.json({ success: true, message: `Script ${action}` });
}
