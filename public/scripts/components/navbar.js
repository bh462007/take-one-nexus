/**
 * CENTRALIZED NAVBAR LOGIC
 * Manages consistent navigation across all pages.
 */

const Navbar = {
    config: [
        { label: 'Discover Projects', href: '/#explore' },
        { label: 'Find Crew', href: '/crew', id: 'navCrewLink' },
        { label: 'Share Your Script', href: '/#upload', id: 'navUploadLink' },
        { label: 'Profile', href: '/profile' }
    ],

    render(user) {
        const nav = document.querySelector('header nav');
        if (!nav) return;

        let html = '';
        
        // Use a Set to keep track of labels we've already added to avoid duplication
        const addedLabels = new Set();

        this.config.forEach(item => {
            let label = item.label;
            let href = item.href;

            // Role-based renaming for Upload/Workspace
            if (item.id === 'navUploadLink' && user) {
                const role = user.role ? user.role.toLowerCase() : '';
                const creatorRoles = ['director', 'writer', 'producer'];
                
                if (creatorRoles.includes(role)) {
                    label = user.role; // Use specific role like 'Director'
                } else if (role && role !== 'crew' && role !== 'admin') {
                    label = user.role; // Use specific role like 'Cinematographer'
                    href = '/#explore';
                } else {
                    label = 'Workspace';
                    href = '/#explore';
                }
            }

            // Standardize Crew Link
            if (item.id === 'navCrewLink') {
                label = 'Find Crew';
                href = '/crew';
            }

            // Avoid duplication (e.g. if a role is named 'Crew')
            if (addedLabels.has(label.toUpperCase())) return;
            addedLabels.add(label.toUpperCase());

            html += `<a href="${href}" ${item.id ? `id="${item.id}"` : ''}>${label}</a>`;
        });

        // Add Admin Panel for admins, developers, and moderators
        if (user && user.role) {
            const role = user.role.toLowerCase();
            if (role === 'admin' || role === 'developer' || role === 'moderator') {
                html += `<a href="/admin" style="color: var(--neon); font-weight: bold;">Admin Panel</a>`;
            }
        }

        // Add Login/Logout button
        if (user) {
            html += `
                <button id="loginBtn" class="nav-cta">
                    Logout
                </button>
            `;
        } else {
            html += `
                <button id="loginBtn" class="nav-cta">
                    Join Now
                </button>
            `;
        }

        nav.innerHTML = html;

        const btn = document.getElementById('loginBtn');
        const modal = document.getElementById('loginModal');
        if (!btn) return;

        const openAuthModalSafely = () => {
            try {
                if (!modal) {
                    console.error('Navbar auth modal open failed: #loginModal missing');
                    return;
                }

                if (typeof window.openTakeOneModal === 'function') {
                    window.openTakeOneModal(modal);
                    return;
                }

                if (typeof openModal === 'function') {
                    openModal(modal);
                    return;
                }

                // Fallback so CTA still works even if modal helper script fails.
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            } catch (error) {
                console.error('Navbar auth modal open crashed:', error);
            }
        };

        if (user) {
            btn.addEventListener('click', async () => {
                try {
                    if (typeof API !== 'undefined' && API.auth) {
                        await API.auth.logout();
                    } else {
                        console.error('Logout requested but API.auth is unavailable');
                    }
                } catch (error) {
                    console.error('Navbar logout failed:', error);
                }
            });
            return;
        }

        btn.addEventListener('click', openAuthModalSafely);
    }
};

// Auto-init for all pages
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof API !== 'undefined' && typeof API.auth !== 'undefined') {
        try {
            const user = await API.auth.getUser();
            Navbar.render(user);
        } catch (err) {
            console.error('Navbar auto-init failed:', err);
            Navbar.render(null);
        }
    }

    // ── HAMBURGER TOGGLE ──
    const toggle = document.getElementById('navToggle');
    const headerEl = document.querySelector('header');
    if (toggle && headerEl) {
        toggle.addEventListener('click', () => {
            const isOpen = headerEl.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', isOpen);
        });

        // Close when a nav link is clicked (using event delegation since links are re-rendered dynamically)
        headerEl.addEventListener('click', (e) => {
            if (e.target.closest('nav a')) {
                headerEl.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!headerEl.contains(e.target)) {
                headerEl.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
});
