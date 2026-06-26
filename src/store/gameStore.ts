import { create } from 'zustand'
import type { GameState, LocationData, Stats, WeaponInstance, SublocationType, ContentItem, Locale, WorkflowGraph } from '../types/game'
import { ENEMIES } from '../data/enemies'
import { saveGame, loadGame } from '../engine/save'
import { registerWeapon, WEAPONS } from '../data/weapons'
import { RUN_DURATION_SECONDS, RUN_ESTUS_MAX, ESTUS_HEAL_FRACTION, ARTICLE_EQUIP_WEIGHT, statLevelCost, weaponUpgradeCost } from '../data/constants'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { WEAPON_CLASSES } from '../data/generators/weaponClasses'
import { generateRemasterWorkflow, regenerateWorkflowKeepingStructure } from '../data/generators/remasterGenerator'
import { CLASS_DEFINITIONS } from '../data/classes'

function hydrateRegistries(state: GameState): void {
  state.weapon_instances.forEach(w => registerWeapon(w))
}

const DEFAULT_STATS: Stats = { VIG: 10, END: 10, MND: 10, STR: 8, DEX: 8, INT: 8, FAI: 8, ARC: 8 }

export function calcMaxHp(vig: number): number {
  if (vig <= 25) return 300 + vig * 12
  if (vig <= 40) return 600 + (vig - 25) * 18
  return 870 + (vig - 40) * 8
}
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

const ENCOUNTER_POOL: Array<{ enemy_id: string; tier: number }> = [
  { enemy_id: 'procrastination_mob',  tier: 1 },
  { enemy_id: 'procrastination_mob',  tier: 1 },
  { enemy_id: 'procrastination_mob',  tier: 1 },
  { enemy_id: 'procrastination_mob',  tier: 1 },
  { enemy_id: 'procrastination_mob',  tier: 1 },
  { enemy_id: 'burnout_shade',        tier: 1 },
  { enemy_id: 'burnout_shade',        tier: 1 },
  { enemy_id: 'burnout_shade',        tier: 1 },
  { enemy_id: 'burnout_shade',        tier: 1 },
  { enemy_id: 'burnout_shade',        tier: 1 },
  { enemy_id: 'notification_swarm',   tier: 1 },
  { enemy_id: 'notification_swarm',   tier: 1 },
  { enemy_id: 'notification_swarm',   tier: 1 },
  { enemy_id: 'notification_swarm',   tier: 1 },
  { enemy_id: 'notification_swarm',   tier: 1 },
  { enemy_id: 'fear_phantom',         tier: 2 },
  { enemy_id: 'fear_phantom',         tier: 2 },
  { enemy_id: 'fear_phantom',         tier: 2 },
  { enemy_id: 'comparison_engine',    tier: 2 },
  { enemy_id: 'comparison_engine',    tier: 2 },
  { enemy_id: 'comparison_engine',    tier: 2 },
  { enemy_id: 'hater',                tier: 2 },
  { enemy_id: 'hater',                tier: 2 },
  { enemy_id: 'hater',                tier: 2 },
  { enemy_id: 'blank_page_omen',      tier: 2 },
  { enemy_id: 'blank_page_omen',      tier: 2 },
  { enemy_id: 'blank_page_omen',      tier: 2 },
  { enemy_id: 'impostor_shade',       tier: 2 },
  { enemy_id: 'impostor_shade',       tier: 2 },
  { enemy_id: 'impostor_shade',       tier: 2 },
  { enemy_id: 'algorithm_specter',    tier: 2 },
  { enemy_id: 'algorithm_specter',    tier: 2 },
  { enemy_id: 'algorithm_specter',    tier: 2 },
  { enemy_id: 'blank_page_omen',      tier: 3 },
  { enemy_id: 'blank_page_omen',      tier: 3 },
  { enemy_id: 'comparison_engine',    tier: 3 },
  { enemy_id: 'comparison_engine',    tier: 3 },
  { enemy_id: 'fear_phantom',         tier: 3 },
  { enemy_id: 'fear_phantom',         tier: 3 },
  { enemy_id: 'hater',                tier: 3 },
  { enemy_id: 'deadline_wraith',      tier: 3 },
  { enemy_id: 'deadline_wraith',      tier: 3 },
  { enemy_id: 'deadline_wraith',      tier: 3 },
  { enemy_id: 'perfectionism_knight', tier: 4 },
  { enemy_id: 'overload_colossus',    tier: 4 },
  { enemy_id: 'distraction_weaver',   tier: 4 },
  { enemy_id: 'void_tyrant',          tier: 4 },
]

