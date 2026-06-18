'use client';
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  gender?: string;
  avatar_url?: string;
}

export default function NewDirectMessageModal({ 
  isOpen, 
  onClose, 
  onSelectUser 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelectUser: (userId: number) => void 
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        let currentUserId: number | undefined;
        try {
          const stored = localStorage.getItem('take_one_user');
          if (stored) {
            currentUserId = JSON.parse(stored).id;
          }
        } catch (err) {
          console.error('Failed to retrieve current user from local storage:', err);
        }

        setUsers(
          currentUserId
            ? data.data.filter((u: User) => u.id !== currentUserId)
            : data.data
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      fetchUsers('');
    }
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) fetchUsers(search);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-black border border-orange-500/30 p-6 rounded shadow-[0_0_50px_rgba(255,77,26,0.15)] max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-orange-500 transition-colors">✕</button>
        <h2 className="text-2xl text-white font-bebas tracking-widest mb-6 border-b border-orange-500/20 pb-4">New Direct Message</h2>

        <div className="flex flex-col gap-5 text-sm text-white">
          <div>
            <label className="block text-xs uppercase tracking-widest text-orange-500 mb-2">Search Crew Member</label>
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:border-orange-500 focus:outline-none transition-all" 
              placeholder="Search by name or email..." 
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-orange-500 mb-2">Select Recipient</label>
            <div className="max-h-60 overflow-y-auto border border-gray-800 rounded bg-gray-950">
              {loading && (
                <div className="p-4 text-orange-500/50 text-center text-xs uppercase tracking-widest">
                  Scanning Nexus...
                </div>
              )}
              {!loading && users.length === 0 && (
                <div className="p-4 text-gray-500 text-center text-xs">
                  No crew members found.
                </div>
              )}
              {!loading && users.map(u => (
                <div 
                  key={u.id} 
                  className="flex items-center justify-between p-3 hover:bg-orange-500/5 border-b border-gray-800/50 cursor-pointer transition-colors" 
                  onClick={() => {
                    onSelectUser(u.id);
                  }}
                >
                  <div>
                    <div className="font-bold text-gray-200">{u.name}</div>
                    <div className="text-[10px] uppercase tracking-tighter text-orange-500/70">{u.role}</div>
                  </div>
                  <span className="text-xs text-orange-500 opacity-60 hover:opacity-100 transition-opacity">Select →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
