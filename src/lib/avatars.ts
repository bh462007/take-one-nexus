/**
 * EMERGENCY FALLBACK AVATAR SYSTEM
 * Disables external API dependencies (DiceBear, UI-Avatars) for maximum stability.
 */

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export function getAvatarUrl(name: string, gender?: string | null, customAvatar?: string | null): string {
  // Use custom avatar if provided, otherwise a local placeholder
  if (customAvatar && customAvatar.trim() !== '') {
    return customAvatar;
  }

  // RETURN STATIC LOCAL PLACEHOLDER TO AVOID EXTERNAL NETWORK CALLS DURING SSR
  // This is a base64 encoded simple profile SVG
  return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkY0RDFBIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDIxdi0yYTRhIDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIj48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=`;
}

/**
 * Helper for client-side image fallback
 */
export const handleImageError = (e: any) => {
  const target = e.target;
  target.onerror = null;
  target.src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkY0RDFBIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDIxdi0yYTRhIDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIj48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=`;
};
