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
          placeholder="Search by name, email or role..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-add" onClick={() => router.push('/admin/users/add')}>+ Add User</button>
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>College</th>
              <th>City</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-badge">{user.role || 'Unassigned'}</span>
                  </td>
                  <td>{user.college || '—'}</td>
                  <td>{user.city || '—'}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-action btn-delete" 
                      onClick={() => handleDelete(user.id)}
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
