import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const userCount = await prisma.user.count();
  const scriptCount = await prisma.script.count();
  const requestCount = await prisma.collaborationRequest.count();
  
  // Get recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { created_at: 'desc' }
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">System Overview & Real-time Signal</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Total Creators</div>
          <div className="stat-value">{userCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scripts Locked</div>
          <div className="stat-value">{scriptCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collab Requests</div>
          <div className="stat-value">{requestCount}</div>
        </div>
      </div>

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Recent Signal</h2>
        <Link href="/admin/users" className="btn-action">View All Users →</Link>
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>College</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td style={{ color: 'var(--silver)' }}>{user.email}</td>
                <td>
                  <span className="role-badge">{user.role || 'Unassigned'}</span>
                </td>
                <td style={{ color: 'var(--silver)' }}>{user.college || '—'}</td>
                <td style={{ color: 'var(--silver)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '50px', padding: '30px', border: '1px dashed var(--border)', textAlign: 'center', background: 'rgba(255,77,26,0.02)' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase' }}>
          Monitoring Active · All Actions Logged · Encrypted Signal
        </p>
      </div>
    </div>
  );
}
