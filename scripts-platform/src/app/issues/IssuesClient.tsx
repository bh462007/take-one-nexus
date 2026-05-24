'use client';

import { useState, useEffect, useCallback } from 'react';

interface Issue {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  priority: string;
  location: string | null;
  created_at: string;
  author_name: string | null;
}

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved'];
const PRIORITY_MAP: Record<string, string> = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const SEVERITY_MAP: Record<string, string> = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-red' };

export default function IssuesClient() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues?status=${filter}`);
      const json = await res.json();
      setIssues(json.data || []);
    } catch {
      showToast('Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Issue marked as ${status} ✓`);
      load();
    } else {
      showToast(json.message || 'Update failed', 'error');
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <>
      <div className="filter-bar">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', letterSpacing: '3px', fontSize: '11px' }}>
          LOADING ISSUES...
        </div>
      ) : (
        <div style={{ background: 'var(--machine)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Reporter</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                    No issues in this queue
                  </td>
                </tr>
              ) : (
                issues.map(issue => (
                  <tr key={issue.id}>
                    <td style={{ color: 'var(--muted)', fontSize: '11px' }}>#{issue.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, marginBottom: '3px' }}>{issue.title}</div>
                      {issue.location && (
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{issue.location}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{issue.author_name || 'Anonymous'}</td>
                    <td>
                      <span className={`badge ${SEVERITY_MAP[issue.severity] || 'badge-low'}`}>{issue.severity}</span>
                    </td>
                    <td>
                      <span className={`badge ${PRIORITY_MAP[issue.priority] || 'badge-medium'}`}>{issue.priority}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${issue.status === 'in_progress' ? 'progress' : issue.status}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatDate(issue.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {issue.status !== 'in_progress' && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '10px', padding: '4px 8px', color: 'var(--cyan)', borderColor: 'var(--cyan)' }}
                            onClick={() => updateStatus(issue.id, 'in_progress')}
                          >
                            In Progress
                          </button>
                        )}
                        {issue.status !== 'resolved' && (
                          <button
                            className="btn btn-approve"
                            style={{ fontSize: '10px', padding: '4px 8px' }}
                            onClick={() => updateStatus(issue.id, 'resolved')}
                          >
                            Resolve
                          </button>
                        )}
                        {issue.status !== 'open' && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '10px', padding: '4px 8px' }}
                            onClick={() => updateStatus(issue.id, 'open')}
                          >
                            Reopen
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

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
