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
    // Only log detailed error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Profile Page Error Details:', error);
    }
  }, [error]);

  const isDbError = error.message.includes('DATABASE') || 
                    error.message.includes('PRODUCTION_DATABASE') ||
                    error.message.includes('CONN_LOST') ||
                    error.message.includes('P200');

  return (
    <div className="error-container">
      <div className="glitch-overlay"></div>
      <div className="error-content">
        <div className="signal-lost-tag">
          <span className="blink-dot"></span>
          {isDbError ? 'Database Signal Lost' : 'Execution Error'}
        </div>
        
        <h1 className="error-title">
          {isDbError ? 'CONNECTION TERMINATED' : 'SIGNAL INTERRUPTED'}
        </h1>
        
        <p className="error-msg">
          {isDbError 
            ? 'The production database is currently unreachable. Our team has been notified and is investigating the uplink failure.'
            : 'An unexpected error occurred while processing the profile data. The production signal has been dropped.'}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="dev-error-box">
            <code>{error.message}</code>
          </div>
        )}

        <div className="error-actions">
          <button onClick={() => reset()} className="btn-retry">
            Re-establish Uplink →
          </button>
          <a href="/" className="btn-home">
            Abort & Return Home
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .error-container {
          min-height: 100vh;
          background: #06080A;
          color: #E8DFC8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
          font-family: 'Space Mono', monospace;
          position: relative;
          overflow: hidden;
        }
        .glitch-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 2px);
          pointer-events: none;
        }
        .error-content {
          position: relative;
          z-index: 1;
          max-width: 600px;
        }
        .signal-lost-tag {
          font-size: 11px;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          color: #FF4D1A;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .blink-dot {
          width: 6px;
          height: 6px;
          background: #FF4D1A;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .error-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          line-height: 0.9;
          margin-bottom: 20px;
          letter-spacing: 2px;
          background: linear-gradient(180deg, #E8DFC8 0%, rgba(232, 223, 200, 0.5) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .error-msg {
          color: #6B7A8D;
          line-height: 1.8;
          margin-bottom: 40px;
          font-size: 14px;
        }
        .dev-error-box {
          background: rgba(255, 77, 26, 0.05);
          border: 1px solid rgba(255, 77, 26, 0.2);
          padding: 12px;
          margin-bottom: 30px;
          font-size: 12px;
          color: #FF4D1A;
          text-align: left;
          overflow-x: auto;
        }
        .error-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
        }
        .btn-retry {
          background: #FF4D1A;
          color: #06080A;
          border: none;
          padding: 14px 28px;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .btn-retry:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 77, 26, 0.3);
        }
        .btn-home {
          border: 1px solid rgba(232, 223, 200, 0.2);
          color: #E8DFC8;
          padding: 14px 28px;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-home:hover {
          background: rgba(232, 223, 200, 0.05);
          border-color: rgba(232, 223, 200, 0.5);
        }
      `}} />
    </div>
  );
}
