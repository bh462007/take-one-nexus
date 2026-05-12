'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  role: string | null;
  college: string | null;
  city: string | null;
  created_at: string;
}

interface Stats {
  users: number;
  scripts: number;
  requests: number;
}

interface DashboardData {
  counts: Stats;
  recentUsers: User[];
}

export default function AdminDashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetch('/api/system/stats', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.status === 401) {
        window.location.href = '/?auth=login';
        return;
      }

      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to sync with Command Center');
      }
    } catch (err) {
      setError('Signal lost: Could not reach Command Center');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Initialize Pusher
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '';

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher configuration missing for real-time updates');
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster
    });

    const channel = pusher.subscribe('admin-dashboard');
    
    channel.bind('update', (payload: any) => {
      console.log('Admin Dashboard Update Received:', payload);
      fetchStats();
      
      if (payload.type === 'USER_CREATED') {
        setNewUserId(payload.user.id);
        setTimeout(() => setNewUserId(null), 5000); // Clear pulse after 5 seconds
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('admin-dashboard');
      pusher.disconnect();
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--neon)' }}>
        <div className="pulse-ring" style={{ width: '50px', height: '50px' }}></div>
        <span style={{ marginLeft: '20px', fontFamily: 'var(--font-title)', letterSpacing: '4px', textTransform: 'uppercase' }}>Synchronizing Production Data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--silver)', background: 'rgba(255,0,0,0.05)' }}>
        <h3 style={{ color: 'var(--neon)', marginBottom: '10px' }}>CONNECTION INTERRUPTED</h3>
        <p>{error}</p>
        <button onClick={() => { setLoading(true); fetchStats(); }} className="btn-action" style={{ marginTop: '20px' }}>Retry Sync</button>
      </div>
    );
  }

  const getRoleBadgeClass = (role: string | null) => {
    if (!role) return 'role-badge';
    const r = role.toLowerCase();
    if (r === 'developer') return 'role-badge dev-badge';
    if (r === 'admin') return 'role-badge admin-badge';
    return 'role-badge';
  };

  return (
    <>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Production Crew</div>
          <div className="stat-value">{data.counts.users}</div>
          <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--silver)', letterSpacing: '2px' }}>REGISTERED CREATORS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scripts Locked</div>
          <div className="stat-value">{data.counts.scripts}</div>
          <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--silver)', letterSpacing: '2px' }}>SCREENPLAYS ON FILE</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Collabs</div>
          <div className="stat-value">{data.counts.requests}</div>
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
            {data.recentUsers.map(user => (
              <tr key={user.id} className={newUserId === user.id ? 'row-pulse' : ''}>
                <td style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user.name}
                  {newUserId === user.id && <span className="new-pulse">NEW</span>}
                </td>
                <td style={{ color: 'var(--silver)', fontFamily: 'var(--font-main)' }}>{user.email}</td>
                <td>
                  <span className={getRoleBadgeClass(user.role)}>{user.role || 'GHOST'}</span>
                </td>
                <td style={{ color: 'var(--silver)' }}>{user.college || '—'}</td>
                <td style={{ color: 'var(--silver)', fontSize: '10px' }}>
                  {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {data.recentUsers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--silver)' }}>No transmissions detected in this sector.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .row-pulse {
          background: rgba(255, 77, 26, 0.1) !important;
          animation: rowHighlight 5s ease-out forwards;
        }

        .new-pulse {
          font-size: 8px;
          background: var(--neon);
          color: var(--void);
          padding: 2px 6px;
          border-radius: 2px;
          animation: pulse 1.5s infinite;
          letter-spacing: 1px;
          font-weight: bold;
        }

        .dev-badge {
          border-color: var(--cyan) !important;
          color: var(--cyan) !important;
          background: rgba(0, 255, 255, 0.1) !important;
        }

        .admin-badge {
          border-color: #ffcc00 !important;
          color: #ffcc00 !important;
          background: rgba(255, 204, 0, 0.1) !important;
        }

        @keyframes rowHighlight {
          0% { background: rgba(255, 77, 26, 0.2); }
          100% { background: transparent; }
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
