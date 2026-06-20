import type { ContentProductType } from './contentProducts'
import type { StatKey } from '../types/game'

// Each content type grants a bonus to the stat(s) listed here, on top of the
// weapon's own scaling. Magnitude lives in CONTENT_TYPE_STAT_BONUS (constants.ts).
export const CONTENT_TYPE_STATS: Record<ContentProductType, { label: string; stats: StatKey[] }> = {
  Plaintext:          { label: 'Plaintext',           stats: ['DEX'] },
  StructuredText:     { label: 'Structured Text',     stats: ['STR'] },
  IllustratedText:    { label: 'Illustrated Text',    stats: ['STR'] },
  SingleGraphic:      { label: 'Single Graphic',      stats: ['DEX'] },
  Carousel:           { label: 'Carousel',            stats: ['STR'] },
  Infographic:        { label: 'Infographic',         stats: ['INT'] },
  RawAudio:           { label: 'Raw Audio',           stats: ['DEX'] },
  ProducedAudio:      { label: 'Produced Audio',      stats: ['STR'] },
  ARollVideo:         { label: 'A-Roll Video',        stats: ['ARC', 'DEX'] },
  SlideshowVideo:     { label: 'Slideshow Video',     stats: ['INT'] },
  Screencast:         { label: 'Screencast',          stats: ['FAI'] },
  CinematicVideo:     { label: 'Cinematic Video',     stats: ['STR'] },
  MotionGraphics:     { label: 'Motion Graphics',     stats: ['ARC'] },
  LiveStream:         { label: 'Livestream',          stats: ['ARC'] },
  MultimediaPage:     { label: 'Multimedia Page',     stats: ['FAI'] },
  BranchingNarrative: { label: 'Branching Narrative', stats: ['FAI'] },
  AssetPack:          { label: 'Asset Pack',          stats: ['FAI'] },
  CurationFeed:       { label: 'Curation Feed',       stats: ['FAI'] },
  CommunitySpace:     { label: 'Community Space',     stats: ['ARC'] },
  InteractiveApp:     { label: 'Interactive App',     stats: ['INT'] },
  _blank:             { label: 'Experiment',          stats: ['INT'] },
}
