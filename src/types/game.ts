export type StatKey = 'VIG' | 'END' | 'MIND'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
export type StatusType = 'bleed' | 'frost' | 'madness' | 'scarlet_rot'
export type DefenseAction = 'roll' | 'block' | 'parry' | 'take' | 'flee'

// ── Weapon generation types ────────────────────────────────────────────────
export type WeaponRarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary'

export type WeaponClass =
  | 'daggers' | 'straight_swords' | 'greatswords' | 'katanas'
  | 'hammers' | 'spears' | 'axes' | 'bows' | 'fists'

export type PoiseWeight = 'light' | 'medium' | 'heavy' | 'colossal'

export type SublocationType = 'mob' | 'elite' | 'event' | 'boss'

export interface Affix {
  id: string
  label: string
  damage_mult?: number
  stamina_mult?: number
  fp_mult?: number
  xp_mult?: number
  poise_mult?: number
}

// A generated weapon instance — stored in GameState and in the WEAPONS registry
export interface WeaponInstance extends Weapon {
  instance_id: string          // UUID key used everywhere
  weapon_class: WeaponClass
  rarity: WeaponRarity
  affixes: Affix[]
  skill_slots: number          // Ash-of-War slots from rarity
  heat_threshold: number
  poise_weight: PoiseWeight
}

// ── Atomic move / moveset generation types ─────────────────────────────────
export type AtomicMedium    = 'Writing' | 'Audio' | 'Video' | 'Image' | 'Design' | 'Outline' | 'Hybrid'
export type AtomicMode      = 'Creating' | 'Consuming' | 'Connecting' | 'Commentary' | 'Compressing' | 'Expanding' | 'Remixing'
export type AtomicStage     = 'Ideate' | 'Outline' | 'Draft' | 'Produce' | 'Refine' | 'Publish' | 'Repurpose' | 'Consume' | 'React' | 'Connect'
export type AtomicTime      = 'Micro' | 'Short' | 'Medium' | 'Long' | 'Deep'
export type AtomicPub       = 'just_work' | 'private' | 'draft_published' | 'public'
export type AtomicOrigin    = 'New' | 'Compression' | 'Expansion' | 'Recycled' | 'Remastered' | 'Revamped' | 'Reboot'
export type AtomicPlanning  = 'Spontaneous' | 'Planned' | 'Scheduled'
export type MovesetVariant  = 'Light' | 'Heavy' | 'Skill' | 'Jump'

export interface AtomicDimensions {
  medium:        AtomicMedium
  cognitive_mode: AtomicMode
  stage:         AtomicStage
  time_budget:   AtomicTime
  publication:   AtomicPub
  content_origin: AtomicOrigin
  planning:      AtomicPlanning
}

// Pipeline: what the full chain looks like; level filters which steps show
export interface MovesetPipeline {
  all_steps:   Step[]    // complete sequence (e.g. Outline→Draft→Refine→Publish)
  unlocked_at: number[]  // all_steps[i] appears from this moveset level
  drops_at:    number[]  // all_steps[i] disappears ("masz w głowie") from this level; 0 = never drops
}

// Extended Moveset with generation metadata
export interface GeneratedMoveset extends Moveset {
  rarity:        WeaponRarity
  variant_type:  MovesetVariant
  weapon_class?: WeaponClass
  pipeline:      MovesetPipeline
}
export type CombatPhase =
  | 'INIT' | 'PLAYER_ATTACK' | 'STEP_TIMER'
  | 'ENEMY_ATTACK' | 'ENEMY_STAGGERED' | 'VICTORY' | 'DEFEAT'

export interface Step {
  name: string
  time: number
  base_damage: number
  poise_damage: number
}

export interface Task {
  name: string
  time: number
}

export interface Moveset {
  id: string
  name: string
  scaling_stat: StatKey
  stamina_cost: number
  fp_cost?: number
  types: string[]
  steps: Step[]
}

export interface EnemyMove {
  id: string
  name: string
  description: string
  damage: number
  block_damage: number
  poise_damage: number
  dodge_task: Task
  parry_task: Task
}

export interface EnemyDrop {
  id: string
  first_kill_chance: number
  repeat_chance: number
}

export interface Enemy {
  name: string
  description: string
  max_hp: number
  initiative: number
  max_poise: number
  rune_reward: number
  is_boss: boolean
  is_remembrance?: boolean
  unlocks_area?: string
  drops: EnemyDrop[]
  status_multipliers: Partial<Record<StatusType, number>>
  moveset: string[]
}

export interface Weapon {
  name: string
  description: string
  stat_req: Partial<Record<StatKey, number>>
  scaling: Partial<Record<StatKey, Grade>>
  constant_movesets: string[]
  moveset_slots: number
  xp_thresholds: number[]
  defense_movesets: { block: string; parry: string }
}

export interface LocationData {
  enemy_id: string
  name: string
  mult: number
  sublocation_type: SublocationType
  event_type?: string   // 'site_of_grace' | 'trial'
}

export interface Stats {
  VIG: number
  END: number
  MIND: number
  [key: string]: number
}

export interface GameState {
  stats: Stats
  level: number
  // Weapon inventory — owned_weapons holds instance_ids; weapon_instances holds the full objects
  owned_weapons: string[]
  weapon_instances: WeaponInstance[]
  equipped_run_weapons: string[]
  weapon_xp: Record<string, number>    // kill points (3/mob, 8/boss)
  weapon_level: Record<string, number> // upgrade level 0-10
  weapon_extra_movesets: Record<string, string[]>
  // Moveset inventory — standalone drops separate from weapons
  owned_movesets: string[]
  moveset_instances: GeneratedMoveset[]
  // Moveset progression — independent of weapon level
  moveset_xp: Record<string, number>    // accumulated step.time seconds per moveset
  moveset_level: Record<string, number> // 1-10 per moveset id
  current_hp: number
  current_stamina: number
  current_fp: number
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
  weapon_cooldown: Record<string, number>   // instance_id → runs remaining on cooldown
  run_location_name: string
}
