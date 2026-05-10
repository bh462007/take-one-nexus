'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import IssueReportModal from './IssueReportModal';

export default function GlobalIssueReporter() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/project') {
    return null;
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-red-600 hover:bg-red-700 text-white font-bebas tracking-widest px-4 py-2 rounded shadow-lg transition-transform hover:scale-105"
        aria-label="Report Issue"
      >
        REPORT ISSUE
      </button>
      <IssueReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
