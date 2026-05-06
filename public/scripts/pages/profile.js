/* Logic moved to common.js and ui.js */

/* ── TAB SWITCHING ── */
function switchTab(name, btn) {
    /* Hide all panes, deactivate all tabs */
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));

    /* Activate the selected pane */
    document.getElementById('tab-' + name).classList.add('active');

    /* Activate the correct button */
    if (btn) {
        btn.classList.add('active');
    } else {
        /* Called without a button reference (e.g. from "Edit Profile" link) */
        document.querySelectorAll('.ctab').forEach(b => {
            if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(name)) {
                b.classList.add('active');
            }
        });
    }
}

function activateHashTab() {
    const requestedTab = window.location.hash.replace('#', '');
    const allowedTabs = ['projects', 'about', 'collab', 'notifications'];

    if (allowedTabs.includes(requestedTab)) {
        switchTab(requestedTab);
    }
}

/* ── AVATAR UPLOAD ── */
function changeAvatar(input) {
    if (!input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('profilePic').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
}

/* ── LIVE NAME PREVIEW ── */
function liveUpdateName(val) {
    const el = document.getElementById('profileName');
    if (val.trim()) el.textContent = val;
}

/* Utils moved to helpers.js */

/* Moved to helpers.js as getCardTone */

function renderSkillBadges(skills) {
    const wrap = document.getElementById('skillBadges');
    if (!wrap) return;

    const items = splitSkills(skills);
    if (items.length === 0) {
        wrap.innerHTML = '<span class="badge">New Creator</span>';
        updateStat('skillsCount', 0);
        return;
    }

    wrap.innerHTML = items.map(skill => `<span class="badge">${skill}</span>`).join('');
    updateStat('skillsCount', items.length);
}

function setProfileGate(show) {
    const gate = document.getElementById('profileAuthGate');
    const main = document.querySelector('.profile-main');
    const logout = document.getElementById('profileLogoutBtn');

    if (gate) gate.hidden = !show;
    if (main) main.hidden = show;
    if (logout) logout.hidden = show;
}

function renderProjects(scripts) {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    const items = Array.isArray(scripts) ? scripts : [];
    const cards = items.map((script, index) => `
        <div class="project-card"
             style="background: linear-gradient(160deg, ${getCardTone(script.genre)} 0%, #06080A 100%)">
          <div class="pc-num">${String(index + 1).padStart(3, '0')}</div>
          <div class="pc-genre">${script.genre || 'General'}</div>
          <div class="pc-title">${script.title || 'Untitled Script'}</div>
        </div>
    `).join('');

    grid.innerHTML = `
        ${cards || `
        <div class="project-card"
             style="background: rgba(255,77,26,0.03); border: 1px dashed rgba(255,77,26,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 12px; color: rgba(255,77,26,0.5); text-transform: uppercase; letter-spacing: 0.2em;">No scripts yet</div>
        </div>`}
        <div class="project-card"
             style="background: rgba(255,77,26,0.03);
                    border: 1px dashed rgba(255,77,26,0.2);
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    cursor: none;"
             onclick="window.location='/project.htm#upload'">
          <div style="font-size: 28px; color: rgba(255,77,26,0.3); margin-bottom: 8px;">+</div>
          <div style="font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase;
                      color: rgba(255,77,26,0.4);">New Script</div>
        </div>
    `;

    updateStat('projCount', items.length);
}

/* Moved to ui.js */

function populateProfile(profile) {
    document.getElementById('profileName').textContent = profile.name || 'Creator Name';
    document.getElementById('profileRole').textContent =
        ['Filmmaker', profile.role || '']
            .filter(Boolean)
            .join(' · ');
    document.getElementById('profileMeta').textContent =
        [profile.city || '', profile.college || '']
            .filter(Boolean)
            .join(' · ') || 'Open to collaborations';

    document.getElementById('profileBio').textContent =
        profile.bio || `Based in ${profile.city || 'your city'} — open to collaborations.`;

    if (profile.avatar_url) {
        document.getElementById('profilePic').src = profile.avatar_url;
    }

    document.getElementById('editName').value = profile.name || '';
    if (document.getElementById('editRole')) {
        document.getElementById('editRole').value = profile.role || '';
    }
    if (document.getElementById('editCollege')) {
        document.getElementById('editCollege').value = profile.college || '';
    }
    if (document.getElementById('editCity')) {
        document.getElementById('editCity').value = profile.city || '';
    }
    if (document.getElementById('editPortfolio')) {
        document.getElementById('editPortfolio').value = profile.portfolio || '';
    }
    if (document.getElementById('editBio')) {
        document.getElementById('editBio').value = profile.bio || '';
    }
    if (document.getElementById('editSkills')) {
        document.getElementById('editSkills').value = profile.skills || '';
    }

    renderSkillBadges(profile.skills);
    renderProjects(profile.scripts || []);

    updateStat('profileCity', profile.city || '--');
}

async function loadProfile() {
    if (typeof API === 'undefined' || !API.auth || !API.users) return;

    const authUser = API.auth.getUser();
    if (!authUser || !authUser.id) {
        setProfileGate(true);
        return;
    }

    try {
        setProfileGate(false);
        const response = await API.users.getProfile(authUser.id);
        if (response.success && response.data) {
            populateProfile(response.data);
            loadCollaborationRequests(authUser.id);
            loadNotifications(authUser.id);
        }
    } catch (err) {
        console.error('Profile load failed:', err);
        showToast(`Could not load profile ✦`);
    }
}

document.getElementById('profileLogoutBtn')?.addEventListener('click', () => {
    API.auth.logout();
});

function requestCard(request, mode) {
    const otherName = mode === 'incoming'
        ? request.requester_name
        : request.owner_name;
    const contactEmail = mode === 'incoming'
        ? request.requester_email
        : request.owner_email;
    const roleLine = mode === 'incoming'
        ? `${request.requester_role || 'Crew'}${request.requester_city ? ' · ' + request.requester_city : ''}`
        : 'Project owner';
    const status = String(request.status || 'pending').toLowerCase();
    const statusPill = `<div class="request-status ${escapeHTML(status)}">${escapeHTML(status)}</div>`;
    const decisionActions = mode === 'incoming' && status === 'pending'
        ? `
            <div class="request-actions">
                <button class="request-action accept" type="button"
                        onclick="updateRequestStatus(${Number(request.id)}, 'accepted', this)">Accept</button>
                <button class="request-action reject" type="button"
                        onclick="updateRequestStatus(${Number(request.id)}, 'rejected', this)">Reject</button>
            </div>
        `
        : '';
    const contactLink = contactEmail
        ? `<a class="request-contact" href="mailto:${escapeHTML(contactEmail)}?subject=TAKE%20ONE%20Collaboration">Contact</a>`
        : '';

    return `
        <div class="request-card">
            <div>
                <div class="request-script">${escapeHTML(request.script_title || 'Untitled Script')}</div>
                <div class="request-meta">${escapeHTML(request.script_genre || 'General')}</div>
                <div class="request-person">${escapeHTML(otherName || 'Creator')} · ${escapeHTML(roleLine)}</div>
                <div class="request-message">${escapeHTML(request.message || 'No message added.')}</div>
            </div>
            <div class="request-side">
                ${statusPill}
                ${decisionActions}
                ${contactLink}
            </div>
        </div>
    `;
}

function renderRequestList(id, requests, mode) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!Array.isArray(requests) || requests.length === 0) {
        el.innerHTML = `
            <div class="collab-empty">
                <div class="collab-reel"><span>🎬</span></div>
                <p>${mode === 'incoming' ? 'No incoming requests yet' : 'No sent requests yet'}</p>
                <em>${mode === 'incoming' ? 'Crew requests for your scripts will appear here.' : 'Requests you send to productions will appear here.'}</em>
            </div>
        `;
        return;
    }

    el.innerHTML = requests.map(request => requestCard(request, mode)).join('');
}

