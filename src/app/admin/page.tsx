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
        <h1 className="page-title">Command Center</h1>
        <p className="page-subtitle">Mission Overview & Real-time Production Signal</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Production Crew</div>
          <div className="stat-value">{userCount}</div>
          <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--silver)', letterSpacing: '2px' }}>REGISTERED CREATORS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scripts Locked</div>
          <div className="stat-value">{scriptCount}</div>
          <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--silver)', letterSpacing: '2px' }}>SCREENPLAYS ON FILE</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Collabs</div>
          <div className="stat-value">{requestCount}</div>
          <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--silver)', letterSpacing: '2px' }}>COLLABORATION SIGNALS</div>
        </div>
      </div>

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '32px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Recent Transmissions</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '10px', letterSpacing: '3px', color: 'var(--silver)', textTransform: 'uppercase' }}>Last 5 creators to join the production</p>
        </div>
        <Link href="/admin/users" className="btn-action">View Full Crew List →</Link>
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Creator Name</th>
              <th>Channel / Email</th>
              <th>Role Designation</th>
              <th>College / Base</th>
              <th>Sync Date</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 'bold' }}>{user.name}</td>
                <td style={{ color: 'var(--silver)', fontFamily: 'var(--font-main)' }}>{user.email}</td>
                <td>
                  <span className="role-badge">{user.role || 'GHOST'}</span>
                </td>
                <td style={{ color: 'var(--silver)' }}>{user.college || '—'}</td>
                <td style={{ color: 'var(--silver)', fontSize: '10px' }}>{new Date(user.created_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: '60px', 
        padding: '40px', 
        border: '1px solid var(--border)', 
        textAlign: 'center', 
        background: 'rgba(255,77,26,0.02)',
        clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '8px', color: 'var(--neon)', letterSpacing: '3px', marginBottom: '5px' }}>SIGNAL STRENGTH</div>
            <div style={{ width: '100px', height: '4px', background: 'var(--border)' }}>
              <div style={{ width: '85%', height: '100%', background: 'var(--neon)' }}></div>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '8px', color: 'var(--cyan)', letterSpacing: '3px', marginBottom: '5px' }}>ENCRYPTION</div>
            <div style={{ width: '100px', height: '4px', background: 'var(--border)' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--cyan)' }}></div>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase', margin: 0 }}>
          Direct Database Connection Established · Signal 001-A · TAKE ONE Nexus Mission Control
        </p>
      </div>
    </div>
  );
}