const TIER_DIST: Record<number, [number, number, number]> = {
  10: [3, 4, 2], 15: [5, 6, 3], 20: [7, 8, 4], 25: [8, 10, 6], 30: [10, 12, 7],
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

function generateLocationSequence(numSublocations = 20): LocationData[] {
  const [t1, t2, t3] = TIER_DIST[numSublocations] ?? TIER_DIST[20]
  const tier1    = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 1)).slice(0, t1)
  const tier2    = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 2)).slice(0, t2)
  const tier3    = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 3)).slice(0, t3)
  const bossPool = ENCOUNTER_POOL.filter(e => e.tier === 4)
  const boss     = [bossPool[Math.floor(Math.random() * bossPool.length)]]
  const ordered  = [...tier1, ...tier2, ...tier3, ...boss]

  return ordered.map((enc, i) => {
    const baseMult = TIER_MULTS[enc.tier] ?? 1.0
    const isLast   = i === ordered.length - 1
    if (isLast) {
      const bossEnemy = ENEMIES[enc.enemy_id]
      return {
        enemy_id: enc.enemy_id,
        name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
        mult: baseMult,
        tier: enc.tier,
        sublocation_type: 'boss' as SublocationType,
        boss_name: bossEnemy?.boss_name ?? bossEnemy?.name ?? enc.enemy_id,
      }
    }
    const position = i / ordered.length
    const eliteChance = 0.15 + position * 0.1
    const eventChance = 0.10
    const roll = Math.random()
    let type: SublocationType = 'mob'
    if (roll < eventChance) type = 'event'
    else if (roll < eventChance + eliteChance) type = 'elite'
    // Sites of Grace are gone — what would've rolled one is now a plain mob fight.
    let event_type: 'trial' | undefined
    if (type === 'event') {
      if (Math.random() < 0.6) type = 'mob'
      else event_type = 'trial'
    }
    const finalMult = type === 'elite' ? baseMult * 1.3 : baseMult
    return {
      enemy_id: enc.enemy_id,
      name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
      mult: finalMult, tier: enc.tier,
      sublocation_type: type,
      ...(event_type ? { event_type } : {}),
    }
  })
}

function initialState(): GameState {
  const startWeapon = rollWeapon('straight_swords', 'common')
  return {
    stats: { ...DEFAULT_STATS },
    player_class: '',
    total_levels_spent: 0,
    runes: 0, lost_runes: 0, lost_rune_location: '', lost_rune_node_index: -1,
    owned_weapons: [startWeapon.instance_id],
    weapon_instances: [startWeapon],
    weapon_level: { [startWeapon.instance_id]: 0 },
    current_hp: calcMaxHp(DEFAULT_STATS.VIG),
    run_count: 0, run_active: false,
    run_location_sequence: [],
    run_current_index: 0,
    run_start_time: 0,
    run_duration_seconds: RUN_DURATION_SECONDS,
    run_estus_count: RUN_ESTUS_MAX,
    run_defeated_enemies: [],
    pending_encounter: null,
    pending_run_reward: '',
    run_location_name: '',
    completed_locations: [],
    abandon_penalty: 0,
    active_workflow: null,
    active_content_id: null,
    content_items: [],

    total_task_time_s: 0,
    locale: 'pl',
  }
}

export interface GameStore extends GameState {
  maxHp: () => number

  // Run management
  startRun:            (locationName?: string, numSublocations?: number, runDuration?: number) => void
  advanceRun:          () => void
  endRunVictory:       () => void
  endRunFailure:       () => void
  setPendingEncounter: (loc: LocationData | null) => void
  setPendingReward:    (id: string) => void
  addDefeatedEnemy:    (id: string) => void
  syncCombatResult:    (hp: number, estus: number) => void

  // HP / resources
  takePlayerDamage:  (amount: number) => void
  healPlayer:        (amount: number) => void
  drinkEstus:        () => boolean

  // Weapon inventory
  addWeaponInstance: (w: WeaponInstance) => void
  unlockWeapon:      (id: string) => void
  upgradeWeapon:     (weaponId: string) => boolean

  // Rune economy
  addRunes:         (amount: number) => void
  dropRunes:        (location: string, nodeIndex: number) => void
  recoverRunes:     () => void
  spendRunesOnStat: (stat: keyof Stats) => boolean

  // Abandon penalty
  setAbandonPenalty:    (v: number) => void
  clearAbandonPenalty:  () => void

  saveWorkflowProgress: (workflow: WorkflowGraph) => void
  setActiveContentId:   (id: string) => void
  clearActiveWorkflow:  () => void

  // Class & character init
  initClass: (classId: string) => void

  // Content pipeline
  addContentItem:    (name: string) => void
  updateContentItem: (id: string, patch: Partial<Pick<ContentItem, 'name' | 'notes' | 'completed' | 'is_remastering' | 'remaster_count' | 'last_workflow'>>) => void
  removeContentItem: (id: string) => void
  startRemaster:           (contentId: string, weaponInstanceId: string) => void
  attachContentToWeapon:   (contentId: string, weaponInstanceId: string) => void
  detachContentFromWeapon: (contentId: string) => void

