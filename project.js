
/* ── CUSTOM CURSOR ── */
const dot   = document.getElementById('dot');
const cross = document.getElementById('cross');
let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
});

(function animateCursor() {
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
  cx += (mx - cx) * 0.1;
  cy += (my - cy) * 0.1;
  cross.style.left = cx + 'px';
  cross.style.top  = cy + 'px';
  requestAnimationFrame(animateCursor);
})();

/* Scale crosshair on hover over interactive elements */
document.querySelectorAll('a, button, .role-card, .movie-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cross.style.transform = 'translate(-50%, -50%) scale(1.6)';
  });
  el.addEventListener('mouseleave', () => {
    cross.style.transform = 'translate(-50%, -50%) scale(1)';
  });
});

/* ── SCROLL REVEAL ── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── LIVE CLOCK (STATUS BAR) ── */
function updateTime() {
  const el = document.getElementById('statusTime');
  if (!el) return;
  const t = new Date();
  el.textContent = t.toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
setInterval(updateTime, 1000);
updateTime();

/* ── GENRE FILTER (Live Script Cards) ── */
function filterCards(genre, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  activeGenreFilter = genre || 'all';
  loadLiveScripts();
}

/* ── UPLOAD SCRIPT ── */
function uploadScript() {
  const titleEl  = document.getElementById('scriptTitle');
  const genreEl  = document.getElementById('scriptTheme');
  const descEl   = document.getElementById('scriptDesc');
  const posterEl = document.getElementById('posterInput');

  const title = titleEl.value.trim();
  const genre = genreEl.value;
  const file  = posterEl.files[0];

  if (!title) {
    showToast('Please enter a title ✦');
    return;
  }

  /* Build card */
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.setAttribute('data-genre', genre);
  card.style.cssText = 'background: linear-gradient(160deg, #1a1108 0%, #06080A 100%);';

  const num = (document.querySelectorAll('.movie-card').length + 1)
    .toString().padStart(3, '0');

  /* Load poster image if provided */
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      card.style.backgroundImage    = `url(${e.target.result})`;
      card.style.backgroundSize     = 'cover';
      card.style.backgroundPosition = 'center';
    };
    reader.readAsDataURL(file);
  }

  card.innerHTML = `
    <div class="data-num">${num}</div>
    <div class="card-genre">${genre}</div>
    <div class="card-title">${title}</div>
    <div class="card-tag">Just Added</div>
  `;

  document.getElementById('cardRow').prepend(card);
  showToast('Script submitted ✦');

  /* Reset form fields */
  titleEl.value  = '';
  descEl.value   = '';
  posterEl.value = '';
}

