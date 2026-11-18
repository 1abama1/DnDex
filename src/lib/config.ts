export const SYSTEMS = [
  'D&D 5e',
  'D&D 5.5e (2024)',
  'Pathfinder 2e',
  'Call of Cthulhu',
  'Shadowrun 6e',
  'Vampire: The Masquerade',
  'FATE Core',
  'Savage Worlds',
  'Other',
] as const;

export type GameSystem = (typeof SYSTEMS)[number];
