import type { StatusType, StatKey } from '../types/game'

// Each emotion (status type) grants a bonus to the stat(s) listed here, on
// top of the weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type/origin/style scaling.
export const STATUS_TYPE_STATS: Record<StatusType, { label: string; stats: StatKey[] }> = {
  bleed:        { label: 'Bleed',        stats: ['DEX'] },
  scarlet_rot:  { label: 'Scarlet Rot',  stats: ['ARC'] },
  frostbite:    { label: 'Frostbite',    stats: ['STR'] },
  madness:      { label: 'Madness',      stats: ['ARC', 'INT'] },
  sleep:        { label: 'Sleep',        stats: ['INT'] },
  death_blight: { label: 'Death Blight', stats: ['FAI'] },
  glintstone:   { label: 'Glintstone',   stats: ['INT'] },
  frenzy_flame: { label: 'Frenzy Flame', stats: ['FAI', 'ARC'] },
  devotion:     { label: 'Devotion',     stats: ['FAI'] },
  yearning:     { label: 'Yearning',     stats: ['FAI'] },
  dread:        { label: 'Dread',        stats: ['ARC'] },
  murmur:       { label: 'Murmur',       stats: ['ARC'] },
  grace:        { label: 'Grace',        stats: ['FAI'] },
}
