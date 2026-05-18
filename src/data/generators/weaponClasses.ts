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
}

export const ALL_WEAPON_CLASSES = Object.keys(WEAPON_CLASSES) as WeaponClass[]
