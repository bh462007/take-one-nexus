'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Script {
  id: number;
  title: string;
  genre: string | null;
  synopsis: string | null;
  work_type: string;
  status: string;
  approval_status: string;
  media_links: string | null;
  moderation_notes: string | null;
  created_at: string;
  author_name: string;
  author_email: string;
}

export default function ReviewClient({ script }: { script: Script }) {
  const router = useRouter();
  const [notes, setNotes] = useState(script.moderation_notes || '');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  async function moderate(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/scripts/${script.id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, moderation_notes: notes }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Script marked as ${action} ✓`, 'success');
        setTimeout(() => router.push('/scripts'), 1500);
      } else {
        showToast(json.message || 'Action failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoading(null);
    }
  }

  const mediaLinks = (() => {
    try { return JSON.parse(script.media_links || '[]'); } catch { return []; }
  })();

  const pdfLinks = mediaLinks.filter((l: string) =>
    typeof l === 'string' && (l.endsWith('.pdf') || l.includes('pdf'))
  );

  return (
    <>
      <div className="script-detail-grid">
        {/* ── Left: Script content ── */}
        <div>
          <div className="detail-section">
            <h3>Script Information</h3>
            <div className="detail-field">
              <label>Title</label>
              <p style={{ fontSize: '18px', fontWeight: 700 }}>{script.title}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="detail-field">
                <label>Genre</label>
                <p>{script.genre || '—'}</p>
              </div>
              <div className="detail-field">
                <label>Work Type</label>
                <p>{script.work_type}</p>
              </div>
              <div className="detail-field">
                <label>Collaboration Status</label>
                <p>{script.status}</p>
              </div>
              <div className="detail-field">
                <label>Submitted</label>
                <p>{new Date(script.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {script.synopsis && (
            <div className="detail-section">
              <h3>Synopsis</h3>
              <p style={{ color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{script.synopsis}</p>
            </div>
          )}

          {/* ── PDF Viewer ── */}
          {pdfLinks.length > 0 && (
            <div className="detail-section">
              <h3>Script Files</h3>
              {pdfLinks.map((url: string, i: number) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '11px' }}>
                      Open in New Tab ↗
                    </a>
                  </div>
                  <iframe
                    src={url}
                    style={{ width: '100%', height: '600px', border: '1px solid var(--border)', borderRadius: '6px' }}
                    title={`Script PDF ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          )}

          {mediaLinks.length > 0 && pdfLinks.length < mediaLinks.length && (
            <div className="detail-section">
              <h3>Media Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mediaLinks.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--cyan)', fontSize: '12px', wordBreak: 'break-all' }}
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Action panel ── */}
        <div>
          <div className="action-panel">
            <h3>Moderation Actions</h3>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '6px' }}>CURRENT STATUS</div>
              <span className={`badge badge-${script.approval_status}`} style={{ fontSize: '12px', padding: '4px 14px' }}>
                {script.approval_status}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: '12px' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>Moderator Notes</div>
              <textarea
                className="input-field"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes (visible in rejection email)..."
                rows={4}
                style={{ marginBottom: '16px' }}
              />

              <button
                className="btn btn-approve"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}
                onClick={() => moderate('approved')}
                disabled={!!loading}
              >
                {loading === 'approved' ? 'Processing...' : '✓ Approve Script'}
              </button>

              <button
                className="btn btn-reject"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}
                onClick={() => moderate('rejected')}
                disabled={!!loading}
              >
                {loading === 'rejected' ? 'Processing...' : '✕ Reject Script'}
              </button>

              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
                onClick={() => moderate('pending')}
                disabled={!!loading}
              >
                ↺ Reset to Pending
              </button>
            </div>
          </div>

          {/* Author card */}
          <div style={{
            background: 'var(--machine)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '16px',
          }}>
            <h3 style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: '14px' }}>
              Author
            </h3>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{script.author_name}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{script.author_email}</div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}
