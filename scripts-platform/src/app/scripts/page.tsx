import { getAdminSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ScriptsClient from './ScriptsClient';

export const metadata = { title: 'Script Queue | TAKE ONE Review' };

export default async function ScriptsPage() {
  const session = await getAdminSession();

  return (
    <div className="shell">
      <Sidebar adminEmail={session?.email} />
      <main className="main-content">
        <div className="page-header">
          <div className="page-kicker">Moderation Queue</div>
          <h1 className="page-title">Script Review</h1>
          <p className="page-sub">Approve, reject, or flag submissions for the platform</p>
        </div>
        <ScriptsClient />
      </main>
    </div>
  );
}
