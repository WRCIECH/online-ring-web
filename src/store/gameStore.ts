import { create } from 'zustand'
import type { GameState, LocationData, Stats, GeneratedMoveset, WeaponInstance, SublocationType } from '../types/game'
import { ENEMIES } from '../data/enemies'
import { saveGame, loadGame } from '../engine/save'
import { registerWeapon, statLevelCost, weaponUpgradeCost } from '../data/weapons'
import { MOVES, registerMoveset } from '../data/movesets'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { LOCATION_DEFINITIONS } from '../data/locations'
import { CLASS_DEFINITIONS } from '../data/classes'

/** Re-populate WEAPONS/MOVES registries from persisted instances (called on load & init). */
function hydrateRegistries(state: GameState): void {
  state.weapon_instances.forEach(w => registerWeapon(w))
  state.moveset_instances.forEach(m => registerMoveset(m))
}

const RUN_DURATION = 172800  // 48 hours in seconds
const RUN_ESTUS_MAX = 3

const DEFAULT_STATS: Stats = { VIG:10, END:10, MND:10, STR:8, DEX:8, INT:8, FAI:8, ARC:8 }

export function calcMaxHp(vig: number): number {
  if (vig <= 25) return 300 + vig * 12
  if (vig <= 40) return 600 + (vig - 25) * 18
  return 870 + (vig - 40) * 8
}
export function calcMaxStamina(end: number): number { return end * 10 }
export function calcMaxFp(mnd: number): number { return mnd * 3 }

// Internal sublocation names for the spiral run map (30 max for very large locations)
const LOCATION_NAMES = [
  'The Endless Feed', 'Deadline Flats', 'The Comparison Pit', 'Scroll Abyss',
  'Fear Marsh', 'Distraction Fields', 'The Blank Vista', 'Burnout Hollow',
  'Revision Tunnels', 'Imposter Caverns', 'The Audience Void', 'Doubt Spire',
  'The Hater\'s Reach', 'Overload Depths', 'Silence Archive', 'The Mirror Maze',
  'Momentum Ruins', 'The Unfinished Gallery', 'Visibility Peak', 'The Long Draft',
  'Perfectionism Gate', 'The Final Page',
  'The Echo Chamber', 'Shadow Archive', 'The Forgotten Draft', 'Spiral Descent',
  'Burnout Vale', 'Threshold Point', 'The Last Revision', 'Final Threshold',
]

// Full 30-entry pool (supports up to very large locations)
const ENCOUNTER_POOL: Array<{ enemy_id: string; tier: number }> = [
  // Tier 1 (easy) — 10
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'procrastination_mob', tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  { enemy_id: 'burnout_shade',       tier: 1 },
  // Tier 2 (medium) — 12
  { enemy_id: 'fear_phantom',        tier: 2 },
  { enemy_id: 'fear_phantom',        tier: 2 },
  { enemy_id: 'fear_phantom',        tier: 2 },
  { enemy_id: 'comparison_engine',   tier: 2 },
  { enemy_id: 'comparison_engine',   tier: 2 },
  { enemy_id: 'comparison_engine',   tier: 2 },
  { enemy_id: 'hater',               tier: 2 },
  { enemy_id: 'hater',               tier: 2 },
  { enemy_id: 'hater',               tier: 2 },
  { enemy_id: 'blank_page_omen',     tier: 2 },
  { enemy_id: 'blank_page_omen',     tier: 2 },
  { enemy_id: 'blank_page_omen',     tier: 2 },
  // Tier 3 (hard) — 7
  { enemy_id: 'blank_page_omen',     tier: 3 },
  { enemy_id: 'blank_page_omen',     tier: 3 },
  { enemy_id: 'comparison_engine',   tier: 3 },
  { enemy_id: 'comparison_engine',   tier: 3 },
  { enemy_id: 'fear_phantom',        tier: 3 },
  { enemy_id: 'fear_phantom',        tier: 3 },
  { enemy_id: 'hater',               tier: 3 },
  // Boss (fixed) — 1
  { enemy_id: 'perfectionism_knight', tier: 4 },
]

// Tier distribution per total sublocation count: [tier1, tier2, tier3]
const TIER_DIST: Record<number, [number, number, number]> = {
  10: [3,  4,  2],
  15: [5,  6,  3],
  20: [7,  8,  4],
  25: [8,  10, 6],
  30: [10, 12, 7],
}

