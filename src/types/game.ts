export type Locale = 'pl' | 'en'
export type RewardTier = 'C' | 'B1' | 'B2' | 'A1' | 'A2' | 'S'
export type StatKey = 'VIG' | 'END' | 'TEXT' | 'VIDEO' | 'AUDIO' | 'GRAPHIC' | 'VELOCITY' | 'DEPTH' | 'PARASOCIAL' | 'FRICTION' | 'INSIGHT'
export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type SublocationType = 'mob' | 'elite' | 'event' | 'boss'
export type MoveType = 'Light' | 'Heavy'

// Unified content transformation type — annotates campaign edges and tiles.
// Combines the former AtomicOrigin (relation types) and StyleType (style types).
export type ContentTransformation =
  | 'Succinct' | 'Verbose' | 'ZoomIn' | 'ZoomOut' | 'Similar' | 'Opposite'
  | 'Shock' | 'Narration' | 'Segmentation'
  | 'Passion' | 'Estetic' | 'Cliffhanger'
  | 'Viral' | 'Controversy' | 'Comfort' | 'Drama' | 'Humor'
  | 'Parasocial' | 'Wow' | 'Hope' | 'Fear' | 'Desire'
  | 'Critique' | 'Follows' | 'AudienceShift' | 'Synthesis'
  | 'RemixFusion' | 'Evidence' | 'Simplify' | 'Technicalize'
  | 'Socratic' | 'Analogy' | 'FirstPrinciples' | 'DataDriven'

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

// ── Content creation dimensions ────────────────────────────────────────────
export type AtomicStage = 'Research' | 'Produce'
export type AtomicTime = 'Micro' | 'Short' | 'Medium' | 'Long' | 'Deep'

import type { ContentProductType } from '../data/contentProducts'
export type { ContentProductType }