/* ── TOAST NOTIFICATION ── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
}

function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateScrollProgress() {
  const progress = document.getElementById('scrollProgress');
  if (!progress) return;

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = `${percent}%`;
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

function scrollToSection(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openCrewFinderPage(role = '') {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  window.location.href = `/crew.htm${query}`;
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function isCreatorRole(role) {
  const normalized = normalizeRole(role);
  return (
    normalized.includes('director') ||
    normalized.includes('writer') ||
    normalized.includes('producer') ||
    normalized.includes('screenwriter')
  );
}

const CREW_ROLE_OPTIONS = [
  { key: 'director', query: 'Director', label: 'Directors', icon: '🎬' },
  { key: 'camera', query: 'Cinematographer', label: 'Camera Crew', icon: '📷' },
  { key: 'writer', query: 'Writer', label: 'Writers', icon: '✍' },
  { key: 'sound', query: 'Sound', label: 'Sound Crew', icon: '🎙' },
  { key: 'editor', query: 'Editor', label: 'Editors', icon: '✂' },
  { key: 'gaffer', query: 'Gaffer', label: 'Lighting Crew', icon: '💡' },
  { key: 'actor', query: 'Actor', label: 'Actors', icon: '🎭' },
  { key: 'spot_boy', query: 'Spot', label: 'Spot Crew', icon: '⚙' }
];

const ROLE_WORKSPACES = {
  guest: {
    label: 'Login',
    title: 'Choose Your Role Workspace',
    subtitle: 'Login first, then TAKE ONE will show the correct workspace for your film role.',
    heading: 'Login To Unlock Your Workspace',
    description: 'Directors and writers can post scripts. Camera, lights, sound, actors, editors, and set crew get a different workspace for finding projects.',
    list: [
      'Create or login to your account',
      'Pick your real role during registration',
      'Your dashboard changes automatically'
    ],
    primary: 'Browse Live Scripts →',
    secondary: 'Create Profile'
  },
  director: {
    label: 'Director',
    title: 'Director Project Desk',
    subtitle: 'Post your film idea, list crew needs, and let available collaborators request to join.',
    scriptLabel: 'Project / Film Title',
    scriptPlaceholder: 'Enter the film or scene title',
    descLabel: 'Director Vision',
    descPlaceholder: 'Describe your visual style, story, tone, locations, and crew you need.',
    rolesLabel: 'Crew Needed',
    rolesPlaceholder: 'DP, Gaffer, Sound, Editor, Actors...',
    button: 'Post Director Call →',
    status: 'Director call is live. Crew members can request to join.'
  },
  writer: {
    label: 'Writer',
    title: 'Writer Script Desk',
    subtitle: 'Share your screenplay or story idea so directors and producers can discover it.',
    scriptLabel: 'Script Title',
    scriptPlaceholder: 'Enter your screenplay title',
    descLabel: 'Story Synopsis',
    descPlaceholder: 'Describe your story, genre, main characters, and what kind of team it needs.',
    rolesLabel: 'Looking For',
    rolesPlaceholder: 'Director, producer, actors, editor...',
    button: 'Submit Script →',
    status: 'Script is live. Creators can discover and contact you.'
  },
  producer: {
    label: 'Producer',
    title: 'Producer Hiring Desk',
    subtitle: 'Create a production call and list the departments you want to bring together.',
    scriptLabel: 'Production Title',
    scriptPlaceholder: 'Enter your production title',
    descLabel: 'Production Brief',
    descPlaceholder: 'Describe budget style, timeline, locations, and team requirements.',
    rolesLabel: 'Departments Needed',
    rolesPlaceholder: 'Director, camera, lights, art, sound, edit...',
    button: 'Post Production Call →',
    status: 'Production call is live for your crew search.'
  },
  camera: {
    label: 'Camera',
    title: 'Camera Opportunities',
    subtitle: 'This workspace is for camera people. Directors cannot see this mode unless they register as camera crew.',
    heading: 'Camera Department',
    description: 'Find scripts and director calls that need cinematographers, DPs, camera operators, or camera assistants.',
    list: [
      'Browse live scripts that need camera crew',
      'Send a join request to the project owner',
      'Keep your profile ready with reel, camera skills, and city'
    ],
    primary: 'Find Camera Projects →',
    secondary: 'Update Camera Profile'
  },
  gaffer: {
    label: 'Lights',
    title: 'Lighting Opportunities',
    subtitle: 'This workspace is for gaffers and lighting crew. It focuses only on light-related project needs.',
    heading: 'Lighting Department',
    description: 'Find productions that need gaffers, light assistants, and people who can shape the look of a scene.',
    list: [
      'Browse projects asking for gaffer or lighting help',
      'Request to join productions directly',
      'Add your lighting skills and gear knowledge to profile'
    ],
    primary: 'Find Lighting Projects →',
    secondary: 'Update Lighting Profile'
  },
  sound: {
    label: 'Sound',
    title: 'Sound Opportunities',
    subtitle: 'This workspace is for sound recordists, designers, and audio crew.',
    heading: 'Sound Department',
    description: 'Find productions that need sync sound, dubbing, sound design, or final mix support.',
    list: [
      'Browse live scripts that mention sound or audio needs',
      'Send requests to productions from script cards',
      'Use your profile to show sound gear and audio skills'
    ],
    primary: 'Find Sound Projects →',
    secondary: 'Update Sound Profile'
  },
  editor: {
    label: 'Editor',
    title: 'Post Production Desk',
    subtitle: 'This workspace is for editors and post-production crew.',
    heading: 'Post Production',
    description: 'Find films looking for editors, color work, trailer cuts, or finishing help.',
    list: [
      'Browse scripts looking for edit or post support',
      'Request to join projects that match your style',
      'Add portfolio links and software skills to your profile'
    ],
    primary: 'Find Edit Projects →',
    secondary: 'Update Editor Profile'
  },
  actor: {
    label: 'Actor',
    title: 'Casting Opportunities',
    subtitle: 'This workspace is for actors. It shows project calls where casting is open.',
    heading: 'Casting Desk',
    description: 'Find scripts and directors looking for actors, performers, and screen tests.',
    list: [
      'Browse live projects with casting needs',
      'Request to join from script cards',
      'Keep your city, photos, and acting bio updated'
    ],
    primary: 'Find Casting Calls →',
    secondary: 'Update Actor Profile'
  },
  spot: {
    label: 'Set Crew',
    title: 'Set Support Desk',
    subtitle: 'This workspace is for spot crew, runners, and production support.',
    heading: 'Set Support',
    description: 'Find productions that need reliable on-set help, logistics, and support crew.',
    list: [
      'Browse productions looking for set support',
      'Request to join active teams',
      'Show your availability, city, and experience on profile'
    ],
    primary: 'Find Set Work →',
    secondary: 'Update Crew Profile'
  },
  defaultCrew: {
    label: 'Crew',
    title: 'Crew Opportunities',
    subtitle: 'This workspace is for crew members to find productions and request to join.',
    heading: 'Crew Mode',
    description: 'Browse active scripts, find productions that need your role, and let your profile do the talking.',
    list: [
      'Browse open scripts and production needs',
      'Send live requests to project owners',
      'Keep your profile updated for faster replies'
    ],
    primary: 'Browse Open Scripts →',
    secondary: 'Build Crew Profile'
  }
};

function getWorkspaceForRole(role) {
  const normalized = normalizeRole(role);

  if (!normalized) return ROLE_WORKSPACES.guest;
  if (normalized.includes('director')) return ROLE_WORKSPACES.director;
  if (normalized.includes('writer') || normalized.includes('screenwriter')) return ROLE_WORKSPACES.writer;
  if (normalized.includes('producer')) return ROLE_WORKSPACES.producer;
  if (normalized.includes('camera') || normalized.includes('cinematographer') || normalized.includes('dp')) return ROLE_WORKSPACES.camera;
  if (normalized.includes('gaffer') || normalized.includes('light')) return ROLE_WORKSPACES.gaffer;
  if (normalized.includes('sound')) return ROLE_WORKSPACES.sound;
  if (normalized.includes('editor')) return ROLE_WORKSPACES.editor;
  if (normalized.includes('actor')) return ROLE_WORKSPACES.actor;
  if (normalized.includes('spot')) return ROLE_WORKSPACES.spot;

  return ROLE_WORKSPACES.defaultCrew;
}

function getRoleSkinKey(role) {
  const normalized = normalizeRole(role);

  if (normalized.includes('director')) return 'director';
  if (normalized.includes('camera') || normalized.includes('cinematographer') || normalized.includes('dp')) return 'camera';
  if (normalized.includes('actor')) return 'actor';
  if (normalized.includes('writer') || normalized.includes('screenwriter')) return 'writer';
  if (normalized.includes('producer')) return 'producer';
  if (normalized.includes('gaffer') || normalized.includes('light')) return 'gaffer';
  if (normalized.includes('sound')) return 'sound';
  if (normalized.includes('editor')) return 'editor';
  if (normalized.includes('spot')) return 'spot';

  return 'crew';
}

function applyRoleSkin(role) {
  document.body.classList.remove(
    'role-skin-director',
    'role-skin-camera',
    'role-skin-actor',
    'role-skin-writer',
    'role-skin-producer',
    'role-skin-gaffer',
    'role-skin-sound',
    'role-skin-editor',
    'role-skin-spot',
    'role-skin-crew'
  );

  document.body.classList.add(`role-skin-${getRoleSkinKey(role)}`);
}

function getRoleTools(role) {
  const key = getRoleSkinKey(role);
  const tools = {
    director: [
      ['Script Command', 'Post a project, define the tone, and list the departments you need.'],
      ['Crew Breakdown', 'See which roles are available before your first production call.'],
      ['Request Inbox', 'Review people asking to join your scripts from Profile.']
    ],
    camera: [
      ['Shot Match', 'Find projects asking for DP, cinematographer, or camera support.'],
      ['Gear Board', 'Use your profile to show cameras, lenses, rigs, and shooting style.'],
      ['Visual Pitch', 'Request projects with a short note about how you would shoot the scene.']
    ],
    actor: [
      ['Casting Calls', 'Focus on projects with actors, casting, or performance needs.'],
      ['Audition Slate', 'Keep your role, city, skills, and profile ready for directors.'],
      ['Character Match', 'Open script previews and request the roles that fit your screen presence.']
    ],
    writer: [
      ['Story Desk', 'Publish scripts and story ideas for directors to discover.'],
      ['Collab Needs', 'Mention if you need a director, producer, actors, or editor.'],
      ['Script Signal', 'Your newest story appears in the live script showcase.']
    ],
    producer: [
      ['Production Call', 'Post a production brief and assemble the departments needed.'],
      ['Department Map', 'Track director, camera, light, sound, edit, and cast needs.'],
      ['Collab Inbox', 'Use Profile to see who has requested to join.']
    ],
    gaffer: [
      ['Lighting Calls', 'Find productions asking for gaffer or lighting support.'],
      ['Look Builder', 'Show lighting skills and gear knowledge in your profile.'],
      ['Set Ready', 'Request projects where mood, contrast, and exposure matter.']
    ],
    sound: [
      ['Audio Calls', 'Find scripts needing sound recording, design, or mix support.'],
      ['Sound Kit', 'Show microphones, software, and cleanup skills in your profile.'],
      ['Post Audio', 'Request films where dialogue, ambience, or sound design is important.']
    ],
    editor: [
      ['Edit Calls', 'Find projects asking for editor, trailer cut, or post-production help.'],
      ['Timeline Skills', 'Show editing software, color, sync, and storytelling strengths.'],
      ['Post Match', 'Request scripts that fit your editing taste.']
    ],
    spot: [
      ['Set Calls', 'Find productions that need support, logistics, and on-set help.'],
      ['Availability', 'Keep your city and availability clear for fast coordination.'],
      ['Production Support', 'Request teams that need reliable set crew.']
    ],
    crew: [
      ['Open Calls', 'Browse live scripts and production needs.'],
      ['Profile Card', 'Use your profile as your role card.'],
      ['Request Flow', 'Send live collaboration requests from script cards.']
    ]
  };

  return tools[key] || tools.crew;
}

function renderRoleToolkit(user, workspace) {
  const toolkit = document.getElementById('roleToolkit');
  const title = document.getElementById('roleToolkitTitle');
  const kicker = document.getElementById('roleToolkitKicker');
  const signal = document.getElementById('roleToolkitSignal');
  const grid = document.getElementById('roleToolGrid');
  const directorDesk = document.getElementById('directorDeskPanel');

  if (!toolkit || !grid) return;

  if (!user) {
    toolkit.hidden = true;
    if (directorDesk) directorDesk.hidden = true;
    return;
  }

  toolkit.hidden = false;
  if (title) title.textContent = workspace.title;
  if (kicker) kicker.textContent = `${user.role || 'Crew'} Interface`;
  if (signal) signal.textContent = getRoleSkinKey(user.role).toUpperCase();

  grid.innerHTML = getRoleTools(user.role).map((tool, index) => `
    <div class="role-tool-card">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <strong>${tool[0]}</strong>
      <p>${tool[1]}</p>
    </div>
  `).join('');

  if (directorDesk) {
    const isDirector = getRoleSkinKey(user.role) === 'director';
    directorDesk.hidden = !isDirector;
    if (isDirector) updateDirectorDeskPreview();
  }
}

function setLabelText(forId, value) {
  const label = document.querySelector(`label[for="${forId}"]`);
  if (label && value) label.textContent = value;
}

function applyCreatorWorkspaceCopy(workspace) {
  setLabelText('scriptTitle', workspace.scriptLabel);
  setLabelText('scriptDesc', workspace.descLabel);
  setLabelText('authorName', workspace.rolesLabel);

  const titleEl = document.getElementById('scriptTitle');
  const descEl = document.getElementById('scriptDesc');
  const authorEl = document.getElementById('authorName');

  if (titleEl) titleEl.placeholder = workspace.scriptPlaceholder || '';
  if (descEl) descEl.placeholder = workspace.descPlaceholder || '';
  if (authorEl) authorEl.placeholder = workspace.rolesPlaceholder || '';
}

function applyCrewWorkspaceCopy(workspace) {
  const heading = document.getElementById('crewModeHeading');
  const description = document.getElementById('crewModeDescription');
  const list = document.getElementById('crewModeList');
  const browseAction = document.getElementById('crewBrowseAction');
  const profileAction = document.getElementById('crewProfileAction');

  if (heading) heading.textContent = workspace.heading;
  if (description) description.textContent = workspace.description;
  if (list) {
    list.innerHTML = workspace.list.map((item) => `<li>${item}</li>`).join('');
  }
  if (browseAction) browseAction.textContent = workspace.primary;
  if (profileAction) profileAction.textContent = workspace.secondary;
}

function getSelectedDirectorRoles() {
  return Array.from(document.querySelectorAll('.director-chip.active'))
    .map((chip) => chip.dataset.directorRole)
    .filter(Boolean);
}

function getDirectorDeskPitch() {
  const title = document.getElementById('scriptTitle')?.value.trim() || 'Untitled director call';
  const genre = document.getElementById('scriptTheme')?.value || 'drama';
  const synopsis = document.getElementById('scriptDesc')?.value.trim();
  const mood = document.getElementById('directorSceneMood')?.value || 'Gritty realistic';
  const location = document.getElementById('directorLocation')?.value.trim();
  const shootDate = document.getElementById('directorShootDate')?.value;
  const roles = getSelectedDirectorRoles();

  return {
    title,
    genre,
    synopsis,
    mood,
    location,
    shootDate,
    roles
  };
}

function updateDirectorDeskPreview() {
  const preview = document.getElementById('directorDeskPreview');
  const state = document.getElementById('directorDeskState');
  const value = document.getElementById('directorReadinessValue');
  const bar = document.getElementById('directorReadinessBar');
  const pitch = getDirectorDeskPitch();
  const readinessParts = [
    pitch.title !== 'Untitled director call',
    Boolean(pitch.synopsis),
    Boolean(pitch.location),
    pitch.roles.length > 0,
    Boolean(pitch.shootDate)
  ];
  const readiness = Math.max(20, Math.round((readinessParts.filter(Boolean).length / readinessParts.length) * 100));
  const dateLine = pitch.shootDate ? `Shoot window: ${pitch.shootDate}. ` : '';
  const locationLine = pitch.location ? `Location idea: ${pitch.location}. ` : '';
  const rolesLine = pitch.roles.length ? `Needs: ${pitch.roles.join(', ')}.` : 'Needs: select crew roles.';
  const storyLine = pitch.synopsis ? `Story: ${pitch.synopsis}` : 'Story: add a short director vision in the synopsis box.';

  if (preview) {
    preview.textContent = `${pitch.title} is a ${pitch.genre} call with a ${pitch.mood.toLowerCase()} tone. ${locationLine}${dateLine}${rolesLine} ${storyLine}`;
  }

  if (value) value.textContent = `${readiness}%`;
  if (bar) bar.style.width = `${readiness}%`;
  if (state) state.textContent = readiness >= 80 ? 'Ready' : readiness >= 50 ? 'Building' : 'Draft';
}

function useDirectorDeskInUploadForm() {
  const pitch = getDirectorDeskPitch();
  const rolesEl = document.getElementById('authorName');
  const synopsisEl = document.getElementById('scriptDesc');
  const locationLine = pitch.location ? `Location: ${pitch.location}. ` : '';
  const dateLine = pitch.shootDate ? `Shoot window: ${pitch.shootDate}. ` : '';
  const generatedBrief = `${pitch.mood} tone. ${locationLine}${dateLine}Crew needed: ${pitch.roles.join(', ') || 'DP, Gaffer, Sound, Actors, Editor'}.`;

  if (rolesEl) rolesEl.value = pitch.roles.join(', ') || 'DP, Gaffer, Sound, Actors, Editor';
  if (synopsisEl && !synopsisEl.value.trim()) {
    synopsisEl.value = generatedBrief;
  } else if (synopsisEl && !synopsisEl.value.includes('Crew needed:')) {
    synopsisEl.value = `${synopsisEl.value.trim()}\n\n${generatedBrief}`;
  }

  updateDirectorDeskPreview();
  showToast('Director call added to upload form ✦');
  document.getElementById('creatorUploadZone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initDirectorDesk() {
  const watched = ['scriptTitle', 'scriptTheme', 'scriptDesc', 'authorName', 'directorSceneMood', 'directorLocation', 'directorShootDate'];

  watched.forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', updateDirectorDeskPreview);
    el?.addEventListener('change', updateDirectorDeskPreview);
  });

  document.getElementById('directorCrewChips')?.addEventListener('click', (event) => {
    const chip = event.target.closest('.director-chip');
    if (!chip) return;
    chip.classList.toggle('active');
    updateDirectorDeskPreview();
  });

  document.getElementById('directorBuildCallBtn')?.addEventListener('click', useDirectorDeskInUploadForm);
  document.getElementById('directorCrewFinderBtn')?.addEventListener('click', () => openCrewFinderPage());
  document.getElementById('directorInboxBtn')?.addEventListener('click', () => {
    window.location.href = '/profile#collab';
  });
}

let latestHomeStats = {};
let allLiveScripts = [];
let activeSearchQuery = '';
let activeGenreFilter = 'all';

function getCardTone(genre) {
  const tones = {
    horror: '#2a0808',
    romance: '#081020',
    action: '#0a1808',
    comedy: '#181408',
    thriller: '#10080a',
    drama: '#08101a',
    'sci-fi': '#08121c'
  };

  return tones[String(genre || '').toLowerCase()] || '#141018';
}

function normalizeScriptCard(script, index) {
  return {
    id: script.id,
    owner_id: script.owner_id || script.user_id || '',
    number: script.number || String(index + 1).padStart(3, '0'),
    title: script.title || 'Untitled Script',
    genre: script.genre || 'General',
    tag: script.tag || script.roles_needed || script.status || 'Open for collaboration',
    status: script.status || 'Live',
    synopsis: script.synopsis || '',
    author_name: script.author_name || 'TAKE ONE creator'
  };
}

function getNormalizedScriptById(scriptId) {
  const index = allLiveScripts.findIndex((script) => Number(script.id) === Number(scriptId));
  if (index === -1) return null;
  return normalizeScriptCard(allLiveScripts[index], index);
}

function roleKeywords(role) {
  const normalized = normalizeRole(role);

  if (normalized.includes('camera') || normalized.includes('cinematographer') || normalized.includes('dp')) {
    return ['camera', 'cinematographer', 'dp', 'dop', 'director of photography'];
  }
  if (normalized.includes('gaffer') || normalized.includes('light')) {
    return ['gaffer', 'light', 'lighting'];
  }
  if (normalized.includes('sound')) {
    return ['sound', 'audio', 'recordist'];
  }
  if (normalized.includes('editor')) {
    return ['editor', 'edit', 'post'];
  }
  if (normalized.includes('actor')) {
    return ['actor', 'cast', 'casting', 'performer'];
  }
  if (normalized.includes('spot')) {
    return ['spot', 'runner', 'set support'];
  }

  return normalized ? [normalized] : [];
}

function scriptMatchesUserRole(script) {
  if (typeof API === 'undefined' || !API.auth?.isLoggedIn()) return false;

  const user = API.auth.getUser();
  if (!user || isCreatorRole(user.role)) return false;

  const keywords = roleKeywords(user.role);
  const haystack = normalizeRole(`${script.title} ${script.genre} ${script.tag} ${script.synopsis}`);

  return keywords.some((keyword) => haystack.includes(keyword));
}

function updateLiveScriptStatus(count, query = activeSearchQuery, genre = activeGenreFilter) {
  const status = document.getElementById('liveScriptStatus');
  if (!status) return;

  const filterText = [
    query ? `search: "${query}"` : '',
    genre && genre !== 'all' ? `genre: ${genre}` : ''
  ].filter(Boolean).join(' · ');

  status.textContent = `${count} live script${count === 1 ? '' : 's'} loaded from MySQL${filterText ? ` · ${filterText}` : ''}`;
}

function renderHomepageScripts(scripts) {
  const cardRow = document.getElementById('cardRow');
  if (!cardRow || !Array.isArray(scripts)) return;
  const normalizedScripts = scripts.map(normalizeScriptCard);

  if (scripts.length === 0) {
    cardRow.innerHTML = `
      <div class="live-empty-card">
        No live scripts found. Upload one from your role workspace and it will appear here.
      </div>
    `;
    updateLiveScriptStatus(0);
    return;
  }

  cardRow.innerHTML = normalizedScripts.map((script) => `
    <div class="movie-card ${scriptMatchesUserRole(script) ? 'role-match-card' : ''}" data-script-id="${script.id}" data-owner-id="${script.owner_id || ''}" data-genre="${String(script.genre || 'general').toLowerCase()}"
      style="background: linear-gradient(160deg, ${getCardTone(script.genre)} 0%, #06080A 100%)">
      <div class="data-num">${script.number || '001'}</div>
      <div class="card-genre">${script.genre || 'General'}</div>
      <div class="card-title">${script.title || 'Untitled Script'}</div>
      <div class="card-tag">${script.tag || 'Open for collaboration'}</div>
      ${scriptMatchesUserRole(script) ? '<div class="role-match-label">Matches your role</div>' : ''}
      <div class="card-open-hint">Open Preview</div>
      <button class="request-join-btn" data-script-id="${script.id}" data-owner-id="${script.owner_id || ''}">Request</button>
    </div>
  `).join('');

  updateLiveScriptStatus(normalizedScripts.length);
}

function updateDirectorMonitor(stats = {}, scripts = []) {
  const latestScript = Array.isArray(scripts) && scripts.length > 0
    ? normalizeScriptCard(scripts[0], 0)
    : null;
  const roleCounts = stats.roleCounts || {};
  const activeRoleTypes = Object.values(roleCounts).filter((count) => Number(count) > 0).length;

  updateText('monitorScripts', formatCompactNumber(stats.scripts || scripts.length));
  updateText('monitorCrew', formatCompactNumber(stats.creators));
  updateText('monitorRoles', activeRoleTypes || 0);

  if (latestScript) {
    updateText('monitorTitle', latestScript.title);
    updateText('monitorMeta', `${latestScript.genre} · ${latestScript.tag}`);
    updateText('monitorStatus', 'LIVE');
  } else {
    updateText('monitorTitle', 'Waiting for first script');
    updateText('monitorMeta', 'Upload a script to start the production signal');
    updateText('monitorStatus', 'READY');
  }
}

function updateFeatureDashboard(stats = {}, scripts = []) {
  latestHomeStats = stats;
  const latestScript = Array.isArray(scripts) ? scripts[0] : null;
  const roleCounts = stats.roleCounts || {};
  const activeRoleTypes = Object.values(roleCounts).filter((count) => Number(count) > 0).length;

  updateText('featureScriptCount', formatCompactNumber(stats.scripts));
  updateText('featureCreatorCount', formatCompactNumber(stats.creators));

  if (latestScript) {
    updateText('featureSpotlightTitle', latestScript.title || 'Untitled Script');
    updateText(
      'featureSpotlightMeta',
      `${latestScript.genre || 'General'} · ${latestScript.tag || 'Open for collaboration'}`
    );
  } else {
    updateText('featureSpotlightTitle', 'No scripts yet');
    updateText('featureSpotlightMeta', 'Upload a script to activate this');
  }

  const teamCard = document.querySelector('[data-feature-card="team"] .feat-live small');
  if (teamCard) {
    teamCard.textContent = `${activeRoleTypes || 0} role groups active`;
  }

  renderCrewRoleBrowser(roleCounts);
  updateDirectorMonitor(stats, scripts);
}

function activateFeatureSection() {
  document.querySelectorAll('[data-monitor-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.monitorAction === 'crew') {
        openCrewFinderPage();
        return;
      }

      scrollToSection('#explore');
      setTimeout(() => document.getElementById('liveSearchInput')?.focus(), 500);
    });
  });

  document.querySelectorAll('[data-feature-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.featureAction;

      if (action === 'scripts') {
        scrollToSection('#explore');
        setTimeout(() => document.getElementById('liveSearchInput')?.focus(), 500);
        showToast('Live script showcase opened ✦');
        return;
      }

      if (action === 'team') {
        openCrewFinderPage();
        showToast('Crew finder opened ✦');
        return;
      }

      if (action === 'spotlight') {
        scrollToSection('#explore');
        const firstCard = document.querySelector('#cardRow .movie-card');
        if (firstCard) {
          firstCard.classList.add('spotlight-pulse');
          setTimeout(() => firstCard.classList.remove('spotlight-pulse'), 1600);
        }
        showToast('Latest live script highlighted ✦');
      }
    });
  });

  document.querySelector('[data-feature-card="team"]')?.addEventListener('click', (event) => {
    if (event.target.closest('[data-feature-action]')) return;
    openCrewFinderPage();
    showToast('Crew finder opened ✦');
  });
}

const STAGE_COPY = {
  script: {
    title: 'Script Showcase',
    text: 'Browse live scripts, search by genre, and open script previews before requesting to join.'
  },
  crew: {
    title: 'Crew Finder',
    text: 'Open the full crew finder page to browse roles, filter people, and contact real registered users.'
  },
  request: {
    title: 'Collaboration Request',
    text: 'Send a request from any script card. TAKE ONE saves it in MySQL and tries to email the owner.'
  }
};

document.getElementById('productionStages')?.addEventListener('click', (event) => {
  const button = event.target.closest('.stage-card');
  if (!button) return;

  document.querySelectorAll('.stage-card').forEach((card) => card.classList.remove('active'));
  button.classList.add('active');

  const copy = STAGE_COPY[button.dataset.stage] || STAGE_COPY.script;
  updateText('deckPreviewTitle', copy.title);
  updateText('deckPreviewText', copy.text);
});

async function loadHomepageData() {
  if (typeof API === 'undefined' || !API.home) return;

  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.animation = 'loaderOut 0.5s ease forwards';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  };

  // Safety timeout: hide loader after 5 seconds no matter what
  const safetyTimeout = setTimeout(hideLoader, 5000);

  try {
    const response = await API.home.get();
    const stats = response.stats || {};
    const roleCounts = stats.roleCounts || {};

    updateText('statCreators', formatCompactNumber(stats.creators));
    updateText('statScripts', formatCompactNumber(stats.scripts));
    updateText('statColleges', formatCompactNumber(stats.colleges));

    updateText('countDirector', roleCounts.director || 0);
    updateText('countCamera', roleCounts.camera || 0);
    updateText('countWriter', roleCounts.writer || 0);
    updateText('countSound', roleCounts.sound || 0);
    updateText('countEditor', roleCounts.editor || 0);
    updateText('countGaffer', roleCounts.gaffer || 0);
    updateText('countActor', roleCounts.actor || 0);
    updateText('countSpotBoy', roleCounts.spot_boy || 0);

    updateText(
      'liveCommunityText',
      `Reviewed within 24 hrs. Join ${stats.creators || 0} creators across ${stats.colleges || 0} colleges.`
    );
    updateText('statusCreators', `${stats.creators || 0} Creators Active`);

    allLiveScripts = response.scripts || [];
    renderHomepageScripts(allLiveScripts);
    updateFeatureDashboard(stats, response.scripts || []);
    
    clearTimeout(safetyTimeout);
    hideLoader();
  } catch (err) {
    console.error('Homepage data load failed:', err);
    updateText('liveScriptStatus', 'Could not load live scripts. Check server and MySQL connection.');
    clearTimeout(safetyTimeout);
    hideLoader();
  }
}


activateFeatureSection();


/* ════════════════════════════════════════════════════════════
   ADD THIS CODE TO project-2.js
   
   These are NEW functions. Add them AFTER all existing functions
   but BEFORE the final closing code.
   ════════════════════════════════════════════════════════════ */

