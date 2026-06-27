import type { ContentProductType } from './contentProducts'
import type { StatKey } from '../types/game'

// Each content type grants a bonus to the stat(s) listed here, on top of the
// weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS (constants.ts).
export const CONTENT_TYPE_STATS: Record<ContentProductType, { label: string; stats: StatKey[] }> = {
  Plaintext:          { label: 'Plaintext',           stats: ['TEXT'] },
  StructuredText:     { label: 'Structured Text',     stats: ['TEXT', 'DEPTH'] },
  IllustratedText:    { label: 'Illustrated Text',    stats: ['TEXT', 'GRAPHIC'] },
  SingleGraphic:      { label: 'Single Graphic',      stats: ['GRAPHIC'] },
  Carousel:           { label: 'Carousel',            stats: ['GRAPHIC', 'VELOCITY'] },
  Infographic:        { label: 'Infographic',         stats: ['GRAPHIC', 'DEPTH'] },
  RawAudio:           { label: 'Raw Audio',           stats: ['AUDIO'] },
  ProducedAudio:      { label: 'Produced Audio',      stats: ['AUDIO', 'DEPTH'] },
  ARollVideo:         { label: 'A-Roll Video',        stats: ['VIDEO'] },
  SlideshowVideo:     { label: 'Slideshow Video',     stats: ['VIDEO', 'VELOCITY'] },
  Screencast:         { label: 'Screencast',          stats: ['VIDEO', 'DEPTH'] },
  CinematicVideo:     { label: 'Cinematic Video',     stats: ['VIDEO'] },
  MotionGraphics:     { label: 'Motion Graphics',     stats: ['VIDEO', 'GRAPHIC'] },
  LiveStream:         { label: 'Livestream',          stats: ['PARASOCIAL', 'AUDIO'] },
  MultimediaPage:     { label: 'Multimedia Page',     stats: ['PARASOCIAL', 'TEXT'] },
  BranchingNarrative: { label: 'Branching Narrative', stats: ['PARASOCIAL', 'INSIGHT'] },
  AssetPack:          { label: 'Asset Pack',          stats: ['GRAPHIC', 'DEPTH'] },
  CurationFeed:       { label: 'Curation Feed',       stats: ['TEXT', 'INSIGHT'] },
  CommunitySpace:     { label: 'Community Space',     stats: ['PARASOCIAL'] },
  InteractiveApp:     { label: 'Interactive App',     stats: ['INSIGHT', 'PARASOCIAL'] },
  _blank:             { label: 'Experiment',          stats: ['INSIGHT'] },
}
