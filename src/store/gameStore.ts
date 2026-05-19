import { create } from 'zustand'
import type { GameState, LocationData, Stats, GeneratedMoveset, WeaponInstance, SublocationType } from '../types/game'
import { ENEMIES } from '../data/enemies'
import { saveGame, loadGame } from '../engine/save'
import { registerWeapon } from '../data/weapons'
import { MOVES, registerMoveset } from '../data/movesets'
import { rollWeapon, WEAPON_KILL_THRESHOLDS } from '../data/generators/weaponGenerator'

/** Re-populate WEAPONS/MOVES registries from persisted instances (called on load & init). */
function hydrateRegistries(state: GameState): void {
  state.weapon_instances.forEach(w => registerWeapon(w))
  state.moveset_instances.forEach(m => registerMoveset(m))
}

const RUN_DURATION = 172800  // 48 hours in seconds
const RUN_ESTUS_MAX = 3

const DEFAULT_STATS: Stats = { VIG: 10, END: 10, MIND: 10 }

export function calcMaxHp(vig: number): number {
  if (vig <= 25) return 300 + vig * 12
  if (vig <= 40) return 600 + (vig - 25) * 18
  return 870 + (vig - 40) * 8
}
export function calcMaxStamina(end: number): number { return end * 10 }
export function calcMaxFp(mind: number): number { return mind * 3 }

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
  { enemy_id: 'blank_page_omen',      tier: 3 },
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

  return ordered.map((enc, i) => {
    const baseMult = TIER_MULTS[enc.tier] ?? 1.0
    const isLast   = i === ordered.length - 1

    if (isLast) {
      return {
        enemy_id: enc.enemy_id,
        name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
        mult: baseMult,
        sublocation_type: 'boss' as SublocationType,
      }
    }

    const position     = i / ordered.length
    const eliteChance  = 0.15 + position * 0.1
    const eventChance  = 0.10
    const roll         = Math.random()

    let type: SublocationType = 'mob'
    if (roll < eventChance) type = 'event'
    else if (roll < eventChance + eliteChance) type = 'elite'

    const event_type   = type === 'event'
      ? (Math.random() < 0.6 ? 'site_of_grace' : 'trial')
      : undefined
    const finalMult    = type === 'elite' ? baseMult * 1.3 : baseMult

    return {
      enemy_id: enc.enemy_id,
      name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
      mult: finalMult,
      sublocation_type: type,
      ...(event_type ? { event_type } : {}),
    }
  })
}

// Moveset XP thresholds in seconds (cumulative committed work time)
const MOVESET_XP_THRESHOLDS = [1800,3600,7200,10800,18000,25200,36000,54000,72000] // lvl 1→10

function initialState(): GameState {
  // Generate a starting Common straight-sword for new players
  const startWeapon = rollWeapon('straight_swords', 'common')
  // Collect all movesets registered by the weapon roll
  const movesetIds = [
    ...startWeapon.constant_movesets,
    startWeapon.defense_movesets.block,
    startWeapon.defense_movesets.parry,
  ]
  const movesetInsts: GeneratedMoveset[] = movesetIds
    .map(id => MOVES[id])
    .filter((m): m is GeneratedMoveset => !!m && 'pipeline' in m)

  return {
    stats: { ...DEFAULT_STATS },
    level: 1,
    owned_weapons: [startWeapon.instance_id],
    weapon_instances: [startWeapon],
    owned_movesets: [],
    moveset_instances: movesetInsts,
    equipped_run_weapons: [startWeapon.instance_id],
    weapon_xp: { [startWeapon.instance_id]: 0 },
    weapon_level: { [startWeapon.instance_id]: 0 },
    weapon_extra_movesets: { [startWeapon.instance_id]: [] },
    moveset_xp: {},
    moveset_level: {},
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
    weapon_cooldown: {},
    run_location_name: '',
  }
}

export interface GameStore extends GameState {
  // Computed
  maxHp: () => number
  maxStamina: () => number
  maxFp: () => number

  // Run management
  startRun: (weapons: string[], locationName?: string) => void
  advanceRun: () => void
  endRunVictory: () => void
  endRunFailure: () => void
  setPendingEncounter: (loc: LocationData | null) => void
  setPendingReward: (id: string) => void
  addDefeatedEnemy: (id: string) => void
  syncCombatResult: (hp: number, estus: number) => void