// ── Workflow graph ─────────────────────────────────────────────────────────
export interface WorkflowTile {
  id: string
  type: AtomicStage
  name: string
  time_light: number   // seconds for Light Attack timer
  time_heavy: number   // seconds for Heavy Attack timer
  content_type?: ContentProductType
  content_transformation?: ContentTransformation
  status?: EmotionType
  time_budget?: AtomicTime
  is_completed: boolean
  repeat_count: number
  is_advance?: boolean // synthetic last tile that advances to the next workflow phase
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

export interface WeaponPerk {
  type: 'product' | 'transformation'
  target: string   // ContentProductType or ContentTransformation
  bonus: number    // additive fraction, e.g. 0.15 = +15%
}

export interface Weapon {
  name: string
  description: string
  stat_req: Partial<Record<StatKey, number>>
}

// All draws a weapon instance's pattern can make (Format/Transformation/
// Style/Emotion/Length), rolled once at weapon-creation time and never
// re-rolled per fight. Format/Transformation/Style/Emotion each hold a
// 2D array [occurrenceIndex][stateIndex] — only stateIndex 0 is used
// (the extra stateIndex dimension is kept for save-file backward compat).
// Length has no per-occurrence sequence — a single fixed value used everywhere.
// When a draw occurs once per path inside the same branch() (e.g. halberds'
// 3 parallel Style draws), its occurrences are redrawn together as one group
// on the round-robin's turn rather than independently — see patternSlots.ts.
export interface RolledPatternDraws {
  format: (ContentProductType | null)[][]   // [occurrenceIndex][stateIndex]
  length: AtomicTime
}

export interface WeaponInstance extends Weapon {
  instance_id: string
  weapon_class: WeaponClass
  rarity: WeaponRarity
  affixes: Affix[]
  base_damage_mult: number
  // kept for WeaponSprite rendering
  poise_weight?: number
  // absent on legacy saves predating this feature — consumers fall back
  // to the old per-call random roll whenever this is undefined
  rolled_draws?: RolledPatternDraws
  // absent on legacy saves; undefined → no perks
  perks?: WeaponPerk[]
}

// ── Enemy affinity system ─────────────────────────────────────────────────
export interface MobAffinityConditions {
  products?: ContentProductType[]
  transformations?: ContentTransformation[]
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

// ── Location definition fields added by region expansion ──────────────────
// region_id and is_final_location are on LocationDef in locations.ts

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
  superhit_used?: boolean       // true once the base Superhit charge has been used
  promote_count?: number        // 0–3; each promote adds one extra Superhit charge
  promotes_consumed?: number    // how many promote-charges have been consumed in combat
  content_type?: ContentProductType  // rolled at node creation; undefined in old saves
  content_type_modified?: boolean          // true when player has changed content_type
  original_content_type?: ContentProductType  // first value before any player modification
  content_type_modified_stat?: StatKey    // stat spent on the most recent modification
  node_research?: number        // allocated research tiles (≥0); undefined = weapon class default
  node_produce?: number         // allocated produce tiles (≥1); undefined = weapon class default
}

export interface CampaignEdge {
  from_id: string
  to_id: string
  label: ContentTransformation | null  // null = chronological/follows
  label_modified?: boolean                       // true when player has changed label
  original_label?: ContentTransformation | null  // first value before any player modification
  label_modified_stat?: StatKey                  // stat spent on the most recent modification
}

export interface WeaponCampaign {
  id: string
  nodes: CampaignNode[]
  edges: CampaignEdge[]
  created_at: number
  completed: boolean
  campaign_name?: string
  activated?: boolean           // false = draft; true = in progress (editing blocked)
  done_count?: number           // times finalized; drives +5%/completion damage mult
  ordinal?: number              // sequential number for this weapon (1 = first, 2 = after first finalization, …)
  skip_allowance?: number       // nodes that may be left unpublished; 0 = all required; max = END stat
  micro?: MicroModeState
  medium?: MediumModeState
  heavy?: HeavyModeState
}

// ── Mode-specific content type pools ─────────────────────────────────────
export type MicroContentType =
  'Plaintext' | 'SingleGraphic' | 'Carousel' | 'ARollVideo' | 'RawAudio' | 'LinkShare'

export type MediumContentType =
  'Plaintext' | 'ProducedAudio' | 'ARollVideo' | 'Interview' | 'Commentary' | 'Infographic' | 'Carousel'

export type HeavyContentType =
  'Plaintext' | 'ARollVideo' | 'AssetPack' | 'CurationFeed' | 'InteractiveApp' |
  'Website' | '_blank' | 'Course' | 'Book'

export type ContentShift = 'Follows' | 'ZoomIn' | 'ZoomOut' | 'Similar' | 'Opposite'

// ── Constraint system (labels only for now) ───────────────────────────────
export type PropagandaShift = 'enhance' | 'weaken' | 'focus' | 'action'
export type MediumAudienceShift =
  'audience_x' | 'lower_self' | 'average_self' | 'higher_self' |
  'base_trend_event' | 'need_identity_belief'
export type StyleShift =
  'narration' | 'segmentation' | 'socratic' | 'enemy_hero' | 'slogan_symbol' |
  'analogy' | 'verbose' | 'succinct' | 'technicalize' | 'simplify' |
  'evidence' | 'data_driven' | 'first_principles'
export type ConstraintCategory = 'propaganda' | 'audience' | 'style'

export interface NodeConstraint {
  category: ConstraintCategory
  value: PropagandaShift | MediumAudienceShift | StyleShift
}

// ── Micro mode ────────────────────────────────────────────────────────────
export interface MicroProduct {
  id: string
  content_type: MicroContentType
  style?: ContentTransformation   // present ~50% of the time
  done_count: number
  // Modification tracking (stat-based edit system)
  type_modified?: boolean; original_content_type?: MicroContentType; type_modified_stat?: StatKey
  style_modified?: boolean; original_style?: ContentTransformation;   style_modified_stat?: StatKey
}

export interface MicroModeState {
  products: MicroProduct[]
  current_index: number           // index of the next product to publish
  completed: boolean              // true once all products done at least once
}

// ── Medium mode ───────────────────────────────────────────────────────────
export interface MediumPiece {
  id: string
  name: string
  level1_type: MediumContentType
  level2_type: MediumContentType
  link_type: ContentShift
  constraint?: NodeConstraint
  level1_done: boolean
  level2_done: boolean
  // Modification tracking
  constraint_modified?: boolean; original_constraint?: NodeConstraint; constraint_modified_stat?: StatKey
  link_type_modified?: boolean;  original_link_type?: ContentShift;   link_type_modified_stat?: StatKey
}

export interface MediumModeState {
  pieces: MediumPiece[]
  completed: boolean              // true when last piece.level2_done
  // Global format modification tracking (L1/L2 apply to all pieces at once)
  level1_modified?: boolean; original_level1_type?: MediumContentType; level1_modified_stat?: StatKey
  level2_modified?: boolean; original_level2_type?: MediumContentType; level2_modified_stat?: StatKey
}

// ── Heavy mode ────────────────────────────────────────────────────────────
export interface HeavyModeState {
  name?: string
  product_type: HeavyContentType
  research_count: number
  produce_count: number
  research_done: number
  produce_done: number
  completed: boolean   // all tiles done
  published?: boolean  // explicitly published → grants superhit
  // Modification tracking
  product_type_modified?: boolean; original_product_type?: HeavyContentType; product_type_modified_stat?: StatKey
}

// ── Audience profiles ─────────────────────────────────────────────────────
export type AudienceSectionKey =
  | 'sociological_trends'
  | 'long_term_trends'
  | 'short_term_trends'
  | 'needs_explanations'
  | 'identities_values'
  | 'attitudes_beliefs'
  | 'symbols_slogans'
  | 'heroes_enemies'
  | 'myths_reflexes'
  | 'narratives_frames'

export interface AudienceItem {
  id: string
  text: string
}

export interface AudienceProfile {
  id: string
  name: string
  sections: Record<AudienceSectionKey, AudienceItem[]>
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
  run_duration_seconds: number
  game_time_end: number          // Unix epoch seconds; 0 = game not yet started
  run_estus_count: number
  run_defeated_enemies: string[]
  pending_encounter: LocationData | null
  pending_run_reward: string
  run_location_name: string
  completed_locations: string[]
  // Per-node saved workflow progress (keyed by CampaignNode id)
  workflow_progress: Record<string, WorkflowGraph>
  // Per-node consistency streak (tiles completed without switching content)
  content_streak: Record<string, number>
  active_content_id: string | null
  // Set by pre-fight picker so CombatScreen boots with the right weapon
  pending_weapon_id: string | null
  // Content campaigns (per weapon instance)
  weapon_campaigns: Record<string, WeaponCampaign>
  // Completed campaigns saved for re-use across weapons
  campaign_library: WeaponCampaign[]
  // Analytics
  total_task_time_s: number
  // Real wall-clock seconds spent per content node, split by stage
  node_time_spent: Record<string, { Research: number; Produce: number }>
  last_fight_ended_at?: number   // epoch ms; updated on fight VICTORY, used to compute flow mult
  // UI locale
  locale: Locale
  // External rewards
  rewards: Record<RewardTier, number>
  reward_names: Partial<Record<RewardTier, string>>
  reward_used_count: Partial<Record<RewardTier, number>>
  // Unconsumed Superhit/promote charges carried over when a campaign is finalized
  weapon_pending_superhits: Record<string, number>
  // Music playlist
  run_music_seed?: number   // rolled at startRun; undefined in old saves → treated as 0
  music_tracks?:   string[] // YouTube video IDs; undefined in old saves → uses DEFAULT_MUSIC_TRACKS
  // Campaign modification actions spent (keyed by stat); stat value - used = remaining
  stat_modifications_used: Partial<Record<StatKey, number>>
  // World region progress
  completed_regions: string[]   // region IDs whose final boss was defeated
  current_region_id: string     // region currently selected on the world map
  game_won?: boolean            // true when region_6 final boss is defeated
  // Audience research profiles
  audiences: AudienceProfile[]
}
