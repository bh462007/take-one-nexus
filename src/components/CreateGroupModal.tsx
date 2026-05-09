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

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSearch('');
      setSelectedIds([]);
      fetchUsers('');
    }
  }, [isOpen]);

  const fetchUsers = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) fetchUsers(search);
    }, 300);
    return () => clearTimeout(timeoutId);
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
      <div className="bg-gray-900 border border-gray-700 p-6 rounded shadow-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-xl text-white font-bebas mb-4">Create Transmission Group</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm text-white">
          <div>
            <label className="block text-gray-400 mb-1">Group Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="e.g. Project Alpha Team" />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Search Members to Add</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white mb-2" placeholder="Search by name..." />
            
            <div className="max-h-48 overflow-y-auto border border-gray-800 rounded bg-black">
              {loading && <div className="p-2 text-gray-500 text-center">Searching...</div>}
              {!loading && users.map(u => (
                <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-800 border-b border-gray-800 cursor-pointer" onClick={() => toggleUser(u.id)}>
                  <input type="checkbox" checked={selectedIds.includes(u.id)} readOnly className="cursor-pointer" />
                  <div>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={!name.trim() || selectedIds.length === 0} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition font-bold disabled:opacity-50">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
}
