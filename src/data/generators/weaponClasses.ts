import type { WeaponClass, PoiseWeight } from '../../types/game'
import type { MovesetArchetype } from './atomicMove'

export interface WeaponClassDef {
  id: WeaponClass
  name: string                        // display name
  description: string
  poise_weight: PoiseWeight
  heat_threshold: number              // uses before cooldown
  base_damage_mult: number
  preferred_archetypes: MovesetArchetype[]
  scaling_primary: 'END' | 'MIND'
  scaling_grade: 'A' | 'B' | 'C' | 'D'
  light_archetype: MovesetArchetype
  heavy_archetype: MovesetArchetype
}

export const WEAPON_CLASSES: Record<WeaponClass, WeaponClassDef> = {
  daggers: {
    id: 'daggers', name: 'Dagger', description: 'Micro-content: tweets, shorts, quick reactions.',
    poise_weight: 'light', heat_threshold: 10, base_damage_mult: 0.7,
    preferred_archetypes: ['micro','hot_take','commentary'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'micro', heavy_archetype: 'hot_take',
  },
  straight_swords: {
    id: 'straight_swords', name: 'Straight Sword', description: 'Standard articles and blog posts.',
    poise_weight: 'medium', heat_threshold: 7, base_damage_mult: 1.0,
    preferred_archetypes: ['long_form','commentary','research'],
    scaling_primary: 'END', scaling_grade: 'B',
    light_archetype: 'micro', heavy_archetype: 'long_form',
  },
  greatswords: {
    id: 'greatswords', name: 'Greatsword', description: 'Long-form essays and deep dives.',
    poise_weight: 'heavy', heat_threshold: 4, base_damage_mult: 1.5,
    preferred_archetypes: ['long_form','storytelling','research'],
    scaling_primary: 'END', scaling_grade: 'A',
    light_archetype: 'compression', heavy_archetype: 'long_form',
  },
  katanas: {
    id: 'katanas', name: 'Katana', description: 'Polished craft pieces — quality over quantity.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 1.1,
    preferred_archetypes: ['long_form','storytelling','editing'],
    scaling_primary: 'MIND', scaling_grade: 'B',
    light_archetype: 'hot_take', heavy_archetype: 'long_form',
  },
  hammers: {
    id: 'hammers', name: 'Hammer', description: 'Hot takes and opinion pieces.',
    poise_weight: 'heavy', heat_threshold: 5, base_damage_mult: 1.3,
    preferred_archetypes: ['hot_take','commentary'],
    scaling_primary: 'END', scaling_grade: 'B',
    light_archetype: 'hot_take', heavy_archetype: 'commentary',
  },
  spears: {
    id: 'spears', name: 'Spear', description: 'Research-driven content.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 1.0,
    preferred_archetypes: ['research','long_form'],
    scaling_primary: 'MIND', scaling_grade: 'C',
    light_archetype: 'research', heavy_archetype: 'long_form',
  },
  axes: {
    id: 'axes', name: 'Axe', description: 'Editing and compression of existing content.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 0.9,
    preferred_archetypes: ['editing','compression','remix'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'compression', heavy_archetype: 'editing',
  },
  bows: {
    id: 'bows', name: 'Bow', description: 'Async content — newsletters, scheduled posts.',
    poise_weight: 'light', heat_threshold: 5, base_damage_mult: 0.85,
    preferred_archetypes: ['async','research'],
    scaling_primary: 'MIND', scaling_grade: 'D',
    light_archetype: 'async', heavy_archetype: 'long_form',
  },
  fists: {
    id: 'fists', name: 'Fists', description: 'Raw BTS content and vlogs.',
    poise_weight: 'light', heat_threshold: 12, base_damage_mult: 0.65,
    preferred_archetypes: ['micro','hot_take','commentary'],
    scaling_primary: 'END', scaling_grade: 'D',
    light_archetype: 'micro', heavy_archetype: 'commentary',
  },
  colossal_swords: {
    id: 'colossal_swords', name: 'Colossal Sword', description: 'Books, courses, and long-form products.',
    poise_weight: 'colossal', heat_threshold: 2, base_damage_mult: 2.2,
    preferred_archetypes: ['long_form','storytelling'],
    scaling_primary: 'END', scaling_grade: 'A',
    light_archetype: 'compression', heavy_archetype: 'long_form',
  },
  thrusting_swords: {
    id: 'thrusting_swords', name: 'Thrusting Sword', description: 'Comments and reply content.',
    poise_weight: 'light', heat_threshold: 10, base_damage_mult: 0.75,
    preferred_archetypes: ['micro','commentary'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'micro', heavy_archetype: 'hot_take',
  },
  heavy_thrusting: {
    id: 'heavy_thrusting', name: 'Heavy Thrusting Sword', description: 'In-depth analysis and commentary.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 1.1,
    preferred_archetypes: ['research','commentary'],
    scaling_primary: 'MIND', scaling_grade: 'B',
    light_archetype: 'commentary', heavy_archetype: 'research',
  },
  curved_swords: {
    id: 'curved_swords', name: 'Curved Sword', description: 'Storytelling and narrative content.',
    poise_weight: 'medium', heat_threshold: 7, base_damage_mult: 1.0,
    preferred_archetypes: ['storytelling','long_form'],
    scaling_primary: 'END', scaling_grade: 'B',
    light_archetype: 'micro', heavy_archetype: 'storytelling',
  },
  curved_greatswords: {
    id: 'curved_greatswords', name: 'Curved Greatsword', description: 'Epic series and narrative sagas.',
    poise_weight: 'heavy', heat_threshold: 4, base_damage_mult: 1.4,
    preferred_archetypes: ['storytelling','long_form'],
    scaling_primary: 'END', scaling_grade: 'A',
    light_archetype: 'compression', heavy_archetype: 'storytelling',
  },
  twinblades: {
    id: 'twinblades', name: 'Twinblade', description: 'Multi-platform cross-posting.',
    poise_weight: 'medium', heat_threshold: 7, base_damage_mult: 0.9,
    preferred_archetypes: ['remix','micro'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'micro', heavy_archetype: 'remix',
  },
  great_hammers: {
    id: 'great_hammers', name: 'Great Hammer', description: 'Manifestos and major opinion pieces.',
    poise_weight: 'heavy', heat_threshold: 3, base_damage_mult: 1.7,
    preferred_archetypes: ['hot_take','commentary'],
    scaling_primary: 'END', scaling_grade: 'A',
    light_archetype: 'hot_take', heavy_archetype: 'hot_take',
  },
  great_axes: {
    id: 'great_axes', name: 'Great Axe', description: 'Recaps, roundups, and year-in-review content.',
    poise_weight: 'heavy', heat_threshold: 4, base_damage_mult: 1.35,
    preferred_archetypes: ['compression','editing','remix'],
    scaling_primary: 'END', scaling_grade: 'B',
    light_archetype: 'compression', heavy_archetype: 'editing',
  },
  flails: {
    id: 'flails', name: 'Flail', description: 'Spontaneous and improv content.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 0.95,
    preferred_archetypes: ['micro','hot_take'],
    scaling_primary: 'END', scaling_grade: 'D',
    light_archetype: 'micro', heavy_archetype: 'hot_take',
  },
  colossal_weapons: {
    id: 'colossal_weapons', name: 'Colossal Weapon', description: 'Mega-projects — documentaries, full series.',
    poise_weight: 'colossal', heat_threshold: 2, base_damage_mult: 2.4,
    preferred_archetypes: ['long_form','storytelling'],
    scaling_primary: 'END', scaling_grade: 'A',
    light_archetype: 'compression', heavy_archetype: 'long_form',
  },
  great_spears: {
    id: 'great_spears', name: 'Great Spear', description: 'Investigative content.',
    poise_weight: 'heavy', heat_threshold: 4, base_damage_mult: 1.25,
    preferred_archetypes: ['research','long_form'],
    scaling_primary: 'MIND', scaling_grade: 'B',
    light_archetype: 'research', heavy_archetype: 'research',
  },
  halberds: {
    id: 'halberds', name: 'Halberd', description: 'Hybrid research and opinion.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 1.1,
    preferred_archetypes: ['research','commentary'],
    scaling_primary: 'MIND', scaling_grade: 'C',
    light_archetype: 'commentary', heavy_archetype: 'research',
  },
  reapers: {
    id: 'reapers', name: 'Reaper', description: 'Commentary, takedowns, and critiques.',
    poise_weight: 'heavy', heat_threshold: 4, base_damage_mult: 1.2,
    preferred_archetypes: ['commentary','hot_take'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'hot_take', heavy_archetype: 'commentary',
  },
  whips: {
    id: 'whips', name: 'Whip', description: 'Series and content cycles.',
    poise_weight: 'medium', heat_threshold: 7, base_damage_mult: 0.9,
    preferred_archetypes: ['async','storytelling'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'async', heavy_archetype: 'storytelling',
  },
  greatbows: {
    id: 'greatbows', name: 'Greatbow', description: 'Long-tail evergreen content.',
    poise_weight: 'colossal', heat_threshold: 2, base_damage_mult: 1.6,
    preferred_archetypes: ['async','research'],
    scaling_primary: 'MIND', scaling_grade: 'C',
    light_archetype: 'async', heavy_archetype: 'async',
  },
  crossbows: {
    id: 'crossbows', name: 'Crossbow', description: 'Email blasts and push notifications.',
    poise_weight: 'medium', heat_threshold: 6, base_damage_mult: 0.85,
    preferred_archetypes: ['micro','async'],
    scaling_primary: 'END', scaling_grade: 'C',
    light_archetype: 'async', heavy_archetype: 'micro',
  },
  ballistas: {
    id: 'ballistas', name: 'Ballista', description: 'Major product launches.',
    poise_weight: 'colossal', heat_threshold: 2, base_damage_mult: 2.2,
    preferred_archetypes: ['long_form','async'],
    scaling_primary: 'MIND', scaling_grade: 'A',
    light_archetype: 'async', heavy_archetype: 'long_form',
  },
  torches: {
    id: 'torches', name: 'Torch', description: 'Lifestyle and lo-fi vlog content.',
    poise_weight: 'light', heat_threshold: 12, base_damage_mult: 0.6,
    preferred_archetypes: ['micro','hot_take'],
    scaling_primary: 'END', scaling_grade: 'D',
    light_archetype: 'micro', heavy_archetype: 'commentary',
  },
}

export const ALL_WEAPON_CLASSES = Object.keys(WEAPON_CLASSES) as WeaponClass[]
