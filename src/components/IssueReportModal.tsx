'use client';
import React, { useState, useEffect } from 'react';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueReportModal({ isOpen, onClose }: IssueReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bug');
  const [screenshot, setScreenshot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    
    setStatus('loading');
    setErrorMessage('');

    try {
      const location = typeof window !== 'undefined' ? window.location.href : 'Unknown';
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          category, 
          location,
          screenshot: screenshot || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2500);
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Transmission failed. Signal lost.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Check your uplink.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('bug');
    setScreenshot('');
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0E1218] border border-[#FF4D1A]/30 rounded-lg shadow-[0_0_50px_rgba(255,77,26,0.15)] overflow-hidden">
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-[#FF4D1A] via-[#00D4FF] to-[#FFA620]"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] font-mono text-[#FF4D1A] tracking-[0.3em] uppercase mb-1">System Report</div>
              <h2 className="text-3xl font-bebas text-white tracking-wider">Report an Issue</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-[#6B7A8D] hover:text-white transition-colors p-2"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {status === 'success' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-[#00D4FF]/20 rounded-full flex items-center justify-center mb-4 border border-[#00D4FF]/50 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-bebas text-white tracking-widest mb-2">Transmission Received</h3>
              <p className="text-[#6B7A8D] font-mono text-xs">Our techs are on it. Closing signal link...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono text-[#6B7A8D] uppercase tracking-widest mb-2">Subject / Title</label>
                <input 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#06080A] border border-[#1C2330] rounded p-3 text-white font-mono text-sm focus:border-[#FF4D1A]/50 focus:outline-none transition-colors"
                  placeholder="e.g. Navigation button not working"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#6B7A8D] uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#06080A] border border-[#1C2330] rounded p-3 text-white font-mono text-sm focus:border-[#FF4D1A]/50 focus:outline-none transition-colors appearance-none"
                  >
                    <option value="bug">Technical Bug</option>
                    <option value="visual">Visual Glitch</option>
                    <option value="content">Content Error</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#6B7A8D] uppercase tracking-widest mb-2">Screenshot URL (Opt)</label>
                  <input 
                    value={screenshot} 
                    onChange={(e) => setScreenshot(e.target.value)}
                    className="w-full bg-[#06080A] border border-[#1C2330] rounded p-3 text-white font-mono text-sm focus:border-[#FF4D1A]/50 focus:outline-none transition-colors"
                    placeholder="Link to image..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#6B7A8D] uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#06080A] border border-[#1C2330] rounded p-3 text-white font-mono text-sm h-32 resize-none focus:border-[#FF4D1A]/50 focus:outline-none transition-colors"
                  placeholder="Explain what happened..."
                />
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-500 text-[10px] font-mono uppercase tracking-wider">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className="w-full bg-[#FF4D1A] hover:bg-[#FF7A1A] disabled:bg-[#3A4556] text-white font-bebas tracking-[0.2em] py-4 rounded transition-all shadow-[0_0_20px_rgba(255,77,26,0.3)] hover:shadow-[0_0_30px_rgba(255,77,26,0.5)] active:scale-[0.98]"
                >
                  {status === 'loading' ? 'Transmitting...' : 'Submit Report →'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#06080A] px-8 py-3 flex justify-between items-center border-t border-[#1C2330]">
          <div className="text-[9px] font-mono text-[#3A4556] uppercase">Take One Nexus v2.0</div>
          <div className="text-[9px] font-mono text-[#3A4556] uppercase">Location: {typeof window !== 'undefined' ? window.location.pathname : 'Root'}</div>
        </div>
      </div>
    </div>
  );
}

