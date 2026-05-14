export type StatKey = 'VIG' | 'END' | 'MIND'
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
export type StatusType = 'bleed' | 'frost' | 'madness' | 'scarlet_rot'
export type DefenseAction = 'roll' | 'block' | 'parry' | 'take' | 'flee'
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
  owned_weapons: string[]
  owned_movesets: string[]
  equipped_run_weapons: string[]
  weapon_xp: Record<string, number>
  weapon_level: Record<string, number>
  weapon_extra_movesets: Record<string, string[]>
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
}