  // Learning items

  // Analytics
  addTaskTime: (seconds: number) => void

  // Locale
  setLocale: (locale: Locale) => void

  // Persistence
  save:  () => void
  load:  () => boolean
  reset: () => void
}

const _savedOrFresh = loadGame() ?? initialState()
hydrateRegistries(_savedOrFresh)

export const useGameStore = create<GameStore>((set, get) => ({
  ..._savedOrFresh,

  maxHp: () => calcMaxHp(get().stats.VIG),

  startRun: (locationName = '', numSublocations = 20, runDuration = RUN_DURATION_SECONDS) => {
    const seq = generateLocationSequence(numSublocations)
    set({
      run_active: true,
      run_location_sequence: seq,
      run_current_index: 0,
      run_start_time: Date.now() / 1000,
      run_duration_seconds: runDuration,
      run_estus_count: RUN_ESTUS_MAX,
      run_defeated_enemies: [],
      current_hp: calcMaxHp(get().stats.VIG),
      run_location_name: locationName,
      active_workflow: null,
      active_content_id: null,
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
      run_count:  s.run_count + 1,
      completed_locations: s.completed_locations.includes(s.run_location_name)
        ? s.completed_locations
        : [...s.completed_locations, s.run_location_name],
    }))
    get().save()
  },

  endRunFailure: () => { set({ run_active: false, active_workflow: null, active_content_id: null }); get().save() },

  setPendingEncounter: (loc) => { set({ pending_encounter: loc }); get().save() },
  setPendingReward:    (id)  => set({ pending_run_reward: id }),
  syncCombatResult:    (hp, estus) => set({ current_hp: hp, run_estus_count: estus }),
  addDefeatedEnemy:    (id)  => set(s => ({ run_defeated_enemies: [...s.run_defeated_enemies, id] })),

  takePlayerDamage: (amount) => set(s => ({ current_hp: Math.max(0, s.current_hp - amount) })),
  healPlayer:       (amount) => set(s => ({
    current_hp: Math.min(calcMaxHp(s.stats.VIG), s.current_hp + amount),
  })),

  drinkEstus: () => {
    const s = get()
    if (s.run_estus_count <= 0) return false
    const healAmount = Math.floor(calcMaxHp(s.stats.VIG) * ESTUS_HEAL_FRACTION)
    set(prev => ({
      run_estus_count: prev.run_estus_count - 1,
      current_hp:      Math.min(calcMaxHp(prev.stats.VIG), prev.current_hp + healAmount),
    }))
    return true
  },

  addWeaponInstance: (w) => {
    registerWeapon(w)
    set(s => ({
      weapon_instances: [...s.weapon_instances.filter(x => x.instance_id !== w.instance_id), w],
      owned_weapons: s.owned_weapons.includes(w.instance_id)
        ? s.owned_weapons : [...s.owned_weapons, w.instance_id],
      weapon_level: s.weapon_level[w.instance_id] !== undefined
        ? s.weapon_level : { ...s.weapon_level, [w.instance_id]: 0 },
    }))
    get().save()
  },

  unlockWeapon: (id) => set(s => ({
    owned_weapons: s.owned_weapons.includes(id) ? s.owned_weapons : [...s.owned_weapons, id],
    weapon_level:  s.weapon_level[id] !== undefined ? s.weapon_level : { ...s.weapon_level, [id]: 0 },
  })),

  addRunes: (amount) => set(s => ({ runes: s.runes + amount })),

  dropRunes: (location, nodeIndex) => set(s => ({
    lost_runes: s.runes, lost_rune_location: location,
    lost_rune_node_index: nodeIndex, runes: 0,
  })),

  recoverRunes: () => set(s => ({
    runes: s.runes + s.lost_runes, lost_runes: 0,
    lost_rune_location: '', lost_rune_node_index: -1,
  })),

  spendRunesOnStat: (stat) => {
    const s    = get()
    const cost = statLevelCost(s.total_levels_spent)
    if (s.runes < cost) return false
    const newVal = s.stats[stat] + 1
    set(prev => ({
      runes: prev.runes - cost,
      total_levels_spent: prev.total_levels_spent + 1,
      stats: { ...prev.stats, [stat]: newVal },
      current_hp: stat === 'VIG' ? calcMaxHp(newVal) : prev.current_hp,
    }))
    get().save()
    return true
  },

  upgradeWeapon: (weaponId) => {
    const s        = get()
    const curLevel = s.weapon_level[weaponId] ?? 0
    if (curLevel >= 10) return false
    const cost = weaponUpgradeCost(curLevel)
    if (s.runes < cost) return false
    set(prev => ({
      runes:        prev.runes - cost,
      weapon_level: { ...prev.weapon_level, [weaponId]: curLevel + 1 },
    }))
    get().save()
    return true
  },

  setAbandonPenalty:   (v) => { set({ abandon_penalty: v }); get().save() },
  clearAbandonPenalty: ()  => { set({ abandon_penalty: 0 }); get().save() },

  saveWorkflowProgress: (workflow) => { set({ active_workflow: workflow }); get().save() },
  setActiveContentId:   (id)       => { set({ active_content_id: id }); get().save() },
  clearActiveWorkflow:  ()         => { set({ active_workflow: null, active_content_id: null }); get().save() },

  initClass: (classId) => {
    const cls = CLASS_DEFINITIONS.find(c => c.id === classId)
    if (!cls) return
    const w = rollWeapon(cls.weaponClass, 'common')
    registerWeapon(w)
    set({
      player_class: classId,
      stats: { ...cls.startingStats },
      total_levels_spent: 0,
      runes: 0, lost_runes: 0, lost_rune_location: '', lost_rune_node_index: -1,
      owned_weapons: [w.instance_id],
      weapon_instances: [w],
      weapon_level: { [w.instance_id]: 0 },
      current_hp: calcMaxHp(cls.startingStats.VIG),
    })
    get().save()
  },

  addContentItem: (name) => {
    const id   = 'c_' + Math.random().toString(36).slice(2, 9)
    set(s => {
      const item: ContentItem = { id, name }
      return { content_items: [...s.content_items, item] }
    })
    get().save()
  },

  updateContentItem: (id, patch) => {
    set(s => ({
      content_items: s.content_items.map(c => c.id === id ? { ...c, ...patch } : c),
    }))
    get().save()
  },

  removeContentItem: (id) => {
    set(s => ({ content_items: s.content_items.filter(c => c.id !== id) }))
    get().save()
  },

  startRemaster: (contentId, weaponInstanceId) => {
    const weapon = WEAPONS[weaponInstanceId] as WeaponInstance | undefined
    if (!weapon) return
    const weaponClass = weapon.weapon_class
    const item = get().content_items.find(c => c.id === contentId)
    const stateIndex = Math.min((item?.remaster_count ?? 0) + 1, WEAPON_CLASSES[weaponClass].remaster_steps)
    const workflow = item?.last_workflow
      ? regenerateWorkflowKeepingStructure(item.last_workflow, weaponClass, weapon.rolled_draws, stateIndex)
      : generateRemasterWorkflow(weaponClass, weapon.rolled_draws, stateIndex)
    set(s => ({
      content_items: s.content_items.map(c => c.id === contentId ? { ...c, completed: false, is_remastering: true } : c),
      active_workflow: workflow,
      active_content_id: contentId,
    }))
    get().save()
  },

  attachContentToWeapon: (contentId, weaponInstanceId) => {
    set(s => ({
      content_items: s.content_items.map(c => c.id === contentId ? { ...c, attached_weapon_id: weaponInstanceId } : c),
    }))
    get().save()
  },

  detachContentFromWeapon: (contentId) => {
    set(s => ({
      content_items: s.content_items.map(c => c.id === contentId ? { ...c, attached_weapon_id: undefined } : c),
    }))
    get().save()
  },

  addTaskTime: (seconds) => {
    set(s => ({ total_task_time_s: (s.total_task_time_s ?? 0) + seconds }))
    get().save()
  },

  setLocale: (locale) => { set({ locale }); get().save() },

  save: () => saveGame(get()),

  load: () => {
    const data = loadGame()
    if (!data) return false
    // Migration safety
    if (!data.content_items)  data.content_items  = []
    if (!data.locale)          data.locale          = 'pl'
    if (!data.total_task_time_s) data.total_task_time_s = 0
    if (data.abandon_penalty === undefined) data.abandon_penalty = 0
    if (data.active_workflow  === undefined) data.active_workflow  = null
    if (data.active_content_id === undefined) data.active_content_id = null
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

// ── Selectors ─────────────────────────────────────────────────────────────

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
  return ENEMIES[loc.enemy_id] ?? null
}

export const selectWeaponSlotLoad = (s: GameStore, weaponInstanceId: string) => {
  const used = s.content_items.filter(c => !c.completed && c.attached_weapon_id === weaponInstanceId).length
  const weapon = WEAPONS[weaponInstanceId] as WeaponInstance | undefined
  const capacity = weapon ? WEAPON_CLASSES[weapon.weapon_class].content_slots : 0
  return { used, capacity }
}

export const selectEquipLoad = (s: GameStore) => {
  const contentUsed = s.content_items.filter(c => !c.completed).length * ARTICLE_EQUIP_WEIGHT
  return { used: contentUsed, capacity: s.stats.END }
}
