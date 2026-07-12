import type { WeaponClass, StatKey, Grade, StyleType, EmotionType, AtomicOrigin } from '../../types/game'

type PoiseWeight = 'light' | 'medium' | 'heavy' | 'colossal'
import type { ContentProductType } from '../contentProducts'

export interface WeaponClassDef {
  id: WeaponClass
  name: string
  description: string
  poise_weight: PoiseWeight
  base_damage_mult: number
  // Draw pools for supported_products / styles / emotions /
  // allowed_transformations: each is sampled uniformly by pick() (see
  // patternSlots.ts), so an entry's *probability* is its share of the pool's
  // length — repeating a value gives it proportionally more weight. An empty
  // pool means *no restriction* — rollSlotValue falls back to a wildcard of
  // every possible value for that kind, each equally likely — rather than
  // disabling the draw.
  supported_products: ContentProductType[]
  scaling: Partial<Record<StatKey, Grade>>
  styles: StyleType[]
  time_mod: number
  emotions: EmotionType[]
  allowed_transformations: AtomicOrigin[]
  content_slots: number
  // Number of pre-rolled remaster states beyond the primary roll (see
  // RolledPatternDraws in types/game.ts) — defaults by poise_weight.
  remaster_steps: number
}


export const WEAPON_CLASSES: Record<WeaponClass, WeaponClassDef> = {
  daggers: {
    id: 'daggers', name: 'Dagger', description: 'Micro-content: tweets, shorts, quick reactions.',
    poise_weight: 'light', base_damage_mult: 0.7,
    scaling: { VELOCITY: 'S' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'RawAudio', 'ARollVideo'],
    styles: ['Viral', 'Humor'],
    emotions: [],
    allowed_transformations: [],
  },
  straight_swords: {
    id: 'straight_swords', name: 'Straight Sword', description: 'Standard articles and blog posts.',
    poise_weight: 'medium', base_damage_mult: 1.0,
    scaling: { TEXT: 'D', VELOCITY: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', "IllustratedText", "SingleGraphic", 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast'],

    styles: [],
    emotions: [],
    allowed_transformations: [],
  },
  greatswords: {
    id: 'greatswords', name: 'Greatsword', description: 'Long-form essays and deep dives.',
    poise_weight: 'heavy', base_damage_mult: 1.5,
    scaling: { DEPTH: 'B', TEXT: 'D' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', "IllustratedText", "SingleGraphic", 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'ProducedAudio'],
    styles: ['Wow', 'Hope'],
    emotions: [],
    allowed_transformations: [],
  },
  katanas: {
    id: 'katanas', name: 'Katana', description: 'Polished craft pieces — quality over quantity.',
    poise_weight: 'medium', base_damage_mult: 1.1,
    scaling: { GRAPHIC: 'A' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'BranchingNarrative', '_blank'],
    styles: [],
    emotions: [],
    allowed_transformations: [],
  },
  hammers: {
    id: 'hammers', name: 'Hammer', description: 'Hot takes and opinion pieces.',
    poise_weight: 'heavy', base_damage_mult: 1.3,
    scaling: { FRICTION: 'A' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    styles: ['Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Cliffhanger'],
    emotions: [],
    allowed_transformations: [],
  },
  spears: {
    id: 'spears', name: 'Spear', description: 'Research-driven content.',
    poise_weight: 'medium', base_damage_mult: 1.0,
    scaling: { DEPTH: 'B', TEXT: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: ['Wow', 'Hope'],
    emotions: [],
    allowed_transformations: ['Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'Opposite'],
  },
  axes: {
    id: 'axes', name: 'Axe', description: 'Editing and compression of existing content.',
    poise_weight: 'medium', base_damage_mult: 0.9,
    scaling: { FRICTION: 'C', VELOCITY: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: [],
    emotions: [],
    allowed_transformations: [],
  },
  bows: {
    id: 'bows', name: 'Bow', description: 'Async content — newsletters, scheduled posts.',
    poise_weight: 'light', base_damage_mult: 0.85,
    scaling: { TEXT: 'A' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'LiveStream', 'CurationFeed', 'CommunitySpace'],
    styles: ['Comfort', 'Hope', 'Parasocial', 'Desire'],
    emotions: [],
    allowed_transformations: [],
  },
  fists: {
    id: 'fists', name: 'Fists', description: 'Raw BTS content and vlogs.',
    poise_weight: 'light', base_damage_mult: 0.65,
    scaling: { VELOCITY: 'C', GRAPHIC: 'C' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'RawAudio', 'ARollVideo'],
    styles: ['Viral', 'Humor', 'Parasocial'],
    emotions: [],
    allowed_transformations: [],
  },
  colossal_swords: {
    id: 'colossal_swords', name: 'Colossal Sword', description: 'Books, courses, and long-form products.',
    poise_weight: 'colossal', base_damage_mult: 2.2,
    scaling: { DEPTH: 'S' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', "IllustratedText", "SingleGraphic", 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'ProducedAudio'],
    styles: ['Wow', 'Hope', 'Comfort'],
    emotions: [],
    allowed_transformations: [],
  },
  thrusting_swords: {
    id: 'thrusting_swords', name: 'Thrusting Sword', description: 'Comments and reply content.',
    poise_weight: 'light', base_damage_mult: 0.75,
    scaling: { DEPTH: 'A', VELOCITY: 'D' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'CommunitySpace'],
    styles: ['Controversy', 'Drama', 'Humor'],
    emotions: [],
    allowed_transformations: [],
  },
  heavy_thrusting: {
    id: 'heavy_thrusting', name: 'Heavy Thrusting Sword', description: 'In-depth analysis and commentary.',
    poise_weight: 'medium', base_damage_mult: 1.1,
    scaling: { DEPTH: 'B', TEXT: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'CommunitySpace'],
    styles: ['Controversy', 'Fear', 'Wow'],
    emotions: [],
    allowed_transformations: [],
  },
  curved_swords: {
    id: 'curved_swords', name: 'Curved Sword', description: 'Storytelling and narrative content.',
    poise_weight: 'medium', base_damage_mult: 1.0,
    scaling: { AUDIO: 'A' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: ['Comfort', 'Drama', 'Hope'],
    emotions: [],
    allowed_transformations: ['Expansion', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite'],
  },
  curved_greatswords: {
    id: 'curved_greatswords', name: 'Curved Greatsword', description: 'Epic series and narrative sagas.',
    poise_weight: 'heavy', base_damage_mult: 1.4,
    scaling: { PARASOCIAL: 'B', AUDIO: 'D' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: ['Comfort', 'Drama', 'Parasocial', 'Hope'],
    emotions: [],
    allowed_transformations: ['Compression', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite'],
  },
  twinblades: {
    id: 'twinblades', name: 'Twinblade', description: 'Multi-platform cross-posting.',
    poise_weight: 'medium', base_damage_mult: 0.9,
    scaling: { VELOCITY: 'S' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: ['Viral', 'Desire'],
    emotions: [],
    allowed_transformations: [],
  },
  great_hammers: {
    id: 'great_hammers', name: 'Great Hammer', description: 'Manifestos and major opinion pieces.',
    poise_weight: 'heavy', base_damage_mult: 1.7,
    scaling: { FRICTION: 'A' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    styles: ['Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Cliffhanger', 'Controversy', 'Drama', 'Fear'],
    emotions: [],
    allowed_transformations: [],
  },
  great_axes: {
    id: 'great_axes', name: 'Great Axe', description: 'Recaps, roundups, and year-in-review content.',
    poise_weight: 'heavy', base_damage_mult: 1.35,
    scaling: { FRICTION: 'A' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: [],
    emotions: [],
    allowed_transformations: [],
  },
  flails: {
    id: 'flails', name: 'Flail', description: 'Spontaneous and improv content.',
    poise_weight: 'medium', base_damage_mult: 0.95,
    scaling: { INSIGHT: 'B', VIDEO: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    styles: ['Viral', 'Humor', 'Wow'],
    emotions: [],
    allowed_transformations: [],
  },
  colossal_weapons: {
    id: 'colossal_weapons', name: 'Colossal Weapon', description: 'Mega-projects — documentaries, full series.',
    poise_weight: 'colossal', base_damage_mult: 2.4,
    scaling: { DEPTH: 'S' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'CinematicVideo', 'SlideshowVideo', 'MotionGraphics', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'InteractiveApp', '_blank'],
    styles: ['Wow', 'Drama', 'Hope'],
    emotions: [],
    allowed_transformations: [],
  },
  great_spears: {
    id: 'great_spears', name: 'Great Spear', description: 'Investigative content.',
    poise_weight: 'heavy', base_damage_mult: 1.25,
    scaling: { FRICTION: 'B', DEPTH: 'C' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: ['Controversy', 'Fear', 'Wow'],
    emotions: [],
    allowed_transformations: ['Compression', 'Expansion', 'Similar', 'Opposite'],
  },
  halberds: {
    id: 'halberds', name: 'Halberd', description: 'Hybrid research and opinion.',
    poise_weight: 'medium', base_damage_mult: 1.1,
    scaling: { DEPTH: 'C', PARASOCIAL: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'SlideshowVideo', 'Screencast', 'MultimediaPage', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    styles: ['Minimalism', 'Segmentation', 'Intellectual', 'Intellectual', 'Intellectual', 'ProblemSolving', 'ProblemSolving', 'Wow', 'Fear'],
    emotions: [],
    allowed_transformations: [],
  },
  reapers: {
    id: 'reapers', name: 'Reaper', description: 'Commentary, takedowns, and critiques.',
    poise_weight: 'heavy', base_damage_mult: 1.2,
    scaling: { FRICTION: 'A', VELOCITY: 'D' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'SlideshowVideo', 'CurationFeed', 'ARollVideo'],
    styles: ['Controversy', 'Drama', 'Fear', 'Humor'],
    emotions: [],
    allowed_transformations: [],
  },
  whips: {
    id: 'whips', name: 'Whip', description: 'Series and content cycles.',
    poise_weight: 'medium', base_damage_mult: 0.9,
    scaling: { FRICTION: 'B', INSIGHT: 'C' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['ARollVideo', 'CinematicVideo', 'SlideshowVideo', 'MotionGraphics', 'LiveStream'],
    styles: ['Comfort', 'Parasocial', 'Desire'],
    emotions: [],
    allowed_transformations: [],
  },
  greatbows: {
    id: 'greatbows', name: 'Greatbow', description: 'Long-tail evergreen content.',
    poise_weight: 'colossal', base_damage_mult: 1.6,
    scaling: { PARASOCIAL: 'A', VELOCITY: 'D' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Carousel', 'BranchingNarrative', 'InteractiveApp', 'LiveStream', 'MultimediaPage', 'CommunitySpace', '_blank'],
    styles: ['Comfort', 'Parasocial', 'Hope', 'Desire'],
    emotions: [],
    allowed_transformations: [],
  },
  crossbows: {
    id: 'crossbows', name: 'Crossbow', description: 'Email blasts and push notifications.',
    poise_weight: 'medium', base_damage_mult: 0.85,
    scaling: { VELOCITY: 'B' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    styles: ['Viral', 'Desire'],
    emotions: [],
    allowed_transformations: ['Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'Similar'],
  },
  ballistas: {
    id: 'ballistas', name: 'Ballista', description: 'Major product launches.',
    poise_weight: 'colossal', base_damage_mult: 2.2,
    scaling: { DEPTH: 'C', VIDEO: 'D' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    styles: ['Controversy', 'Wow', 'Fear', 'Desire'],
    emotions: [],
    allowed_transformations: [],
  },
  torches: {
    id: 'torches', name: 'Torch', description: 'Lifestyle and lo-fi vlog content.',
    poise_weight: 'light', base_damage_mult: 0.6,
    scaling: { AUDIO: 'A', PARASOCIAL: 'D' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'CinematicVideo', 'LiveStream', 'CommunitySpace'],
    styles: ['Shock', 'Narration', 'Fast', 'Passion', 'Cliffhanger', 'Viral', 'Humor', 'Parasocial', 'Comfort'],
    emotions: [],
    allowed_transformations: [],
  },
}

export const ALL_WEAPON_CLASSES = Object.keys(WEAPON_CLASSES) as WeaponClass[]
