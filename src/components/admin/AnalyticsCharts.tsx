'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

interface ChartData {
  date: string;
  count: number;
}

interface AnalyticsData {
  users: ChartData[];
  scripts: ChartData[];
}

export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetch('/api/system/analytics', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.status === 401) {
        window.location.href = '/?auth=login';
        return;
      }

      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Initialize Pusher for real-time analytics updates
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (pusherKey && pusherCluster) {
      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster
      });

      const channel = pusher.subscribe('admin-dashboard');
      channel.bind('update', () => {
        // Debounce or just fetch fresh data
        fetchAnalytics();
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe('admin-dashboard');
        pusher.disconnect();
      };
    }
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--neon)' }}>
        <div className="pulse-ring" style={{ width: '40px', height: '40px' }}></div>
        <span style={{ marginLeft: '15px', fontFamily: 'var(--font-title)', letterSpacing: '2px' }}>Loading Analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '20px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--silver)' }}>
        Failed to synchronize telemetry: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
      <div style={{ flex: '1 1 45%', minWidth: '300px', padding: '20px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon), transparent)' }}></div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', letterSpacing: '2px', marginBottom: '20px', color: 'var(--text-bright)' }}>Crew Registrations</h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.users} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--silver)" fontSize={10} tickMargin={10} />
              <YAxis stroke="var(--silver)" fontSize={10} tickMargin={10} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid var(--neon)', borderRadius: '0' }}
                itemStyle={{ color: 'var(--neon)' }}
              />
              <Line type="monotone" dataKey="count" name="Users" stroke="var(--neon)" strokeWidth={2} dot={{ r: 3, fill: 'var(--bg-main)', stroke: 'var(--neon)' }} activeDot={{ r: 5, fill: 'var(--neon)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ flex: '1 1 45%', minWidth: '300px', padding: '20px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)' }}></div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', letterSpacing: '2px', marginBottom: '20px', color: 'var(--text-bright)' }}>Scripts Uploaded</h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.scripts} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--silver)" fontSize={10} tickMargin={10} />
              <YAxis stroke="var(--silver)" fontSize={10} tickMargin={10} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid var(--cyan)', borderRadius: '0' }}
                itemStyle={{ color: 'var(--cyan)' }}
                cursor={{ fill: 'rgba(0,255,255,0.1)' }}
              />
              <Bar dataKey="count" name="Scripts" fill="var(--cyan)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
