/**
 * Formats a given name by capitalizing the first letter of each word
 * and lowercasing the remaining letters.
 */
function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return name || '';
  return name
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

module.exports = {
  formatDisplayName
};
