/**
 * Utility to generate avatar URLs based on gender and name.
 * Uses DiceBear API (avataaars style).
 */

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export function getAvatarUrl(name: string, gender?: string | null, customAvatar?: string | null): string {
  // If user has uploaded a custom profile picture, use it
  if (customAvatar && customAvatar.trim() !== '') {
    return customAvatar;
  }

  const normalizedGender = (gender || 'Other').toLowerCase();
  const seed = encodeURIComponent(name || 'User');

  // DiceBear Avataaars options based on gender
  let options = '';
  
  if (normalizedGender === 'male') {
    options = '&top[]=shortHair&top[]=shaggy&top[]=shortWaved&facialHairProbability=10';
  } else if (normalizedGender === 'female') {
    options = '&top[]=longHair&top[]=bob&top[]=curly&facialHairProbability=0';
  } else {
    // Neutral options
    options = '&top[]=shortHair&top[]=hat&top[]=curly&facialHairProbability=0';
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}${options}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood[]=happy`;
}

/**
 * Helper for client-side image fallback
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string, gender?: string | null) => {
  const target = e.target as HTMLImageElement;
  target.onerror = null; // Prevent infinite loop
  target.src = getAvatarUrl(name, gender);
};
