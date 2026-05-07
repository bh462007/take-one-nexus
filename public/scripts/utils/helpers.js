/**
 * HELPER UTILITIES
 * Pure functions and data manipulators used across the application.
 */

function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatCompactNumber(value) {
    return new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(Number(value) || 0);
}

function splitSkills(skills) {
    return String(skills || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
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

function splitCollegeCity(value) {
    const cleaned = String(value || '').trim();
    if (!cleaned) return { college: '', city: '' };

    const separator = cleaned.includes('·') ? '·' : ',';
    const parts = cleaned
        .split(separator)
        .map(part => part.trim())
        .filter(Boolean);

    return {
        college: parts[0] || '',
        city: parts.slice(1).join(` ${separator} `) || ''
    };
}

function isAdmin(user) {
    if (!user) return false;
    const ADMIN_EMAILS = [
        'aarushgupta289@gmail.com',
        'alok.r25012@csds.rishihood.edu.in'
    ];
    return ADMIN_EMAILS.includes(user.email) || normalizeRole(user.role) === 'admin';
}

function getAvatarUrl(name, gender, customAvatar) {
    if (customAvatar && customAvatar.trim() !== '') {
        return customAvatar;
    }

    const normalizedGender = (gender || 'Other').toLowerCase();
    const seed = encodeURIComponent(name || 'User');

    let options = '';
    if (normalizedGender === 'male') {
        options = '&top[]=shortHair&top[]=shaggy&top[]=shortWaved&facialHairProbability=10';
    } else if (normalizedGender === 'female') {
        options = '&top[]=longHair&top[]=bob&top[]=curly&facialHairProbability=0';
    } else {
        options = '&top[]=shortHair&top[]=hat&top[]=curly&facialHairProbability=0';
    }

    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}${options}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood[]=happy`;
}

function handleImageError(img, name, gender) {
    img.onerror = null;
    img.src = getAvatarUrl(name, gender);
}
