export type Locale = 'pl' | 'en'
export type StatKey = 'VIG' | 'END' | 'MND' | 'STR' | 'DEX' | 'INT' | 'FAI' | 'ARC'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
export type WeaponRarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary'
export type SublocationType = 'mob' | 'elite' | 'event' | 'boss'
export type MoveType = 'Light' | 'Heavy'

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
export type AtomicStage = 'Research' | 'Plan' | 'Produce' | 'Refine' | 'Publish' | 'Promote'
export type AtomicOrigin =
  | 'New' | 'Compression' | 'Expansion' | 'Recycled' | 'Remastered'
  | 'Revamped' | 'Reboot' | 'ZoomIn' | 'ZoomOut' | 'AudienceAlter' | 'Commentary'
  | 'Similar' | 'Opposite'
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
  type: AtomicStage
  name: string
  time_light: number   // seconds for Light Attack timer
  time_heavy: number   // seconds for Heavy Attack timer
  content_type?: ContentProductType
  content_origin?: AtomicOrigin
  damage_type?: DamageType
  status?: StatusType
  time_budget?: AtomicTime
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

// ── Content pipeline ──────────────────────────────────────────────────────
export interface ContentItem {
  id: string
  name: string
  notes?: string
  completed?: boolean
  remaster_count?: number
  is_remastering?: boolean
  attached_weapon_id?: string
  // Snapshot of the workflow structure last completed for this item — reused
  // by a remaster pass to keep the same tile shape and only redraw content
  // type / transformation / style / emotion.
  last_workflow?: WorkflowGraph
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
  // Enemy ids whose mob curse wasn't lifted before the fight ended; carries
  // into the next encounter this run, reset to [] on a new run.
  incoming_curses: string[]
  // Active workflow (persisted across mob fights until all tiles done or abandoned)
  active_workflow: WorkflowGraph | null
  active_content_id: string | null
  // Epoch ms of the last boss kill, for the boss-rush damage bonus
  last_boss_kill_at: number | null
  // Content pipeline
  content_items: ContentItem[]
  // Analytics
  total_task_time_s: number
  // UI locale
  locale: Locale
}
