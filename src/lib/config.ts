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

export const SYSTEM_COLORS: Record<string, string> = {
  'D&D 5e': 'from-red-600 to-orange-500',
  'D&D 5.5e (2024)': 'from-red-500 to-amber-500',
  'Pathfinder 2e': 'from-blue-600 to-cyan-500',
  'Call of Cthulhu': 'from-green-600 to-emerald-500',
  'Shadowrun 6e': 'from-cyan-600 to-pink-500',
  'Vampire: The Masquerade': 'from-rose-600 to-purple-500',
  'FATE Core': 'from-indigo-600 to-blue-500',
  'Savage Worlds': 'from-amber-600 to-yellow-500',
};
