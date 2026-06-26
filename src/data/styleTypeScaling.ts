import type { StyleType, StatKey } from '../types/game'

// Each style type grants a bonus to the stat(s) listed here, on top of the
// weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type/origin scaling.
export const STYLE_TYPE_STATS: Record<StyleType, { label: string; stats: StatKey[] }> = {
  Minimalism:    { label: 'Minimalism',    stats: ['DEX'] },
  Shock:         { label: 'Shock',         stats: ['STR'] },
  Narration:     { label: 'Narration',     stats: ['DEX'] },
  Segmentation:  { label: 'Segmentation',  stats: ['DEX', 'STR'] },
  Fast:          { label: 'Fast',          stats: ['ARC'] },
  Passion:       { label: 'Passion',       stats: ['FAI'] },
  Intellectual:  { label: 'Intellectual',  stats: ['INT'] },
  ProblemSolving:{ label: 'ProblemSolving',stats: ['FAI'] },
  Estetic:       { label: 'Estetic',       stats: ['ARC'] },
  Interactive:   { label: 'Interactive',   stats: ['STR', 'INT'] },
  Cliffhanger:   { label: 'Cliffhanger',   stats: ['ARC'] },
}
