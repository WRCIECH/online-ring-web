import { create } from 'zustand'
import type { GameState, LocationData, Stats } from '../types/game'
import { ENEMIES } from '../data/enemies'
import { saveGame, loadGame } from '../engine/save'

const RUN_DURATION = 172800  // 48 hours in seconds
const RUN_ESTUS_MAX = 3

const DEFAULT_STATS: Stats = { VIG: 10, END: 10, MIND: 10 }

function calcMaxHp(vig: number): number {
  if (vig <= 25) return 300 + vig * 12
  if (vig <= 40) return 600 + (vig - 25) * 18
  return 870 + (vig - 40) * 8
}
function calcMaxStamina(end: number): number { return 80 + end * 5 }
function calcMaxFp(mind: number): number { return 80 + mind * 6 }

// Named locations for the 22-node spiral map
const LOCATION_NAMES = [
  'The Endless Feed', 'Deadline Flats', 'The Comparison Pit', 'Scroll Abyss',
  'Fear Marsh', 'Distraction Fields', 'The Blank Vista', 'Burnout Hollow',
  'Revision Tunnels', 'Imposter Caverns', 'The Audience Void', 'Doubt Spire',
  'The Hater\'s Reach', 'Overload Depths', 'Silence Archive', 'The Mirror Maze',
  'Momentum Ruins', 'The Unfinished Gallery', 'Visibility Peak', 'The Long Draft',
  'Perfectionism Gate', 'The Final Page',
]

const ENCOUNTER_POOL: Array<{ enemy_id: string; tier: number }> = [
  // Tier 1 (easy)
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  // Tier 2 (medium)
  { enemy_id: 'fear_phantom',        tier: 2 },
  { enemy_id: 'comparison_engine',   tier: 2 },
  { enemy_id: 'hater',               tier: 2 },
  { enemy_id: 'blank_page_omen',     tier: 2 },
  { enemy_id: 'fear_phantom',        tier: 2 },
  { enemy_id: 'comparison_engine',   tier: 2 },
  { enemy_id: 'hater',               tier: 2 },
  { enemy_id: 'blank_page_omen',     tier: 2 },
  // Tier 3 (hard)
  { enemy_id: 'perfectionism_knight', tier: 3 },
  { enemy_id: 'comparison_engine',    tier: 3 },
  { enemy_id: 'fear_phantom',         tier: 3 },
  { enemy_id: 'hater',                tier: 3 },
  { enemy_id: 'blank_page_omen',      tier: 3 },
  // Boss (fixed)
  { enemy_id: 'perfectionism_knight', tier: 4 },
]

const TIER_MULTS: Record<number, number> = { 1: 0.65, 2: 1.0, 3: 1.35, 4: 1.60 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateLocationSequence(): LocationData[] {
  const tier1 = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 1))
  const tier2 = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 2))
  const tier3 = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 3))
  const boss  = ENCOUNTER_POOL.filter(e => e.tier === 4)
  const ordered = [...tier1, ...tier2, ...tier3, ...boss]
  return ordered.map((enc, i) => ({
    enemy_id: enc.enemy_id,
    name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
    mult: TIER_MULTS[enc.tier] ?? 1.0,
  }))
}

function initialState(): GameState {
  return {
    stats: { ...DEFAULT_STATS },
    level: 1,
    owned_weapons: ['unarmed'],
    owned_movesets: [],
    equipped_run_weapons: ['unarmed'],
    weapon_xp: { unarmed: 0 },
    weapon_level: { unarmed: 1 },
    weapon_extra_movesets: { unarmed: [] },
    current_hp: calcMaxHp(DEFAULT_STATS.VIG),
    current_stamina: calcMaxStamina(DEFAULT_STATS.END),
    current_fp: calcMaxFp(DEFAULT_STATS.MIND),
    run_count: 0,
    run_active: false,
    run_location_sequence: [],
    run_current_index: 0,
    run_start_time: 0,
    run_duration_seconds: RUN_DURATION,
    run_estus_count: RUN_ESTUS_MAX,
    run_defeated_enemies: [],
    pending_encounter: null,
    pending_run_reward: '',
  }
}

interface GameStore extends GameState {
  // Computed
  maxHp: () => number
  maxStamina: () => number
  maxFp: () => number

  // Run management
  startRun: (weapons: string[]) => void
  advanceRun: () => void
  endRunVictory: () => void
  endRunFailure: () => void
  setPendingEncounter: (loc: LocationData) => void
  setPendingReward: (id: string) => void
  addDefeatedEnemy: (id: string) => void

  // HP / resources
  takePlayerDamage: (amount: number) => void
  healPlayer: (amount: number) => void
  drinkEstus: () => boolean
  spendStamina: (amount: number) => boolean
  restoreStamina: () => void
  spendFp: (amount: number) => boolean

  // Weapon progression
  addWeaponXp: (weaponId: string, amount: number) => boolean
  setWeaponExtraMovesets: (weaponId: string, ids: string[]) => void
  unlockMoveset: (id: string) => void

  // Stat level-up
  levelUpStat: (stat: keyof Stats) => boolean

  // Persistence
  save: () => void
  load: () => boolean
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  maxHp:      () => calcMaxHp(get().stats.VIG),
  maxStamina: () => calcMaxStamina(get().stats.END),
  maxFp:      () => calcMaxFp(get().stats.MIND),