/* ── SEARCH BAR ── */
const searchInput = document.getElementById('liveSearchInput');
const searchResults = document.getElementById('searchResults');
let searchTimeout;

searchInput?.addEventListener('input', (e) => {
  activeSearchQuery = e.target.value.trim();
  clearTimeout(searchTimeout);
  if (!activeSearchQuery) {
    searchResults.style.display = 'none';
    searchTimeout = setTimeout(() => {
      loadLiveScripts();
    }, 200);
    return;
  }
  searchTimeout = setTimeout(() => {
    performSearch(activeSearchQuery);
  }, 300);
});

function renderSearchResults(scripts, query) {
  if (!searchResults) return;

  if (!query) {
    searchResults.style.display = 'none';
    return;
  }

  if (!Array.isArray(scripts) || scripts.length === 0) {
    searchResults.innerHTML = `
      <div class="search-no-results">
        No live scripts found for "<strong>${query}</strong>"
      </div>
    `;
    searchResults.style.display = 'block';
    return;
  }

  searchResults.innerHTML = scripts.slice(0, 6).map((script) => `
    <div class="search-result-item" data-script-id="${script.id}">
      <div class="sri-poster" style="background: linear-gradient(160deg, ${getCardTone(script.genre)} 0%, #06080A 100%)"></div>
      <div class="sri-info">
        <div class="sri-title">${script.title || 'Untitled Script'}</div>
        <div class="sri-genre">${script.genre || 'General'}</div>
        <div class="sri-author">by ${script.author_name || 'TAKE ONE creator'}</div>
      </div>
    </div>
  `).join('');

  searchResults.style.display = 'block';

  document.querySelectorAll('.search-result-item').forEach((item) => {
    item.addEventListener('click', () => {
      searchResults.style.display = 'none';
      scrollToSection('#explore');
      openScriptModal(item.dataset.scriptId);
    });
  });
}

