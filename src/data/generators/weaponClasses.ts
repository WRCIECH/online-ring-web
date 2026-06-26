import type { WeaponClass, StatKey, Grade, StyleType, StatusType, AtomicOrigin } from '../../types/game'

type PoiseWeight = 'light' | 'medium' | 'heavy' | 'colossal'
import type { ContentProductType } from '../contentProducts'

export interface WeaponClassDef {
  id: WeaponClass
  name: string
  description: string
  poise_weight: PoiseWeight
  base_damage_mult: number
  // Draw pools for supported_products / base_damage_types / inherent_status /
  // allowed_transformations: each is sampled uniformly by pick() (see
  // patternSlots.ts), so an entry's *probability* is its share of the pool's
  // length — repeating a value gives it proportionally more weight. An empty
  // pool means *no restriction* — rollSlotValue falls back to a wildcard of
  // every possible value for that kind, each equally likely — rather than
  // disabling the draw.
  supported_products: ContentProductType[]
  scaling: Partial<Record<StatKey, Grade>>
  base_damage_types: StyleType[]
  time_mod: number
  inherent_status: StatusType[]
  allowed_transformations: AtomicOrigin[]
  // Per-weapon cap on simultaneously-attached ContentItems (on top of the
  // global END-stat cap in gameStore.ts's selectEquipLoad).
  content_slots: number
  // Number of pre-rolled remaster states beyond the primary roll (see
  // RolledPatternDraws in types/game.ts) — defaults by poise_weight.
  remaster_steps: number
}


