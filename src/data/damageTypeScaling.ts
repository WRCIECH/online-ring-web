import type { DamageType, StatKey } from '../types/game'

// Each style (damage type) grants a bonus to the stat(s) listed here, on top
// of the weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type/origin scaling.
export const DAMAGE_TYPE_STATS: Record<DamageType, { label: string; stats: StatKey[] }> = {
  standard:  { label: 'Standard',  stats: ['DEX'] },
  strike:    { label: 'Strike',    stats: ['STR'] },
  slash:     { label: 'Slash',     stats: ['DEX'] },
  pierce:    { label: 'Pierce',    stats: ['DEX', 'STR'] },
  lightning: { label: 'Lightning', stats: ['ARC'] },
  fire:      { label: 'Fire',      stats: ['FAI'] },
  magic:     { label: 'Magic',     stats: ['INT'] },
  holy:      { label: 'Holy',      stats: ['FAI'] },
  occult:    { label: 'Occult',    stats: ['ARC'] },
  grafting:  { label: 'Grafting',  stats: ['STR', 'INT'] },
  poison:    { label: 'Poison',    stats: ['ARC'] },
}
