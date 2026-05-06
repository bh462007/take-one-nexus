import React from 'react';
import '@/styles/admin.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TAKE ONE | Control Room',
  description: 'Mission Control for TAKE ONE Nexus',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <a href="/admin" className="logo">TAKE <span>ONE</span> <small>CONTROL ROOM</small></a>
        <nav className="admin-nav">
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">Users</a>
          <a href="/">Exit to Site</a>
        </nav>
      </header>
      <main className="admin-main">
        {children}
      </main>
      <footer className="admin-footer">
        <p>&copy; 2026 TAKE ONE Nexus — System Online</p>
      </footer>
    </div>
  );
}