  // HP / resources
  takePlayerDamage: (amount: number) => void
  healPlayer: (amount: number) => void
  drinkEstus: () => boolean
  spendStamina: (amount: number) => boolean
  restoreStamina: () => void
  spendFp: (amount: number) => boolean

  // Weapon progression (kill-based)
  addWeaponXp: (weaponId: string, amount: number) => boolean
  flushWeaponXp: (gains: Record<string, number>) => void
  recordWeaponKill: (weaponId: string, isBoss: boolean) => void
  setWeaponExtraMovesets: (weaponId: string, ids: string[]) => void
  unlockMoveset: (id: string) => void
  unlockWeapon: (id: string) => void
  addWeaponInstance: (w: WeaponInstance) => void
  addMovesetInstance: (m: GeneratedMoveset) => void

  // Moveset progression (time-based)
  flushMovesetXp: (gains: Record<string, number>) => void

  // Weapon heat / overheat (applied at end of each combat)
  applyWeaponHeat: (heat: Record<string, number>) => void

  // Replace the single starting weapon (called from class-select screen)
  replaceStartingWeapon: (w: WeaponInstance) => void

  // Stat level-up
  levelUpStat: (stat: keyof Stats) => boolean

  // Persistence
  save: () => void
  load: () => boolean
  reset: () => void
}

const _savedOrFresh = loadGame() ?? initialState()
hydrateRegistries(_savedOrFresh)