export const WEAPON_CLASSES: Record<WeaponClass, WeaponClassDef> = {
  daggers: {
    id: 'daggers', name: 'Dagger', description: 'Micro-content: tweets, shorts, quick reactions.',
    poise_weight: 'light', base_damage_mult: 0.7,
    scaling: { DEX: 'S' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'RawAudio', 'ARollVideo'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  straight_swords: {
    id: 'straight_swords', name: 'Straight Sword', description: 'Standard articles and blog posts.',
    poise_weight: 'medium', base_damage_mult: 1.0,
    scaling: { STR: 'D', DEX: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', "IllustratedText", "SingleGraphic", 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast'],

    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  greatswords: {
    id: 'greatswords', name: 'Greatsword', description: 'Long-form essays and deep dives.',
    poise_weight: 'heavy', base_damage_mult: 1.5,
    scaling: { STR: 'B', DEX: 'D' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', "IllustratedText", "SingleGraphic", 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'ProducedAudio'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  katanas: {
    id: 'katanas', name: 'Katana', description: 'Polished craft pieces — quality over quantity.',
    poise_weight: 'medium', base_damage_mult: 1.1,
    scaling: { DEX: 'A' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'BranchingNarrative', '_blank'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  hammers: {
    id: 'hammers', name: 'Hammer', description: 'Hot takes and opinion pieces.',
    poise_weight: 'heavy', base_damage_mult: 1.3,
    scaling: { STR: 'A' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    base_damage_types: ['Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Cliffhanger'],
    inherent_status: ['bleed', 'glintstone', 'frenzy_flame', 'scarlet_rot', 'frostbite', 'madness', 'death_blight', 'dread', 'murmur'],
    allowed_transformations: [],
  },
  spears: {
    id: 'spears', name: 'Spear', description: 'Research-driven content.',
    poise_weight: 'medium', base_damage_mult: 1.0,
    scaling: { DEX: 'B', STR: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: ['Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'AudienceAlter', 'Commentary', 'Opposite'],
  },
  axes: {
    id: 'axes', name: 'Axe', description: 'Editing and compression of existing content.',
    poise_weight: 'medium', base_damage_mult: 0.9,
    scaling: { STR: 'C', DEX: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  bows: {
    id: 'bows', name: 'Bow', description: 'Async content — newsletters, scheduled posts.',
    poise_weight: 'light', base_damage_mult: 0.85,
    scaling: { DEX: 'A' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'LiveStream', 'CurationFeed', 'CommunitySpace'],
    base_damage_types: [],
    inherent_status: ['sleep', 'devotion', 'murmur', 'death_blight'],
    allowed_transformations: [],
  },
  fists: {
    id: 'fists', name: 'Fists', description: 'Raw BTS content and vlogs.',
    poise_weight: 'light', base_damage_mult: 0.65,
    scaling: { STR: 'C', DEX: 'C' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'RawAudio', 'ARollVideo'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  colossal_swords: {
    id: 'colossal_swords', name: 'Colossal Sword', description: 'Books, courses, and long-form products.',
    poise_weight: 'colossal', base_damage_mult: 2.2,
    scaling: { STR: 'S' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', "IllustratedText", "SingleGraphic", 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'ProducedAudio'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  thrusting_swords: {
    id: 'thrusting_swords', name: 'Thrusting Sword', description: 'Comments and reply content.',
    poise_weight: 'light', base_damage_mult: 0.75,
    scaling: { INT: 'A', DEX: 'D' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'CommunitySpace'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  heavy_thrusting: {
    id: 'heavy_thrusting', name: 'Heavy Thrusting Sword', description: 'In-depth analysis and commentary.',
    poise_weight: 'medium', base_damage_mult: 1.1,
    scaling: { INT: 'B', STR: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'CommunitySpace'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  curved_swords: {
    id: 'curved_swords', name: 'Curved Sword', description: 'Storytelling and narrative content.',
    poise_weight: 'medium', base_damage_mult: 1.0,
    scaling: { DEX: 'A' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: ['Expansion', 'ZoomIn', 'ZoomOut', 'AudienceAlter', 'Commentary', 'Similar', 'Opposite'],
  },
  curved_greatswords: {
    id: 'curved_greatswords', name: 'Curved Greatsword', description: 'Epic series and narrative sagas.',
    poise_weight: 'heavy', base_damage_mult: 1.4,
    scaling: { DEX: 'B', STR: 'D' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: ['Compression', 'ZoomIn', 'ZoomOut', 'AudienceAlter', 'Commentary', 'Similar', 'Opposite'],
  },
  twinblades: {
    id: 'twinblades', name: 'Twinblade', description: 'Multi-platform cross-posting.',
    poise_weight: 'medium', base_damage_mult: 0.9,
    scaling: { DEX: 'S' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  great_hammers: {
    id: 'great_hammers', name: 'Great Hammer', description: 'Manifestos and major opinion pieces.',
    poise_weight: 'heavy', base_damage_mult: 1.7,
    scaling: { STR: 'A' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    base_damage_types: ['Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Cliffhanger'],
    inherent_status: ['bleed', 'glintstone', 'frenzy_flame', 'scarlet_rot', 'frostbite', 'madness', 'death_blight', 'dread', 'murmur'],
    allowed_transformations: [],
  },
  great_axes: {
    id: 'great_axes', name: 'Great Axe', description: 'Recaps, roundups, and year-in-review content.',
    poise_weight: 'heavy', base_damage_mult: 1.35,
    scaling: { STR: 'A' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  flails: {
    id: 'flails', name: 'Flail', description: 'Spontaneous and improv content.',
    poise_weight: 'medium', base_damage_mult: 0.95,
    scaling: { DEX: 'B', STR: 'D' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  colossal_weapons: {
    id: 'colossal_weapons', name: 'Colossal Weapon', description: 'Mega-projects — documentaries, full series.',
    poise_weight: 'colossal', base_damage_mult: 2.4,
    scaling: { STR: 'S' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'CinematicVideo', 'SlideshowVideo', 'MotionGraphics', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'InteractiveApp', '_blank'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  great_spears: {
    id: 'great_spears', name: 'Great Spear', description: 'Investigative content.',
    poise_weight: 'heavy', base_damage_mult: 1.25,
    scaling: { STR: 'B', DEX: 'C' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: ['Compression', 'Expansion', 'AudienceAlter', 'Commentary', 'Similar', 'Opposite'],
  },
  halberds: {
    id: 'halberds', name: 'Halberd', description: 'Hybrid research and opinion.',
    poise_weight: 'medium', base_damage_mult: 1.1,
    scaling: { STR: 'C', DEX: 'C' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'SlideshowVideo', 'Screencast', 'MultimediaPage', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    base_damage_types: ['Minimalism', 'Segmentation', 'Intellectual', 'Intellectual', 'Intellectual', 'ProblemSolving', 'ProblemSolving'],
    inherent_status: ['glintstone', 'grace', 'madness'],
    allowed_transformations: [],
  },
  reapers: {
    id: 'reapers', name: 'Reaper', description: 'Commentary, takedowns, and critiques.',
    poise_weight: 'heavy', base_damage_mult: 1.2,
    scaling: { ARC: 'A', DEX: 'D' },
    content_slots: 5,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'SlideshowVideo', 'CurationFeed', 'ARollVideo'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  whips: {
    id: 'whips', name: 'Whip', description: 'Series and content cycles.',
    poise_weight: 'medium', base_damage_mult: 0.9,
    scaling: { ARC: 'B', DEX: 'C' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['ARollVideo', 'CinematicVideo', 'SlideshowVideo', 'MotionGraphics', 'LiveStream'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  greatbows: {
    id: 'greatbows', name: 'Greatbow', description: 'Long-tail evergreen content.',
    poise_weight: 'colossal', base_damage_mult: 1.6,
    scaling: { FAI: 'A', STR: 'D' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['Carousel', 'BranchingNarrative', 'InteractiveApp', 'LiveStream', 'MultimediaPage', 'CommunitySpace', '_blank'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  crossbows: {
    id: 'crossbows', name: 'Crossbow', description: 'Email blasts and push notifications.',
    poise_weight: 'medium', base_damage_mult: 0.85,
    scaling: { DEX: 'B' },
    content_slots: 4,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: [],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: ['Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'AudienceAlter', 'Commentary', 'Similar'],
  },
  ballistas: {
    id: 'ballistas', name: 'Ballista', description: 'Major product launches.',
    poise_weight: 'colossal', base_damage_mult: 2.2,
    scaling: { STR: 'C', DEX: 'D' },
    content_slots: 6,
    remaster_steps: 5,
    time_mod: 1.0,

    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    base_damage_types: [],
    inherent_status: [],
    allowed_transformations: [],
  },
  torches: {
    id: 'torches', name: 'Torch', description: 'Lifestyle and lo-fi vlog content.',
    poise_weight: 'light', base_damage_mult: 0.6,
    scaling: { FAI: 'A', INT: 'D' },
    content_slots: 3,
    remaster_steps: 3,
    time_mod: 1.0,

    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'CinematicVideo', 'LiveStream', 'CommunitySpace'],
    base_damage_types: ['Shock', 'Narration', 'Fast', 'Passion', 'Cliffhanger'],
    inherent_status: ['bleed', 'glintstone', 'frenzy_flame', 'yearning', 'scarlet_rot', 'frostbite', 'madness', 'death_blight'],
    allowed_transformations: [],
  },
}

export const ALL_WEAPON_CLASSES = Object.keys(WEAPON_CLASSES) as WeaponClass[]
