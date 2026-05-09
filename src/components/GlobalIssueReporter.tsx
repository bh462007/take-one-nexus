'use client';
import React, { useState } from 'react';
import IssueReportModal from './IssueReportModal';

export default function GlobalIssueReporter() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9998] group flex items-center gap-3"
        aria-label="Report Issue"
      >
        <div className="relative flex items-center justify-center w-10 h-10 bg-[#0E1218] border border-[#FF4D1A]/50 rounded-lg shadow-[0_0_15px_rgba(255,77,26,0.2)] transition-all duration-300 group-hover:scale-110 group-hover:border-[#FF4D1A] group-hover:shadow-[0_0_25px_rgba(255,77,26,0.4)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          
          {/* Glitch Effect Decorative Elements */}
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        <span className="text-[10px] font-bebas text-[#FF4D1A] tracking-[0.2em] uppercase opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap bg-[#0E1218]/80 backdrop-blur-sm px-3 py-1 rounded border border-[#FF4D1A]/20">
          Report Issue
        </span>
      </button>
      
      <IssueReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