  startRun: (weapons) => {
    const seq = generateLocationSequence()
    set({
      equipped_run_weapons: weapons,
      run_active: true,
      run_location_sequence: seq,
      run_current_index: 0,
      run_start_time: Date.now() / 1000,
      run_duration_seconds: RUN_DURATION,
      run_estus_count: RUN_ESTUS_MAX,
      run_defeated_enemies: [],
      current_hp: calcMaxHp(get().stats.VIG),
      current_stamina: calcMaxStamina(get().stats.END),
      current_fp: calcMaxFp(get().stats.MIND),
    })
    get().save()
  },

  advanceRun: () => {
    set(s => ({ run_current_index: s.run_current_index + 1 }))
    get().save()
  },

  endRunVictory: () => {
    set(s => ({ run_active: false, run_count: s.run_count + 1 }))
    get().save()
  },

  endRunFailure: () => {
    set({ run_active: false })
    get().save()
  },

  setPendingEncounter: (loc) => set({ pending_encounter: loc }),
  setPendingReward:    (id)  => set({ pending_run_reward: id }),

  addDefeatedEnemy: (id) => set(s => ({
    run_defeated_enemies: [...s.run_defeated_enemies, id],
  })),

  takePlayerDamage: (amount) => set(s => ({
    current_hp: Math.max(0, s.current_hp - amount),
  })),

  healPlayer: (amount) => set(s => ({
    current_hp: Math.min(calcMaxHp(s.stats.VIG), s.current_hp + amount),
  })),

  drinkEstus: () => {
    const s = get()
    if (s.run_estus_count <= 0) return false
    const healAmount = Math.floor(calcMaxHp(s.stats.VIG) * 0.40)
    set(prev => ({
      run_estus_count: prev.run_estus_count - 1,
      current_hp: Math.min(calcMaxHp(prev.stats.VIG), prev.current_hp + healAmount),
    }))
    return true
  },

  spendStamina: (amount) => {
    const s = get()
    if (s.current_stamina < amount) return false
    set(prev => ({ current_stamina: Math.max(0, prev.current_stamina - amount) }))
    return true
  },

  restoreStamina: () => set(s => ({ current_stamina: calcMaxStamina(s.stats.END) })),

  spendFp: (amount) => {
    const s = get()
    if (s.current_fp < amount) return false
    set(prev => ({ current_fp: Math.max(0, prev.current_fp - amount) }))
    return true
  },

  addWeaponXp: (weaponId, amount) => {
    const s = get()
    const newXp = (s.weapon_xp[weaponId] ?? 0) + amount
    const currentLevel = s.weapon_level[weaponId] ?? 1
    const thresholds = [100, 300, 700, 1500]
    let newLevel = currentLevel
    for (let i = currentLevel - 1; i < thresholds.length; i++) {
      if (newXp >= thresholds[i]) newLevel = i + 2
    }
    const levelled = newLevel > currentLevel
    const newExtraMovesets = s.weapon_extra_movesets[weaponId] ?? []
    set(prev => ({
      weapon_xp: { ...prev.weapon_xp, [weaponId]: newXp },
      weapon_level: { ...prev.weapon_level, [weaponId]: newLevel },
      weapon_extra_movesets: levelled
        ? { ...prev.weapon_extra_movesets, [weaponId]: [...newExtraMovesets, ''] }
        : prev.weapon_extra_movesets,
    }))
    return levelled
  },

  setWeaponExtraMovesets: (weaponId, ids) => set(s => ({
    weapon_extra_movesets: { ...s.weapon_extra_movesets, [weaponId]: ids },
  })),

  unlockMoveset: (id) => set(s => ({
    owned_movesets: s.owned_movesets.includes(id) ? s.owned_movesets : [...s.owned_movesets, id],
  })),

  levelUpStat: (stat) => {
    const s = get()
    if (s.level < 1) return false
    set(prev => ({
      stats: { ...prev.stats, [stat]: prev.stats[stat] + 1 },
      level: prev.level + 1,
      current_hp: stat === 'VIG' ? calcMaxHp(prev.stats.VIG + 1) : prev.current_hp,
      current_stamina: stat === 'END' ? calcMaxStamina(prev.stats.END + 1) : prev.current_stamina,
      current_fp: stat === 'MIND' ? calcMaxFp(prev.stats.MIND + 1) : prev.current_fp,
    }))
    return true
  },

  save: () => saveGame(get()),

  load: () => {
    const data = loadGame()
    if (!data) return false
    set({ ...data })
    return true
  },

  reset: () => set(initialState()),
}))

// Selectors
export const selectRunElapsedSeconds = (s: GameStore) =>
  s.run_active ? Date.now() / 1000 - s.run_start_time : 0

export const selectRunRemainingSeconds = (s: GameStore) =>
  Math.max(0, s.run_duration_seconds - selectRunElapsedSeconds(s))

export const selectIsRunExpired = (s: GameStore) =>
  s.run_active && selectRunRemainingSeconds(s) <= 0

export const selectCurrentLocation = (s: GameStore) =>
  s.run_location_sequence[s.run_current_index] ?? null

export const selectEnemyData = (s: GameStore) => {
  const loc = selectCurrentLocation(s)
  if (!loc) return null
  const enemy = ENEMIES[loc.enemy_id]
  if (!enemy) return null
  return { ...enemy, max_hp: Math.floor(enemy.max_hp * loc.mult) }
}
