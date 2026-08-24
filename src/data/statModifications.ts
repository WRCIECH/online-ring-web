import type { ContentProductType, ContentTransformation, StatKey } from '../types/game'

// Reverse mapping: which content types each stat governs (for node modification picker).
export const STAT_CONTENT_TYPES: Partial<Record<StatKey, ContentProductType[]>> = {
  TEXT:       ['Plaintext', 'StructuredText', 'IllustratedText', 'CurationFeed'],
  VIDEO:      ['ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo'],
  AUDIO:      ['RawAudio', 'ProducedAudio', 'LiveStream'],
  GRAPHIC:    ['SingleGraphic', 'Carousel', 'Infographic', 'AssetPack'],
  VELOCITY:   ['Carousel', 'SlideshowVideo'],
  DEPTH:      ['StructuredText', 'ProducedAudio', 'Screencast', 'Infographic', 'AssetPack'],
  PARASOCIAL: ['LiveStream', 'CommunitySpace', 'InteractiveApp'],
  FRICTION:   [],
  INSIGHT:    ['CurationFeed', 'InteractiveApp', '_blank'],
}

// Reverse mapping: which edge transformations each stat governs (for edge modification picker).
export const STAT_TRANSFORMATIONS: Partial<Record<StatKey, ContentTransformation[]>> = {
  TEXT:       ['Expansion', 'Segmentation', 'Synthesis', 'Split'],
  VIDEO:      ['Estetic', 'Wow'],
  AUDIO:      [],
  GRAPHIC:    ['Segmentation', 'Wow', 'DataDriven'],
  VELOCITY:   ['Compression', 'Similar', 'Cliffhanger', 'Viral', 'Humor', 'Desire', 'Follows', 'RemixFusion', 'Split', 'Simplify'],
  DEPTH:      ['Expansion', 'ZoomIn', 'ZoomOut', 'ProblemSolving', 'Parasocial', 'Hope', 'Fear', 'DomainTransfer', 'Evidence', 'Technicalize', 'Socratic', 'Analogy', 'FirstPrinciples'],
  PARASOCIAL: ['Narration', 'Passion', 'Comfort', 'Drama', 'Humor', 'Parasocial', 'Hope', 'AudienceShift', 'Simplify', 'Localize', 'Analogy'],
  FRICTION:   ['Shock', 'Opposite', 'Cliffhanger', 'Viral', 'Drama', 'Fear', 'Desire', 'Controversy', 'Critique', 'Technicalize'],
  INSIGHT:    ['ZoomOut', 'Opposite', 'Controversy', 'AudienceShift', 'DomainTransfer', 'RemixFusion', 'Evidence', 'Socratic', 'Analogy', 'FirstPrinciples', 'DataDriven', 'Localize'],
}

// Stats that govern modification actions (all except VIG and END).
export const MODIFICATION_STATS: StatKey[] = [
  'TEXT', 'VIDEO', 'AUDIO', 'GRAPHIC', 'VELOCITY', 'DEPTH', 'PARASOCIAL', 'FRICTION', 'INSIGHT',
]
