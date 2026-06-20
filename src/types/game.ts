export type Locale = 'pl' | 'en'
export type StatKey = 'VIG' | 'END' | 'MND' | 'STR' | 'DEX' | 'INT' | 'FAI' | 'ARC'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
export type WeaponRarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary'
export type SublocationType = 'mob' | 'elite' | 'event' | 'boss'
export type MoveType = 'Light' | 'Heavy' | 'Jump'
export type TileType = 'research' | 'outline' | 'draft' | 'edit' | 'publish' | 'promote'

// Kept for content pipeline stamps and badge colours
export type DamageType =
  | 'standard' | 'strike' | 'slash' | 'pierce' | 'lightning'
  | 'fire' | 'magic' | 'holy' | 'occult' | 'grafting' | 'poison'

export type StatusType =
  | 'bleed' | 'scarlet_rot' | 'frostbite' | 'madness' | 'sleep'
  | 'death_blight' | 'glintstone' | 'frenzy_flame' | 'devotion'
  | 'yearning' | 'dread' | 'murmur' | 'grace'

export type WeaponClass =
  | 'daggers' | 'straight_swords' | 'greatswords' | 'katanas'
  | 'hammers' | 'spears' | 'axes' | 'bows' | 'fists'
  | 'colossal_swords' | 'thrusting_swords' | 'heavy_thrusting'
  | 'curved_swords' | 'curved_greatswords' | 'twinblades'
  | 'great_hammers' | 'great_axes' | 'flails' | 'colossal_weapons'
  | 'great_spears' | 'halberds' | 'reapers' | 'whips'
  | 'greatbows' | 'crossbows' | 'ballistas' | 'torches'

// ── Content creation dimensions (kept for tile generation & stamps) ────────
export type AtomicStage = 'Research' | 'Outline' | 'Produce' | 'Glue' | 'Refine' | 'Publish'
export type AtomicOrigin =
  | 'New' | 'Compression' | 'Expansion' | 'Recycled' | 'Remastered'
  | 'Revamped' | 'Reboot' | 'ZoomIn' | 'ZoomOut' | 'AudienceAlter' | 'Commentary'
export type AtomicTime = 'Micro' | 'Short' | 'Medium' | 'Long' | 'Deep'

import type { ContentProductType } from '../data/contentProducts'
export type { ContentProductType }

export interface AtomicDimensions {
  product: ContentProductType
  stage: AtomicStage
  time_budget: AtomicTime
  content_origin: AtomicOrigin
}

// ── Workflow graph ─────────────────────────────────────────────────────────
export interface WorkflowTile {
  id: string
  type: TileType
  name: string
  time_light: number   // seconds for Light Attack timer
  time_heavy: number   // seconds for Heavy Attack timer
  content_type?: string
  is_completed: boolean
  repeat_count: number
}

export interface WorkflowEdge {
  from: string
  to: string
}

export interface WorkflowGraph {
  tiles: WorkflowTile[]
  edges: WorkflowEdge[]
  start_id: string
  end_id: string
}

// ── Weapon (now a workflow template) ──────────────────────────────────────
export interface Affix {
  id: string
  label: string
  damage_mult?: number
  stamina_mult?: number
  fp_mult?: number
}

export interface Weapon {
  name: string
  description: string
  stat_req: Partial<Record<StatKey, number>>
  scaling: Partial<Record<StatKey, Grade>>
}

export interface WeaponInstance extends Weapon {
  instance_id: string
  weapon_class: WeaponClass
  rarity: WeaponRarity
  affixes: Affix[]
  base_damage_mult: number
  // kept for WeaponSprite rendering
  poise_weight?: 'light' | 'medium' | 'heavy' | 'colossal'
}

// ── Enemy (simplified — no attack movesets) ───────────────────────────────
export interface EnemyDrop {
  id: string
  first_kill_chance: number
  repeat_chance: number
}

export interface Enemy {
  name: string
  description: string
  max_hp: number
  rune_reward: number
  is_boss: boolean
  is_remembrance?: boolean
  unlocks_area?: string
  drops: EnemyDrop[]
  // Legacy fields kept for display compat; not used in combat logic
  initiative?: number
  max_poise?: number
  status_multipliers?: Partial<Record<StatusType, number>>
  weaknesses?: DamageType[]
  resistances?: DamageType[]
  moveset?: string[]
}

// ── Combat phases ─────────────────────────────────────────────────────────
export type CombatPhase = 'PLAYER_TURN' | 'STEP_TIMER' | 'VICTORY' | 'DEFEAT' | 'FLED'

// ── Step (kept for TimerOverlay & tile display) ───────────────────────────
export interface StepBadge {
  label: string
  detail: string
  color?: string
  tr_key?: string
  tr_detail_key?: string
}

export interface Step {
  name: string
  time: number
  base_damage: number
  poise_damage: number
  damage_type?: DamageType
  stage?: AtomicStage
  badges?: StepBadge[]
}

// ── Location ──────────────────────────────────────────────────────────────
export interface LocationData {
  enemy_id: string
  name: string
  mult: number
  tier: number
  sublocation_type: SublocationType
  event_type?: string
  boss_name?: string
}

// ── Player stats ─────────────────────────────────────────────────────────
export interface Stats {
  VIG: number; END: number; MND: number
  STR: number; DEX: number; INT: number; FAI: number; ARC: number
}

// ── Learning items ────────────────────────────────────────────────────────
export interface LearningItem {
  id: string
  name: string
  completed_at?: number
}

// ── Content pipeline ──────────────────────────────────────────────────────
export type ContentPhase =
  | 'Research' | 'Outline' | 'Produce' | 'Glue'
  | 'Refine' | 'Publish' | 'Published'

export interface ContentItem {
  id: string
  name: string
  phase: ContentPhase
  published_at?: number
  notes?: string
  stamped_product?: ContentProductType
  stamped_origin?: AtomicOrigin
  stamped_status?: StatusType
  stamped_style?: DamageType
}

// ── Game state ────────────────────────────────────────────────────────────
export interface GameState {
  stats: Stats
  player_class: string
  total_levels_spent: number
  // Rune economy
  runes: number
  lost_runes: number
  lost_rune_location: string
  lost_rune_node_index: number
  // Weapon inventory
  owned_weapons: string[]
  weapon_instances: WeaponInstance[]
  equipped_run_weapons: string[]
  weapon_level: Record<string, number>
  // Player resources
  current_hp: number
  current_stamina: number
  current_fp: number
  // Run state
  run_count: number
  run_active: boolean
  run_location_sequence: LocationData[]
  run_current_index: number
  run_start_time: number
  run_duration_seconds: number
  run_estus_count: number
  run_defeated_enemies: string[]
  pending_encounter: LocationData | null
  pending_run_reward: string
  run_location_name: string
  completed_locations: string[]
  // Workflow abandon penalty (0.0 = none, resets after workflow completion)
  abandon_penalty: number
  // Content pipeline
  content_items: ContentItem[]
  // Learning items
  learning_items: LearningItem[]
  // Analytics
  total_task_time_s: number
  // UI locale
  locale: Locale
}
