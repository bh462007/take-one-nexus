/**
 * COMMON ANIMATIONS
 * Cursor, scroll reveal, and scroll progress tracking.
 */

/* ── CUSTOM CURSOR ── */
const dot = document.getElementById('dot');
const cross = document.getElementById('cross');
let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
});

(function animateCursor() {
    if (dot) {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
    }
    if (cross) {
        cx += (mx - cx) * 0.1;
        cy += (my - cy) * 0.1;
        cross.style.left = cx + 'px';
        cross.style.top = cy + 'px';
    }
    requestAnimationFrame(animateCursor);
})();

/* Scale crosshair on hover over interactive elements (Event Delegation) */
function initCursorInteractions() {
    document.addEventListener('mouseover', (e) => {
        if (!(e.target instanceof Element)) return;
        const interactive = e.target.closest('a, button, .role-card, .movie-card, .ctab, .project-card');
        if (interactive && cross) {
            cross.style.transform = 'translate(-50%, -50%) scale(1.6)';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (!(e.target instanceof Element)) return;
        const interactive = e.target.closest('a, button, .role-card, .movie-card, .ctab, .project-card');
        if (interactive && cross) {
            cross.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    });
}

/* ── SCROLL REVEAL ── */
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
    });
}, { threshold: 0.1 }) : null;

function initScrollReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
        if (revealObserver) {
            revealObserver.observe(el);
        } else {
            el.classList.add('visible');
        }
    });
}

/* ── SCROLL PROGRESS ── */
function updateScrollProgress() {
    const progress = document.getElementById('scrollProgress');
    if (!progress) return;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${percent}%`;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initCursorInteractions();
    initScrollReveal();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
});
