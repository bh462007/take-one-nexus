import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { USER_ROLES } from '@/lib/constants';
import Script from 'next/script';
import './profile.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Await params and searchParams for Next.js 15+ compatibility
    await params;
    await searchParams;
    
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        title: 'Profile — TAKE ONE',
      };
    }

    return {
      title: `${user.name} — TAKE ONE`,
      description: user.bio || `Creator profile of ${user.name} on TAKE ONE.`,
    };
  } catch (error) {
    console.error('[Metadata Error]:', error);
    return {
      title: 'Profile — TAKE ONE',
    };
  }
}

export default async function ProfilePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error('[Profile Fetch Error]:', error);
    // Return a specific error component or throw for the Error Boundary
    throw new Error('Database connection failed');
  }

  if (!user) {
    return (
      <div className="profile-auth-gate" id="profileAuthGate">
        <div className="auth-kicker">Profile Locked</div>
        <h1>Login to open your creator profile</h1>
        <p>Your scripts, requests, skills, and collaboration inbox live here after you sign in.</p>
        <div className="auth-actions">
          <a href="/?auth=login" className="auth-primary">Login →</a>
          <a href="/?auth=register" className="auth-secondary">Create Account</a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── CUSTOM CURSOR ── */}
      <div className="cur-dot" id="dot"></div>

      {/* ── TOAST NOTIFICATION ── */}
      <div id="toast">Profile saved ✦</div>

      {/* ── HEADER ── */}
      <header>
        <a href="/" className="logo">TAKE <span>ONE</span></a>
        <nav>
          <a href="/">Home</a>
          <a href="/#explore">Explore</a>
          <a href="/#upload">Upload</a>
          <button className="profile-logout" id="profileLogoutBtn" type="button">Logout</button>
        </nav>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="profile-hero">
        <div className="hero-reel-deco"></div>
        <div className="hero-reel-deco2"></div>
        <div className="profile-hero-text">TAKE ONE · LIVE CREATOR PROFILE</div>
        <div className="filmstrip-h"></div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="profile-main">
        <div className="profile-card">

          {/* ── SIDEBAR ── */}
          <div className="profile-sidebar">
            <div className="avatar-wrap">
              <div className="avatar-ring">
                <img src={user.avatar_url || "https://via.placeholder.com/150/0E1218/FF4D1A?text=C"}
                     id="profilePic" alt="Profile Photo" />
              </div>
              <button className="avatar-edit" id="avatarEditBtn" type="button">✎</button>
              <input type="file" id="avatarInput" accept="image/*" style={{ display: 'none' }} />
            </div>

            <div id="profileName">{user.name}</div>
            <div className="profile-role" id="profileRole">{user.role || 'Independent Filmmaker'}</div>
            <div className="profile-meta" id="profileMeta">{user.college || 'College'} · {user.city || 'City'}</div>

            <p className="profile-bio" id="profileBio">
              {user.bio || 'No bio provided yet.'}
            </p>

            <div className="profile-stats">
              <div className="pstat">
                <div className="pstat-num" id="projCount">{user.scripts?.length || 0}</div>
                <div className="pstat-label">Scripts</div>
              </div>
              <div className="pstat">
                <div className="pstat-num" id="skillsCount">{user.skills ? String(user.skills).split(',').length : 0}</div>
                <div className="pstat-label">Skills</div>
              </div>
              <div className="pstat">
                <div className="pstat-num pstat-text" id="profileCity">{user.city || '--'}</div>
                <div className="pstat-label">City</div>
              </div>
            </div>

            <button className="btn-edit-profile" id="sidebarEditBtn">
              Edit Profile →
            </button>

            <div className="skill-badges" id="skillBadges">
              {user.skills && String(user.skills).split(',').map((skill, i) => (
                <span key={i} className="badge">{skill.trim()}</span>
              ))}
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="profile-content">
            <div className="content-tabs" id="profileTabs">
              <button className="ctab active" data-tab="projects">Projects</button>
              <button className="ctab"        data-tab="about">About</button>
              <button className="ctab"        data-tab="collab">Collaborate</button>
              <button className="ctab"        data-tab="notifications">
                Notifications <span className="tab-count" id="notificationCount">0</span>
              </button>
            </div>

            {/* ── PROJECTS TAB ── */}
            <div className="tab-pane active" id="tab-projects">
              <div className="section-head">
                <h3>My Projects</h3>
                <a href="/#upload" className="btn-sm">+ Add Script</a>
              </div>
              <div className="project-grid" id="projectGrid">
                {(user.scripts || []).map((script, i) => (
                  <div key={script.id} className="project-card"
                       style={{ background: `linear-gradient(160deg, #1a1108 0%, #06080A 100%)` }}>
                    <div className="pc-num">{String(i + 1).padStart(3, '0')}</div>
                    <div className="pc-genre">{script.genre || 'General'}</div>
                    <div className="pc-title">{script.title || 'Untitled Script'}</div>
                  </div>
                ))}
                
                <div className="project-card"
                     style={{ 
                        background: 'rgba(255,77,26,0.03)',
                        border: '1px dashed rgba(255,77,26,0.2)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                     }}
                     id="addProjectAction">
                  <div style={{ fontSize: '28px', color: 'rgba(255,77,26,0.3)', marginBottom: '8px' }}>+</div>
                  <div style={{ fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,77,26,0.4)' }}>New Script</div>
                </div>
              </div>
            </div>

            {/* ── ABOUT TAB ── */}
            <div className="tab-pane" id="tab-about">
              <div className="section-head"><h3>About Me</h3></div>
              <div className="about-grid">
                <div className="about-item">
                  <label htmlFor="editName">Display Name</label>
                  <input type="text" id="editName" defaultValue={user.name} placeholder="Your name…" />
                </div>
                <div className="about-item">
                  <label htmlFor="editRole">Primary Role</label>
                  <select id="editRole" className="profile-role-dropdown" defaultValue={user.role || ''}>
                    {USER_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="about-item">
                  <label htmlFor="editCollege">College</label>
                  <input type="text" id="editCollege" defaultValue={user.college || ''} placeholder="FTII, Pune…" />
                </div>
                <div className="about-item">
                  <label htmlFor="editCity">City</label>
                  <input type="text" id="editCity" defaultValue={user.city || ''} placeholder="Mumbai…" />
                </div>
                <div className="about-item full">
                  <label htmlFor="editPortfolio">Portfolio / Reel</label>
                  <input type="text" id="editPortfolio" defaultValue={user.portfolio || ''} placeholder="https://…" />
                </div>
                <div className="about-item full">
                  <label htmlFor="editBio">Bio</label>
                  <textarea id="editBio" defaultValue={user.bio || ''} placeholder="Tell the world about your filmmaking journey…"></textarea>
                </div>
                <div className="about-item full">
                  <label htmlFor="editSkills">Skills (comma separated)</label>
                  <input type="text" id="editSkills" defaultValue={user.skills || ''} placeholder="Direction, Screenplay, Color Grading, VFX… " />
                </div>
              </div>
              <button className="save-btn" id="saveProfileBtn">Save Changes →</button>
            </div>

            {/* ── COLLABORATE TAB ── */}
            <div className="tab-pane" id="tab-collab">
              <div className="section-head"><h3>Collaborate</h3></div>
              <div className="collab-board" id="collabBoard">
                <div className="collab-column">
                  <div className="collab-column-title">Requests For My Scripts</div>
                  <div id="incomingRequests" className="request-list">
                    <div className="collab-empty">
                      <div className="collab-reel"><span>🎬</span></div>
                      <p>Loading requests...</p>
                    </div>
                  </div>
                </div>
                <div className="collab-column">
                  <div className="collab-column-title">My Sent Requests</div>
                  <div id="outgoingRequests" className="request-list">
                    <div className="collab-empty">
                      <div className="collab-reel"><span>🎬</span></div>
                      <p>Loading requests...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── NOTIFICATIONS TAB ── */}
            <div className="tab-pane" id="tab-notifications">
              <div className="section-head">
                <h3>Notifications</h3>
                <button className="btn-sm" type="button" id="markReadBtn">Mark All Read</button>
              </div>
              <div className="notification-list" id="notificationList">
                <div className="collab-empty">
                  <div className="collab-reel"><span>•</span></div>
                  <p>Loading notifications...</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="status-bar">
        <div className="status-item">
          <div className="status-dot"></div>Profile Active
        </div>
        <div className="status-item">TAKE ONE · Creator Mode</div>
        <div className="status-item" id="statusTime"></div>
      </div>

      <Script src="/scripts/api/api.js" strategy="afterInteractive" />
      <Script src="/scripts/utils/helpers.js" strategy="afterInteractive" />
      <Script src="/scripts/components/ui.js" strategy="afterInteractive" />
      <Script src="/scripts/animations/common.js" strategy="afterInteractive" />
      <Script src="/scripts/pages/profile.js" strategy="afterInteractive" />
    </>
  );
}
