import type { WeaponClass, ContentTransformation, MicroContentType, MediumContentType, HeavyContentType } from '../../types/game'

import type { ContentProductType } from '../contentProducts'

export interface ContentTransformationsConfig {
  S:        ContentTransformation[]  // 50% weight
  A:        ContentTransformation[]  // 25% weight
  B:        ContentTransformation[]  // 15% weight
  Excluded: ContentTransformation[]  // never drawn, not even in wildcard
  // wildcard (10% weight) = all ContentTransformations minus S ∪ A ∪ B ∪ Excluded
}

export interface WeaponClassDef {
  id: WeaponClass
  name: string
  description: string
  /** Total normal tile count (Research + Produce, excluding advance tile). */
  poise_weight: number
  /** Fraction of tiles that are Research (0–1). Produce = 1 − research_weight. */
  research_weight: number
  base_damage_mult: number
  // Candidate pool for format draws — sampled uniformly. An empty pool means
  // *no restriction* — falls back to a wildcard of every ContentProductType.
  supported_products: ContentProductType[]
  time_mod: number
  content_transformations: ContentTransformationsConfig
  // Override campaign graph size [min, max] nodes. Falls back to poise_weight formula when absent.
  campaign_nodes?: [number, number]
  // Medium mode: L1 and L2 content type pair for all pieces in this weapon class.
  medium_level1_type: MediumContentType
  medium_level2_type: MediumContentType
  // Micro mode: product pool for this class. Empty = uniform over all MicroContentTypes.
  micro_product_pool?: MicroContentType[]
  // Heavy mode: product pool for this class. Empty = uniform over all HeavyContentTypes.
  heavy_product_pool?: HeavyContentType[]
}


