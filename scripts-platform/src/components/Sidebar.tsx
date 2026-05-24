'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard',      icon: '◎' },
  { href: '/scripts',   label: 'Script Queue',   icon: '◈' },
  { href: '/issues',    label: 'Issue Reports',  icon: '⚠' },
];

export default function Sidebar({ adminEmail }: { adminEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">TAKE <span>ONE</span></div>

      <div className="sidebar-label">Navigation</div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {adminEmail && (
          <div style={{ marginBottom: '12px', fontSize: '10px', opacity: 0.6, wordBreak: 'break-all' }}>
            {adminEmail}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: '10px', letterSpacing: '2px' }}
        >
          SIGN OUT
        </button>
      </div>
    </aside>
  );
}