const TIER_MULTS: Record<number, number> = { 1: 0.65, 2: 1.0, 3: 1.35, 4: 1.60 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateLocationSequence(numSublocations: number = 20, bossName?: string): LocationData[] {
  const [t1, t2, t3] = TIER_DIST[numSublocations] ?? TIER_DIST[20]
  const tier1 = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 1)).slice(0, t1)
  const tier2 = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 2)).slice(0, t2)
  const tier3 = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 3)).slice(0, t3)
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
        ...(bossName ? { boss_name: bossName } : {}),
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

function initialState(): GameState {
  // Placeholder weapon — replaced immediately by ClassSelectScreen
  const startWeapon = rollWeapon('straight_swords', 'common')
  const movesetIds = [
    ...startWeapon.constant_movesets,
    startWeapon.defense_movesets.block,
  ]
  const movesetInsts: GeneratedMoveset[] = movesetIds
    .map(id => MOVES[id])
    .filter((m): m is GeneratedMoveset => !!m && 'rarity' in m)

  return {
    stats: { ...DEFAULT_STATS },
    player_class: '',
    total_levels_spent: 0,
    runes: 0,
    lost_runes: 0,
    lost_rune_location: '',
    lost_rune_node_index: -1,
    owned_weapons: [startWeapon.instance_id],
    weapon_instances: [startWeapon],
    owned_movesets: [],
    moveset_instances: movesetInsts,
    equipped_run_weapons: [startWeapon.instance_id],
    weapon_level: { [startWeapon.instance_id]: 0 },
    weapon_extra_movesets: { [startWeapon.instance_id]: [] },
    weapon_cooldown: {},
    current_hp: calcMaxHp(DEFAULT_STATS.VIG),
    current_stamina: calcMaxStamina(DEFAULT_STATS.END),
    current_fp: calcMaxFp(DEFAULT_STATS.MND),
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
    run_location_name: '',
    completed_locations: [],
    run_start_owned_movesets: [],
  }
}

export interface GameStore extends GameState {
  // Computed
  maxHp: () => number
  maxStamina: () => number
  maxFp: () => number

  // Run management
  startRun: (weapons: string[], locationName?: string, numSublocations?: number, runDuration?: number) => void
  advanceRun: () => void
  endRunVictory: () => void
  endRunFailure: () => void
  setPendingEncounter: (loc: LocationData | null) => void
  setPendingReward: (id: string) => void
  addDefeatedEnemy: (id: string) => void
  syncCombatResult: (hp: number, estus: number, fp: number) => void

  // HP / resources
  takePlayerDamage: (amount: number) => void
  healPlayer: (amount: number) => void
  drinkEstus: () => boolean
  spendStamina: (amount: number) => boolean
  restoreStamina: () => void
  spendFp: (amount: number) => boolean

  // Weapon / moveset inventory
  setWeaponExtraMovesets: (weaponId: string, ids: string[]) => void
  unlockMoveset: (id: string) => void
  unlockWeapon: (id: string) => void
  addWeaponInstance: (w: WeaponInstance) => void
  addMovesetInstance: (m: GeneratedMoveset) => void

  // Weapon heat / overheat (applied at end of each combat)
  applyWeaponHeat: (heat: Record<string, number>) => void

  // Rune economy
  addRunes: (amount: number) => void
  dropRunes: (location: string, nodeIndex: number) => void
  recoverRunes: () => void
  spendRunesOnStat: (stat: keyof Stats) => boolean
  upgradeWeapon: (weaponId: string) => boolean

  // Class & character init (called from ClassSelectScreen on new game)
  initClass: (classId: string) => void

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
  maxFp:      () => calcMaxFp(get().stats.MND),

