'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Profile Page Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06080A',
      color: '#E8DFC8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      fontFamily: "'Space Mono', monospace"
    }}>
      <div style={{
        fontSize: '12px',
        letterSpacing: '0.5em',
        textTransform: 'uppercase',
        color: '#FF4D1A',
        marginBottom: '20px'
      }}>
        Signal Lost
      </div>
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '48px',
        marginBottom: '16px'
      }}>
        Unable to load profile
      </h1>
      <p style={{
        maxWidth: '500px',
        color: '#6B7A8D',
        lineHeight: '1.6',
        marginBottom: '32px'
      }}>
        There was a problem connecting to the production database. This usually happens during high traffic or maintenance.
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => reset()}
          style={{
            background: '#FF4D1A',
            color: '#06080A',
            border: 'none',
            padding: '12px 24px',
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Retry Connection →
        </button>
        <a
          href="/"
          style={{
            border: '1px solid rgba(255, 77, 26, 0.3)',
            color: '#E8DFC8',
            padding: '12px 24px',
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            fontFamily: 'inherit'
          }}
        >
          Back Home
        </a>
      </div>
    </div>
  );
}
