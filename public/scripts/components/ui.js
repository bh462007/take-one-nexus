/**
 * UI COMPONENTS & STATUS HELPERS
 * Toast notifications, status bar clock, and UI updates.
 */

/* ── TOAST NOTIFICATION ── */
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── LIVE CLOCK (STATUS BAR) ── */
function updateStatusBarTime() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    const t = new Date();
    el.textContent = t.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateStatusBarTime, 1000);
    updateStatusBarTime();
});
