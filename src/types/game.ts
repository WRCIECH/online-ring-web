export type StatKey = 'VIG' | 'END' | 'MND' | 'STR' | 'DEX' | 'INT' | 'FAI' | 'ARC'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'

export type DamageType =
  | 'standard' | 'strike' | 'slash' | 'pierce' | 'lightning'
  | 'fire' | 'magic' | 'holy' | 'occult' | 'grafting' | 'poison'

export type StatusType =
  | 'bleed' | 'scarlet_rot' | 'frostbite' | 'madness' | 'sleep'
  | 'death_blight' | 'glintstone' | 'frenzy_flame' | 'devotion'
  | 'yearning' | 'dread' | 'murmur' | 'grace'

export type DefenseAction = 'roll' | 'block' | 'parry' | 'take' | 'flee'

// ── Weapon generation types ────────────────────────────────────────────────
export type WeaponRarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary'

export type WeaponClass =
  | 'daggers' | 'straight_swords' | 'greatswords' | 'katanas'
  | 'hammers' | 'spears' | 'axes' | 'bows' | 'fists'
  | 'colossal_swords' | 'thrusting_swords' | 'heavy_thrusting'
  | 'curved_swords' | 'curved_greatswords' | 'twinblades'
  | 'great_hammers' | 'great_axes' | 'flails' | 'colossal_weapons'
  | 'great_spears' | 'halberds' | 'reapers' | 'whips'
  | 'greatbows' | 'crossbows' | 'ballistas' | 'torches'

export type PoiseWeight = 'light' | 'medium' | 'heavy' | 'colossal'

export type SublocationType = 'mob' | 'elite' | 'event' | 'boss'

export interface Affix {
  id: string
  label: string
  damage_mult?: number
  stamina_mult?: number
  fp_mult?: number
  poise_mult?: number
}

// A generated weapon instance — stored in GameState and in the WEAPONS registry
export interface WeaponInstance extends Weapon {
  instance_id: string
  weapon_class: WeaponClass
  rarity: WeaponRarity
  affixes: Affix[]
  skill_slots: number
  heat_threshold: number
  poise_weight: PoiseWeight
  base_damage_mult: number
  numeric_weight?: number
  poise_value?: number
  scaling_original?: Partial<Record<StatKey, Grade>>
}

// ── Atomic move / moveset generation types ─────────────────────────────────
export type AtomicMedium    = 'Writing' | 'Audio' | 'Video' | 'Image' | 'Hybrid'
export type AtomicMode      = 'Creating' | 'Consuming' | 'Connecting' | 'Commentary' | 'Compressing' | 'Expanding' | 'Remixing'
export type AtomicStage     = 'Research' | 'Outline' | 'Produce' | 'Glue' | 'Refine' | 'Publish'
export type AtomicTime      = 'Micro' | 'Short' | 'Medium' | 'Long' | 'Deep'
export type AtomicPub       = 'just_work' | 'private' | 'draft_published' | 'public'
export type AtomicOrigin    = 'New' | 'Compression' | 'Expansion' | 'Recycled' | 'Remastered' | 'Revamped' | 'Reboot' | 'ZoomIn' | 'ZoomOut' | 'AudienceAlter' | 'Commentary'
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

// Pipeline kept for structural compatibility but no longer used for level-gating
export interface MovesetPipeline {
  all_steps:   Step[]
  unlocked_at: number[]
  drops_at:    number[]
}

// Extended Moveset with generation metadata
export interface GeneratedMoveset extends Moveset {
  rarity:               WeaponRarity
  variant_type:         MovesetVariant
  weapon_class?:        WeaponClass
  pipeline:             MovesetPipeline
  primary_damage_type?: DamageType
  status_buildup?:      StatusType
  infusion?:            Partial<Record<StatKey, Grade>>
  content_origin?:      AtomicOrigin
  dominant_medium?:     AtomicMedium   // characteristic medium of this moveset
}

export type CombatPhase =
  | 'INIT' | 'PLAYER_ATTACK' | 'STEP_TIMER'
  | 'ENEMY_ATTACK' | 'ENEMY_STAGGERED' | 'VICTORY' | 'DEFEAT' | 'FLED'

export interface StepBadge {
  label:  string   // Short chip text, e.g. "Generate", "Fiery", "Audio"
  detail: string   // Tooltip explanation shown on hover
  color?: string   // Optional accent color (used for damage-type badges)
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
  publish_task: Task
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
  weaknesses: DamageType[]
  resistances: DamageType[]
  moveset: string[]
}

export interface Weapon {
  name: string
  description: string
  stat_req: Partial<Record<StatKey, number>>
  scaling: Partial<Record<StatKey, Grade>>
  constant_movesets: string[]
  moveset_slots: number
  defense_movesets: { block: string }
}

export interface LocationData {
  enemy_id: string
  name: string
  mult: number
  sublocation_type: SublocationType
  event_type?: string
  boss_name?: string
}

export interface Stats {
  VIG: number
  END: number
  MND: number
  STR: number
  DEX: number
  INT: number
  FAI: number
  ARC: number
}

// ── Content pipeline ──────────────────────────────────────────────────────
export type ContentPhase =
  | 'Research' | 'Outline' | 'Produce' | 'Glue'
  | 'Refine'   | 'Publish' | 'Published'

export interface ContentItem {
  id:            string     // uid, e.g. 'c_abc123'
  name:          string     // user-defined title
  phase:         ContentPhase
  published_at?: number     // Date.now() when phase → 'Published'
  notes?:        string     // optional rough notes
  // Stamps applied on first task completion (lock the article's character)
  stamped_medium?: AtomicMedium    // from moveset's dominant_medium
  stamped_origin?: AtomicOrigin    // from moveset's content_origin
  stamped_status?: StatusType      // from moveset's status_buildup (emotional fingerprint)
}

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
  weapon_extra_movesets: Record<string, string[]>
  weapon_cooldown: Record<string, number>
  // Moveset inventory
  owned_movesets: string[]
  moveset_instances: GeneratedMoveset[]
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
  run_start_owned_movesets: string[]
  // Content pipeline
  content_items: ContentItem[]
}
