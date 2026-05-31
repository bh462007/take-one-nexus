'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';
import { getCurrentUser } from '@/utils/userSession';

export default function EmailVerificationBanner() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in and unverified by reading the cookie via API
    const check = async () => {
      try {
        const data = await getCurrentUser();
        if (data.success && data.user && data.user.email_verified === false) {
          setEmail(data.user.email || '');
          setShow(true);
        }
      } catch {
        // Not logged in or API unavailable — don't show banner
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (sending || cooldown > 0 || !email) return;
    setSending(true);
    setError('');

    try {
      const res = await fetchWithCSRF('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.message || 'Too many requests. Please wait.');
        setCooldown(data.retryAfter || 60);
      } else {
        setSent(true);
        setCooldown(60);
      }
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }, [sending, cooldown, email]);

  if (!show) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 9000,
      background: 'rgba(6, 8, 10, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 77, 26, 0.4)',
      boxShadow: '0 4px 30px rgba(255, 77, 26, 0.15)',
      fontFamily: 'var(--font-main)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      {/* Animated Scanline Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'rgba(255, 77, 26, 0.3)',
        boxShadow: '0 0 10px rgba(255, 77, 26, 0.5)',
        animation: 'banner-scan 3s linear infinite'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(255, 77, 26, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 77, 26, 0.3)',
          color: 'var(--neon)',
          fontSize: 14,
          flexShrink: 0
        }}>
          ⚡
        </div>
        <div>
          <div style={{ 
            fontSize: 10, 
            letterSpacing: '0.3em', 
            textTransform: 'uppercase', 
            color: 'var(--neon)', 
            fontWeight: 800,
            marginBottom: 2
          }}>
            Restricted Access: Verification Required
          </div>
          <div style={{ fontSize: 11, color: 'var(--silver)', letterSpacing: '0.05em', opacity: 0.8 }}>
            {sent
              ? `Verification uplink transmitted to ${email}.`
              : error
              ? error
              : 'Messaging, projects, and leaderboard are locked until email signal is confirmed.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
        {!sent && (
          <button
            id="resend-verification-btn"
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            style={{
              background: 'transparent',
              color: 'var(--neon)',
              border: '1px solid var(--neon)',
              padding: '8px 20px',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: sending || cooldown > 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-main)',
              opacity: sending || cooldown > 0 ? 0.5 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 10px rgba(255, 77, 26, 0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {sending ? '◌ Transmitting...' : cooldown > 0 ? `Retry in ${cooldown}s` : 'Resend Signal'}
          </button>
        )}
        {sent && (
          <div style={{ 
            fontSize: 10, 
            color: 'var(--cyan)', 
            letterSpacing: '0.15em',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 14 }}>✓</span> SIGNAL SENT
          </div>
        )}
        <button
          onClick={() => setShow(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--dim)', 
            cursor: 'pointer', 
            fontSize: 18, 
            lineHeight: 1, 
            padding: '4px',
            opacity: 0.5,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes banner-scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
