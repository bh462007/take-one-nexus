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
          <h2 className="modal-title">CREATOR <span>SYNCED</span></h2>
          <p style={{ marginBottom: '25px', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            ACCESS KEY GENERATED. SECURE THIS SIGNAL IMMEDIATELY.
          </p>
          
          <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            padding: '40px', 
            fontSize: '42px', 
            letterSpacing: '10px', 
            color: 'var(--neon)', 
            border: '1px solid var(--border)',
            marginBottom: '40px',
            fontFamily: 'var(--font-title)',
            boxShadow: '0 0 40px rgba(255, 77, 26, 0.2)',
            textShadow: '0 0 10px var(--neon)'
          }}>
            {generatedPassword}
          </div>

          <button 
            className="btn-add" 
            onClick={() => {
              navigator.clipboard.writeText(generatedPassword);
              alert('ACCESS KEY COPIED TO TERMINAL CLIPBOARD');
            }}
            style={{ marginBottom: '20px', width: '100%' }}
          >
            COPY ACCESS KEY
          </button>
          
          <button 
            className="btn-action" 
            onClick={() => router.push('/admin/users')}
            style={{ width: '100%' }}
          >
            RETURN TO CREW DATABASE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div className="form-group">
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '3px' }}>CREATOR NAME</label>
          <input name="name" className="search-input" required placeholder="IDENTIFY PERSON..." />
        </div>

        <div className="form-group">
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '3px' }}>TRANSMISSION CHANNEL</label>
          <input name="email" type="email" className="search-input" required placeholder="EMAIL ADDRESS..." />
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '3px' }}>PRODUCTION DESIGNATION</label>
        <select name="role" className="search-input" required style={{ width: '100%', height: '52px' }}>
          {USER_ROLES.map(role => (
            <option key={role} value={role}>{role.toUpperCase()}</option>
          ))}
          <option value="admin">SYSTEM ADMINISTRATOR</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div className="form-group">
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '3px' }}>ACADEMIC BASE</label>
          <input name="college" className="search-input" placeholder="COLLEGE / INSTITUTE..." />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '3px' }}>SECTOR / CITY</label>
          <input name="city" className="search-input" placeholder="LOCATION..." />
        </div>
      </div>

      <div style={{ marginBottom: '50px' }}>
        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '3px' }}>MISSION PROFILE (BIO)</label>
        <textarea name="bio" className="search-input" style={{ width: '100%', height: '150px', resize: 'vertical', padding: '20px' }} placeholder="LOG CREATOR BIOGRAPHY..."></textarea>
      </div>

      <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
        <button type="submit" className="btn-add" disabled={loading}>
          {loading ? 'TRANSMITTING...' : 'ONBOARD CREATOR DESIGNATION →'}
        </button>
        <button type="button" className="btn-action" onClick={() => router.back()}>ABORT MISSION</button>
      </div>
    </form>
  );
}
