'use client';
import React, { useState } from 'react';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';

export default function IssueReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(typeof window !== 'undefined' ? window.location.pathname : '');
  const [severity, setSeverity] = useState('low');
  const [screenshot, setScreenshot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetchWithCSRF('/api/issues', {
        method: 'POST',
        body: JSON.stringify({ title, description, location, severity, screenshot })
      });
      const data = await response.json();
      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setTitle('');
          setDescription('');
          setScreenshot('');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Failed to submit issue');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded shadow-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-xl text-white font-bebas mb-4">Report an Issue</h2>
        
        {status === 'success' ? (
          <div className="text-green-500 font-bold text-center py-4">Issue reported successfully. Thank you!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm text-white">
            <div>
              <label className="block text-gray-400 mb-1">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="Brief issue title" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white h-24" placeholder="Detailed description of the issue" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Page / Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="/path/to/page" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white">
                <option value="low">Low - Minor bug or visual glitch</option>
                <option value="medium">Medium - Core feature is buggy</option>
                <option value="high">High - Site crashes or prevents usage</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Screenshot URL (Optional)</label>
              <input value={screenshot} onChange={(e) => setScreenshot(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="https://imgur.com/..." />
            </div>
            {status === 'error' && <div className="text-red-500">{errorMessage}</div>}
            <button type="submit" disabled={status === 'loading'} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition font-bold">
              {status === 'loading' ? 'Submitting...' : 'Submit Issue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
