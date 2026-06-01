'use client';
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  role: string;
  email: string;
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (name: string, userIds: number[]) => void }) {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        const currentUser = JSON.parse(
          localStorage.getItem('take_one_user') || '{}'
        );

        setUsers(
          data.data.filter((u: User) => u.id !== currentUser.id)
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
      setName('');
      setSearch('');
      setSelectedIds([]);
      fetchUsers('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) fetchUsers(search);
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedIds.length === 0) return;
    onCreate(name, selectedIds);
    onClose();
  };

  const toggleUser = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-black border border-orange-500/30 p-6 rounded shadow-[0_0_50px_rgba(255,77,26,0.15)] max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-orange-500 transition-colors">✕</button>
        <h2 className="text-2xl text-white font-bebas tracking-widest mb-6 border-b border-orange-500/20 pb-4">Create Transmission Group</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm text-white">
          <div>
            <label className="block text-xs uppercase tracking-widest text-orange-500 mb-2">Group Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:border-orange-500 focus:outline-none transition-all" placeholder="e.g. Project Alpha Team" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-orange-500 mb-2">Search Members to Add</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white mb-2 focus:border-orange-500 focus:outline-none transition-all" placeholder="Search by name..." />

            <div className="max-h-48 overflow-y-auto border border-gray-800 rounded bg-gray-950">
              {loading && <div className="p-4 text-orange-500/50 text-center text-xs uppercase tracking-widest">Scanning Nexus...</div>}
              {!loading && users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-orange-500/5 border-b border-gray-800/50 cursor-pointer transition-colors" onClick={() => toggleUser(u.id)}>
                  <div className={`w-4 h-4 border ${selectedIds.includes(u.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-700'} rounded flex items-center justify-center transition-all`}>
                    {selectedIds.includes(u.id) && <svg viewBox="0 0 24 24" width="10" height="10" stroke="black" strokeWidth="4" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <div>
                    <div className="font-bold text-gray-200">{u.name}</div>
                    <div className="text-[10px] uppercase tracking-tighter text-orange-500/70">{u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={!name.trim() || selectedIds.length === 0} className="mt-4 bg-orange-500 hover:bg-orange-600 text-black p-3 rounded transition-all font-bebas tracking-widest text-lg disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,77,26,0.2)]">
            Establish Channel
          </button>
        </form>
      </div>
    </div>
  );
}
