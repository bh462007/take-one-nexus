/**
 * TAKE ONE NEXUS
 * Leaderboard & FAQ Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initLeaderboard();
    initFAQ();
});

async function initLeaderboard() {
    const tableBody = document.getElementById('leaderboardBody');
    if (!tableBody) return;

    try {
        const response = await fetch('/api/users/leaderboard');
        const json = await response.json();

        if (!json.success || !json.data) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ff4444;">Failed to sync with Nexus signal.</td></tr>`;
            return;
        }

        const users = json.data;
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">No creators have earned credits yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = users.map((user, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `top-rank-${rank}` : '';
            const displayName = user.displayName || 'Anonymous Creator';
            const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            // Reuse avatar logic if available, else initials
            const avatarHtml = user.avatar_url 
                ? `<img src="${user.avatar_url}" alt="" class="user-avatar">`
                : `<div class="user-avatar">${initials}</div>`;

            const credits = user.credits || 0;

            return `
                <tr class="leaderboard-row ${rankClass}">
                    <td class="rank-cell">#${rank}</td>
                    <td>
                        <div class="user-cell">
                            ${avatarHtml}
                            <div class="user-info">
                                <span class="user-name">${displayName}</span>
                                <span class="user-role">${user.college || 'Nexus Creator'}</span>
                            </div>
                        </div>
                    </td>
                    <td>${user.role || 'Crew'}</td>
                    <td class="credits-cell">${credits.toLocaleString()} pts</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Leaderboard Init Error:', error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ff4444;">Signal Interrupted. Please check your connection.</td></tr>`;
    }
}

function initFAQ() {
    const faqCards = document.querySelectorAll('.faq-card');
    
    faqCards.forEach(card => {
        const question = card.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close others
            faqCards.forEach(other => {
                if (other !== card) other.classList.remove('active');
            });
            // Toggle current
            card.classList.toggle('active');
        });
    });
}
