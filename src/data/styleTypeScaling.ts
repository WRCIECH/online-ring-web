import type { StyleType, StatKey } from '../types/game'

// Each style type grants a bonus to the stat(s) listed here, on top of the
// weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS
// (constants.ts) — shared with content-type/origin scaling.
export const STYLE_TYPE_STATS: Record<StyleType, { label: string; stats: StatKey[] }> = {
  Minimalism:    { label: 'Minimalism',    stats: ['GRAPHIC'] },
  Shock:         { label: 'Shock',         stats: ['FRICTION'] },
  Narration:     { label: 'Narration',     stats: ['PARASOCIAL'] },
  Segmentation:  { label: 'Segmentation',  stats: ['TEXT', 'GRAPHIC'] },
  Fast:          { label: 'Fast',          stats: ['VELOCITY'] },
  Passion:       { label: 'Passion',       stats: ['PARASOCIAL'] },
  Intellectual:  { label: 'Intellectual',  stats: ['DEPTH'] },
  ProblemSolving:{ label: 'ProblemSolving',stats: ['DEPTH'] },
  Estetic:       { label: 'Estetic',       stats: ['VIDEO', 'GRAPHIC'] },
  Interactive:   { label: 'Interactive',   stats: ['PARASOCIAL', 'INSIGHT'] },
  Cliffhanger:   { label: 'Cliffhanger',   stats: ['VELOCITY', 'FRICTION'] },
}
