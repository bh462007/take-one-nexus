'use client';

import React, { useState } from 'react';
import { deleteUser, updateSecondaryRole } from '@/app/admin/users/actions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string | null;
  secondary_role: string | null;
  college: string | null;
  city: string | null;
  created_at: Date;
}

interface Props {
  initialUsers: User[];
}

const SECONDARY_ROLES = [
  { value: '', label: '— None —' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
];

export default function UserManagement({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
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
    return () => { active = false; };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

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

  const handleSecondaryRoleChange = async (id: number, role: string) => {
    setUpdatingRoleId(id);
    try {
      const result = await updateSecondaryRole(id, role);
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, secondary_role: role || null } : u));
      } else {
        alert(result.error || 'Failed to update role');
      }
    } catch {
      alert('An error occurred while updating the secondary role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const downloadCSV = () => {
    try {
      const headers = ['Name', 'Email', 'Role/Designation', 'Secondary Role', 'College', 'City', 'Account Creation Date'];
      const rows = filteredUsers.map(user => [
        user.name,
        user.email,
        user.role || 'GHOST',
        user.secondary_role || '—',
        user.college || '—',
        user.city || '—',
        new Date(user.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `takeone-users-${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Crew Database Export Failed:', error);
      alert('Failed to generate CSV export. Check console for details.');
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
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-download" onClick={downloadCSV} aria-label="Download CSV">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>DOWNLOAD CSV</span>
          </button>
          <button className="btn-add" onClick={() => router.push('/admin/users/add')} aria-label="Add new crew member">
            <span>+ NEW CREW SIGNAL</span>
          </button>
        </div>
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
              <th>SECONDARY ROLE</th>
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
                  <td data-label="SECONDARY ROLE">
                    <select
                      value={user.secondary_role || ''}
                      disabled={updatingRoleId === user.id}
                      onChange={(e) => handleSecondaryRoleChange(user.id, e.target.value)}
                      style={{
                        background: 'var(--machine)',
                        color: user.secondary_role ? 'var(--neon)' : 'var(--silver)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: updatingRoleId === user.id ? 'wait' : 'pointer',
                        outline: 'none',
                        minWidth: '110px',
                      }}
                    >
                      {SECONDARY_ROLES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {updatingRoleId === user.id && (
                      <span style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--silver)', letterSpacing: '1px' }}>SAVING...</span>
                    )}
                  </td>
                  <td data-label="BASE / COLLEGE" style={{ color: 'var(--silver)' }}>{user.college || '—'}</td>
                  <td data-label="LOCATION" style={{ color: 'var(--silver)' }}>{user.city || '—'}</td>
                  <td data-label="SYNC DATE" style={{ color: 'var(--silver)', fontSize: '10px' }}>
                    {new Date(user.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td data-label="OPERATIONS">
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn-action"
                        onClick={() => router.push(`/profile?id=${user.id}`)}
                      >
                        VIEW PROFILE
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? 'WIPING...' : 'WIPE'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '10px' }}>
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
