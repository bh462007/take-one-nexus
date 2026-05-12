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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
        const meRes = await fetch('/api/users/me', {
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          cache: 'no-store'
        });
        const mePayload = await meRes.json();
        const role = String(mePayload?.user?.role || '').toLowerCase();
        if (meRes.ok && mePayload?.success && ['admin', 'developer', 'moderator'].includes(role)) {
          setIsAuthorized(true);
          return;
        }

        const storedUser = localStorage.getItem('take_one_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const fallbackRole = String(user.role || '').toLowerCase();
          if (['admin', 'developer', 'moderator'].includes(fallbackRole)) {
            setIsAuthorized(true);
            return;
          }
        }
      } catch (err) {
        console.error('Admin layout auth check failed:', err);
      }
      window.location.href = '/?auth=login';
    };
    checkAuth();
  }, []);

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

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#06080A', color: 'var(--neon)', fontFamily: 'Bebas Neue' }}>
        <h2>Authenticating Signal...</h2>
      </div>
    );
  }

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
          <Link href="/crew">Crew</Link>
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
