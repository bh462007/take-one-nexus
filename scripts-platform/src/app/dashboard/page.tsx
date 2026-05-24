import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

interface RecentScript {
  id: number;
  title: string;
  created_at: Date;
  approval_status: string;
  user: { name: string; email: string } | null;
}

interface RecentIssue {
  id: number;
  title: string;
  severity: string;
  status: string;
  created_at: Date;
  user: { name: string } | null;
}

async function getStats() {
  const [
    totalScripts,
    pendingScripts,
    approvedScripts,
    rejectedScripts,
    totalIssues,
    openIssues,
    resolvedIssues,
    totalUsers,
  ] = await Promise.all([
    prisma.script.count(),
    prisma.script.count({ where: { approval_status: 'pending' } }),
    prisma.script.count({ where: { approval_status: 'approved' } }),
    prisma.script.count({ where: { approval_status: 'rejected' } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { status: 'open' } }),
    prisma.issue.count({ where: { status: 'resolved' } }),
    prisma.user.count(),
  ]);

  const recentScripts = (await prisma.script.findMany({
    take: 6,
    orderBy: { created_at: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })) as unknown as RecentScript[];

  const recentIssues = (await prisma.issue.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: { user: { select: { name: true } } },
  })) as unknown as RecentIssue[];

  return {
    totalScripts, pendingScripts, approvedScripts, rejectedScripts,
    totalIssues, openIssues, resolvedIssues, totalUsers,
    recentScripts, recentIssues,
  };
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function DashboardPage() {
  const session = await getAdminSession();
  const stats = await getStats();

  return (
    <div className="shell">
      <Sidebar adminEmail={session?.email} />

      <main className="main-content">
        <div className="page-header">
          <div className="page-kicker">Moderation Command Centre</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Live overview of scripts, issues, and platform health</p>
        </div>

        {/* ── Stat grid ── */}
        <div className="stat-grid">
          <div className="stat-card neon">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{stats.pendingScripts}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Approved Scripts</div>
            <div className="stat-value">{stats.approvedScripts}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Open Issues</div>
            <div className="stat-value">{stats.openIssues}</div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-label">Total Creators</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

          {/* ── Recent submissions ── */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--neon)', textTransform: 'uppercase' }}>
                Recent Submissions
              </h2>
              <a href="/scripts" className="btn btn-ghost" style={{ fontSize: '10px', padding: '4px 12px' }}>
                View All →
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentScripts.map((s) => (
                <a
                  key={s.id}
                  href={`/scripts/${s.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'var(--machine)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s',
                  }}
                    className="hover-row"
                  >
                    <div>
                      <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: '4px', fontSize: '13px' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {s.user?.name || 'Unknown'} · {formatDate(s.created_at)}
                      </div>
                    </div>
                    <span className={`badge badge-${s.approval_status || 'pending'}`}>
                      {s.approval_status || 'pending'}
                    </span>
                  </div>
                </a>
              ))}

              {stats.recentScripts.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                  No scripts submitted yet
                </div>
              )}
            </div>
          </section>

          {/* ── Recent issues ── */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--red)', textTransform: 'uppercase' }}>
                Recent Issues
              </h2>
              <a href="/issues" className="btn btn-ghost" style={{ fontSize: '10px', padding: '4px 12px' }}>
                View All →
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    background: 'var(--machine)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: '4px', fontSize: '13px' }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {issue.user?.name || 'Anonymous'} · {formatDate(issue.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge badge-${String(issue.severity)}`}>{String(issue.severity)}</span>
                    <span className={`badge badge-${issue.status === 'in_progress' ? 'progress' : String(issue.status)}`}>
                      {String(issue.status)}
                    </span>
                  </div>
                </div>
              ))}

              {stats.recentIssues.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                  No issues reported yet
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
