'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';
import { getCurrentUser, invalidateUserCache } from '@/utils/userSession';
import { useEmailVerificationReminder } from '@/lib/useEmailVerificationReminder';

interface EmailVerificationReminderPopupProps {
  trigger?: 'login' | 'register' | 'profile' | 'periodic';
  onVerifyNow?: () => void;
}

export default function EmailVerificationReminderPopup({ 
  trigger = 'periodic',
  onVerifyNow 
}: EmailVerificationReminderPopupProps) {
  // Initialize trigger listeners directly within the popup component
  useEmailVerificationReminder();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Check if user should see popup (based on localStorage "Remind Me Later")
  const shouldShowPopup = useCallback(() => {
    const remindLaterKey = 'email-verification-remind-later';
    const remindLaterTime = localStorage.getItem(remindLaterKey);
    
    if (remindLaterTime) {
      const remindDate = new Date(remindLaterTime);
      const now = new Date();
      const hoursSinceReminder = (now.getTime() - remindDate.getTime()) / (1000 * 60 * 60);
      
      // Show popup again after 24 hours
      if (hoursSinceReminder < 24) {
        return false;
      }
    }
    
    return true;
  }, []);

  // Check user verification status
  const checkVerificationStatus = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      
      if (data.success && data.user) {
        const verified = data.user.email_verified === true;
        setIsVerified(verified);
        setEmail(data.user.email || '');
        
        // Only show popup if user is unverified and should see it
        if (!verified && shouldShowPopup()) {
          // Add small delay for better UX
          setTimeout(() => setShow(true), 1500);
        }
      }
    } catch {
      // Silent fail - don't show errors for background checks
    }
  }, [shouldShowPopup]);

  // Initial check on mount and trigger changes
  useEffect(() => {
    checkVerificationStatus();
  }, [trigger, checkVerificationStatus]);

  // Listen for custom trigger events
  useEffect(() => {
    const handleTriggerEvent = (event: CustomEvent) => {
      const { trigger: eventTrigger } = event.detail;
      // Re-check verification status when triggered
      if (eventTrigger) {
        // Invalidate cache first to force a fresh fetch
        invalidateUserCache();
        checkVerificationStatus();
      }
    };

    window.addEventListener('email-verification-reminder', handleTriggerEvent as EventListener);

    return () => {
      window.removeEventListener('email-verification-reminder', handleTriggerEvent as EventListener);
    };
  }, [checkVerificationStatus]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  // Handle Resend Verification Email
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
      } else if (res.ok) {
        setSent(true);
        setCooldown(60);
        // Invalidate user cache to ensure subsequent status checks fetch fresh verified state
        invalidateUserCache();
      } else {
        setError(data.message || 'Failed to send verification email.');
      }
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }, [sending, cooldown, email]);

  // Handle Verify Now
  const handleVerifyNow = () => {
    setShow(false);
    if (onVerifyNow) {
      onVerifyNow();
    } else {
      // Trigger the existing verification flow (open OTP modal if on profile)
      const verifyBtn = document.getElementById('verifyEmailBtn');
      if (verifyBtn) {
        verifyBtn.click();
      } else {
        // Redirect to profile if not there
        window.location.href = '/profile';
      }
    }
  };

  // Handle Remind Me Later
  const handleRemindLater = () => {
    const remindLaterKey = 'email-verification-remind-later';
    localStorage.setItem(remindLaterKey, new Date().toISOString());
    setShow(false);
  };

  // Don't show if verified or not showing
  if (!show || isVerified) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="evrTitle"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 8, 10, 0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div style={{
        background: 'var(--machine, #0E1218)',
        border: '1px solid rgba(255, 77, 26, 0.3)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        boxShadow: '0 0 60px rgba(255, 77, 26, 0.12)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Filmstrip top accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--neon, #ff4d1a), var(--neon2, #ff7a1a))',
          borderRadius: '12px 12px 0 0',
        }} />

        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--silver, #6B7A8D)',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '4px',
            opacity: 0.6,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 77, 26, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 77, 26, 0.3)',
          marginBottom: '24px',
          margin: '0 auto 24px',
        }}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--neon, #ff4d1a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <h2 id="evrTitle" style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '28px',
          letterSpacing: '4px',
          color: 'var(--neon, #ff4d1a)',
          marginBottom: '12px',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}>
          Verify Your Email Address
        </h2>

        {/* Message */}
        <p style={{
          fontSize: '13px',
          color: 'var(--silver, #6B7A8D)',
          marginBottom: '24px',
          textAlign: 'center',
          lineHeight: '1.6',
          letterSpacing: '0.02em',
        }}>
          Your email address has not been verified yet.<br />
          Verify your account to unlock all platform features and improve account security.
        </p>

        {/* Error/Success messages */}
        {error && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '12px',
            color: 'var(--red, #ff3366)',
            marginBottom: '20px',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            {error}
          </div>
        )}

        {sent && !error && (
          <div style={{
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.25)',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '12px',
            color: 'var(--green, #00ff88)',
            marginBottom: '20px',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            ✓ Verification email sent successfully to {email}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <button
            onClick={handleVerifyNow}
            style={{
              width: '100%',
              background: 'var(--neon, #ff4d1a)',
              color: '#06080A',
              border: 'none',
              borderRadius: '6px',
              padding: '14px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'Bebas Neue, sans-serif',
              boxShadow: '0 0 20px rgba(255, 77, 26, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 77, 26, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 77, 26, 0.3)';
            }}
          >
            Verify Now
          </button>

          <button
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--neon, #ff4d1a)',
              border: '1px solid var(--neon, #ff4d1a)',
              borderRadius: '6px',
              padding: '14px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: sending || cooldown > 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Mono, monospace',
              opacity: sending || cooldown > 0 ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {sending ? '◌ Sending...' : cooldown > 0 ? `Retry in ${cooldown}s` : 'Resend Verification Email'}
          </button>

          <button
            onClick={handleRemindLater}
            style={{
              width: '100%',
              background: 'none',
              color: 'var(--silver, #6B7A8D)',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '11px',
              fontWeight: '400',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            Remind Me Later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
