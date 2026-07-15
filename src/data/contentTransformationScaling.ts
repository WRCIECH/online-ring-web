import type { ContentTransformation, StatKey } from '../types/game'

// Each content transformation annotating a campaign edge grants a bonus to the
// stat(s) listed here when a tile carries that transformation. Magnitude lives
// in CONTENT_TYPE_STAT_BONUS (constants.ts) — shared with content-type scaling.
export const CONTENT_TRANSFORMATION_STATS: Record<ContentTransformation, { label: string; stats: StatKey[] }> = {
  // ── Relation types (formerly AtomicOrigin) ────────────────────────────────
  New:            { label: 'New',           stats: ['TEXT'] },
  Compression:    { label: 'Compression',   stats: ['VELOCITY'] },
  Expansion:      { label: 'Expansion',     stats: ['DEPTH', 'TEXT'] },
  ZoomIn:         { label: 'Zoom In',       stats: ['DEPTH'] },
  ZoomOut:        { label: 'Zoom Out',      stats: ['DEPTH', 'INSIGHT'] },
  Similar:        { label: 'Similar',       stats: ['VELOCITY'] },
  Opposite:       { label: 'Opposite',      stats: ['FRICTION', 'INSIGHT'] },
  // ── Style types (formerly StyleType) ─────────────────────────────────────
  Minimalism:     { label: 'Minimalism',    stats: ['GRAPHIC'] },
  Shock:          { label: 'Shock',         stats: ['FRICTION'] },
  Narration:      { label: 'Narration',     stats: ['PARASOCIAL'] },
  Segmentation:   { label: 'Segmentation',  stats: ['TEXT', 'GRAPHIC'] },
  Fast:           { label: 'Fast',          stats: ['VELOCITY'] },
  Passion:        { label: 'Passion',       stats: ['PARASOCIAL'] },
  Intellectual:   { label: 'Intellectual',  stats: ['DEPTH'] },
  ProblemSolving: { label: 'ProblemSolving', stats: ['DEPTH'] },
  Estetic:        { label: 'Estetic',       stats: ['VIDEO', 'GRAPHIC'] },
  Interactive:    { label: 'Interactive',   stats: ['PARASOCIAL', 'INSIGHT'] },
  Cliffhanger:    { label: 'Cliffhanger',   stats: ['VELOCITY', 'FRICTION'] },
  Viral:          { label: 'Viral',         stats: ['VELOCITY', 'FRICTION'] },
  Controversy:    { label: 'Controversy',   stats: ['FRICTION', 'INSIGHT'] },
  Comfort:        { label: 'Comfort',       stats: ['PARASOCIAL'] },
  Drama:          { label: 'Drama',         stats: ['PARASOCIAL', 'FRICTION'] },
  Humor:          { label: 'Humor',         stats: ['VELOCITY', 'PARASOCIAL'] },
  Parasocial:     { label: 'Parasocial',    stats: ['PARASOCIAL', 'DEPTH'] },
  Wow:            { label: 'Wow',           stats: ['GRAPHIC', 'VIDEO'] },
  Hope:           { label: 'Hope',          stats: ['PARASOCIAL', 'DEPTH'] },
  Fear:           { label: 'Fear',          stats: ['FRICTION', 'DEPTH'] },
  Desire:         { label: 'Desire',        stats: ['FRICTION', 'VELOCITY'] },
}
