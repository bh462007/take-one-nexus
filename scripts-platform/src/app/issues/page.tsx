import { getAdminSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import IssuesClient from './IssuesClient';

export const metadata = { title: 'Issue Reports | TAKE ONE Review' };

export default async function IssuesPage() {
  const session = await getAdminSession();

  return (
    <div className="shell">
      <Sidebar adminEmail={session?.email} />
      <main className="main-content">
        <div className="page-header">
          <div className="page-kicker">Bug & Issue Tracker</div>
          <h1 className="page-title">Issue Reports</h1>
          <p className="page-sub">Triage, assign, and resolve platform issues reported by users</p>
        </div>
        <IssuesClient />
      </main>
    </div>
  );
}
