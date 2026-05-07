import React from 'react';

export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06080A',
      color: '#E8DFC8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      fontFamily: "'Space Mono', monospace"
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '2px solid #FF4D1A',
        borderRadius: '50%',
        borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite'
      }}></div>
      <div style={{
        fontSize: '10px',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: '#FF4D1A'
      }}>
        Syncing Profile...
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