export const WEAPON_CLASSES: Record<WeaponClass, WeaponClassDef> = {
  daggers: {
    id: 'daggers', name: 'Dagger', description: 'Micro-content: tweets, shorts, quick reactions.',
    poise_weight: 4, research_weight: 0.25, base_damage_mult: 0.7,
    time_mod: 0.60,
    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo'],
    content_transformations: {
      S:        ['Viral', 'Shock', 'Follows'],
      A:        ['Succinct', 'Cliffhanger', 'Humor', 'Similar'],
      B:        ['Controversy', 'Opposite', 'Fear'],
      Excluded: ['FirstPrinciples', 'Technicalize', 'Synthesis', 'Socratic', 'DataDriven', 'Verbose', 'Evidence'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  straight_swords: {
    id: 'straight_swords', name: 'Straight Sword', description: 'Standard articles and blog posts.',
    poise_weight: 8, research_weight: 0.25, base_damage_mult: 1.0,
    time_mod: 0.90,
    supported_products: ['Plaintext', 'StructuredText', 'RawAudio', 'SlideshowVideo', 'Screencast'],
    content_transformations: {
      S:        ['Follows', 'Verbose', 'ZoomIn'],
      A:        ['Evidence', 'Similar', 'Segmentation', 'ZoomIn'],
      B:        ['Narration', 'Succinct', 'Simplify', 'Critique'],
      Excluded: ['Shock', 'Viral', 'Drama', 'Cliffhanger'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  greatswords: {
    id: 'greatswords', name: 'Greatsword', description: 'Long-form essays and deep dives.',
    poise_weight: 10, research_weight: 0.30, base_damage_mult: 1.5,
    time_mod: 1.10,
    supported_products: ['StructuredText', 'IllustratedText', 'SingleGraphic', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'ProducedAudio'],
    content_transformations: {
      S:        ['Verbose', 'ZoomIn', 'FirstPrinciples', 'DataDriven'],
      A:        ['Evidence', 'Synthesis', 'Technicalize'],
      B:        ['Narration', 'Critique', 'Socratic', 'Analogy'],
      Excluded: ['Viral', 'Shock', 'Cliffhanger', 'Humor', 'Drama', 'Succinct'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  katanas: {
    id: 'katanas', name: 'Katana', description: 'Polished craft pieces — quality over quantity.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 1.1,
    time_mod: 1.0,
    supported_products: ['Plaintext', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'LiveStream', '_blank'],
    content_transformations: {
      S:        ['Estetic', 'Narration', 'Analogy', 'Passion'],
      A:        ['ZoomIn', 'Simplify', 'Follows', 'Passion'],
      B:        ['AudienceShift', 'Wow', 'Verbose', 'Comfort'],
      Excluded: ['Shock', 'Controversy', 'Drama', 'Viral', 'Cliffhanger'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  hammers: {
    id: 'hammers', name: 'Hammer', description: 'Hot takes and opinion pieces.',
    poise_weight: 10, research_weight: 0.30, base_damage_mult: 1.3,
    time_mod: 1.10,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'LiveStream'],
    content_transformations: {
      S:        ['Opposite', 'Controversy', 'Critique', 'Shock'],
      A:        ['Shock', 'Cliffhanger', 'Fear', 'Passion'],
      B:        ['ZoomOut', 'Drama', 'Humor', 'Viral'],
      Excluded: ['Simplify', 'Comfort', 'FirstPrinciples', 'DataDriven', 'Follows', 'Similar'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  spears: {
    id: 'spears', name: 'Spear', description: 'Research-driven content.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 1.0,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Evidence', 'DataDriven', 'ZoomIn', 'FirstPrinciples'],
      A:        ['Synthesis', 'Verbose', 'Technicalize', 'ZoomOut'],
      B:        ['Critique', 'Socratic', 'ZoomOut'],
      Excluded: ['Shock', 'Viral', 'Drama', 'Cliffhanger', 'Humor', 'Comfort', 'Passion'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  axes: {
    id: 'axes', name: 'Axe', description: 'Editing and compression of existing content.',
    poise_weight: 10, research_weight: 0.30, base_damage_mult: 0.9,
    time_mod: 1.0,
    supported_products: [],
    content_transformations: {
      S:        ['Succinct', 'Simplify', 'Synthesis'],
      A:        ['ZoomIn', 'Critique', 'Similar', 'AudienceShift'],
      B:        ['Segmentation', 'Follows', 'Evidence', 'RemixFusion'],
      Excluded: ['Viral', 'Shock', 'Drama', 'Cliffhanger', 'FirstPrinciples'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  bows: {
    id: 'bows', name: 'Bow', description: 'Async content — newsletters, scheduled posts.',
    poise_weight: 6, research_weight: 0.33, base_damage_mult: 0.85,
    time_mod: 0.85,
    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'LiveStream', 'CurationFeed', 'CommunitySpace'],
    content_transformations: {
      S:        ['Follows', 'Segmentation', 'Similar'],
      A:        ['Similar', 'AudienceShift', 'Evidence', 'Synthesis'],
      B:        ['Narration', 'ZoomOut', 'Simplify', 'DataDriven'],
      Excluded: ['Shock', 'Viral', 'Drama', 'Cliffhanger'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  fists: {
    id: 'fists', name: 'Fists', description: 'Raw BTS content and vlogs.',
    poise_weight: 5, research_weight: 0.20, base_damage_mult: 0.65,
    time_mod: 0.65,
    supported_products: ['Plaintext', 'SingleGraphic', 'RawAudio', 'ARollVideo'],
    content_transformations: {
      S:        ['Follows', 'Narration', 'Parasocial', 'Passion'],
      A:        ['Similar', 'Comfort', 'Hope', 'Wow'],
      B:        ['ZoomIn', 'Humor', 'Wow', 'Drama'],
      Excluded: ['DataDriven', 'FirstPrinciples', 'Technicalize', 'Evidence', 'Synthesis', 'Segmentation', 'Critique'],
    },
    medium_level1_type: 'ARollVideo',
    medium_level2_type: 'ProducedAudio',
  },
  colossal_swords: {
    id: 'colossal_swords', name: 'Colossal Sword', description: 'Books, courses, and long-form products.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 2.2,
    time_mod: 1.20,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'ProducedAudio'],
    content_transformations: {
      S:        ['Synthesis', 'FirstPrinciples', 'Verbose', 'Evidence'],
      A:        ['Evidence', 'DataDriven', 'Technicalize', 'ZoomIn'],
      B:        ['Narration', 'Socratic', 'AudienceShift', 'Analogy'],
      Excluded: ['Viral', 'Shock', 'Cliffhanger', 'Humor', 'Drama', 'Succinct'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  thrusting_swords: {
    id: 'thrusting_swords', name: 'Thrusting Sword', description: 'Comments and reply content.',
    poise_weight: 8, research_weight: 0.25, base_damage_mult: 0.75,
    time_mod: 0.70,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'LiveStream', 'CommunitySpace'],
    content_transformations: {
      S:        ['Opposite', 'Critique', 'Similar', 'Follows'],
      A:        ['Succinct', 'ZoomIn', 'Humor', 'Shock'],
      B:        ['Controversy', 'Analogy', 'Cliffhanger', 'Evidence'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Synthesis', 'Verbose', 'Narration'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  heavy_thrusting: {
    id: 'heavy_thrusting', name: 'Heavy Thrusting Sword', description: 'In-depth analysis and commentary.',
    poise_weight: 12, research_weight: 0.25, base_damage_mult: 1.1,
    time_mod: 1.0,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'LiveStream', 'CommunitySpace'],
    content_transformations: {
      S:        ['Critique', 'Opposite', 'ZoomIn', 'Evidence'],
      A:        ['Verbose', 'DataDriven', 'Analogy'],
      B:        ['Technicalize', 'Narration', 'Controversy', 'FirstPrinciples'],
      Excluded: ['Viral', 'Shock', 'Drama', 'Cliffhanger', 'Humor'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  curved_swords: {
    id: 'curved_swords', name: 'Curved Sword', description: 'Storytelling and narrative content.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 1.0,
    time_mod: 1.0,
    supported_products: [],
    content_transformations: {
      S:        ['Narration', 'Follows', 'Verbose', 'Analogy'],
      A:        ['Similar', 'Analogy', 'Passion', 'AudienceShift'],
      B:        ['ZoomIn', 'Comfort', 'Hope', 'Drama'],
      Excluded: ['DataDriven', 'FirstPrinciples', 'Segmentation', 'Technicalize', 'Shock', 'Controversy'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  curved_greatswords: {
    id: 'curved_greatswords', name: 'Curved Greatsword', description: 'Epic series and narrative sagas.',
    poise_weight: 14, research_weight: 0.21, base_damage_mult: 1.4,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Follows', 'Narration', 'Verbose', 'Similar'],
      A:        ['Passion', 'Parasocial', 'Hope', 'Comfort'],
      B:        ['AudienceShift', 'Drama', 'Analogy', 'ZoomIn'],
      Excluded: ['Shock', 'Viral', 'DataDriven', 'FirstPrinciples', 'Segmentation', 'Succinct'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  twinblades: {
    id: 'twinblades', name: 'Twinblade', description: 'Multi-platform cross-posting.',
    poise_weight: 8, research_weight: 0.25, base_damage_mult: 0.9,
    time_mod: 1.0,
    campaign_nodes: [7, 9],
    supported_products: [],
    content_transformations: {
      S:        ['Similar', 'Succinct', 'AudienceShift'],
      A:        ['Follows', 'RemixFusion'],
      B:        ['Simplify', 'Segmentation', 'Viral', 'Succinct'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Synthesis', 'Technicalize', 'Verbose', 'Socratic'],
    },
    medium_level1_type: 'Carousel',
    medium_level2_type: 'ARollVideo',
  },
  great_hammers: {
    id: 'great_hammers', name: 'Great Hammer', description: 'Manifestos and major opinion pieces.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 1.7,
    time_mod: 1.20,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'LiveStream'],
    content_transformations: {
      S:        ['Opposite', 'Controversy', 'Critique', 'FirstPrinciples'],
      A:        ['FirstPrinciples', 'Verbose', 'ZoomOut', 'Passion'],
      B:        ['Evidence', 'DataDriven', 'Narration', 'Fear'],
      Excluded: ['Similar', 'Follows', 'Succinct', 'Cliffhanger', 'AudienceShift'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  great_axes: {
    id: 'great_axes', name: 'Great Axe', description: 'Recaps, roundups, and year-in-review content.',
    poise_weight: 16, research_weight: 0.25, base_damage_mult: 1.35,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Synthesis', 'Similar', 'Succinct', 'ZoomOut'],
      A:        ['Segmentation', 'Evidence', 'DataDriven', 'Follows'],
      B:        ['AudienceShift', 'Narration', 'ZoomOut'],
      Excluded: ['Shock', 'Viral', 'Cliffhanger', 'Opposite', 'Controversy', 'Drama', 'Passion'],
    },
    medium_level1_type: 'Carousel',
    medium_level2_type: 'Infographic',
  },
  flails: {
    id: 'flails', name: 'Flail', description: 'Spontaneous and improv content.',
    poise_weight: 5, research_weight: 0.20, base_damage_mult: 0.95,
    time_mod: 0.70,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'LiveStream', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Follows', 'Passion', 'Humor', 'Similar'],
      A:        ['Similar', 'Opposite', 'Narration', 'Comfort'],
      B:        ['Wow', 'Viral', 'Drama', 'ZoomOut'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Evidence', 'Technicalize', 'Synthesis', 'Segmentation'],
    },
    medium_level1_type: 'ARollVideo',
    medium_level2_type: 'ProducedAudio',
  },
  colossal_weapons: {
    id: 'colossal_weapons', name: 'Colossal Weapon', description: 'Mega-projects — documentaries, full series.',
    poise_weight: 18, research_weight: 0.22, base_damage_mult: 2.4,
    time_mod: 1.30,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'CinematicVideo', 'SlideshowVideo', 'AssetPack', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Synthesis', 'Narration', 'FirstPrinciples', 'Verbose'],
      A:        ['Verbose', 'Evidence', 'DataDriven', 'ZoomIn'],
      B:        ['Technicalize', 'AudienceShift', 'Analogy', 'Socratic'],
      Excluded: ['Viral', 'Shock', 'Cliffhanger', 'Humor', 'Succinct', 'Similar'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  great_spears: {
    id: 'great_spears', name: 'Great Spear', description: 'Investigative content.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 1.25,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Evidence', 'DataDriven', 'Critique', 'ZoomIn'],
      A:        ['ZoomIn', 'Verbose', 'FirstPrinciples', 'Technicalize'],
      B:        ['Synthesis', 'Controversy', 'ZoomOut'],
      Excluded: ['Viral', 'Shock', 'Humor', 'Drama', 'Cliffhanger', 'Comfort', 'Follows'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  halberds: {
    id: 'halberds', name: 'Halberd', description: 'Hybrid research and opinion.',
    poise_weight: 7, research_weight: 0.29, base_damage_mult: 1.1,
    time_mod: 0.90,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'SlideshowVideo', 'Screencast', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Evidence', 'Opposite', 'ZoomIn', 'Critique'],
      A:        ['DataDriven', 'Verbose', 'Analogy', 'Opposite'],
      B:        ['AudienceShift', 'FirstPrinciples', 'Narration', 'Synthesis'],
      Excluded: ['Viral', 'Shock', 'Cliffhanger', 'Drama', 'Humor'],
    },
    medium_level1_type: 'Infographic',
    medium_level2_type: 'ARollVideo',
  },
  reapers: {
    id: 'reapers', name: 'Reaper', description: 'Commentary, takedowns, and critiques.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 1.2,
    time_mod: 1.0,
    supported_products: ['StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'SlideshowVideo', 'CurationFeed', 'ARollVideo'],
    content_transformations: {
      S:        ['Critique', 'Opposite', 'Controversy', 'Shock'],
      A:        ['Similar', 'Fear', 'Drama', 'Humor'],
      B:        ['Cliffhanger', 'ZoomIn', 'Evidence', 'Succinct'],
      Excluded: ['Comfort', 'Hope', 'Follows', 'Synthesis', 'DataDriven', 'FirstPrinciples', 'AudienceShift'],
    },
    medium_level1_type: 'Commentary',
    medium_level2_type: 'ARollVideo',
  },
  whips: {
    id: 'whips', name: 'Whip', description: 'Series and content cycles.',
    poise_weight: 12, research_weight: 0.25, base_damage_mult: 0.9,
    time_mod: 1.0,
    supported_products: ['ARollVideo', 'CinematicVideo', 'SlideshowVideo', 'LiveStream'],
    content_transformations: {
      S:        ['Follows', 'Similar', 'Verbose', 'Narration'],
      A:        ['Narration', 'Passion', 'AudienceShift'],
      B:        ['ZoomIn', 'Controversy', 'Opposite', 'RemixFusion'],
      Excluded: ['Shock', 'Viral', 'DataDriven', 'FirstPrinciples', 'Technicalize', 'Succinct'],
    },
    medium_level1_type: 'ARollVideo',
    medium_level2_type: 'ProducedAudio',
  },
  greatbows: {
    id: 'greatbows', name: 'Greatbow', description: 'Long-tail evergreen content.',
    poise_weight: 12, research_weight: 0.25, base_damage_mult: 1.6,
    time_mod: 1.20,
    supported_products: ['Carousel', 'InteractiveApp', 'LiveStream', 'CommunitySpace', '_blank'],
    content_transformations: {
      S:        ['Simplify', 'AudienceShift', 'Analogy'],
      A:        ['Evidence', 'DataDriven', 'Analogy', 'Socratic'],
      B:        ['Follows', 'Narration', 'ZoomIn', 'FirstPrinciples'],
      Excluded: ['Shock', 'Viral', 'Cliffhanger', 'Drama', 'Fear', 'Controversy'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'ARollVideo',
  },
  crossbows: {
    id: 'crossbows', name: 'Crossbow', description: 'Email blasts and push notifications.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 0.85,
    time_mod: 0.85,
    supported_products: [],
    content_transformations: {
      S:        ['Succinct', 'Cliffhanger', 'Similar'],
      A:        ['Follows', 'Shock', 'Viral', 'Fear'],
      B:        ['Opposite', 'Humor', 'Controversy'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Synthesis', 'Technicalize', 'Verbose', 'Narration', 'Socratic'],
    },
    medium_level1_type: 'Plaintext',
    medium_level2_type: 'Commentary',
  },
  ballistas: {
    id: 'ballistas', name: 'Ballista', description: 'Major product launches.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 2.2,
    time_mod: 1.20,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'SlideshowVideo', 'CinematicVideo', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Evidence', 'DataDriven', 'Synthesis'],
      A:        ['Narration', 'Wow', 'Verbose', 'Analogy'],
      B:        ['AudienceShift', 'Technicalize', 'ZoomIn', 'Segmentation'],
      Excluded: ['Succinct', 'Similar', 'Follows', 'Shock', 'Viral', 'Drama', 'Opposite'],
    },
    medium_level1_type: 'Infographic',
    medium_level2_type: 'ARollVideo',
  },
  torches: {
    id: 'torches', name: 'Torch', description: 'Lifestyle and lo-fi vlog content.',
    poise_weight: 5, research_weight: 0.20, base_damage_mult: 0.6,
    time_mod: 0.65,
    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'CinematicVideo', 'LiveStream', 'CommunitySpace'],
    content_transformations: {
      S:        ['Follows', 'Narration', 'Parasocial', 'Comfort'],
      A:        ['Similar', 'Passion', 'Hope', 'Comfort'],
      B:        ['Wow', 'Humor', 'Drama', 'AudienceShift'],
      Excluded: ['DataDriven', 'FirstPrinciples', 'Technicalize', 'Evidence', 'Critique', 'Controversy', 'Segmentation'],
    },
    medium_level1_type: 'ARollVideo',
    medium_level2_type: 'ProducedAudio',
  },
}

export const ALL_WEAPON_CLASSES = Object.keys(WEAPON_CLASSES) as WeaponClass[]
