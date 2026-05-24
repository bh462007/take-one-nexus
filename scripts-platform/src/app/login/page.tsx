'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Invalid credentials');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Connection error — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">TAKE <span style={{ color: '#e8e8e0' }}>ONE</span></div>
        <div className="login-sub">Script Review Platform · Admin Access</div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@takeone-nexus.net.in"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '12px', letterSpacing: '3px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS PLATFORM'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '10px', color: 'var(--muted)', textAlign: 'center', letterSpacing: '1px' }}>
          TAKE ONE Nexus · Restricted Access · Admin Only
        </p>
      </div>
    </div>
  );
}
