export const USER_ROLES = [
  "Director",
  "Cinematographer / DP",
  "Writer",
  "Editor",
  "Sound Designer",
  "Designer",
  "Developer",
  "Actor",
  "Producer",
  "Lighting Crew",
  "Set Support",
  "Other"
] as const;

export type UserRole = (typeof USER_ROLES)[number];
