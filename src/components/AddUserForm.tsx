'use client';

import React, { useState } from 'react';
import { addUser } from '@/app/admin/users/actions';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

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
          <h2 className="modal-title">Creator <span>Onboarded</span></h2>
          <p style={{ marginBottom: '20px', fontSize: '12px', color: 'var(--text-dim)' }}>Copy the generated password below. It will only be shown once.</p>
          
          <div style={{ 
            background: 'black', 
            padding: '30px', 
            fontSize: '32px', 
            letterSpacing: '8px', 
            color: 'var(--neon)', 
            border: '1px solid var(--border)',
            marginBottom: '30px',
            fontFamily: 'var(--font-title)',
            boxShadow: '0 0 30px rgba(255, 77, 26, 0.1)'
          }}>
            {generatedPassword}
          </div>

          <button 
            className="btn-add" 
            onClick={() => {
              navigator.clipboard.writeText(generatedPassword);
              alert('Password copied to clipboard');
            }}
            style={{ marginBottom: '15px', width: '100%' }}
          >
            Copy Password
          </button>
          
          <button 
            className="btn-action" 
            onClick={() => router.push('/admin/users')}
            style={{ width: '100%' }}
          >
            Go to User List →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Full Name</label>
          <input name="name" className="search-input" required placeholder="Arjun Mehta" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Email Address</label>
          <input name="email" type="email" className="search-input" required placeholder="arjun@example.com" />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Primary Role</label>
        <select name="role" className="search-input" required style={{ width: '100%' }}>
          {USER_ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
          <option value="admin">System Admin</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>College</label>
          <input name="college" className="search-input" placeholder="FTII Pune" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>City</label>
          <input name="city" className="search-input" placeholder="Mumbai" />
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Bio (Optional)</label>
        <textarea name="bio" className="search-input" style={{ width: '100%', height: '120px', resize: 'vertical' }} placeholder="Tell the system about this creator..."></textarea>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button type="submit" className="btn-add" disabled={loading}>
          {loading ? 'Transmitting...' : 'Onboard Creator →'}
        </button>
        <button type="button" className="btn-action" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
