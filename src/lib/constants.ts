export const USER_ROLES = [
  'Director',
  'Cinematographer / DP',
  'Writer',
  'Editor',
  'Sound Designer',
  'Designer',
  'Actor',
  'Producer',
  'Other'
] as const;

export type UserRole = (typeof USER_ROLES)[number];
