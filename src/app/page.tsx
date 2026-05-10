import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'TAKE ONE — Film Crew Connect',
  description: 'Where scripts become films. Connect with student filmmakers across campuses.',
};

export default function HomePage() {
  return (
    <>
      {/* ── CUSTOM CURSOR ── */}
      <div className="cur-dot" id="dot"></div>
      <div className="cur-cross" id="cross"></div>

      {/* ── TOAST NOTIFICATION ── */}
      <div id="toast">Script submitted ✦</div>

      {/* ── LOADER ── */}
      <div id="loader">
        <div className="load-reels">
          <div className="reel">
            <div className="reel-spoke"></div>
            <div className="reel-spoke"></div>
            <div className="reel-spoke"></div>
          </div>
          <div className="reel">
            <div className="reel-spoke"></div>
            <div className="reel-spoke"></div>
            <div className="reel-spoke"></div>
          </div>
        </div>
        <div className="load-logo">TAKE <span>ONE</span></div>
        <div className="load-tag">Film Crew Connect · Est. 2026</div>
        <div className="load-bar">
          <div className="load-fill"></div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header>
        <a href="#" className="logo">TAKE <span>ONE</span></a>
        <nav>
          {/* Initial links for SEO; Navbar.render() will update this dynamically */}
          <a href="#explore">Explore</a>
          <a href="/crew.htm" id="navCrewLink">Crew</a>
          <a href="#upload" id="navUploadLink">Upload</a>
          <a href="/profile">Profile</a>
          <button id="loginBtn" className="nav-cta" style={{ background: 'var(--neon)', border: 'none', padding: '9px 20px', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Join Now
          </button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="filmstrip-v">
          {[...Array(12)].map((_, i) => <div key={i} className="film-hole"></div>)}
        </div>
    
        <div className="hero-glow"></div>
        <div className="hero-glow2"></div>
        <div className="aperture-ring" aria-hidden="true">
          <div className="ap-blade ap-b1"></div>
          <div className="ap-blade ap-b2"></div>
          <div className="ap-blade ap-b3"></div>
          <div className="ap-blade ap-b4"></div>
          <div className="ap-blade ap-b5"></div>
          <div className="ap-blade ap-b6"></div>
          <div className="ap-circle"></div>
        </div>

        <div className="hero-reel">
          <div className="reel-arm"></div>
          <div className="reel-arm"></div>
          <div className="reel-arm"></div>
          <div className="reel-hole"></div>
          <div className="reel-hole"></div>
          <div className="reel-hole"></div>
          <div className="reel-hub">
            <div className="reel-hub-inner"><span>REEL</span></div>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-label">Film Crew Connect · College Edition</div>
          <br/><br/>
          <h1>
            <span>LIGHTS.</span>
            <span className="neon-line">CAMERA.</span>
            <span className="outline-line">CONNECT.</span>
          </h1>
          <br/><br/>

          <div className="clapper" aria-hidden="true">
            <div className="clapper-top">
              {[...Array(5)].map((_, i) => <div key={i} className="clapper-stripe"></div>)}
            </div>
            <div className="clapper-body">
              <div className="clapper-row">
                <span className="clapper-label">PRODUCTION</span>
                <span className="clapper-val">TAKE ONE</span>
              </div>
              <div className="clapper-row">
                <span className="clapper-label">SCENE</span>
                <span className="clapper-val" id="clapScene">001</span>
              </div>
              <div className="clapper-row">
                <span className="clapper-label">TAKE</span>
                <span className="clapper-val" id="clapTake">01</span>
              </div>
              <div className="clapper-row">
                <span className="clapper-label">ROLL</span>
                <span className="clapper-val">A</span>
              </div>
            </div>
          </div>

          <span className="hero-sub" id="heroSubText">
            Where directors find their DPs, writers meet their directors,
            and spot boys become legends. Build your film team — from first
            script to final cut.
          </span>
          <div className="hero-actions">
            <a href="#explore" className="btn-primary" id="heroPrimaryAction">Browse Scripts →</a>
            <a href="#upload" className="btn-secondary" id="heroSecondaryAction">Upload Your Script</a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hstat-num" id="statCreators">0</div>
              <div className="hstat-label">Creators</div>
            </div>
            <div>
              <div className="hstat-num" id="statScripts">0</div>
              <div className="hstat-label">Scripts</div>
            </div>
            <div>
              <div className="hstat-num" id="statColleges">0</div>
              <div className="hstat-label">Colleges</div>
            </div>
          </div>
        </div>
        
        <aside className="director-monitor reveal reveal-d2" aria-label="Live production monitor">
          <div className="monitor-top">
            <span className="monitor-dot"></span>
            <span>Live Production Signal</span>
            <strong id="monitorStatus">ONLINE</strong>
          </div>
          <div className="monitor-screen">
            <div className="monitor-grid"></div>
            <div className="monitor-frame">
              <div className="monitor-kicker">Now Rolling</div>
              <h2 id="monitorTitle">Loading script signal</h2>
              <p id="monitorMeta">Syncing live scripts from MySQL</p>
            </div>
            <div className="monitor-slate">
              <div>
                <span id="monitorScripts">0</span>
                <small>Scripts</small>
              </div>
              <div>
                <span id="monitorCrew">0</span>
                <small>Crew</small>
              </div>
              <div>
                <span id="monitorRoles">0</span>
                <small>Roles</small>
              </div>
            </div>
          </div>
          <div className="monitor-actions">
            <button type="button" data-monitor-action="scripts">View Scripts</button>
            <button type="button" data-monitor-action="crew">Crew Finder</button>
          </div>
        </aside>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <span>Director</span><span>Cinematographer</span><span>Spot Boy</span>
          <span>Sound Designer</span><span>Script Writer</span><span>Editor</span>
          <span>Producer</span><span>Art Director</span><span>VFX Artist</span>
          <span>Costume Designer</span><span>Gaffer</span><span>Actor</span>
          <span>Director</span><span>Cinematographer</span><span>Spot Boy</span>
          <span>Sound Designer</span><span>Script Writer</span><span>Editor</span>
          <span>Producer</span><span>Art Director</span><span>VFX Artist</span>
          <span>Costume Designer</span><span>Gaffer</span><span>Actor</span>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section>
        <div className="sec-label reveal">Platform</div>
        <div className="sec-title reveal reveal-d1">Built for<br/>Film Crews</div>
        <p className="sec-sub reveal reveal-d2">
          Everything you need to find your team, share your vision, and make
          your movie — designed for college filmmakers.
        </p>
        <div className="features-grid">
          <div className="feat reveal" data-feature-card="scripts">
            <div className="feat-num">01</div>
            <div className="feat-icon">✍</div>
            <div className="feat-title">Work Showcase</div>
            <p className="feat-desc">
              Upload your screenplay with poster art, synopsis, and role
              requirements. Get discovered by directors and producers across campuses.
            </p>
            <div className="feat-live">
              <span id="featureScriptCount">0</span>
              <small>Live scripts on TAKE ONE</small>
            </div>
            <button className="feat-action" type="button" data-feature-action="scripts">Browse Scripts →</button>
          </div>
          <div className="feat reveal reveal-d1" data-feature-card="team">
            <div className="feat-num">02</div>
            <div className="feat-icon">🎬</div>
            <div className="feat-title">Team Formation</div>
            <p className="feat-desc">
              Find directors, DPs, spot boys, sound designers, editors — every
              role your production needs. Connect and create together.
            </p>
            <div className="feat-live">
              <span id="featureCreatorCount">0</span>
              <small>Registered crew members</small>
            </div>
            <button className="feat-action" type="button" data-feature-action="team">Find People →</button>
          </div>
          <div className="feat reveal reveal-d2" data-feature-card="spotlight">
            <div className="feat-num">03</div>
            <div className="feat-icon">🏆</div>
            <div className="feat-title">Live Spotlight</div>
            <p className="feat-desc">
              The newest uploaded script gets highlighted here so people can
              jump straight into productions that are moving right now.
            </p>
            <div className="feat-live">
              <span id="featureSpotlightTitle">No scripts yet</span>
              <small id="featureSpotlightMeta">Upload a script to activate this</small>
            </div>
            <button className="feat-action" type="button" data-feature-action="spotlight">View Spotlight →</button>
          </div>
        </div>
      </section>

      <section className="production-deck reveal">
        <div className="deck-copy">
          <div className="sec-label">Production Flow</div>
          <div className="sec-title">From Idea<br/>To Set</div>
          <p className="sec-sub">
            A film platform should feel like production in motion. Move from script,
            to crew, to collaboration without leaving the live dashboard.
          </p>
        </div>
        <div className="deck-stages" id="productionStages">
          <button className="stage-card active" type="button" data-stage="script">
            <span>01</span>
            <strong>Script Locked</strong>
            <em>Live stories from MySQL</em>
          </button>
          <button className="stage-card" type="button" data-stage="crew">
            <span>02</span>
            <strong>Crew Call</strong>
            <em>Available people by role</em>
          </button>
          <button className="stage-card" type="button" data-stage="request">
            <span>03</span>
            <strong>Request Sent</strong>
            <em>Collaboration saved and mailed</em>
          </button>
        </div>
        <div className="deck-preview" id="deckPreview">
          <div className="deck-preview-label">Active Stage</div>
          <h3 id="deckPreviewTitle">Work Showcase</h3>
          <p id="deckPreviewText">Browse live projects across all roles, search by type, and open portfolio previews before requesting to collaborate.</p>
        </div>
      </section>

      {/* ── EXPLORE ── */}
      <section id="explore" style={{ paddingTop: 0 }}>
        <div className="sec-label reveal">Browse</div>
        <div className="sec-title reveal reveal-d1">Trending Scripts</div>
        <p className="sec-sub reveal reveal-d2">Discover stories waiting to be brought to life.</p>
        <div className="search-bar-wrapper reveal reveal-d2">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" id="liveSearchInput" aria-label="Search scripts" placeholder="Search scripts by title or genre" autoComplete="off" />
          </div>
          <div id="searchResults"></div>
        </div>
        <div className="live-script-status reveal reveal-d2" id="liveScriptStatus">Loading live scripts...</div>

        <div className="tabs reveal reveal-d3">
          <button className="tab-btn active" data-genre="all">All</button>
          <button className="tab-btn" data-genre="horror">Horror</button>
          <button className="tab-btn" data-genre="romance">Romance</button>
          <button className="tab-btn" data-genre="action">Action</button>
          <button className="tab-btn" data-genre="comedy">Comedy</button>
          <button className="tab-btn" data-genre="thriller">Thriller</button>
        </div>

        <div className="scroll-container reveal reveal-d3" id="cardRow">
          <div className="live-empty-card">Loading live scripts from MySQL...</div>
        </div>
      </section>

      {/* ── UPLOAD ── */}
      <section id="upload" style={{ paddingTop: 0 }}>
        <div className="sec-label reveal" id="uploadSectionLabel">Submit</div>
        <div className="sec-title reveal reveal-d1" id="uploadSectionTitle">Share Your Vision</div>
        <p className="sec-sub reveal reveal-d2" id="uploadSectionSubtitle">
          Every great film starts with a single page. Let yours be discovered.
        </p>

        <div className="upload-zone reveal reveal-d3" id="creatorUploadZone">
          <div className="upload-panel">
            <div className="data-num">01</div>
            <label htmlFor="scriptTitle">Script Title</label>
            <input type="text" id="scriptTitle" placeholder="Enter your script's title…" />
          </div>

          <div className="upload-panel">
            <div className="data-num">02</div>
            <label htmlFor="scriptTheme">Genre</label>
            <select id="scriptTheme">
              <option value="horror">Horror</option>
              <option value="romance">Romance</option>
              <option value="action">Action</option>
              <option value="comedy">Comedy</option>
              <option value="drama">Drama</option>
              <option value="thriller">Thriller</option>
              <option value="sci-fi">Sci-Fi</option>
            </select>
          </div>

          <div className="upload-panel upload-full">
            <div className="data-num">03</div>
            <label htmlFor="scriptDesc">Synopsis</label>
            <textarea id="scriptDesc" placeholder="Describe your script — the story, tone, characters, roles you need…"></textarea>
          </div>

          <div className="upload-panel">
            <div className="data-num">04</div>
            <label htmlFor="posterInput">Poster / Cover Image</label>
            <input type="file" id="posterInput" accept="image/*" />
          </div>

          <div className="upload-panel">
            <div className="data-num">05</div>
            <label htmlFor="authorName">Your Name / Alias</label>
            <input type="text" id="authorName" placeholder="Director · Writer · etc." />
          </div>

          <div className="upload-actions">
            <p id="liveCommunityText">Reviewed within 24 hrs. Join 0 creators across 0 colleges.</p>
            <button className="btn-upload" id="uploadActionButton">Submit Script →</button>
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <div className="cta-strip">
        <h2>Your story deserves to be <em>seen</em>. Start today.</h2>
        <a href="/profile" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Create Profile →</a>
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="logo">TAKE <span>ONE</span></a>
            <p>
              Where scripts become films. The freelancing platform for college
              filmmakers — directors, camera crews, actors, and every role in between.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Navigate</h4>
              <a href="#explore">Explore</a>
              <a href="/crew.htm">Crew Roles</a>
              <a href="#upload">Upload</a>
              <a href="/profile">Profile</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="/legal#privacy">Privacy</a>
              <a href="/legal#terms">Terms</a>
              <a href="/legal#community">Community Rules</a>
              <a href="/moderation">Moderation</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2026 Take One — Create with Vision</p>
          <p>Lights · Camera · Connect</p>
        </div>
      </footer>

      {/* ── MODALS ── */}
      <div id="loginModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">LOGIN</h2>
            <button className="modal-close" id="closeLoginBtn">&times;</button>
          </div>
          <form id="loginForm">
            <div className="form-group">
              <label htmlFor="loginEmail">Email Address</label>
              <input type="email" id="loginEmail" placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input type="password" id="loginPassword" placeholder="Your password" required />
            </div>
            <button type="submit" className="form-submit">Sign In →</button>
          </form>
          <div className="form-footer">
            Don't have an account? <a id="registerLink">Create one</a>
          </div>
        </div>
      </div>

      <div id="registerModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">CREATE ACCOUNT</h2>
            <button className="modal-close" id="closeRegisterBtn">&times;</button>
          </div>
          <form id="registerForm">
            <div className="form-group">
              <label htmlFor="registerName">Full Name</label>
              <input type="text" id="registerName" placeholder="Arjun Mehta" required />
            </div>
            <div className="form-group">
              <label htmlFor="registerEmail">Email Address</label>
              <input type="email" id="registerEmail" placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>
              <input type="password" id="registerPassword" placeholder="At least 6 characters" required />
            </div>
            <div className="form-group">
              <label htmlFor="registerConfirmPassword">Confirm Password</label>
              <input type="password" id="registerConfirmPassword" placeholder="Re-enter password" required />
            </div>
            <div className="form-group">
              <label htmlFor="registerRole">Your Role</label>
              <select id="registerRole">
                <option value="Director">Director</option>
                <option value="Cinematographer / DP">Cinematographer / DP</option>
                <option value="Writer">Writer</option>
                <option value="Editor">Editor</option>
                <option value="Sound Designer">Sound Designer</option>
                <option value="Designer">Designer</option>
                <option value="Actor">Actor</option>
                <option value="Producer">Producer</option>
                <option value="Lighting Crew">Lighting Crew</option>
                <option value="Set Support">Set Support</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="registerScreenName">Screen Name / Stage Name (Optional)</label>
              <input type="text" id="registerScreenName" placeholder="e.g., RK Visuals, AR Motion Lab" />
            </div>
            <div className="form-group">
              <label htmlFor="registerDisplayPreference">Display Preference</label>
              <select id="registerDisplayPreference">
                <option value="Show Real Name Only">Show Real Name Only</option>
                <option value="Show Screen Name Only">Show Screen Name Only</option>
                <option value="Show Both">Show Both (Name • Screen Name)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="registerGender">Gender</label>
              <select id="registerGender" className="profile-role-dropdown">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="registerCollege">College / University</label>
              <input type="text" id="registerCollege" placeholder="e.g., FTII Pune" autoComplete="off" />
              <div id="collegeSuggestions" className="autocomplete-dropdown"></div>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="registerCity">City</label>
              <input type="text" id="registerCity" placeholder="e.g., Mumbai" autoComplete="off" />
              <div id="citySuggestions" className="autocomplete-dropdown"></div>
            </div>
            <button type="submit" className="form-submit">Create Account →</button>
          </form>
          <div className="form-footer">
            Already have an account? <a id="backToLoginLink">Sign in</a>
          </div>
        </div>
      </div>

      <div id="peopleModal" className="modal">
        <div className="modal-content people-modal-content">
          <div className="modal-header">
            <h2 className="modal-title" id="peopleModalTitle">Registered Crew</h2>
            <button className="modal-close" id="closePeopleModalBtn">&times;</button>
          </div>
          <div className="people-modal-subtitle" id="peopleModalSubtitle">Browse and contact available crew.</div>
          <div id="crewRoleBrowser" className="crew-role-browser"></div>
          <div id="peopleResults" className="people-results"></div>
        </div>
      </div>

      <div id="scriptModal" className="modal">
        <div className="modal-content script-modal-content">
          <div className="modal-header">
            <h2 className="modal-title" id="scriptModalTitle">Script Preview</h2>
            <button className="modal-close" id="closeScriptModalBtn">&times;</button>
          </div>
          <div className="script-modal-body">
            <div className="script-poster-preview" id="scriptModalPoster">
              <span id="scriptModalGenre">General</span>
            </div>
            <div className="script-modal-info">
              <div className="script-modal-kicker" id="scriptModalAuthor">TAKE ONE creator</div>
              <p id="scriptModalSynopsis">Open a live script to see the story, crew needs, and project signal.</p>
              <div className="script-modal-tags">
                <span id="scriptModalRoles">Open for collaboration</span>
                <span id="scriptModalStatus">Live</span>
              </div>
              <button className="btn-upload" id="scriptModalRequestBtn" type="button">Request To Join →</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="status-bar" role="status" aria-live="polite">
        <div className="status-item">
          <div className="status-dot"></div>System Online
        </div>
        <div className="status-item">
          <div className="status-dot cyan"></div><span id="statusCreators">0 Creators Active</span>
        </div>
        <div className="status-item">TAKE ONE v2.0</div>
        <div className="status-item" id="statusTime"></div>
      </div>

      {/* Page-specific Scripts */}
      <Script src="/scripts/utils/locations.js" strategy="afterInteractive" />
      <Script src="/scripts/utils/colleges.js" strategy="afterInteractive" />
      <Script src="/scripts/components/ui.js" strategy="afterInteractive" />
      <Script src="/scripts/components/navbar.js" strategy="afterInteractive" />
      <Script src="/scripts/animations/common.js" strategy="afterInteractive" />
      <Script src="/scripts/utils/user.js" strategy="afterInteractive" />
      <Script src="/scripts/pages/project.js" strategy="afterInteractive" />
    </>
  );
}
