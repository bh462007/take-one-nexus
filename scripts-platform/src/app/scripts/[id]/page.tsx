import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ReviewClient from './ReviewClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScriptReviewPage({ params }: Props) {
  const session = await getAdminSession();
  const { id } = await params;

  const rows = (await prisma.$queryRawUnsafe(
    `SELECT s.*, u.name AS author_name, u.email AS author_email
     FROM scripts s LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = ? LIMIT 1`,
    Number(id)
  )) as Record<string, unknown>[];

  if (!rows.length) notFound();

  const script = rows[0] as {
    id: number; title: string; genre: string | null; synopsis: string | null;
    work_type: string; status: string; approval_status: string;
    media_links: string | null; moderation_notes: string | null;
    created_at: string; author_name: string; author_email: string;
  };

  return (
    <div className="shell">
      <Sidebar adminEmail={session?.email} />
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Link href="/scripts" className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>
            ← Back
          </Link>
          <div>
            <div className="page-kicker">Script Review</div>
            <h1 className="page-title" style={{ fontSize: '28px', margin: 0 }}>{script.title}</h1>
          </div>
        </div>

        <ReviewClient script={script} />
      </main>
    </div>
  );
}
