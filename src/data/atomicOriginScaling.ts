import type { AtomicOrigin, StatKey } from '../types/game'

// Each origin (alteration type) grants a bonus to the stat(s) listed here, on
// top of the weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type scaling. 'New' has no bonus.
export const ATOMIC_ORIGIN_STATS: Record<AtomicOrigin, { label: string; stats: StatKey[] }> = {
  New:         { label: 'New',        stats: ['TEXT'] },
  Compression: { label: 'Compression', stats: ['VELOCITY'] },
  Expansion:   { label: 'Expansion',  stats: ['DEPTH', 'TEXT'] },
  ZoomIn:      { label: 'Zoom In',    stats: ['DEPTH'] },
  ZoomOut:     { label: 'Zoom Out',   stats: ['DEPTH', 'INSIGHT'] },
  Similar:     { label: 'Similar',    stats: ['VELOCITY'] },
  Opposite:    { label: 'Opposite',   stats: ['FRICTION', 'INSIGHT'] },
}
