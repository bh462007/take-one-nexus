USE take_one;

INSERT INTO users (
  name,
  email,
  password,
  role,
  college,
  city,
  bio,
  skills,
  portfolio
) VALUES
(
  'Arjun Mehta',
  'arjun@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Director',
  'FTII Pune',
  'Pune',
  'Director who loves tense chamber drama and campus productions.',
  'Direction, Screenplay, Casting',
  'https://portfolio.example/arjun'
),
(
  'Kavya Rao',
  'kavya@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Cinematographer',
  'Whistling Woods',
  'Mumbai',
  'DP focused on moody night exteriors and handheld realism.',
  'DP, Camera, Lighting',
  'https://portfolio.example/kavya'
),
(
  'Rehan Ali',
  'rehan@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Writer',
  'SRFTI Kolkata',
  'Kolkata',
  'Writer building intimate stories with sharp dialogue.',
  'Writing, Dialogue, Story',
  'https://portfolio.example/rehan'
),
(
  'Mira Thomas',
  'mira@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Editor',
  'Christ University',
  'Bengaluru',
  'Editor who enjoys character-driven cuts and trailer edits.',
  'Editing, Trailer Cut, Sound Sync',
  'https://portfolio.example/mira'
),
(
  'Zoya Khan',
  'zoya@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Actor',
  'Delhi University',
  'Delhi',
  'Actor open to short films, auditions, and student productions.',
  'Acting, Voice, Movement',
  'https://portfolio.example/zoya'
),
(
  'Rishi Nair',
  'rishi@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Sound Designer',
  'Loyola College',
  'Chennai',
  'Sound designer working across ambience, foley, and dialogue cleanup.',
  'Sound Design, Foley, Mixing',
  'https://portfolio.example/rishi'
),
(
  'Dev Malhotra',
  'dev@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Gaffer',
  'St. Xavier''s College',
  'Mumbai',
  'Lighting-first crew member for student films and sets.',
  'Lighting, Grip, Electrical',
  'https://portfolio.example/dev'
),
(
  'Naman Yadav',
  'naman@takeone.test',
  '$2a$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcd',
  'Spot Boy',
  'Delhi University',
  'Delhi',
  'Reliable set support for student productions and shoots.',
  'Set Support, Logistics, Unit Help',
  'https://portfolio.example/naman'
);

INSERT INTO scripts (
  user_id,
  title,
  genre,
  synopsis,
  roles_needed,
  status
) VALUES
(
  1,
  'The Last Seance',
  'Horror',
  'A student medium streams a final ritual that goes very wrong.',
  'Director, Sound Designer, Actor',
  'Dir. Needed · 3 Roles Open'
),
(
  3,
  'Letters to Nowhere',
  'Romance',
  'Two campus strangers leave notes in a dead letter box and never meet on time.',
  'Director, DP',
  'Team Forming'
),
(
  1,
  'Dead Sprint',
  'Action',
  'A runner carrying stolen exam footage is chased across an empty city campus.',
  'Actor, Editor, Sound',
  'Full Crew · Casting Open'
),
(
  3,
  'The Wedding Crasher''s Diet',
  'Comedy',
  'A broke filmmaker crashes weddings for free food and finds a real story.',
  'DP, Actor',
  'DP Needed'
),
(
  3,
  'Hollow Ground',
  'Thriller',
  'A missing reel of footage pulls a team back to an abandoned studio floor.',
  'Editor, Sound Designer',
  'Complete Team'
),
(
  1,
  'Monsoon Season',
  'Romance',
  'Two ex-collaborators reunite to finish a film during the rains.',
  'Editor, Sound Designer',
  'Editor + Sound Needed'
),
(
  3,
  'Fractured Signal',
  'Horror',
  'A campus pirate radio station starts broadcasting tomorrow''s emergencies.',
  'All Crew Roles',
  'All Roles Open'
);
