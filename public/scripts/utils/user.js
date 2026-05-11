/**
 * USER UTILITIES
 * Helpers for display name logic, role formatting, and profile URLs.
 */

const UserUtils = {
    /**
     * Get the formatted display name based on user preferences.
     * @param {Object} user - The user object containing name, screen_name, and display_preference.
     * @returns {string} - The formatted name.
     */
    getDisplayName(user) {
        if (!user) return 'Guest';
        
        const name = user.name || 'Anonymous Creator';
        const screen_name = user.screen_name || '';
        const preference = user.display_preference || 'Real Name Only';
        
        if (preference === 'Screen Name Only' && screen_name) {
            return screen_name;
        }
        
        if (preference === 'Both' && screen_name) {
            return `${name} • ${screen_name}`;
        }
        
        return name;
    },

    /**
     * Get the icon for a specific role.
     * @param {string} role - The role name.
     * @returns {string} - The emoji icon.
     */
    getRoleIcon(role) {
        if (typeof ROLE_ICONS !== 'undefined') {
            return ROLE_ICONS[role] || '◎';
        }
        return '◎';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserUtils;
} else if (typeof window !== 'undefined') {
    window.UserUtils = UserUtils;
}
