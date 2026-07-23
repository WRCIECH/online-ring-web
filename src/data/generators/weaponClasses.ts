import type { WeaponClass, ContentTransformation } from '../../types/game'

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
}


export const WEAPON_CLASSES: Record<WeaponClass, WeaponClassDef> = {
  daggers: {
    id: 'daggers', name: 'Dagger', description: 'Micro-content: tweets, shorts, quick reactions.',
    poise_weight: 4, research_weight: 0.25, base_damage_mult: 0.7,
    time_mod: 0.60,
    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo'],
    content_transformations: {
      S:        ['Fast', 'Viral', 'Shock', 'Follows'],
      A:        ['Compression', 'Cliffhanger', 'Humor', 'Similar'],
      B:        ['Controversy', 'Opposite', 'Split', 'Fear'],
      Excluded: ['FirstPrinciples', 'Technicalize', 'Synthesis', 'Socratic', 'DataDriven', 'Expansion', 'Evidence'],
    },
  },
  straight_swords: {
    id: 'straight_swords', name: 'Straight Sword', description: 'Standard articles and blog posts.',
    poise_weight: 8, research_weight: 0.25, base_damage_mult: 1.0,
    time_mod: 0.90,
    supported_products: ['Plaintext', 'StructuredText', 'RawAudio', 'SlideshowVideo', 'Screencast'],
    content_transformations: {
      S:        ['Follows', 'ProblemSolving', 'Expansion', 'ZoomIn'],
      A:        ['Evidence', 'Similar', 'Segmentation', 'ZoomIn'],
      B:        ['Narration', 'Compression', 'Simplify', 'Critique'],
      Excluded: ['Shock', 'Viral', 'Drama', 'Cliffhanger'],
    },
  },
  greatswords: {
    id: 'greatswords', name: 'Greatsword', description: 'Long-form essays and deep dives.',
    poise_weight: 10, research_weight: 0.30, base_damage_mult: 1.5,
    time_mod: 1.10,
    supported_products: ['StructuredText', 'IllustratedText', 'SingleGraphic', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'ProducedAudio'],
    content_transformations: {
      S:        ['Expansion', 'ZoomIn', 'FirstPrinciples', 'DataDriven'],
      A:        ['Evidence', 'Synthesis', 'Technicalize', 'Intellectual'],
      B:        ['Narration', 'Critique', 'Socratic', 'Analogy'],
      Excluded: ['Fast', 'Viral', 'Shock', 'Cliffhanger', 'Humor', 'Drama', 'Compression'],
    },
  },
  katanas: {
    id: 'katanas', name: 'Katana', description: 'Polished craft pieces — quality over quantity.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 1.1,
    time_mod: 1.0,
    supported_products: ['Plaintext', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'BranchingNarrative', '_blank'],
    content_transformations: {
      S:        ['Estetic', 'Narration', 'Analogy', 'Passion'],
      A:        ['ZoomIn', 'Simplify', 'Follows', 'Passion'],
      B:        ['AudienceShift', 'Wow', 'Expansion', 'Comfort'],
      Excluded: ['Shock', 'Controversy', 'Drama', 'Viral', 'Fast', 'Cliffhanger', 'Split'],
    },
  },
  hammers: {
    id: 'hammers', name: 'Hammer', description: 'Hot takes and opinion pieces.',
    poise_weight: 10, research_weight: 0.30, base_damage_mult: 1.3,
    time_mod: 1.10,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    content_transformations: {
      S:        ['Opposite', 'Controversy', 'Critique', 'Shock'],
      A:        ['Shock', 'Cliffhanger', 'Fear', 'Passion'],
      B:        ['ZoomOut', 'Drama', 'Humor', 'Viral'],
      Excluded: ['Simplify', 'Comfort', 'FirstPrinciples', 'DataDriven', 'Follows', 'Similar'],
    },
  },
  spears: {
    id: 'spears', name: 'Spear', description: 'Research-driven content.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 1.0,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Evidence', 'DataDriven', 'ZoomIn', 'FirstPrinciples'],
      A:        ['Synthesis', 'Expansion', 'Technicalize', 'ZoomOut'],
      B:        ['DomainTransfer', 'Critique', 'Socratic', 'ZoomOut'],
      Excluded: ['Shock', 'Viral', 'Drama', 'Cliffhanger', 'Humor', 'Fast', 'Comfort', 'Passion'],
    },
  },
  axes: {
    id: 'axes', name: 'Axe', description: 'Editing and compression of existing content.',
    poise_weight: 10, research_weight: 0.30, base_damage_mult: 0.9,
    time_mod: 1.0,
    supported_products: [],
    content_transformations: {
      S:        ['Compression', 'Split', 'Simplify', 'Synthesis'],
      A:        ['ZoomIn', 'Critique', 'Similar', 'AudienceShift'],
      B:        ['Segmentation', 'Follows', 'Evidence', 'RemixFusion'],
      Excluded: ['Viral', 'Shock', 'Drama', 'Cliffhanger', 'FirstPrinciples'],
    },
  },
  bows: {
    id: 'bows', name: 'Bow', description: 'Async content — newsletters, scheduled posts.',
    poise_weight: 6, research_weight: 0.33, base_damage_mult: 0.85,
    time_mod: 0.85,
    supported_products: ['Plaintext', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'LiveStream', 'CurationFeed', 'CommunitySpace'],
    content_transformations: {
      S:        ['Follows', 'Segmentation', 'ProblemSolving', 'Similar'],
      A:        ['Similar', 'AudienceShift', 'Evidence', 'Synthesis'],
      B:        ['Narration', 'ZoomOut', 'Simplify', 'DataDriven'],
      Excluded: ['Shock', 'Viral', 'Drama', 'Cliffhanger', 'Fast'],
    },
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
  },
  colossal_swords: {
    id: 'colossal_swords', name: 'Colossal Sword', description: 'Books, courses, and long-form products.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 2.2,
    time_mod: 1.20,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'ProducedAudio'],
    content_transformations: {
      S:        ['Synthesis', 'FirstPrinciples', 'Expansion', 'Evidence'],
      A:        ['Evidence', 'DataDriven', 'Technicalize', 'ZoomIn'],
      B:        ['Narration', 'Socratic', 'AudienceShift', 'Analogy'],
      Excluded: ['Fast', 'Viral', 'Shock', 'Cliffhanger', 'Humor', 'Drama', 'Compression', 'Split'],
    },
  },
  thrusting_swords: {
    id: 'thrusting_swords', name: 'Thrusting Sword', description: 'Comments and reply content.',
    poise_weight: 8, research_weight: 0.25, base_damage_mult: 0.75,
    time_mod: 0.70,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'CommunitySpace'],
    content_transformations: {
      S:        ['Opposite', 'Critique', 'Similar', 'Follows'],
      A:        ['Compression', 'ZoomIn', 'Humor', 'Shock'],
      B:        ['Controversy', 'Analogy', 'Cliffhanger', 'Evidence'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Synthesis', 'Expansion', 'Narration'],
    },
  },
  heavy_thrusting: {
    id: 'heavy_thrusting', name: 'Heavy Thrusting Sword', description: 'In-depth analysis and commentary.',
    poise_weight: 12, research_weight: 0.25, base_damage_mult: 1.1,
    time_mod: 1.0,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'CommunitySpace'],
    content_transformations: {
      S:        ['Critique', 'Opposite', 'ZoomIn', 'Evidence'],
      A:        ['Intellectual', 'Expansion', 'DataDriven', 'Analogy'],
      B:        ['Technicalize', 'Narration', 'Controversy', 'FirstPrinciples'],
      Excluded: ['Viral', 'Fast', 'Shock', 'Drama', 'Cliffhanger', 'Humor'],
    },
  },
  curved_swords: {
    id: 'curved_swords', name: 'Curved Sword', description: 'Storytelling and narrative content.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 1.0,
    time_mod: 1.0,
    supported_products: [],
    content_transformations: {
      S:        ['Narration', 'Follows', 'Expansion', 'Analogy'],
      A:        ['Similar', 'Analogy', 'Passion', 'AudienceShift'],
      B:        ['ZoomIn', 'Comfort', 'Hope', 'Drama'],
      Excluded: ['DataDriven', 'FirstPrinciples', 'Segmentation', 'Technicalize', 'Shock', 'Controversy'],
    },
  },
  curved_greatswords: {
    id: 'curved_greatswords', name: 'Curved Greatsword', description: 'Epic series and narrative sagas.',
    poise_weight: 14, research_weight: 0.21, base_damage_mult: 1.4,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Follows', 'Narration', 'Expansion', 'Similar'],
      A:        ['Passion', 'Parasocial', 'Hope', 'Comfort'],
      B:        ['AudienceShift', 'Drama', 'Analogy', 'ZoomIn'],
      Excluded: ['Fast', 'Shock', 'Viral', 'DataDriven', 'FirstPrinciples', 'Segmentation', 'Compression'],
    },
  },
  twinblades: {
    id: 'twinblades', name: 'Twinblade', description: 'Multi-platform cross-posting.',
    poise_weight: 16, research_weight: 0.25, base_damage_mult: 0.9,
    time_mod: 1.0,
    supported_products: [],
    content_transformations: {
      S:        ['Similar', 'Compression', 'AudienceShift', 'Localize'],
      A:        ['Follows', 'RemixFusion', 'Split', 'Fast'],
      B:        ['Simplify', 'Segmentation', 'Viral', 'Compression'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Synthesis', 'Technicalize', 'Expansion', 'Socratic'],
    },
  },
  great_hammers: {
    id: 'great_hammers', name: 'Great Hammer', description: 'Manifestos and major opinion pieces.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 1.7,
    time_mod: 1.20,
    supported_products: ['Plaintext', 'StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    content_transformations: {
      S:        ['Opposite', 'Controversy', 'Critique', 'FirstPrinciples'],
      A:        ['FirstPrinciples', 'Expansion', 'ZoomOut', 'Passion'],
      B:        ['Evidence', 'DataDriven', 'Narration', 'Fear'],
      Excluded: ['Similar', 'Follows', 'Compression', 'Split', 'Fast', 'Cliffhanger', 'AudienceShift'],
    },
  },
  great_axes: {
    id: 'great_axes', name: 'Great Axe', description: 'Recaps, roundups, and year-in-review content.',
    poise_weight: 16, research_weight: 0.25, base_damage_mult: 1.35,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Synthesis', 'Similar', 'Compression', 'ZoomOut'],
      A:        ['Segmentation', 'Evidence', 'DataDriven', 'Follows'],
      B:        ['Split', 'AudienceShift', 'Narration', 'ZoomOut'],
      Excluded: ['Shock', 'Viral', 'Cliffhanger', 'Opposite', 'Controversy', 'Drama', 'Passion'],
    },
  },
  flails: {
    id: 'flails', name: 'Flail', description: 'Spontaneous and improv content.',
    poise_weight: 5, research_weight: 0.20, base_damage_mult: 0.95,
    time_mod: 0.70,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Follows', 'Passion', 'Humor', 'Similar'],
      A:        ['Similar', 'Opposite', 'Narration', 'Comfort'],
      B:        ['Wow', 'Viral', 'Drama', 'ZoomOut'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Evidence', 'Technicalize', 'Synthesis', 'Segmentation'],
    },
  },
  colossal_weapons: {
    id: 'colossal_weapons', name: 'Colossal Weapon', description: 'Mega-projects — documentaries, full series.',
    poise_weight: 18, research_weight: 0.22, base_damage_mult: 2.4,
    time_mod: 1.30,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'CinematicVideo', 'SlideshowVideo', 'MotionGraphics', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Synthesis', 'Narration', 'FirstPrinciples', 'Expansion'],
      A:        ['Expansion', 'Evidence', 'DataDriven', 'ZoomIn'],
      B:        ['Technicalize', 'AudienceShift', 'Analogy', 'Socratic'],
      Excluded: ['Fast', 'Viral', 'Shock', 'Cliffhanger', 'Humor', 'Compression', 'Split', 'Similar'],
    },
  },
  great_spears: {
    id: 'great_spears', name: 'Great Spear', description: 'Investigative content.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 1.25,
    time_mod: 1.10,
    supported_products: [],
    content_transformations: {
      S:        ['Evidence', 'DataDriven', 'Critique', 'ZoomIn'],
      A:        ['ZoomIn', 'Expansion', 'FirstPrinciples', 'Technicalize'],
      B:        ['DomainTransfer', 'Synthesis', 'Controversy', 'ZoomOut'],
      Excluded: ['Viral', 'Shock', 'Humor', 'Drama', 'Cliffhanger', 'Fast', 'Comfort', 'Follows'],
    },
  },
  halberds: {
    id: 'halberds', name: 'Halberd', description: 'Hybrid research and opinion.',
    poise_weight: 7, research_weight: 0.29, base_damage_mult: 1.1,
    time_mod: 0.90,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'SlideshowVideo', 'Screencast', 'MultimediaPage', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Evidence', 'Opposite', 'ZoomIn', 'Critique'],
      A:        ['DataDriven', 'Expansion', 'Analogy', 'Opposite'],
      B:        ['AudienceShift', 'FirstPrinciples', 'Narration', 'Synthesis'],
      Excluded: ['Viral', 'Fast', 'Shock', 'Cliffhanger', 'Drama', 'Humor'],
    },
  },
  reapers: {
    id: 'reapers', name: 'Reaper', description: 'Commentary, takedowns, and critiques.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 1.2,
    time_mod: 1.0,
    supported_products: ['StructuredText', 'IllustratedText', 'Carousel', 'RawAudio', 'SlideshowVideo', 'CurationFeed', 'ARollVideo'],
    content_transformations: {
      S:        ['Critique', 'Opposite', 'Controversy', 'Shock'],
      A:        ['Similar', 'Fear', 'Drama', 'Humor'],
      B:        ['Cliffhanger', 'ZoomIn', 'Evidence', 'Compression'],
      Excluded: ['Comfort', 'Hope', 'Follows', 'Synthesis', 'DataDriven', 'FirstPrinciples', 'AudienceShift'],
    },
  },
  whips: {
    id: 'whips', name: 'Whip', description: 'Series and content cycles.',
    poise_weight: 12, research_weight: 0.25, base_damage_mult: 0.9,
    time_mod: 1.0,
    supported_products: ['ARollVideo', 'CinematicVideo', 'SlideshowVideo', 'MotionGraphics', 'LiveStream'],
    content_transformations: {
      S:        ['Follows', 'Similar', 'Expansion', 'Narration'],
      A:        ['Narration', 'Passion', 'AudienceShift', 'Split'],
      B:        ['ZoomIn', 'Controversy', 'Opposite', 'RemixFusion'],
      Excluded: ['Shock', 'Viral', 'Fast', 'DataDriven', 'FirstPrinciples', 'Technicalize', 'Compression'],
    },
  },
  greatbows: {
    id: 'greatbows', name: 'Greatbow', description: 'Long-tail evergreen content.',
    poise_weight: 12, research_weight: 0.25, base_damage_mult: 1.6,
    time_mod: 1.20,
    supported_products: ['Carousel', 'BranchingNarrative', 'InteractiveApp', 'LiveStream', 'MultimediaPage', 'CommunitySpace', '_blank'],
    content_transformations: {
      S:        ['ProblemSolving', 'Simplify', 'AudienceShift', 'Analogy'],
      A:        ['Evidence', 'DataDriven', 'Analogy', 'Socratic'],
      B:        ['Follows', 'Narration', 'ZoomIn', 'FirstPrinciples'],
      Excluded: ['Shock', 'Viral', 'Cliffhanger', 'Drama', 'Fear', 'Controversy', 'Fast'],
    },
  },
  crossbows: {
    id: 'crossbows', name: 'Crossbow', description: 'Email blasts and push notifications.',
    poise_weight: 10, research_weight: 0.20, base_damage_mult: 0.85,
    time_mod: 0.85,
    supported_products: [],
    content_transformations: {
      S:        ['Compression', 'Fast', 'Cliffhanger', 'Similar'],
      A:        ['Follows', 'Shock', 'Viral', 'Fear'],
      B:        ['Opposite', 'Humor', 'Split', 'Controversy'],
      Excluded: ['FirstPrinciples', 'DataDriven', 'Synthesis', 'Technicalize', 'Expansion', 'Narration', 'Socratic'],
    },
  },
  ballistas: {
    id: 'ballistas', name: 'Ballista', description: 'Major product launches.',
    poise_weight: 14, research_weight: 0.29, base_damage_mult: 2.2,
    time_mod: 1.20,
    supported_products: ['StructuredText', 'IllustratedText', 'Infographic', 'ProducedAudio', 'SlideshowVideo', 'CinematicVideo', 'MotionGraphics', 'MultimediaPage', 'BranchingNarrative', 'AssetPack', 'CurationFeed', 'InteractiveApp', '_blank'],
    content_transformations: {
      S:        ['Evidence', 'DataDriven', 'ProblemSolving', 'Synthesis'],
      A:        ['Narration', 'Wow', 'Expansion', 'Analogy'],
      B:        ['AudienceShift', 'Technicalize', 'ZoomIn', 'Segmentation'],
      Excluded: ['Compression', 'Similar', 'Split', 'Follows', 'Shock', 'Viral', 'Drama', 'Opposite'],
    },
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
  },
}

export const ALL_WEAPON_CLASSES = Object.keys(WEAPON_CLASSES) as WeaponClass[]
