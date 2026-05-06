'use client';

import React, { useState } from 'react';
import { addUser } from '@/app/admin/users/actions';
import { useRouter } from 'next/navigation';

export default function AddUserForm() {
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const result = await addUser(data);
      if (result.success) {
        setGeneratedPassword(result.password!);
      } else {
        alert(result.error || 'Failed to add user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (generatedPassword) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: 'center' }}>
          <h2 className="modal-title">User Created Successfully!</h2>
          <p style={{ marginBottom: '20px' }}>Please copy the generated password below. It will only be shown once.</p>
          
          <div style={{ 
            background: 'black', 
            padding: '20px', 
            fontSize: '24px', 
            letterSpacing: '5px', 
            color: 'var(--neon)', 
            border: '1px solid var(--border)',
            marginBottom: '30px'
          }}>
            {generatedPassword}
          </div>

          <button 
            className="btn-add" 
            onClick={() => {
              navigator.clipboard.writeText(generatedPassword);
              alert('Password copied to clipboard');
            }}
            style={{ marginBottom: '10px', width: '100%' }}
          >
            Copy Password
          </button>
          
          <button 
            className="btn-action" 
            onClick={() => router.push('/admin/users')}
            style={{ width: '100%' }}
          >
            Go to User List
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>Full Name</label>
        <input name="name" className="search-input" required placeholder="e.g. Arjun Mehta" />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>Email Address</label>
        <input name="email" type="email" className="search-input" required placeholder="e.g. arjun@gmail.com" />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>Primary Role</label>
        <select name="role" className="search-input" required style={{ width: '100%', appearance: 'none' }}>
          <option value="Director">Director</option>
          <option value="Cinematographer">Cinematographer</option>
          <option value="Writer">Writer</option>
          <option value="Editor">Editor</option>
          <option value="Sound Designer">Sound Designer</option>
          <option value="Actor">Actor</option>
          <option value="Producer">Producer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>College</label>
          <input name="college" className="search-input" placeholder="e.g. FTII Pune" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>City</label>
          <input name="city" className="search-input" placeholder="e.g. Mumbai" />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>Bio (Optional)</label>
        <textarea name="bio" className="search-input" style={{ width: '100%', height: '100px', resize: 'vertical' }} placeholder="Short bio about the creator..."></textarea>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button type="submit" className="btn-add" disabled={loading}>
          {loading ? 'Creating...' : 'Create User & Generate Password'}
        </button>
        <button type="button" className="btn-action" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
