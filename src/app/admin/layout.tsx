import React from 'react';
import '@/styles/admin.css';

export const metadata = {
  title: 'TAKE ONE | Admin Panel',
  description: 'Control Room for TAKE ONE Nexus',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="logo">TAKE <span>ONE</span> <small>CONTROL ROOM</small></div>
        <nav className="admin-nav">
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">User Management</a>
          <a href="/">Back to Site</a>
        </nav>
      </header>
      <main className="admin-main">
        {children}
      </main>
      <footer className="admin-footer">
        <p>&copy; 2026 TAKE ONE Nexus — Admin Interface</p>
      </footer>
    </div>
  );
}
