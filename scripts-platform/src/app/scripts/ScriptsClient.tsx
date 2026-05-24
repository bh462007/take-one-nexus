'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Script {
  id: number;
  title: string;
  genre: string | null;
  work_type: string;
  approval_status: string;
  created_at: string;
  author_name: string;
  author_email: string;
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ScriptsClient() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts?status=${filter}`);
      const json = await res.json();
      setScripts(json.data || []);
    } catch {
      showToast('Failed to load scripts', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id: number, action: string) {
    const res = await fetch(`/api/scripts/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Script ${action} ✓`, 'success');
      load();
    } else {
      showToast(json.message || 'Action failed', 'error');
    }
  }

  const counts = {
    all: scripts.length,
  };

  return (
    <>
      <div className="filter-bar">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', letterSpacing: '3px', fontSize: '11px' }}>
          LOADING QUEUE...
        </div>
      ) : (
        <div style={{ background: 'var(--machine)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Genre / Type</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scripts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                    No scripts in this queue
                  </td>
                </tr>
              ) : (
                scripts.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--muted)', fontSize: '11px' }}>#{s.id}</td>
                    <td>
                      <Link href={`/scripts/${s.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700 }}>
                        {s.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{s.author_name}</td>
                    <td style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {s.genre || '—'} · {s.work_type}
                    </td>
                    <td>
                      <span className={`badge badge-${s.approval_status}`}>{s.approval_status}</span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatDate(s.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/scripts/${s.id}`} className="btn btn-ghost" style={{ fontSize: '10px', padding: '5px 10px' }}>
                          Review
                        </Link>
                        {s.approval_status !== 'approved' && (
                          <button
                            className="btn btn-approve"
                            style={{ fontSize: '10px', padding: '5px 10px' }}
                            onClick={() => moderate(s.id, 'approved')}
                          >
                            ✓
                          </button>
                        )}
                        {s.approval_status !== 'rejected' && (
                          <button
                            className="btn btn-reject"
                            style={{ fontSize: '10px', padding: '5px 10px' }}
                            onClick={() => moderate(s.id, 'rejected')}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}
