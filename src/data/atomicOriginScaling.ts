import type { AtomicOrigin, StatKey } from '../types/game'

// Each origin (alteration type) grants a bonus to the stat(s) listed here, on
// top of the weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type scaling. 'New' has no bonus.
export const ATOMIC_ORIGIN_STATS: Record<AtomicOrigin, { label: string; stats: StatKey[] }> = {
  New:           { label: 'New',            stats: [] },
  Compression:   { label: 'Compression',    stats: ['DEX'] },
  Expansion:     { label: 'Expansion',      stats: ['STR', 'INT'] },
  Recycled:      { label: 'Recycled',       stats: ['DEX'] },
  Remastered:    { label: 'Remastered',     stats: ['FAI'] },
  Revamped:      { label: 'Revamped',       stats: ['FAI'] },
  Reboot:        { label: 'Reboot',         stats: ['FAI'] },
  ZoomIn:        { label: 'Zoom In',        stats: ['INT'] },
  ZoomOut:       { label: 'Zoom Out',       stats: ['INT'] },
  AudienceAlter: { label: 'Audience Shift', stats: ['FAI'] },
  Commentary:    { label: 'Commentary',     stats: ['ARC'] },
}
