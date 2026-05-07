'use client';

import React, { useState } from 'react';
import { deleteUser } from '@/app/admin/users/actions';
import { useRouter } from 'next/navigation';

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
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  const filteredUsers = initialUsers.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete user');
      }
    } catch (error) {
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
        <button className="btn-add" onClick={() => router.push('/admin/users/add')}>+ NEW CREW SIGNAL</button>
      </div>

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
                  <td style={{ fontWeight: 'bold' }}>{user.name}</td>
                  <td style={{ color: 'var(--silver)' }}>{user.email}</td>
                  <td>
                    <span className="role-badge">{user.role || 'GHOST'}</span>
                  </td>
                  <td style={{ color: 'var(--silver)' }}>{user.college || '—'}</td>
                  <td style={{ color: 'var(--silver)' }}>{user.city || '—'}</td>
                  <td style={{ color: 'var(--silver)', fontSize: '10px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
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
