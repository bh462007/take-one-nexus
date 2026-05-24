const ROLE_FILTERS = [
  { key: '', label: 'All Roles', icon: '◎' },
  ...window.TAKE_ONE_ROLES.map(role => ({
    key: role,
    label: role,
    icon: window.ROLE_ICONS[role] || '◎'
  }))
];

let activeRole = new URLSearchParams(window.location.search).get('role') || '';
let searchTimer = null;
let allPeople = [];

function initials(name) {
  return String(name || 'C')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';
}

function renderRoleFilters(counts = {}) {
  const list = document.getElementById('roleFilterList');
  if (!list) return;

  list.innerHTML = ROLE_FILTERS.map((role) => {
    const count = role.key
      ? allPeople.filter((person) => String(person.role || '').toLowerCase().includes(role.key.toLowerCase())).length
      : allPeople.length;

    return `
      <button class="role-filter ${activeRole === role.key ? 'active' : ''}" type="button" data-role="${role.key}">
        <span class="icon">${role.icon}</span>
        <strong>${role.label}</strong>
        <span>${count}</span>
      </button>
    `;
  }).join('');
}

function personCard(person) {
  const meta = [person.city, person.college].filter(Boolean).join(' · ') || 'Location not added';
  const skills = person.skills || 'Skills not added yet';
  const name = (typeof UserUtils !== 'undefined') ? UserUtils.getDisplayName(person) : (person.name || 'Unnamed Creator');
  
  const chatParams = new URLSearchParams({
    userId: String(person.id),
    username: name,
    role: person.role || 'Crew Member',
    avatar: person.avatar_url || initials(person.name)
  });

  const verifiedBadge = person.email_verified
    ? `<span class="verified-badge-inline" title="Verified Creator" style="display:inline-flex; align-items:center; margin-left:6px; vertical-align:middle;">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--neon); filter:drop-shadow(0 0 3px var(--neon));">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="var(--neon)" />
        </svg>
       </span>`
    : '';

  return `
    <article class="crew-card">
      <div class="crew-avatar">${initials(person.name)}</div>
      <div class="crew-name" style="display:flex; align-items:center; justify-content:center; gap:4px; flex-wrap:wrap;">${name}${verifiedBadge}</div>
      <div class="crew-role">${person.role || 'Crew Member'}</div>
      <div class="crew-meta">${meta}</div>
      <div class="crew-bio">${person.bio || 'Profile is live. Reach out and start a collaboration conversation.'}</div>
      <div class="crew-skills">${skills}</div>
      <div class="crew-actions">
        <a class="crew-contact" href="/chat?${chatParams.toString()}">Message</a>
        <a class="crew-contact view-profile" href="/profile?id=${person.id}">View Profile</a>
      </div>
    </article>
  `;
}

function renderPeople(people) {
  const grid = document.getElementById('crewGrid');
  const status = document.getElementById('crewResultStatus');
  const selected = document.getElementById('selectedRoleLabel');
  const total = document.getElementById('totalCrew');

  if (!grid) return;

  if (total) total.textContent = allPeople.length;
  if (selected) {
    const role = ROLE_FILTERS.find((item) => item.key === activeRole);
    selected.textContent = role?.label || 'All';
  }

  if (!Array.isArray(people) || people.length === 0) {
    grid.innerHTML = '<div class="crew-empty">No people found for this filter yet. Try another role or clear search.</div>';
    if (status) status.textContent = '0 people found';
    return;
  }

  grid.innerHTML = people.map(personCard).join('');
  if (status) status.textContent = `${people.length} people found`;
}

async function loadPeople() {
  const query = document.getElementById('crewSearchInput')?.value.trim() || '';
  const city = document.getElementById('citySearchInput')?.value.trim() || '';

  try {
    const response = await API.users.search({
      role: activeRole,
      city,
      q: query
    });

    const people = response.data || [];
    if (!query && !city && !activeRole) {
      allPeople = people;
      renderRoleFilters();
    }

    renderPeople(people);
  } catch (error) {
    const grid = document.getElementById('crewGrid');
    if (grid) {
      grid.innerHTML = '<div class="crew-empty">Could not load crew right now. Please check your network connection.</div>';
    }
  }
}

document.getElementById('roleFilterList')?.addEventListener('click', (event) => {
  const button = event.target.closest('.role-filter');
  if (!button) return;

  activeRole = button.dataset.role || '';
  document.querySelectorAll('.role-filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  loadPeople();
});

['crewSearchInput', 'citySearchInput'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadPeople, 250);
  });
});

document.getElementById('clearCrewFilters')?.addEventListener('click', () => {
  activeRole = '';
  const crewInput = document.getElementById('crewSearchInput');
  const cityInput = document.getElementById('citySearchInput');
  if (crewInput) crewInput.value = '';
  if (cityInput) cityInput.value = '';
  renderRoleFilters();
  loadPeople();
});

renderRoleFilters();
loadPeople();