  startRun: (weapons, locationName = '', numSublocations = 20, runDuration = RUN_DURATION) => {
    const locDef = LOCATION_DEFINITIONS.find(l => l.id === locationName)
    const seq = generateLocationSequence(numSublocations, locDef?.boss)
    const runStartMovesets = get().owned_movesets
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
      run_duration_seconds: runDuration,
      run_estus_count: RUN_ESTUS_MAX,
      run_defeated_enemies: [],
      current_hp: calcMaxHp(get().stats.VIG),
      current_stamina: calcMaxStamina(get().stats.END),
      current_fp: calcMaxFp(get().stats.MND),
      weapon_cooldown: newCooldown,
      run_location_name: locationName,
      run_start_owned_movesets: runStartMovesets,
    })
    get().save()
  },

  advanceRun: () => {
    set(s => ({ run_current_index: s.run_current_index + 1 }))
    get().save()
  },

  endRunVictory: () => {
    set(s => ({
      run_active: false,
      run_count: s.run_count + 1,
      completed_locations: s.completed_locations.includes(s.run_location_name)
        ? s.completed_locations
        : [...s.completed_locations, s.run_location_name],
    }))
    get().save()
  },

  endRunFailure: () => {
    set({ run_active: false })
    get().save()
  },

  setPendingEncounter: (loc) => { set({ pending_encounter: loc }); get().save() },
  setPendingReward:    (id)  => set({ pending_run_reward: id }),
  syncCombatResult:    (hp, estus, fp) => set({ current_hp: hp, run_estus_count: estus, current_fp: fp }),

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

  setWeaponExtraMovesets: (weaponId, ids) => set(s => ({
    weapon_extra_movesets: { ...s.weapon_extra_movesets, [weaponId]: ids },
  })),

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
    weapon_level:  s.weapon_level[id] !== undefined ? s.weapon_level : { ...s.weapon_level, [id]: 0 },
    weapon_extra_movesets: s.weapon_extra_movesets[id]
      ? s.weapon_extra_movesets
      : { ...s.weapon_extra_movesets, [id]: [] },
  })),

  // ── Rune economy ────────────────────────────────────────────────────────
  addRunes: (amount) => set(s => ({ runes: s.runes + amount })),

  dropRunes: (location, nodeIndex) => set(s => ({
    lost_runes: s.runes,
    lost_rune_location: location,
    lost_rune_node_index: nodeIndex,
    runes: 0,
  })),

  recoverRunes: () => set(s => ({
    runes: s.runes + s.lost_runes,
    lost_runes: 0,
    lost_rune_location: '',
    lost_rune_node_index: -1,
  })),

  spendRunesOnStat: (stat) => {
    const s = get()
    const cost = statLevelCost(s.total_levels_spent)
    if (s.runes < cost) return false
    const newVal = s.stats[stat] + 1
    set(prev => ({
      runes: prev.runes - cost,
      total_levels_spent: prev.total_levels_spent + 1,
      stats: { ...prev.stats, [stat]: newVal },
      current_hp:      stat === 'VIG' ? calcMaxHp(newVal)      : prev.current_hp,
      current_stamina: stat === 'END' ? calcMaxStamina(newVal)  : prev.current_stamina,
      current_fp:      stat === 'MND' ? calcMaxFp(newVal)       : prev.current_fp,
    }))
    get().save()
    return true
  },

  upgradeWeapon: (weaponId) => {
    const s = get()
    const curLevel = s.weapon_level[weaponId] ?? 0
    if (curLevel >= 10) return false
    const cost = weaponUpgradeCost(curLevel)
    if (s.runes < cost) return false
    set(prev => ({
      runes: prev.runes - cost,
      weapon_level: { ...prev.weapon_level, [weaponId]: curLevel + 1 },
    }))
    get().save()
    return true
  },

  // ── Class & character init ──────────────────────────────────────────────
  initClass: (classId) => {
    const cls = CLASS_DEFINITIONS.find(c => c.id === classId)
    if (!cls) return
    const w = rollWeapon(cls.weaponClass, 'common')
    registerWeapon(w)
    const msIds = [
      ...w.constant_movesets,
      w.defense_movesets.block,
    ]
    const movesetInsts: GeneratedMoveset[] = msIds
      .map(id => MOVES[id])
      .filter((m): m is GeneratedMoveset => !!m && 'rarity' in m)
    set({
      player_class: classId,
      stats: { ...cls.startingStats },
      total_levels_spent: 0,
      runes: 0,
      lost_runes: 0,
      lost_rune_location: '',
      lost_rune_node_index: -1,
      owned_weapons: [w.instance_id],
      weapon_instances: [w],
      equipped_run_weapons: [w.instance_id],
      weapon_level: { [w.instance_id]: 0 },
      weapon_extra_movesets: { [w.instance_id]: [] },
      moveset_instances: movesetInsts,
      owned_movesets: [],
      current_hp: calcMaxHp(cls.startingStats.VIG),
      current_stamina: calcMaxStamina(cls.startingStats.END),
      current_fp: calcMaxFp(cls.startingStats.MND),
    })
    get().save()
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
