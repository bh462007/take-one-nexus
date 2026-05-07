/**
 * Utility to generate avatar URLs based on gender and name.
 * Uses DiceBear API (avataaars style) with robust fallbacks.
 */

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export function getAvatarUrl(name: string, gender?: string | null, customAvatar?: string | null): string {
  // 1. Priority: Custom uploaded avatar
  if (customAvatar && customAvatar.trim() !== '') {
    return customAvatar;
  }

  const safeName = (name || 'User').trim();
  const normalizedGender = (gender || 'Other').toLowerCase();
  const seed = encodeURIComponent(safeName);

  // 2. DiceBear Avataaars options based on gender selection
  let genderOptions = '';
  
  if (normalizedGender === 'male') {
    // Masculine traits
    genderOptions = '&top[]=shortHair&top[]=shaggy&top[]=shortWaved&top[]=sides&facialHairProbability=15&facialHair[]=beardLight';
  } else if (normalizedGender === 'female') {
    // Feminine traits
    genderOptions = '&top[]=longHair&top[]=bob&top[]=curly&top[]=bun&facialHairProbability=0';
  } else {
    // Neutral/Eclectic traits
    genderOptions = '&top[]=shortHair&top[]=hat&top[]=curly&top[]=eyepatch&facialHairProbability=5';
  }

  // Cinematic color palette for backgrounds
  const colors = '0E1218,1C2330,FF4D1A,FFA620,00D4FF';

  // Return high-quality SVG from DiceBear
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}${genderOptions}&backgroundColor=${colors}&mood[]=happy&backgroundType=gradientLinear`;
}

/**
 * Helper for client-side image fallback
 * If DiceBear fails (rare), we fall back to a clean Initials avatar
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string, gender?: string | null) => {
  const target = e.target as HTMLImageElement;
  if (target.dataset.triedFallback === 'true') return; // Prevent infinite loop
  
  target.dataset.triedFallback = 'true';
  const safeName = encodeURIComponent(name || 'User');
  
  // Secondary fallback: UI Avatars (initials)
  target.src = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=128&bold=true`;
};