async function loadLiveScripts() {
  if (typeof API === 'undefined' || !API.scripts) return;

  const genre = activeGenreFilter === 'all' ? '' : activeGenreFilter;
  updateText('liveScriptStatus', 'Loading live scripts from MySQL...');

  try {
    const response = await API.scripts.search(activeSearchQuery, genre);
    allLiveScripts = response.data || [];
    renderHomepageScripts(allLiveScripts);
    renderSearchResults(allLiveScripts, activeSearchQuery);
  } catch (err) {
    console.error('Live script load failed:', err);
    updateText('liveScriptStatus', 'Could not load live scripts. Check server and MySQL connection.');
  }
}

async function performSearch(query) {
  try {
    const genre = activeGenreFilter === 'all' ? '' : activeGenreFilter;
    const response = await API.scripts.search(query, genre);
    const scripts = response.data || [];
    allLiveScripts = scripts;
    renderHomepageScripts(scripts);
    renderSearchResults(scripts, query);
  } catch (err) {
    console.error('Search error:', err);
    searchResults.innerHTML = '<div class="search-no-results">Error loading results</div>';
    searchResults.style.display = 'block';
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-bar-wrapper')) {
    searchResults.style.display = 'none';
  }
});


/* ── LOGIN & REGISTER ── */
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const peopleModal = document.getElementById('peopleModal');
const loginBtn = document.getElementById('loginBtn');
const registerLink = document.getElementById('registerLink');
const backToLoginLink = document.getElementById('backToLoginLink');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const closeRegisterBtn = document.getElementById('closeRegisterBtn');
const closePeopleModalBtn = document.getElementById('closePeopleModalBtn');
const scriptModal = document.getElementById('scriptModal');
const closeScriptModalBtn = document.getElementById('closeScriptModalBtn');
const scriptModalRequestBtn = document.getElementById('scriptModalRequestBtn');

