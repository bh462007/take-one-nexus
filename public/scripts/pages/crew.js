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

  return `
    <article class="crew-card">
      <div class="crew-avatar">${initials(person.name)}</div>
      <div class="crew-name">${name}</div>
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
      grid.innerHTML = '<div class="crew-empty">Could not load crew right now. Check your server and MySQL connection.</div>';
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
