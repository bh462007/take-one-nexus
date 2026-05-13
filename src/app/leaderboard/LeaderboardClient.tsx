'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { getAvatarUrl } from '@/lib/avatars';
import { getCanonicalDisplayName } from '@/utils/formatting';
import './leaderboard.css';

interface User {
  id: number;
  name: string;
  screen_name?: string;
  display_preference?: string;
  avatar_url?: string;
  gender?: string;
  role?: string;
  college?: string;
  credits: number;
}

interface LeaderboardClientProps {
  initialUsers: User[];
  pusherConfig: {
    key: string;
    cluster: string;
  };
}

export default function LeaderboardClient({ initialUsers, pusherConfig }: LeaderboardClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/users/leaderboard');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  useEffect(() => {
    if (!pusherConfig.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster
    });

    const channel = pusher.subscribe('global-events');
    channel.bind('leaderboard-update', () => {
      fetchLeaderboard();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('global-events');
    };
  }, [pusherConfig, fetchLeaderboard]);

  const getDisplayName = (u: User) => {
    return getCanonicalDisplayName(u);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const faqs = [
    {
      q: "How can I earn credits?",
      a: "Credits are awarded for active participation in the Nexus: Uploading quality portfolio work, completing film tasks, and consistent community contribution. Every approved task earns you credits."
    },
    {
      q: "Where can I see my credits?",
      a: "Your current credit balance is displayed on your personal Profile page, here on the global Leaderboard, and on your Dashboard indicators when logged in."
    },
    {
      q: "Where can I spend credits?",
      a: "COMING SOON: We are building a cinematic marketplace where credits can be used for project spotlighting, equipment discounts, and exclusive workshop access."
    }
  ];

  return (
    <section className="leaderboard-section">
      <div className="sec-label reveal">Rankings</div>
      <div className="sec-title reveal">The Nexus<br />Leaderboard</div>
      <p className="sec-sub reveal">Recognizing the most active creators, collaborators, and filmmakers in the community.</p>

      <div className="leaderboard-container reveal">
        <div className="leaderboard-header">
          <div className="leaderboard-title">
            <div className="leaderboard-subtitle">Top Performers</div>
            <h2>Elite Creators</h2>
          </div>
          <div className="status-item">
            <div className="status-dot"></div> Live Signal
          </div>
        </div>

        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Creator</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.2)' }}>
                    No creators have earned credits yet.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const rank = index + 1;
                  const rankClass = rank <= 3 ? `top-rank-${rank}` : '';
                  const displayName = getDisplayName(user);
                  const avatarUrl = getAvatarUrl(user.name, user.gender, user.avatar_url);

                  return (
                    <tr key={user.id} className={`leaderboard-row ${rankClass}`}>
                      <td className="rank-cell">#{rank}</td>
                      <td>
                        <div className="user-cell">
                          {user.avatar_url ? (
                            <img src={avatarUrl} alt="" className="user-avatar" />
                          ) : (
                            <div className="user-avatar">{getInitials(user.name)}</div>
                          )}
                          <div className="user-info">
                            <span className="user-name">{displayName}</span>
                            <span className="user-role">{user.college || 'Nexus Creator'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.role || 'Crew'}</td>
                      <td className="credits-cell">
                        {user.credits.toLocaleString()} <span style={{ fontSize: '0.7em', opacity: 0.5 }}>PTS</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="faq-section reveal">
        <h3 className="faq-title">Credit Intelligence</h3>
        <div className="faq-grid">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-card ${activeFaq === i ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                {faq.q}
              </div>
              <div className="faq-answer">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
