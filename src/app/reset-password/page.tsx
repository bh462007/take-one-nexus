'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';

type Phase = 'form' | 'loading' | 'success' | 'error';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phase, setPhase] = useState<Phase>(token ? 'form' : 'error');
  const [message, setMessage] = useState(!token ? 'Invalid or missing reset token. Please request a new password reset.' : '');
  const [showPass, setShowPass] = useState(false);

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'var(--neon)', 'var(--amber)', 'var(--neon2)', 'var(--cyan)'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'loading') return;

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setPhase('error');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      setPhase('error');
      return;
    }

    setPhase('loading');
    try {
      const res = await fetchWithCSRF('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setPhase('success');
        setMessage(data.message);
      } else {
        setMessage(data.message || 'Failed to reset password. Please try again.');
        setPhase('error');
      }
    } catch {
      setMessage('Network error. Please try again.');
      setPhase('error');
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--machine)', border: '1px solid var(--rail)',
    color: 'var(--cream)', padding: '13px 16px', fontSize: 12,
    fontFamily: 'var(--font-main)', outline: 'none', letterSpacing: '0.05em',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-main)' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 36, letterSpacing: '0.1em', color: 'var(--neon)' }}>TAKE ONE</div>
          </a>
          <div style={{ fontSize: 9, letterSpacing: '0.4em', color: 'var(--silver)', textTransform: 'uppercase', marginTop: 6 }}>
            Nexus Platform · Password Reset
          </div>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid rgba(255,77,26,0.2)', borderTop: '3px solid var(--neon)', padding: '40px 36px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'rgba(255,77,26,0.03)', pointerEvents: 'none' }} />

          {phase === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: 'var(--neon)', marginBottom: 20 }}>✦</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, letterSpacing: '0.2em', color: 'var(--cream)', marginBottom: 12 }}>PASSWORD UPDATED</div>
              <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.8, letterSpacing: '0.05em', marginBottom: 28 }}>{message}</p>
              <a href="/?auth=login" style={{ display: 'block', background: 'var(--neon)', color: '#06080A', textDecoration: 'none', padding: '14px 24px', fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center' }}>
                LOGIN NOW →
              </a>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.4em', color: 'var(--neon)', textTransform: 'uppercase', marginBottom: 10 }}>🔐 SET NEW PASSWORD</div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, letterSpacing: '0.15em', color: 'var(--cream)', marginBottom: 12 }}>RESET PASSWORD</div>
                <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.7, letterSpacing: '0.05em' }}>
                  Choose a strong password with at least 8 characters, including letters and numbers.
                </p>
              </div>

              {phase === 'error' && (
                <div style={{ background: 'rgba(255,77,26,0.06)', border: '1px solid rgba(255,77,26,0.2)', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--neon)', letterSpacing: '0.05em', lineHeight: 1.6 }}>
                  ⚠ {message}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--silver)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="new-password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters…" required autoComplete="new-password" style={{ ...inp, paddingRight: 44 }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--neon)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--rail)')} />
                    <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--silver)', cursor: 'pointer', fontSize: 14, padding: 0 }}>{showPass ? '👁' : '👁‍🗨'}</button>
                  </div>
                  {password.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 2, background: 'var(--rail)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ width: `${strength * 25}%`, height: '100%', background: strengthColor, transition: 'all 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 9, color: strengthColor, letterSpacing: '0.2em' }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--silver)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Confirm Password</label>
                  <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required autoComplete="new-password" style={{ ...inp, borderColor: confirmPassword && confirmPassword !== password ? 'var(--neon)' : 'var(--rail)' }} onFocus={e => (e.currentTarget.style.borderColor = confirmPassword !== password ? 'var(--neon)' : 'var(--cyan)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--rail)')} />
                  {confirmPassword && password !== confirmPassword && (
                    <div style={{ marginTop: 6, fontSize: 10, color: 'var(--neon)', letterSpacing: '0.1em' }}>Passwords do not match</div>
                  )}
                </div>

                <button type="submit" id="reset-submit" disabled={phase === 'loading' || !token} style={{ background: phase === 'loading' ? 'var(--rail)' : 'var(--neon)', color: '#06080A', border: 'none', padding: '14px 24px', fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: phase === 'loading' ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-main)', width: '100%', transition: 'all 0.2s' }}>
                  {phase === 'loading' ? '◌ UPDATING…' : 'SET NEW PASSWORD →'}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--rail)', display: 'flex', justifyContent: 'center', gap: 24 }}>
            <a href="/forgot-password" style={{ fontSize: 10, color: 'var(--silver)', textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Request New Link</a>
            <a href="/?auth=login" style={{ fontSize: 10, color: 'var(--silver)', textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silver)' }}>Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