/* Centralized Modal Management */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('show');
  
  // Only re-enable scrolling if no other modals are open
  const openModals = document.querySelectorAll('.modal.show');
  if (openModals.length === 0) {
    document.body.style.overflow = '';
  }
}

loginBtn?.addEventListener('click', () => {
  if (API.auth.isLoggedIn()) {
    API.auth.logout();
  } else {
    openModal(loginModal);
  }
});

registerLink?.addEventListener('click', (e) => {
  e.preventDefault();
  closeModal(loginModal);
  openModal(registerModal);
});

backToLoginLink?.addEventListener('click', (e) => {
  e.preventDefault();
  closeModal(registerModal);
  openModal(loginModal);
});

closeLoginBtn?.addEventListener('click', () => closeModal(loginModal));
closeRegisterBtn?.addEventListener('click', () => closeModal(registerModal));
closePeopleModalBtn?.addEventListener('click', () => closeModal(peopleModal));
closeScriptModalBtn?.addEventListener('click', () => closeModal(scriptModal));

function openAuthFromUrl() {
  const authMode = new URLSearchParams(window.location.search).get('auth');
  if (authMode === 'login') openModal(loginModal);
  if (authMode === 'register') openModal(registerModal);
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    closeModal(e.target);
  }
});

const loginForm = document.getElementById('loginForm');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const submitBtn = loginForm.querySelector('.form-submit');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    const response = await API.users.login(email, password);
    
    if (response.success) {
      API.auth.saveToken(response.token, response.user);
      showToast(`Welcome back, ${response.user.name}! ✦`);
      closeModal(loginModal);
      loginForm.reset();
      updateUIAfterLogin(response.user);
    }
  } catch (err) {
    showToast(`❌ ${err.message || 'Login failed. Check your email and password.'}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

const registerForm = document.getElementById('registerForm');
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const role = document.getElementById('registerRole').value;
  const college = document.getElementById('registerCollege').value;
  const city = document.getElementById('registerCity').value;
  
  if (password !== confirmPassword) {
    showToast('❌ Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    showToast('❌ Password must be at least 6 characters');
    return;
  }
  
  const submitBtn = registerForm.querySelector('.form-submit');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    const response = await API.users.register({
      name, email, password, role, college, city
    });
    
    if (response.success) {
      API.auth.saveToken(response.token, { id: response.user_id, name, role });
      showToast(`Welcome to TAKE ONE, ${name}! ✦`);
      closeModal(registerModal);
      registerForm.reset();
      updateUIAfterLogin({ id: response.user_id, name, role });
    }
  } catch (err) {
    showToast(`❌ ${err.message || 'Registration failed.'}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

function updateUIAfterLogin(user) {
  const loginBtnEl = document.getElementById('loginBtn');
  const navCta = document.querySelector('.nav-cta');
  
  if (loginBtnEl) {
    loginBtnEl.textContent = 'Logout';
    loginBtnEl.style.pointerEvents = 'auto';
    loginBtnEl.style.opacity = '1';
  }
  
  if (navCta) {
    navCta.textContent = `Logout`;
    navCta.onclick = (e) => {
      e.preventDefault();
      API.auth.logout();
    };
  }

  applyRoleBasedUI(user);
}

function applyRoleBasedUI(user) {
  const creatorUploadZone = document.getElementById('creatorUploadZone');
  const crewModePanel = document.getElementById('crewModePanel');
  const uploadSectionLabel = document.getElementById('uploadSectionLabel');
  const uploadSectionTitle = document.getElementById('uploadSectionTitle');
  const uploadSectionSubtitle = document.getElementById('uploadSectionSubtitle');
  const heroSubText = document.getElementById('heroSubText');
  const heroSecondaryAction = document.getElementById('heroSecondaryAction');
  const navUploadLink = document.getElementById('navUploadLink');
  const uploadActionButton = document.getElementById('uploadActionButton');
  const workspace = getWorkspaceForRole(user?.role);

  if (!creatorUploadZone || !crewModePanel) return;

  if (!user) {
    applyRoleSkin('');
    renderRoleToolkit(null, workspace);
    creatorUploadZone.hidden = true;
    crewModePanel.hidden = false;
    if (uploadSectionLabel) uploadSectionLabel.textContent = workspace.label;
    if (uploadSectionTitle) uploadSectionTitle.textContent = workspace.title;
    if (uploadSectionSubtitle) uploadSectionSubtitle.textContent = workspace.subtitle;
    if (heroSecondaryAction) {
      heroSecondaryAction.textContent = 'Create Profile';
      heroSecondaryAction.setAttribute('href', '#');
      heroSecondaryAction.onclick = (event) => {
        event.preventDefault();
        openModal(registerModal);
      };
    }
    if (navUploadLink) {
      navUploadLink.textContent = 'Workspace';
      navUploadLink.setAttribute('href', '#upload');
    }
    applyCrewWorkspaceCopy(workspace);
    return;
  }

  const creatorMode = isCreatorRole(user.role);
  applyRoleSkin(user.role);
  renderRoleToolkit(user, workspace);

  if (creatorMode) {
    creatorUploadZone.hidden = false;
    crewModePanel.hidden = true;
    if (uploadSectionLabel) uploadSectionLabel.textContent = workspace.label;
    if (uploadSectionTitle) uploadSectionTitle.textContent = workspace.title;
    if (uploadSectionSubtitle) {
      uploadSectionSubtitle.textContent = workspace.subtitle;
    }
    if (heroSubText) {
      heroSubText.textContent = `You are in ${workspace.label} mode. Your workspace is built for your role only.`;
    }
    if (heroSecondaryAction) {
      heroSecondaryAction.onclick = null;
      heroSecondaryAction.textContent = workspace.button || 'Upload Your Script';
      heroSecondaryAction.setAttribute('href', '#upload');
    }
    if (navUploadLink) {
      navUploadLink.textContent = workspace.label;
      navUploadLink.setAttribute('href', '#upload');
    }
    if (uploadActionButton) uploadActionButton.textContent = workspace.button || 'Submit Script →';
    applyCreatorWorkspaceCopy(workspace);
    return;
  }

  creatorUploadZone.hidden = true;
  crewModePanel.hidden = false;

  if (uploadSectionLabel) uploadSectionLabel.textContent = workspace.label;
  if (uploadSectionTitle) uploadSectionTitle.textContent = workspace.title;
  if (uploadSectionSubtitle) {
    uploadSectionSubtitle.textContent = workspace.subtitle;
  }
  if (heroSubText) {
    heroSubText.textContent = `You are in ${workspace.label} mode as ${user.role || 'crew'}. Only your role workspace is shown here.`;
  }
  if (heroSecondaryAction) {
    heroSecondaryAction.onclick = null;
    heroSecondaryAction.textContent = workspace.secondary || 'Build Your Crew Profile';
    heroSecondaryAction.setAttribute('href', '/profile');
  }
  if (navUploadLink) {
    navUploadLink.textContent = workspace.label;
    navUploadLink.setAttribute('href', '#explore');
  }

  applyCrewWorkspaceCopy(workspace);
  loadLiveScripts();
}

function checkAuthState() {
  if (typeof API === 'undefined' || !API.auth) return;
  const user = API.auth.getUser();
  if (user) {
    updateUIAfterLogin(user);
  } else {
    applyRoleBasedUI(null);
  }
}

initDirectorDesk();
checkAuthState();
openAuthFromUrl();
loadHomepageData();

function renderCrewRoleBrowser(roleCounts = {}, activeQuery = '') {
  const browser = document.getElementById('crewRoleBrowser');
  if (!browser) return;

  browser.innerHTML = CREW_ROLE_OPTIONS.map((role) => {
    const count = Number(roleCounts[role.key]) || 0;
    const available = count > 0;
    const active = activeQuery && role.query.toLowerCase() === activeQuery.toLowerCase();

    return `
      <button
        type="button"
        class="crew-role-option ${available ? 'available' : 'unavailable'} ${active ? 'active' : ''}"
        data-role-query="${role.query}"
        data-role-label="${role.label}"
        data-role-count="${count}"
      >
        <div class="crew-role-icon">${role.icon}</div>
        <div class="crew-role-name">${role.label}</div>
        <div class="crew-role-status">${available ? `${count} Available` : 'Not Available'}</div>
      </button>
    `;
  }).join('');
}

function showPeopleIntro() {
  const results = document.getElementById('peopleResults');
  if (!results) return;

  results.innerHTML = `
    <div class="people-empty">
      Select any available role above to see registered people and contact them.
    </div>
  `;
}

function openCrewFinderModal() {
  const title = document.getElementById('peopleModalTitle');
  const subtitle = document.getElementById('peopleModalSubtitle');

  if (title) title.textContent = 'Crew Finder';
  if (subtitle) {
    subtitle.textContent = 'See which film roles have registered people right now. Available roles can be opened for contact details.';
  }

  renderCrewRoleBrowser(latestHomeStats.roleCounts || {});
  showPeopleIntro();

  openModal(peopleModal);
}

function renderPeopleResults(people) {
  const results = document.getElementById('peopleResults');
  if (!results) return;

  if (!Array.isArray(people) || people.length === 0) {
    results.innerHTML = `<div class="people-empty">No registered people found for this role yet.</div>`;
    return;
  }

  results.innerHTML = people.map((person) => `
    <div class="person-card">
      <div>
        <div class="person-name">${person.name || 'Unnamed Creator'}</div>
        <div class="person-role">${person.role || 'Crew Member'}</div>
        <div class="person-meta">
          ${[person.city, person.college].filter(Boolean).join(' · ') || 'Location not added yet'}
        </div>
        <div class="person-bio">${person.bio || 'Profile is live. Reach out and start a conversation about the project.'}</div>
      </div>
      <div class="person-actions">
        <a class="person-contact" href="mailto:${person.email}?subject=TAKE%20ONE%20Collaboration">Contact</a>
        <div class="person-email">${person.email || ''}</div>
      </div>
    </div>
  `).join('');
}

function openScriptModal(scriptId) {
  const script = getNormalizedScriptById(scriptId);
  if (!script || !scriptModal) return;

  updateText('scriptModalTitle', script.title);
  updateText('scriptModalGenre', script.genre);
  updateText('scriptModalAuthor', `by ${script.author_name}`);
  updateText(
    'scriptModalSynopsis',
    script.synopsis || 'This creator has opened the project for collaboration. Use the request button to start the conversation.'
  );
  updateText('scriptModalRoles', script.tag);
  updateText('scriptModalStatus', script.status || 'Live');

  const poster = document.getElementById('scriptModalPoster');
  if (poster) {
    poster.style.background = `
      radial-gradient(circle at 50% 30%, rgba(255, 77, 26, 0.22), transparent 42%),
      linear-gradient(160deg, ${getCardTone(script.genre)} 0%, #06080A 100%)
    `;
  }

  if (scriptModalRequestBtn) {
    scriptModalRequestBtn.dataset.scriptId = script.id;
    scriptModalRequestBtn.dataset.ownerId = script.owner_id || '';
    scriptModalRequestBtn.disabled = false;
    scriptModalRequestBtn.textContent = 'Request To Join →';
  }

  openModal(scriptModal);
}

async function openPeopleModal(roleQuery, roleLabel) {
  const title = document.getElementById('peopleModalTitle');
  const subtitle = document.getElementById('peopleModalSubtitle');
  const results = document.getElementById('peopleResults');
  const role = CREW_ROLE_OPTIONS.find((item) => item.query.toLowerCase() === String(roleQuery || '').toLowerCase());
  const count = Number((latestHomeStats.roleCounts || {})[role?.key]) || 0;

  renderCrewRoleBrowser(latestHomeStats.roleCounts || {}, roleQuery);

  if (title) title.textContent = 'Crew Finder';
  if (subtitle) subtitle.textContent = `Showing registered ${roleLabel?.toLowerCase() || 'crew members'} you can contact.`;

  if (count === 0 && role) {
    if (results) {
      results.innerHTML = `<div class="people-empty">${roleLabel || 'This role'} is not available yet. When someone registers for this role, they will appear here.</div>`;
    }
    openModal(peopleModal);
    return;
  }

  if (results) results.innerHTML = '<div class="people-empty">Loading people...</div>';
  openModal(peopleModal);

  try {
    const response = await API.users.search({ role: roleQuery });
    renderPeopleResults(response.data || []);
  } catch (err) {
    if (results) {
      results.innerHTML = `<div class="people-empty">Could not load people right now.</div>`;
    }
  }
}

document.querySelectorAll('.role-card').forEach((card) => {
  card.addEventListener('click', () => {
    openCrewFinderPage(card.dataset.roleQuery);
  });
});

document.querySelectorAll('[data-open-crew-finder]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openCrewFinderPage();
  });
});

