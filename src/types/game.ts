export type Locale = 'pl' | 'en'
export type StatKey = 'VIG' | 'END' | 'TEXT' | 'VIDEO' | 'AUDIO' | 'GRAPHIC' | 'VELOCITY' | 'DEPTH' | 'PARASOCIAL' | 'FRICTION' | 'INSIGHT'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
export type WeaponRarity = 'common' | 'Intellectual' | 'rare' | 'epic' | 'legendary'
export type SublocationType = 'mob' | 'elite' | 'event' | 'boss'
export type MoveType = 'Light' | 'Heavy'

// Kept for content pipeline stamps and badge colours
export type StyleType =
  | 'Minimalism' | 'Shock' | 'Narration' | 'Segmentation' | 'Fast'
  | 'Passion' | 'Intellectual' | 'ProblemSolving' | 'Estetic' | 'Interactive' | 'Cliffhanger'
  | 'Viral' | 'Controversy' | 'Comfort' | 'Drama' | 'Humor'
  | 'Parasocial' | 'Wow' | 'Hope' | 'Fear' | 'Desire'

export type EmotionType =
  | 'Viral' | 'Polarization' | 'Envy' | 'Controversion' | 'Comfort'
  | 'Drama' | 'Wow' | 'Humor' | 'Parasocial'
  | 'Fomo' | 'Fear' | 'Rumor' | 'Hope'

export type WeaponClass =
  | 'daggers' | 'straight_swords' | 'greatswords' | 'katanas'
  | 'hammers' | 'spears' | 'axes' | 'bows' | 'fists'
  | 'colossal_swords' | 'thrusting_swords' | 'heavy_thrusting'
  | 'curved_swords' | 'curved_greatswords' | 'twinblades'
  | 'great_hammers' | 'great_axes' | 'flails' | 'colossal_weapons'
  | 'great_spears' | 'halberds' | 'reapers' | 'whips'
  | 'greatbows' | 'crossbows' | 'ballistas' | 'torches'

// ── Content creation dimensions (kept for tile generation & stamps) ────────
export type AtomicStage = 'Research' | 'Plan' | 'Produce' | 'Refine'
export type AtomicOrigin =
  | 'New' | 'Compression' | 'Expansion'
  | 'ZoomIn' | 'ZoomOut' | 'Similar' | 'Opposite'
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
  style_type?: StyleType
  status?: EmotionType
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
}

export interface Weapon {
  name: string
  description: string
  stat_req: Partial<Record<StatKey, number>>
  scaling: Partial<Record<StatKey, Grade>>
}

// All draws a weapon instance's pattern can make (Format/Transformation/
// Style/Emotion/Length), rolled once at weapon-creation time and never
// re-rolled per fight. Format/Transformation/Style/Emotion each hold a
// fixed sequence of states per occurrence — state 0 ("primary") is used
// for normal content, states 1..N for the 1st..Nth remaster of attached
// content (see WeaponClassDef.remaster_steps). Length has no remaster-state
// sequence — a single fixed value used everywhere. When a draw occurs once
// per path inside the same branch() (e.g. halberds' 3 parallel Style
// draws), its occurrences are redrawn together as one group on the
// round-robin's turn rather than independently — see patternSlots.ts.
export interface RolledPatternDraws {
  format:         (ContentProductType | null)[][]   // [occurrenceIndex][stateIndex]
  transformation: (AtomicOrigin | null)[][]   // [occurrenceIndex][stateIndex]
  style:          (StyleType   | null)[][]   // [occurrenceIndex][stateIndex]
  emotion:        (EmotionType   | null)[][]   // [occurrenceIndex][stateIndex]
  length: AtomicTime
}

export interface WeaponInstance extends Weapon {
  instance_id: string
  weapon_class: WeaponClass
  rarity: WeaponRarity
  affixes: Affix[]
  base_damage_mult: number
  // kept for WeaponSprite rendering
  poise_weight?: 'light' | 'medium' | 'heavy' | 'colossal'
  // absent on legacy saves predating this feature — consumers fall back
  // to the old per-call random roll whenever this is undefined
  rolled_draws?: RolledPatternDraws
}

// ── Enemy affinity system ─────────────────────────────────────────────────
export interface MobAffinityConditions {
  products?: ContentProductType[]
  origins?: AtomicOrigin[]
  styles?: StyleType[]
  emotions?: EmotionType[]
  stages?: AtomicStage[]
}

export interface MobAffinities {
  love?: MobAffinityConditions    // ×2.0
  like?: MobAffinityConditions    // ×1.5
  dislike?: MobAffinityConditions // ×0.7
  hate?: MobAffinityConditions    // ×0.5
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
  affinities?: MobAffinities
  boss_name?: string
}

// ── Combat phases ─────────────────────────────────────────────────────────
export type CombatPhase = 'PLAYER_TURN' | 'STEP_TIMER' | 'VICTORY' | 'DEFEAT' | 'FLED'

// ── Location ──────────────────────────────────────────────────────────────
export type LocationTheme =
  | 'text' | 'video' | 'audio' | 'graphic'
  | 'research' | 'social' | 'deadline'

export interface LocationData {
  enemy_id: string
  name: string
  mult: number
  tier: number
  sublocation_type: SublocationType
  event_type?: string
  boss_name?: string
  locationTheme?: LocationTheme
}

// ── Player stats ─────────────────────────────────────────────────────────
export interface Stats {
  VIG: number; END: number
  TEXT: number; VIDEO: number; AUDIO: number; GRAPHIC: number
  VELOCITY: number; DEPTH: number; PARASOCIAL: number; FRICTION: number; INSIGHT: number
}

// ── Content campaign ──────────────────────────────────────────────────────
export interface CampaignNode {
  id: string
  name: string                  // player-editable content piece title
  completed: boolean            // marked done after one workflow cycle
  published: boolean            // user manually marks after completed
  superhit_used?: boolean       // true once the one-time Superhit has been fired for this node
  last_workflow?: WorkflowGraph // snapshot for remaster regeneration
  remaster_count?: number
  is_remastering?: boolean
}

export interface CampaignEdge {
  from_id: string
  to_id: string
  label: AtomicOrigin | StyleType | null  // null = chronological/follows
}

export interface WeaponCampaign {
  id: string
  nodes: CampaignNode[]
  edges: CampaignEdge[]
  created_at: number
  completed: boolean            // >= 60% of nodes published
  campaign_name?: string        // player-editable title
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
  weapon_level: Record<string, number>
  // Player resources
  current_hp: number
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
  // Active workflow (persisted across mob fights until all tiles done or abandoned)
  active_workflow: WorkflowGraph | null
  active_content_id: string | null
  // Content campaigns (per weapon instance)
  weapon_campaigns: Record<string, WeaponCampaign>
  // Completed campaigns saved for re-use across weapons
  campaign_library: WeaponCampaign[]
  // Analytics
  total_task_time_s: number
  last_fight_ended_at?: number   // epoch ms; updated on fight VICTORY, used to compute flow mult
  // UI locale
  locale: Locale
}
