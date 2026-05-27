'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';

type Status = 'loading' | 'success' | 'already-verified' | 'expired' | 'invalid' | 'error' | 'resending' | 'resent';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get('status') as Status | null;
  const [status, setStatus] = useState<Status>(rawStatus || 'loading');
  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (rawStatus) setStatus(rawStatus as Status);
  }, [rawStatus]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleResend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email || inputEmail;
    if (!targetEmail || cooldown > 0) return;

    setStatus('resending');
    try {
      const res = await fetchWithCSRF('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      setResendMessage(data.message || 'Verification email sent.');
      setStatus('resent');
      setCooldown(60);
    } catch {
      setResendMessage('Failed to resend. Please try again.');
      setStatus('expired');
    }
  }, [email, inputEmail, cooldown]);

  const configs: Record<Status, { icon: string; color: string; title: string; subtitle: string }> = {
    loading: { icon: '◌', color: 'var(--silver)', title: 'VERIFYING SIGNAL…', subtitle: 'Processing your verification request.' },
    success: { icon: '✦', color: 'var(--neon)', title: 'SIGNAL CONFIRMED', subtitle: 'Your email has been verified. Welcome to TAKE ONE Nexus.' },
    'already-verified': { icon: '✓', color: 'var(--cyan)', title: 'ALREADY VERIFIED', subtitle: 'This account is already verified. You can log in.' },
    expired: { icon: '⧗', color: 'var(--amber)', title: 'LINK EXPIRED', subtitle: 'This verification link has expired. Request a new one below.' },
    invalid: { icon: '✕', color: 'var(--neon)', title: 'INVALID TOKEN', subtitle: 'This verification link is invalid or has already been used.' },
    error: { icon: '⚠', color: 'var(--neon)', title: 'SIGNAL ERROR', subtitle: 'Something went wrong. Please try again or request a new link.' },
    resending: { icon: '◌', color: 'var(--cyan)', title: 'SENDING…', subtitle: 'Transmitting your verification signal.' },
    resent: { icon: '✉', color: 'var(--cyan)', title: 'EMAIL SENT', subtitle: resendMessage || 'Check your inbox for the new verification link.' },
  };

  const cfg = configs[status] || configs.error;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-main)' }}>
      {/* Scanline overlay handled by body::before in globals.css */}

      <div style={{ maxWidth: 520, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 36, letterSpacing: '0.1em', color: 'var(--neon)' }}>TAKE ONE</div>
          </a>
          <div style={{ fontSize: 9, letterSpacing: '0.4em', color: 'var(--silver)', textTransform: 'uppercase', marginTop: 6 }}>Nexus Platform · Email Verification</div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'var(--panel)',
          border: `1px solid ${cfg.color === 'var(--neon)' ? 'rgba(255,77,26,0.25)' : cfg.color === 'var(--cyan)' ? 'rgba(0,212,255,0.2)' : 'rgba(255,166,32,0.2)'}`,
          borderTop: `3px solid ${cfg.color}`,
          padding: '40px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: `${cfg.color.replace('var(--neon)', 'rgba(255,77,26,').replace('var(--cyan)', 'rgba(0,212,255,').replace('var(--amber)', 'rgba(255,166,32,')}0.04)`, pointerEvents: 'none' }} />

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              fontSize: 48,
              color: cfg.color,
              marginBottom: 16,
              animation: (status === 'loading' || status === 'resending') ? 'spin 1.2s linear infinite' : 'none',
            }}>
              {cfg.icon}
            </div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 28, letterSpacing: '0.2em', color: 'var(--cream)', marginBottom: 10 }}>
              {cfg.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--silver)', letterSpacing: '0.05em', lineHeight: 1.7 }}>
              {cfg.subtitle}
            </div>
          </div>

          {/* Action buttons by status */}
          {status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="/profile" style={btnStyle('var(--neon)')}>Go to My Profile →</a>
              <a href="/" style={linkStyle}>Return to Home</a>
            </div>
          )}

          {status === 'already-verified' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="/?auth=login" style={btnStyle('var(--cyan)')}>Login Now →</a>
              <a href="/" style={linkStyle}>Return to Home</a>
            </div>
          )}

          {(status === 'expired' || status === 'error' || status === 'invalid') && (
            <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--silver)', textTransform: 'uppercase', marginBottom: 4 }}>
                Enter your email to resend
              </div>
              <input
                type="email"
                value={inputEmail}
                onChange={e => setInputEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={inputStyle}
              />
              <button type="submit" style={btnStyle('var(--neon)')} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
              </button>
              <a href="/" style={linkStyle}>Return to Home</a>
            </form>
          )}

          {status === 'resent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', padding: '12px 16px', fontSize: 12, color: 'var(--cyan)', letterSpacing: '0.05em', lineHeight: 1.6 }}>
                {resendMessage}
              </div>
              <a href="/" style={linkStyle}>Return to Home</a>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 9, letterSpacing: '0.25em', color: 'var(--dim)', textTransform: 'uppercase' }}>
          TAKE ONE NEXUS · takeone-nexus.net.in
        </div>
      </div>

      <style>{`
        @keyframes spin { from { opacity: 0.3; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

const btnStyle = (color: string): React.CSSProperties => ({
  background: color,
  color: '#06080A',
  border: 'none',
  padding: '14px 24px',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  cursor: 'pointer',
  fontFamily: 'var(--font-main)',
  transition: 'opacity 0.2s',
});

const linkStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 10,
  letterSpacing: '0.2em',
  color: 'var(--silver)',
  textDecoration: 'none',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--machine)',
  border: '1px solid var(--rail)',
  color: 'var(--cream)',
  padding: '12px 16px',
  fontSize: 12,
  fontFamily: 'var(--font-main)',
  width: '100%',
  outline: 'none',
  letterSpacing: '0.05em',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silver)', fontFamily: 'var(--font-main)' }}>
        Verifying…
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
