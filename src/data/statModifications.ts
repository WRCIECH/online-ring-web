import type {
  ContentProductType, ContentTransformation, StatKey,
  ContentShift, ConstraintCategory,
  MicroContentType, MediumContentType, HeavyContentType,
} from '../types/game'

// Reverse mapping: which content types each stat governs (for node modification picker).
// Includes mode-specific types (Interview, Commentary, LinkShare, Website, Course, Book).
export const STAT_CONTENT_TYPES: Partial<Record<StatKey, ContentProductType[]>> = {
  TEXT:       ['Plaintext', 'StructuredText', 'IllustratedText', 'CurationFeed', 'Commentary'],
  VIDEO:      ['ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo'],
  AUDIO:      ['RawAudio', 'ProducedAudio', 'LiveStream'],
  GRAPHIC:    ['SingleGraphic', 'Carousel', 'Infographic', 'AssetPack', 'Website'],
  VELOCITY:   ['Carousel', 'SlideshowVideo', 'LinkShare'],
  DEPTH:      ['StructuredText', 'ProducedAudio', 'Screencast', 'Infographic', 'AssetPack', 'Course', 'Book'],
  PARASOCIAL: ['LiveStream', 'CommunitySpace', 'InteractiveApp', 'Interview'],
  FRICTION:   [],
  INSIGHT:    ['CurationFeed', 'InteractiveApp', '_blank'],
}

// Reverse mapping: which edge transformations each stat governs (for edge modification picker).
export const STAT_TRANSFORMATIONS: Partial<Record<StatKey, ContentTransformation[]>> = {
  TEXT:       ['Verbose', 'Segmentation', 'Synthesis'],
  VIDEO:      ['Estetic', 'Wow'],
  AUDIO:      [],
  GRAPHIC:    ['Segmentation', 'Wow', 'DataDriven'],
  VELOCITY:   ['Succinct', 'Similar', 'Cliffhanger', 'Viral', 'Humor', 'Desire', 'Follows', 'RemixFusion', 'Simplify'],
  DEPTH:      ['Verbose', 'ZoomIn', 'ZoomOut', 'Parasocial', 'Hope', 'Fear', 'Evidence', 'Technicalize', 'Socratic', 'Analogy', 'FirstPrinciples'],
  PARASOCIAL: ['Narration', 'Passion', 'Comfort', 'Drama', 'Humor', 'Parasocial', 'Hope', 'AudienceShift', 'Simplify', 'Analogy'],
  FRICTION:   ['Shock', 'Opposite', 'Cliffhanger', 'Viral', 'Drama', 'Fear', 'Desire', 'Controversy', 'Critique', 'Technicalize'],
  INSIGHT:    ['ZoomOut', 'Opposite', 'Controversy', 'AudienceShift', 'RemixFusion', 'Evidence', 'Socratic', 'Analogy', 'FirstPrinciples', 'DataDriven'],
}

// Stats that govern modification actions (all except VIG and END).
export const MODIFICATION_STATS: StatKey[] = [
  'TEXT', 'VIDEO', 'AUDIO', 'GRAPHIC', 'VELOCITY', 'DEPTH', 'PARASOCIAL', 'FRICTION', 'INSIGHT',
]

// Which constraint categories each stat can unlock for medium-piece constraints.
export const STAT_CONSTRAINTS: Partial<Record<StatKey, ConstraintCategory[]>> = {
  DEPTH:      ['propaganda'],
  PARASOCIAL: ['audience'],
  VELOCITY:   ['style'],
  FRICTION:   ['style'],
  INSIGHT:    ['propaganda', 'audience', 'style'],
}

// Which link types (ContentShift) each stat governs for medium-piece connectors.
export const STAT_LINK_TYPES: Partial<Record<StatKey, ContentShift[]>> = {
  VELOCITY:   ['Follows', 'Similar'],
  DEPTH:      ['ZoomIn', 'ZoomOut'],
  FRICTION:   ['Opposite'],
  INSIGHT:    ['Follows', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite'],
}

// ── Mode-specific filter helpers ────────────────────────────────────────────

const MICRO_TYPE_SET  = new Set<string>(['Plaintext','SingleGraphic','Carousel','ARollVideo','RawAudio','LinkShare'])
const MEDIUM_TYPE_SET = new Set<string>(['Plaintext','ProducedAudio','ARollVideo','Interview','Commentary','Infographic','Carousel'])
const HEAVY_TYPE_SET  = new Set<string>(['Plaintext','ARollVideo','AssetPack','CurationFeed','InteractiveApp','Website','_blank','Course','Book'])

export function statMicroTypes(stat: StatKey): MicroContentType[] {
  return (STAT_CONTENT_TYPES[stat] ?? []).filter(t => MICRO_TYPE_SET.has(t)) as MicroContentType[]
}

export function statMediumTypes(stat: StatKey): MediumContentType[] {
  return (STAT_CONTENT_TYPES[stat] ?? []).filter(t => MEDIUM_TYPE_SET.has(t)) as MediumContentType[]
}

export function statHeavyTypes(stat: StatKey): HeavyContentType[] {
  return (STAT_CONTENT_TYPES[stat] ?? []).filter(t => HEAVY_TYPE_SET.has(t)) as HeavyContentType[]
}
