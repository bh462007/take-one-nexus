'use client';

import { useState } from 'react';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';

type Phase = 'form' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'loading') return;

    if (!email) {
      setMessage('Please enter your email address.');
      setPhase('error');
      return;
    }

    setPhase('loading');
    try {
      const res = await fetchWithCSRF('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setPhase('success');
        setMessage(data.message || 'If registered, a secure reset link has been sent.');
      } else {
        setMessage(data.message || 'Failed to process request. Please try again.');
        setPhase('error');
      }
    } catch {
      setMessage('Network error. Please try again.');
      setPhase('error');
    }
  };

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'var(--machine)',
    border: '1px solid var(--rail)',
    color: 'var(--cream)',
    padding: '13px 16px',
    fontSize: 12,
    fontFamily: 'var(--font-main)',
    outline: 'none',
    letterSpacing: '0.05em',
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
            Nexus Platform · Request Reset
          </div>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid rgba(255,77,26,0.2)', borderTop: '3px solid var(--neon)', padding: '40px 36px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'rgba(255,77,26,0.03)', pointerEvents: 'none' }} />

          {phase === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: 'var(--cyan)', marginBottom: 20 }}>✦</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, letterSpacing: '0.2em', color: 'var(--cream)', marginBottom: 12 }}>REQUEST TRANSMITTED</div>
              <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.8, letterSpacing: '0.05em', marginBottom: 28 }}>{message}</p>
              <a href="/?auth=login" style={{ display: 'block', background: 'var(--neon)', color: '#06080A', textDecoration: 'none', padding: '14px 24px', fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center' }}>
                RETURN TO LOGIN
              </a>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.4em', color: 'var(--neon)', textTransform: 'uppercase', marginBottom: 10 }}>🔐 SECURE RESET</div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, letterSpacing: '0.15em', color: 'var(--cream)', marginBottom: 12 }}>FORGOT PASSWORD</div>
                <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.7, letterSpacing: '0.05em' }}>
                  Enter your registered email address. If it exists in the Nexus, we will send you a secure link to reset your password.
                </p>
              </div>

              {phase === 'error' && (
                <div style={{ background: 'rgba(255,77,26,0.06)', border: '1px solid rgba(255,77,26,0.2)', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--neon)', letterSpacing: '0.05em', lineHeight: 1.6 }}>
                  ⚠ {message}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label htmlFor="forgot-email" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--silver)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email Address</label>
                  <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" style={inp} onFocus={e => (e.currentTarget.style.borderColor = 'var(--neon)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--rail)')} />
                </div>

                <button type="submit" disabled={phase === 'loading'} style={{ background: phase === 'loading' ? 'var(--rail)' : 'var(--neon)', color: '#06080A', border: 'none', padding: '14px 24px', fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: phase === 'loading' ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-main)', width: '100%', transition: 'all 0.2s' }}>
                  {phase === 'loading' ? '◌ TRANSMITTING…' : 'SEND RESET LINK →'}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--rail)', display: 'flex', justifyContent: 'center', gap: 24 }}>
            <a href="/?auth=login" style={{ fontSize: 10, color: 'var(--silver)', textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Login</a>
            <a href="/" style={{ fontSize: 10, color: 'var(--silver)', textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Home</a>
          </div>
        </div>
      </div>
    </div>
  );
}
