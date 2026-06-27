import type { EmotionType, StatKey } from '../types/game'

// Each emotion (status type) grants a bonus to the stat(s) listed here, on
// top of the weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type/origin/style scaling.
export const STATUS_TYPE_STATS: Record<EmotionType, { label: string; stats: StatKey[] }> = {
  Viral:         { label: 'Viral',         stats: ['VELOCITY'] },
  Polarization:  { label: 'Polarization',  stats: ['FRICTION'] },
  Envy:          { label: 'Envy',          stats: ['PARASOCIAL'] },
  Controversion: { label: 'Controversion', stats: ['FRICTION', 'DEPTH'] },
  Comfort:       { label: 'Comfort',       stats: ['PARASOCIAL'] },
  Drama:         { label: 'Drama',         stats: ['FRICTION', 'AUDIO'] },
  Wow:           { label: 'Wow',           stats: ['VIDEO', 'GRAPHIC'] },
  Humor:         { label: 'Humor',         stats: ['PARASOCIAL', 'VELOCITY'] },
  Parasocial:    { label: 'Parasocial',    stats: ['PARASOCIAL'] },
  Fomo:          { label: 'Fomo',          stats: ['VELOCITY', 'FRICTION'] },
  Fear:          { label: 'Fear',          stats: ['FRICTION'] },
  Rumor:         { label: 'Rumor',         stats: ['FRICTION'] },
  Hope:          { label: 'Hope',          stats: ['PARASOCIAL'] },
}
