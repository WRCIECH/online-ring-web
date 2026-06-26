import type { EmotionType, StatKey } from '../types/game'

// Each emotion (status type) grants a bonus to the stat(s) listed here, on
// top of the weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type/origin/style scaling.
export const STATUS_TYPE_STATS: Record<EmotionType, { label: string; stats: StatKey[] }> = {
  Viral:        { label: 'Viral',        stats: ['DEX'] },
  Polarization:  { label: 'Polarization',  stats: ['ARC'] },
  Envy:    { label: 'Envy',    stats: ['STR'] },
  Controversion:      { label: 'Controversion',      stats: ['ARC', 'INT'] },
  Comfort:        { label: 'Comfort',        stats: ['INT'] },
  Drama: { label: 'Drama',        stats: ['FAI'] },
  Wow:   { label: 'Wow',   stats: ['INT'] },
  Humor: { label: 'Humor',        stats: ['FAI', 'ARC'] },
  Parasocial:     { label: 'Parasocial',     stats: ['FAI'] },
  Fomo:     { label: 'Fomo',     stats: ['FAI'] },
  Fear:        { label: 'Fear',        stats: ['ARC'] },
  Rumor:       { label: 'Rumor',       stats: ['ARC'] },
  Hope:        { label: 'Hope',        stats: ['FAI'] },
}
