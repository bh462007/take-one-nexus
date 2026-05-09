'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/styles/admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [time, setTime] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-container">
      {/* ── FILMSTRIP RAIL ── */}
      <aside className="filmstrip-v">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="film-hole"></div>
        ))}
      </aside>

      <header className="admin-header">
        <Link href="/admin" className="logo">
          TAKE <span>ONE</span> <small>CONTROL ROOM</small>
        </Link>
        <nav className="admin-nav">
          <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>Dashboard</Link>
          <Link href="/admin/users" className={pathname.startsWith('/admin/users') ? 'active' : ''}>Users</Link>
          <Link href="/admin/issues" className={pathname.startsWith('/admin/issues') ? 'active' : ''}>Issues</Link>
          <Link href="/crew.htm">Crew</Link>
          <Link href="/">Exit Terminal</Link>
        </nav>
      </header>

      <main className="admin-main">
        {children}
      </main>

      <footer className="admin-footer">
        <div className="status-group">
          <div className="status-item">
            <div className="status-dot"></div> SYSTEM ONLINE
          </div>
          <div className="status-item">
            <div className="status-dot cyan"></div> SIGNAL SECURE
          </div>
        </div>
        <div className="status-item">
          TAKE ONE v2.2 // {time}
        </div>
      </footer>
    </div>
  );
}