export const useGameStore = create<GameStore>((set, get) => ({
  ..._savedOrFresh,

  maxHp:      () => calcMaxHp(get().stats.VIG),
  maxStamina: () => calcMaxStamina(get().stats.END),
  maxFp:      () => calcMaxFp(get().stats.MIND),

  startRun: (weapons, locationName = '') => {
    const seq = generateLocationSequence()
    const prevCooldown = get().weapon_cooldown
    const newCooldown = Object.fromEntries(
      Object.entries(prevCooldown).map(([k, v]) => [k, Math.max(0, v - 1)])
    )
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
      weapon_cooldown: newCooldown,
      run_location_name: locationName,
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

  setPendingEncounter: (loc) => { set({ pending_encounter: loc }); get().save() },
  setPendingReward:    (id)  => set({ pending_run_reward: id }),
  syncCombatResult:    (hp, estus) => set({ current_hp: hp, run_estus_count: estus }),

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

  flushWeaponXp: (gains) => {
    const s = get()
    let updates: Partial<GameState> = {
      weapon_xp: { ...s.weapon_xp },
      weapon_level: { ...s.weapon_level },
      weapon_extra_movesets: { ...s.weapon_extra_movesets },
    }
    for (const [weaponId, amount] of Object.entries(gains)) {
      if (amount <= 0) continue
      const newXp = ((updates.weapon_xp as Record<string, number>)[weaponId] ?? 0) + amount
      const currentLevel = ((updates.weapon_level as Record<string, number>)[weaponId] ?? 1)
      const thresholds = [100, 300, 700, 1500]
      let newLevel = currentLevel
      for (let i = currentLevel - 1; i < thresholds.length; i++) {
        if (newXp >= thresholds[i]) newLevel = i + 2
      }
      ;(updates.weapon_xp as Record<string, number>)[weaponId] = newXp
      ;(updates.weapon_level as Record<string, number>)[weaponId] = newLevel
      if (newLevel > currentLevel) {
        const slots = (updates.weapon_extra_movesets as Record<string, string[]>)[weaponId] ?? []
        ;(updates.weapon_extra_movesets as Record<string, string[]>)[weaponId] = [...slots, '']
      }
    }
    set(updates as Partial<typeof s>)
  },

  setWeaponExtraMovesets: (weaponId, ids) => set(s => ({
    weapon_extra_movesets: { ...s.weapon_extra_movesets, [weaponId]: ids },
  })),

  recordWeaponKill: (weaponId, isBoss) => {
    const s = get()
    const pts = isBoss ? 8 : 3
    const newXp = (s.weapon_xp[weaponId] ?? 0) + pts
    const curLevel = s.weapon_level[weaponId] ?? 0
    let newLevel = curLevel
    for (let i = curLevel; i < WEAPON_KILL_THRESHOLDS.length; i++) {
      if (newXp >= WEAPON_KILL_THRESHOLDS[i]) newLevel = i + 1
    }
    set(prev => ({
      weapon_xp:   { ...prev.weapon_xp,   [weaponId]: newXp },
      weapon_level: { ...prev.weapon_level, [weaponId]: newLevel },
    }))
  },

  flushMovesetXp: (gains) => {
    set(s => {
      const xp  = { ...s.moveset_xp }
      const lvl = { ...s.moveset_level }
      for (const [id, secs] of Object.entries(gains)) {
        if (secs <= 0) continue
        xp[id] = (xp[id] ?? 0) + secs
        let newLevel = lvl[id] ?? 1
        for (let i = newLevel - 1; i < MOVESET_XP_THRESHOLDS.length; i++) {
          if (xp[id] >= MOVESET_XP_THRESHOLDS[i]) newLevel = i + 2
        }
        lvl[id] = Math.min(10, newLevel)
      }
      return { moveset_xp: xp, moveset_level: lvl }
    })
  },

  replaceStartingWeapon: (w) => {
    registerWeapon(w)
    const msIds = [
      ...w.constant_movesets,
      w.defense_movesets.block,
      w.defense_movesets.parry,
    ]
    const movesetInsts = msIds
      .map(id => MOVES[id])
      .filter((m): m is GeneratedMoveset => !!m && 'pipeline' in m)
    set({
      owned_weapons: [w.instance_id],
      weapon_instances: [w],
      equipped_run_weapons: [w.instance_id],
      weapon_xp: { [w.instance_id]: 0 },
      weapon_level: { [w.instance_id]: 0 },
      weapon_extra_movesets: { [w.instance_id]: [] },
      moveset_instances: movesetInsts,
    })
    get().save()
  },

  applyWeaponHeat: (heat) => {
    set(s => {
      const cooldown = { ...s.weapon_cooldown }
      for (const [wid, uses] of Object.entries(heat)) {
        const w = s.weapon_instances.find(x => x.instance_id === wid)
        if (!w) continue
        const threshold = w.heat_threshold
        if (uses < threshold) continue
        const excess = uses - threshold
        const cd = excess <= 2 ? 1 : excess <= 5 ? 2 : 3
        cooldown[wid] = (cooldown[wid] ?? 0) + cd
      }
      return { weapon_cooldown: cooldown }
    })
  },

  addWeaponInstance: (w) => {
    registerWeapon(w)
    set(s => ({
      weapon_instances: [...s.weapon_instances.filter(x => x.instance_id !== w.instance_id), w],
      owned_weapons: s.owned_weapons.includes(w.instance_id) ? s.owned_weapons : [...s.owned_weapons, w.instance_id],
      weapon_xp:   s.weapon_xp[w.instance_id]   !== undefined ? s.weapon_xp   : { ...s.weapon_xp,   [w.instance_id]: 0 },
      weapon_level: s.weapon_level[w.instance_id] !== undefined ? s.weapon_level : { ...s.weapon_level, [w.instance_id]: 0 },
      weapon_extra_movesets: s.weapon_extra_movesets[w.instance_id]
        ? s.weapon_extra_movesets
        : { ...s.weapon_extra_movesets, [w.instance_id]: [] },
    }))
    get().save()
  },

  addMovesetInstance: (m) => {
    registerMoveset(m)
    set(s => ({
      moveset_instances: [...s.moveset_instances.filter(x => x.id !== m.id), m],
      owned_movesets: s.owned_movesets.includes(m.id) ? s.owned_movesets : [...s.owned_movesets, m.id],
    }))
    get().save()
  },

  unlockMoveset: (id) => set(s => ({
    owned_movesets: s.owned_movesets.includes(id) ? s.owned_movesets : [...s.owned_movesets, id],
  })),

  unlockWeapon: (id) => set(s => ({
    owned_weapons: s.owned_weapons.includes(id) ? s.owned_weapons : [...s.owned_weapons, id],
    weapon_xp:     s.weapon_xp[id] !== undefined    ? s.weapon_xp    : { ...s.weapon_xp,    [id]: 0 },
    weapon_level:  s.weapon_level[id] !== undefined  ? s.weapon_level  : { ...s.weapon_level,  [id]: 0 },
    weapon_extra_movesets: s.weapon_extra_movesets[id]
      ? s.weapon_extra_movesets
      : { ...s.weapon_extra_movesets, [id]: [] },
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
    hydrateRegistries(data)
    set({ ...data })
    return true
  },

  reset: () => {
    const fresh = initialState()
    hydrateRegistries(fresh)
    set(fresh)
  },
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