document.getElementById('crewRoleBrowser')?.addEventListener('click', (event) => {
  const button = event.target.closest('.crew-role-option');
  if (!button) return;

  openPeopleModal(button.dataset.roleQuery, button.dataset.roleLabel);
});

async function requestToJoinScript(scriptId, ownerId, button) {
  if (!API.auth.isLoggedIn()) {
    showToast('❌ Please login to request a role');
    document.getElementById('loginBtn').click();
    return false;
  }

  const user = API.auth.getUser();

  if (Number(ownerId) === Number(user.id)) {
    showToast('❌ This is your own script');
    return false;
  }

  try {
    const response = await API.requests.create({
      script_id: Number(scriptId),
      message: `${user.name} wants to join as ${user.role || 'crew'}`
    });
    showToast(response.data?.email_sent ? 'Request sent and email delivered ✦' : 'Request saved. Email setup needed ✦');
    if (button) {
      button.textContent = 'Sent';
      button.disabled = true;
    }
    return true;
  } catch (err) {
    showToast(`❌ ${err.message || 'Could not send request'}`);
    return false;
  }
}

document.getElementById('cardRow')?.addEventListener('click', async (event) => {
  const btn = event.target.closest('.request-join-btn');
  const card = event.target.closest('.movie-card');

  if (btn) {
    event.stopPropagation();
    await requestToJoinScript(btn.dataset.scriptId, btn.dataset.ownerId, btn);
    return;
  }

  if (card) {
    openScriptModal(card.dataset.scriptId);
  }
});

