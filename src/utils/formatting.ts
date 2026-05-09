/**
 * Formats a given name by capitalizing the first letter of each word
 * and lowercasing the remaining letters.
 * Example: 'aArUsH gUpTa' -> 'Aarush Gupta'
 */
export function formatDisplayName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
