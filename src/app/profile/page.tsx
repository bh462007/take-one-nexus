import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { USER_ROLES } from '@/lib/constants';
import Script from 'next/script';
import { getAvatarUrl } from '@/lib/avatars';
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
    await params;
    await searchParams;
    const user = await getCurrentUser();
    
    if (!user) {
      return { title: 'Profile — TAKE ONE' };
    }

    return {
      title: `${user.name || 'Creator'} — TAKE ONE`,
      description: user.bio || `Creator profile on TAKE ONE.`,
    };
  } catch (error) {
    return { title: 'Profile — TAKE ONE' };
  }
}

export default async function ProfilePage() {
  try {
    const rawUser = await getCurrentUser();
    
    // Auth Gate
    if (!rawUser) {
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

    // ENSURE POJO SERIALIZATION (Deep clone to remove Prisma class metadata)
    const user = JSON.parse(JSON.stringify(rawUser));

    // STABILITY: Absolute defaults for all fields
    const name = user?.name || 'Creator';
    const role = user?.role || 'Independent Filmmaker';
    const college = user?.college || '';
    const city = user?.city || '';
    const bio = user?.bio || 'The reel is still being edited. No bio added yet.';
    const scripts = user?.scripts || [];
    const skills = user?.skills ? String(user.skills).split(',').filter(Boolean) : [];
    const avatarUrl = getAvatarUrl(name, user?.gender, user?.avatar_url);
    
    // Display Name Logic
    const screenName = user?.screen_name || '';
    const displayPreference = user?.display_preference || 'Show Real Name Only';
    let displayName = name;
    if (displayPreference === 'Show Screen Name Only' && screenName) {
      displayName = screenName;
    } else if (displayPreference === 'Show Both' && screenName) {
      displayName = `${name} • ${screenName}`;
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
            <a href="/chat" className="nav-chat-link">Messages</a>
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
                  <img src={avatarUrl} id="profilePic" alt="Profile Photo" />
                </div>
                <button className="avatar-edit" id="avatarEditBtn" type="button">✎</button>
                <input type="file" id="avatarInput" accept="image/*" style={{ display: 'none' }} />
              </div>

              <div className="credit-badge-wrap">
                <div className="credit-badge">
                  <div className="cb-label">CREDITS</div>
                  <div className="cb-value">{user?.credits ?? 0}</div>
                  <div className="cb-glow"></div>
                </div>
              </div>

              <div id="profileName">{displayName}</div>
              {screenName && displayPreference !== 'Show Screen Name Only' && (
                <div className="profile-screen-name">@{screenName}</div>
              )}
              <div className="profile-role" id="profileRole">{role}</div>
              <div className="profile-meta" id="profileMeta">
                {[college, city].filter(Boolean).join(' · ') || 'Location Pending'}
              </div>

              <p className="profile-bio" id="profileBio">{bio}</p>

              <div className="profile-stats">
                <div className="pstat">
                  <div className="pstat-num" id="projCount">{scripts.length}</div>
                  <div className="pstat-label">Scripts</div>
                </div>
                <div className="pstat">
                  <div className="pstat-num" id="skillsCount">{skills.length}</div>
                  <div className="pstat-label">Skills</div>
                </div>
                <div className="pstat">
                  <div className="pstat-num pstat-text" id="profileCity">{city || '--'}</div>
                  <div className="pstat-label">City</div>
                </div>
              </div>

              <button className="btn-edit-profile" id="sidebarEditBtn">Edit Profile →</button>

              <div className="skill-badges" id="skillBadges">
                {skills.length > 0 ? (
                  skills.map((skill: string, i: number) => (
                    <span key={i} className="badge">{skill.trim()}</span>
                  ))
                ) : (
                  <span className="badge">New Creator</span>
                )}
              </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="profile-content">
              <div className="content-tabs" id="profileTabs">
                <button className="ctab active" data-tab="projects">Projects</button>
                <button className="ctab"        data-tab="about">About</button>
                <button className="ctab"        data-tab="collab">Collaborate</button>
                <button className="ctab"        data-tab="portfolio">Portfolio</button>
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
                  {scripts.length > 0 ? (
                    scripts.map((script: any, i: number) => (
                      <div key={script.id} className="project-card"
                           style={{ background: `linear-gradient(160deg, #1C2330 0%, #06080A 100%)` }}>
                        <div className="pc-num">{String(i + 1).padStart(3, '0')}</div>
                        <div className="pc-genre">{script.genre || 'General'}</div>
                        <div className="pc-title">{script.title || 'Untitled Script'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="project-card empty-guide" style={{ background: '#0E1218', border: '1px dashed #1C2330', gridColumn: '1/-1', padding: '40px', textAlign: 'center' }}>
                      <p style={{ color: '#6B7A8D', fontSize: '12px' }}>Your production history is empty. Upload your first script to begin.</p>
                    </div>
                  )}
                  
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
                    <input type="text" id="editName" defaultValue={name} placeholder="Your name…" />
                  </div>
                  <div className="about-item">
                    <label htmlFor="editRole">Primary Role</label>
                    <select id="editRole" className="profile-role-dropdown" defaultValue={role}>
                      {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="about-item">
                    <label htmlFor="editCollege">College</label>
                    <input type="text" id="editCollege" defaultValue={college} placeholder="FTII, Pune…" />
                  </div>
                  <div className="about-item">
                    <label htmlFor="editCity">City</label>
                    <input type="text" id="editCity" defaultValue={city} placeholder="Mumbai…" />
                  </div>
                  <div className="about-item">
                    <label htmlFor="editGender">Gender</label>
                    <select id="editGender" className="profile-role-dropdown" defaultValue={user?.gender || 'Prefer not to say'}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="about-item">
                    <label htmlFor="editScreenName">Screen Name / Stage Name</label>
                    <input type="text" id="editScreenName" defaultValue={screenName} placeholder="RK Visuals..." />
                  </div>
                  <div className="about-item">
                    <label htmlFor="editDisplayPreference">Display Preference</label>
                    <select id="editDisplayPreference" className="profile-role-dropdown" defaultValue={displayPreference}>
                      <option value="Show Real Name Only">Show Real Name Only</option>
                      <option value="Show Screen Name Only">Show Screen Name Only</option>
                      <option value="Show Both">Show Both (Name • Screen Name)</option>
                    </select>
                  </div>
                  <div className="about-item full">
                    <label htmlFor="editSocialLinks">Social Links (Instagram, LinkedIn, etc.)</label>
                    <input type="text" id="editSocialLinks" defaultValue={user?.social_links || ''} placeholder="Instagram: @rk_visuals, LinkedIn: rk-sharma..." />
                  </div>
                  <div className="about-item full">
                    <label htmlFor="editPortfolio">Portfolio / Reel</label>
                    <input type="text" id="editPortfolio" defaultValue={user?.portfolio || ''} placeholder="https://…" />
                  </div>
                  <div className="about-item full">
                    <label htmlFor="editBio">Bio</label>
                    <textarea id="editBio" defaultValue={user?.bio || ''} placeholder="Tell the world about your filmmaking journey…"></textarea>
                  </div>
                  <div className="about-item full">
                    <label htmlFor="editSkills">Skills (comma separated)</label>
                    <input type="text" id="editSkills" defaultValue={user?.skills || ''} placeholder="Direction, Screenplay, Color Grading, VFX… " />
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
                      <div className="collab-empty"><div className="collab-reel"><span>🎬</span></div><p>Loading requests...</p></div>
                    </div>
                  </div>
                  <div className="collab-column">
                    <div className="collab-column-title">My Sent Requests</div>
                    <div id="outgoingRequests" className="request-list">
                      <div className="collab-empty"><div className="collab-reel"><span>🎬</span></div><p>Loading requests...</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── PORTFOLIO TAB ── */}
              <div className="tab-pane" id="tab-portfolio">
                <div className="section-head">
                  <h3>Creative Portfolio</h3>
                  <div className="portfolio-badge">PRO PROFILE</div>
                </div>
                <div className="portfolio-container">
                  <div className="portfolio-intro">
                    <div className="pi-num">ROLE: {role.toUpperCase()}</div>
                    <p>Showcasing specialized work, gear, and professional milestones.</p>
                  </div>
                  
                  <div className="portfolio-role-details" id="portfolioRoleDetails">
                    {/* Inject role-specific details here via profile.js */}
                    <div className="collab-empty">
                      <div className="collab-reel"><span>⚙</span></div>
                      <p>Complete your profile to see specialized role cards</p>
                    </div>
                  </div>

                  <div className="portfolio-grid-head">Featured Work</div>
                  <div className="portfolio-grid" id="portfolioGrid">
                    {/* Inject featured work cards here via profile.js */}
                    <div className="collab-empty">
                        <p>No featured work added to portfolio yet.</p>
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
                  <div className="collab-empty"><div className="collab-reel"><span>•</span></div><p>Loading notifications...</p></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <div className="status-bar">
          <div className="status-item"><div className="status-dot"></div>Profile Active</div>
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
  } catch (criticalError) {
    console.error('[CRITICAL_PROFILE_RENDER_FAILURE]:', criticalError);
    return (
      <div className="profile-error-fallback" style={{ background: '#06080A', color: '#E8DFC8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '48px', color: '#FF4D1A' }}>SIGNAL RECOVERY MODE</h1>
        <p style={{ color: '#6B7A8D', maxWidth: '500px', margin: '20px 0' }}>The production server encountered a rendering issue. We are currently operating in high-stability fallback mode.</p>
        <a href="/" style={{ border: '1px solid #FF4D1A', color: '#FF4D1A', padding: '12px 24px', textDecoration: 'none', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.2em' }}>Return Home</a>
      </div>
    );
  }
}