document.getElementById('cardRow')?.addEventListener('mousemove', (event) => {
  const card = event.target.closest('.movie-card');
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const rotateY = ((x / rect.width) - 0.5) * 10;
  const rotateX = ((0.5 - (y / rect.height)) * 10);

  card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
});

document.getElementById('cardRow')?.addEventListener('mouseleave', () => {
  document.querySelectorAll('.movie-card').forEach((card) => {
    card.style.transform = '';
  });
});

scriptModalRequestBtn?.addEventListener('click', async () => {
  const sent = await requestToJoinScript(
    scriptModalRequestBtn.dataset.scriptId,
    scriptModalRequestBtn.dataset.ownerId,
    scriptModalRequestBtn
  );

  if (sent && scriptModal) {
    setTimeout(() => {
      closeModal(scriptModal);
    }, 600);
  }
});


/* ── UPDATE UPLOAD FUNCTION ── */
/* REPLACE THE EXISTING uploadScript() FUNCTION WITH THIS: */

function uploadScript() {
  if (!API.auth.isLoggedIn()) {
    showToast('❌ Please login to upload a script');
    document.getElementById('loginBtn').click();
    return;
  }
  
  const titleEl = document.getElementById('scriptTitle');
  const genreEl = document.getElementById('scriptTheme');
  const descEl = document.getElementById('scriptDesc');
  const posterEl = document.getElementById('posterInput');
  const authorEl = document.getElementById('authorName');
  
  const title = titleEl.value.trim();
  const genre = genreEl.value;
  const synopsis = descEl.value.trim();
  const authorAlias = authorEl?.value.trim();
  
  if (!title) {
    showToast('Please enter a title ✦');
    return;
  }

  const user = API.auth.getUser();
  const workspace = getWorkspaceForRole(user.role);

  if (!isCreatorRole(user.role)) {
    showToast('❌ Crew roles cannot upload scripts. Browse projects or build your profile.');
    return;
  }

  const uploadBtn = document.getElementById('uploadActionButton');
  const originalText = uploadBtn.textContent;

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Submitting...';

  API.scripts.create({
    title,
    genre,
    synopsis,
    roles_needed: authorAlias || workspace.rolesPlaceholder || `${user.role || 'Creator'} needed`,
    status: workspace.status || 'Just Added'
  }).then((response) => {
    showToast('Script submitted ✦');
    loadHomepageData();

    titleEl.value = '';
    descEl.value = '';
    posterEl.value = '';
    if (authorEl) authorEl.value = '';
  }).catch((err) => {
    showToast(`❌ ${err.message || 'Could not upload script'}`);
  }).finally(() => {
    uploadBtn.disabled = false;
    uploadBtn.textContent = originalText;
  });
}