async function updateRequestStatus(requestId, status, button) {
    if (typeof API === 'undefined' || !API.requests) return;

    const authUser = API.auth.getUser();
    if (!authUser || !authUser.id) {
        setProfileGate(true);
        return;
    }

    const card = button?.closest('.request-card');
    const buttons = card ? card.querySelectorAll('button') : [];

    try {
        buttons.forEach(item => item.disabled = true);
        await API.requests.updateStatus(requestId, status);
        showToast(`Request ${status} ✦`);
        loadCollaborationRequests(authUser.id);
        loadNotifications(authUser.id);
    } catch (err) {
        console.error('Request status update failed:', err);
        showToast(err.message || 'Could not update request ✦');
        buttons.forEach(item => item.disabled = false);
    }
}

async function loadCollaborationRequests(userId) {
    if (typeof API === 'undefined' || !API.requests) return;

    try {
        const response = await API.requests.forUser(userId);
        const data = response.data || {};
        renderRequestList('incomingRequests', data.incoming || [], 'incoming');
        renderRequestList('outgoingRequests', data.outgoing || [], 'outgoing');
    } catch (err) {
        console.error('Request load failed:', err);
    }
}

function formatNotificationTime(value) {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function notificationCard(notification) {
    const unread = Number(notification.is_read) === 0;
    const openAction = notification.link_url
        ? `<a class="notification-read" href="${escapeHTML(notification.link_url)}">Open</a>`
        : '';
    const readAction = unread
        ? `<button class="notification-read" type="button"
                   onclick="markNotificationRead(${Number(notification.id)}, this)">Mark Read</button>`
        : `<button class="notification-read" type="button" disabled>Read</button>`;

    return `
        <div class="notification-card ${unread ? 'unread' : ''}">
            <div>
                <div class="notification-title">${escapeHTML(notification.title || 'Notification')}</div>
                <div class="notification-body">${escapeHTML(notification.body || '')}</div>
                <div class="notification-time">${escapeHTML(formatNotificationTime(notification.created_at))}</div>
            </div>
            <div class="notification-side">
                ${openAction}
                ${readAction}
            </div>
        </div>
    `;
}

function renderNotifications(notifications, unreadCount) {
    const list = document.getElementById('notificationList');
    const count = document.getElementById('notificationCount');
    if (count) count.textContent = unreadCount || 0;
    if (!list) return;

    const items = Array.isArray(notifications) ? notifications : [];

    if (items.length === 0) {
        list.innerHTML = `
            <div class="collab-empty">
                <div class="collab-reel"><span>•</span></div>
                <p>No notifications yet</p>
                <em>Collaboration updates will appear here.</em>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(notificationCard).join('');
}

async function loadNotifications(userId) {
    if (typeof API === 'undefined' || !API.notifications) return;

    try {
        const response = await API.notifications.forUser(userId);
        renderNotifications(response.data || [], response.unread_count || 0);
    } catch (err) {
        console.error('Notification load failed:', err);
    }
}

async function markNotificationRead(notificationId, button) {
    const authUser = API.auth.getUser();
    if (!authUser || !authUser.id) return;

    try {
        if (button) button.disabled = true;
        await API.notifications.markRead(notificationId);
        loadNotifications(authUser.id);
    } catch (err) {
        console.error('Notification read failed:', err);
        showToast(err.message || 'Could not update notification ✦');
        if (button) button.disabled = false;
    }
}

async function markAllNotificationsRead() {
    const authUser = API.auth.getUser();
    if (!authUser || !authUser.id) {
        setProfileGate(true);
        return;
    }

    try {
        await API.notifications.markAllRead(authUser.id);
        loadNotifications(authUser.id);
        showToast('Notifications cleared ✦');
    } catch (err) {
        console.error('Notification clear failed:', err);
        showToast(err.message || 'Could not clear notifications ✦');
    }
}

/* Moved to helpers.js */

/* ── SAVE PROFILE ── */
async function saveProfile() {
    if (typeof API === 'undefined' || !API.auth || !API.users) return;

    const authUser = API.auth.getUser();
    if (!authUser || !authUser.id) {
        setProfileGate(true);
        return;
    }

    const saveButton = document.querySelector('.save-btn') || document.getElementById('saveProfileBtn');
    const originalText = saveButton ? saveButton.textContent : '';
    
    let college = '';
    let city = '';
    
    if (document.getElementById('editCollege')) {
        college = document.getElementById('editCollege').value.trim();
        city = document.getElementById('editCity')?.value.trim() || '';
    } else {
        const split = splitCollegeCity(document.getElementById('editCollegeCity')?.value);
        college = split.college;
        city = split.city;
    }

    const payload = {
        name: document.getElementById('editName')?.value.trim() || '',
        role: document.getElementById('editRole')?.value.trim() || '',
        college,
        city,
        portfolio: document.getElementById('editPortfolio')?.value.trim() || '',
        bio: document.getElementById('editBio')?.value.trim() || '',
        skills: document.getElementById('editSkills')?.value.trim() || ''
    };

    if (!payload.name) {
        showToast('Name is required ✦');
        return;
    }

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        const response = await API.users.updateProfile(authUser.id, payload);
        if (response.success && response.data) {
            populateProfile(response.data);
            API.auth.saveToken(API.auth.getToken(), {
                id: response.data.id,
                name: response.data.name,
                role: response.data.role || '',
                college: response.data.college || '',
                city: response.data.city || ''
            });
            showToast('Profile saved permanently ✦');
        }
    } catch (err) {
        console.error('Profile save failed:', err);
        showToast(err.message || 'Could not save profile ✦');
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = originalText || 'Save Changes →';
        }
    }
}

/* ── TOAST NOTIFICATION ── */
/* Moved to ui.js */

loadProfile().then(activateHashTab);
window.addEventListener('hashchange', activateHashTab);
