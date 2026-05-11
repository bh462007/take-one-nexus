'use client';

import React, { useState } from 'react';
import { deleteUser } from '@/app/admin/users/actions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string | null;
  college: string | null;
  city: string | null;
  created_at: Date;
}

interface Props {
  initialUsers: User[];
}

export default function UserManagement({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(search.toLowerCase())
  );

  useEffect(() => {
    let active = true;

    async function loadLatestUsers() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch('/api/users/admin/list', {
          credentials: 'include',
          cache: 'no-store'
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load latest users');
        }

        if (active && Array.isArray(payload.data)) {
          setUsers(payload.data);
        }
      } catch (error: any) {
        if (active) {
          setLoadError(error?.message || 'Failed to load latest users');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLatestUsers();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        setUsers(prev => prev.filter(user => user.id !== id));
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete user');
      }
    } catch {
      alert('An error occurred while deleting the user');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="SEARCH CREW BY NAME, EMAIL OR DESIGNATION..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-add" onClick={() => router.push('/admin/users/add')} aria-label="Add new crew member">
          <span>+ NEW CREW SIGNAL</span>
        </button>
      </div>

      {loading && (
        <div style={{ color: 'var(--silver)', fontSize: '10px', marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Syncing latest users...
        </div>
      )}
      {loadError && (
        <div style={{ color: 'var(--neon)', fontSize: '10px', marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {loadError}
        </div>
      )}

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>CREW NAME</th>
              <th>CHANNEL / EMAIL</th>
              <th>DESIGNATION</th>
              <th>BASE / COLLEGE</th>
              <th>LOCATION</th>
              <th>SYNC DATE</th>
              <th>OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td data-label="CREW NAME" style={{ fontWeight: 'bold' }}>{user.name}</td>
                  <td data-label="CHANNEL / EMAIL" style={{ color: 'var(--silver)' }}>{user.email}</td>
                  <td data-label="DESIGNATION">
                    <span className="role-badge">{user.role || 'GHOST'}</span>
                  </td>
                  <td data-label="BASE / COLLEGE" style={{ color: 'var(--silver)' }}>{user.college || '—'}</td>
                  <td data-label="LOCATION" style={{ color: 'var(--silver)' }}>{user.city || '—'}</td>
                  <td data-label="SYNC DATE" style={{ color: 'var(--silver)', fontSize: '10px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td data-label="OPERATIONS">
                    <button 
                      className="btn-action btn-delete" 
                      onClick={() => handleDelete(user.id)}
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? 'WIPING...' : 'WIPE'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '10px' }}>
                  NO SIGNALS DETECTED IN CREW DATABASE.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
