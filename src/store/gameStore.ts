import { create } from 'zustand'
import type { GameState, LocationData, Stats, GeneratedMoveset, WeaponInstance, SublocationType, ContentItem, ContentPhase, AtomicOrigin, StatusType, DamageType, Locale, LearningItem } from '../types/game'
import type { ContentProductType } from '../data/contentProducts'
import { ENEMIES } from '../data/enemies'
import { saveGame, loadGame } from '../engine/save'
import { registerWeapon } from '../data/weapons'
import { RUN_DURATION_SECONDS, RUN_ESTUS_MAX, ESTUS_HEAL_FRACTION, ARTICLE_EQUIP_WEIGHT, LEARNING_ITEM_WEIGHT, statLevelCost, weaponUpgradeCost } from '../data/constants'
import { MOVES, registerMoveset } from '../data/movesets'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { LOCATION_DEFINITIONS } from '../data/locations'
import { CLASS_DEFINITIONS } from '../data/classes'

/** Re-populate WEAPONS/MOVES registries from persisted instances (called on load & init). */
function hydrateRegistries(state: GameState): void {
  state.weapon_instances.forEach(w => registerWeapon(w))
  state.moveset_instances.forEach(m => registerMoveset(m))
}


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

const ENCOUNTER_POOL: Array<{ enemy_id: string; tier: number }> = [
  // Tier 1 (easy) — 15
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
  // Tier 2 (medium) — 18
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
  // Tier 3 (hard) — 10
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
  // Boss pool (one selected randomly per run) — 4
  { enemy_id: 'perfectionism_knight', tier: 4 },
  { enemy_id: 'overload_colossus',    tier: 4 },
  { enemy_id: 'distraction_weaver',   tier: 4 },
  { enemy_id: 'void_tyrant',          tier: 4 },
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

function generateLocationSequence(numSublocations: number = 20): LocationData[] {
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
      return {
        enemy_id: enc.enemy_id,
        name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
        mult: baseMult,
        tier: enc.tier,
        sublocation_type: 'boss' as SublocationType,
        boss_name: ENEMIES[enc.enemy_id]?.name ?? enc.enemy_id,
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
      tier: enc.tier,
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
    run_duration_seconds: RUN_DURATION_SECONDS,
    run_estus_count: RUN_ESTUS_MAX,
    run_defeated_enemies: [],
    pending_encounter: null,
    pending_run_reward: '',
    run_location_name: '',
    completed_locations: [],
    run_start_owned_movesets: [],
    content_items: [],
    learning_items: [],
    last_victory_time: 0,
    locale: 'pl',
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
  equipMovesetToWeaponSlot: (weaponId: string, slotIdx: number, movesetId: string) => void
  removeMovesetFromWeaponSlot: (weaponId: string, slotIdx: number) => void
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

  // Content pipeline
  addContentItem: (name: string) => void
  updateContentItem: (id: string, patch: Partial<Pick<ContentItem, 'name' | 'phase' | 'notes'>>) => void
  removeContentItem: (id: string) => void
  publishContentItem: (id: string) => number   // returns rune reward granted
  stampContentItem: (id: string, stamps: { product?: ContentProductType; origin?: AtomicOrigin; status?: StatusType; style?: DamageType }) => void

  // Learning items
  addLearningItem: (name: string) => void
  completeLearningItem: (id: string) => void
  removeLearningItem: (id: string) => void

  // Momentum
  setLastVictoryTime: (t: number) => void

  // Locale
  setLocale: (locale: Locale) => void

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

  startRun: (weapons, locationName = '', numSublocations = 20, runDuration = RUN_DURATION_SECONDS) => {
    const locDef = LOCATION_DEFINITIONS.find(l => l.id === locationName)
    const seq = generateLocationSequence(numSublocations)
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
    const healAmount = Math.floor(calcMaxHp(s.stats.VIG) * ESTUS_HEAL_FRACTION)
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

  equipMovesetToWeaponSlot: (weaponId, slotIdx, movesetId) => {
    const s = get()
    const inst = s.weapon_instances.find(w => w.instance_id === weaponId)
    if (!inst) return
    const ms = MOVES[movesetId] as GeneratedMoveset | undefined
    const newInsts = s.weapon_instances.map(w => {
      if (w.instance_id !== weaponId) return w
      const backed = w.scaling_original ?? { ...w.scaling }
      const newScaling = ms?.infusion
        ? { ...backed, ...ms.infusion }
        : { ...backed }
      return { ...w, scaling: newScaling, scaling_original: backed }
    })
    const slots = [...(s.weapon_extra_movesets[weaponId] ?? [])]
    slots[slotIdx] = movesetId
    set({ weapon_instances: newInsts, weapon_extra_movesets: { ...s.weapon_extra_movesets, [weaponId]: slots } })
    get().save()
  },

  removeMovesetFromWeaponSlot: (weaponId, slotIdx) => {
    const s = get()
    const newInsts = s.weapon_instances.map(w => {
      if (w.instance_id !== weaponId) return w
      const original = w.scaling_original ?? w.scaling
      return { ...w, scaling: { ...original }, scaling_original: undefined }
    })
    const slots = [...(s.weapon_extra_movesets[weaponId] ?? [])]
    slots[slotIdx] = ''
    set({ weapon_instances: newInsts, weapon_extra_movesets: { ...s.weapon_extra_movesets, [weaponId]: slots } })
    get().save()
  },

  applyWeaponHeat: (_heat) => {
    // Phase 5: overheat is now an in-combat damage penalty (see combat.ts).
    // Between-run cooldowns are removed. No-op; kept for API compatibility.
  },

  addWeaponInstance: (w) => {
    registerWeapon(w)
    // Collect every moveset ID the weapon references so we can persist them.
    // Without this, MOVES['m_xxx'] is undefined after a page reload and the
    // weapon's movesets become unselectable.
    const msIds = [
      ...(w.constant_movesets ?? []),
      ...Object.values(w.defense_movesets ?? {}),
    ]
    set(s => {
      const newMovesetInsts = [...s.moveset_instances]
      for (const id of msIds) {
        const ms = MOVES[id] as GeneratedMoveset | undefined
        if (ms && !newMovesetInsts.find(x => x.id === id)) {
          newMovesetInsts.push(ms as GeneratedMoveset)
        }
      }
      return {
        moveset_instances: newMovesetInsts,
        weapon_instances: [...s.weapon_instances.filter(x => x.instance_id !== w.instance_id), w],
        owned_weapons: s.owned_weapons.includes(w.instance_id) ? s.owned_weapons : [...s.owned_weapons, w.instance_id],
        weapon_level: s.weapon_level[w.instance_id] !== undefined ? s.weapon_level : { ...s.weapon_level, [w.instance_id]: 0 },
        weapon_extra_movesets: s.weapon_extra_movesets[w.instance_id]
          ? s.weapon_extra_movesets
          : { ...s.weapon_extra_movesets, [w.instance_id]: [] },
      }
    })
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

  // ── Content pipeline ────────────────────────────────────────────────────
  addContentItem: (name) => {
    const id = 'c_' + Math.random().toString(36).slice(2, 9)
    const item: ContentItem = { id, name, phase: 'Research' }
    set(s => ({ content_items: [...s.content_items, item] }))
    get().save()
  },

  updateContentItem: (id, patch) => {
    set(s => ({
      content_items: s.content_items.map(c =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }))
    get().save()
  },

  removeContentItem: (id) => {
    set(s => ({ content_items: s.content_items.filter(c => c.id !== id) }))
    get().save()
  },

  publishContentItem: (id) => {
    const item = get().content_items.find(c => c.id === id)
    // Rune reward: 50 base + 25 per stamp locked on the article
    const stamps = item
      ? [item.stamped_product, item.stamped_origin, item.stamped_status].filter(Boolean).length
      : 0
    const reward = 50 + stamps * 25
    set(s => ({
      content_items: s.content_items.map(c =>
        c.id === id ? { ...c, phase: 'Published' as ContentPhase, published_at: Date.now() } : c
      ),
      runes: s.runes + reward,
    }))
    get().save()
    return reward
  },

  stampContentItem: (id, stamps) => {
    set(s => ({
      content_items: s.content_items.map(c => {
        if (c.id !== id) return c
        return {
          ...c,
          // Only overwrite a stamp if it isn't already set (first-use locks it)
          stamped_product: c.stamped_product ?? stamps.product,
          stamped_origin: c.stamped_origin ?? stamps.origin,
          stamped_status: c.stamped_status ?? stamps.status,
          stamped_style:  c.stamped_style  ?? stamps.style,
        }
      }),
    }))
    get().save()
  },

  // ── Learning items ───────────────────────────────────────────────────────
  addLearningItem: (name) => {
    const id = 'l_' + Math.random().toString(36).slice(2, 9)
    const item: LearningItem = { id, name }
    set(s => ({ learning_items: [...s.learning_items, item] }))
    get().save()
  },

  completeLearningItem: (id) => {
    set(s => ({
      learning_items: s.learning_items.map(li =>
        li.id === id ? { ...li, completed_at: Date.now() } : li
      ),
    }))
    get().save()
  },

  removeLearningItem: (id) => {
    set(s => ({ learning_items: s.learning_items.filter(li => li.id !== id) }))
    get().save()
  },

  setLastVictoryTime: (t) => { set({ last_victory_time: t }); get().save() },

  setLocale: (locale) => { set({ locale }); get().save() },

  save: () => saveGame(get()),

  load: () => {
    const data = loadGame()
    if (!data) return false
    // Back-fill fields added after a save was created (migration safety)
    if (!data.content_items) data.content_items = []
    if (!data.locale) data.locale = 'pl'
    if (!data.last_victory_time) data.last_victory_time = 0
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

export const selectEquipLoad = (s: GameStore) => {
  const contentUsed  = s.content_items.filter(c => c.phase !== 'Published').length * ARTICLE_EQUIP_WEIGHT
  const learningUsed = s.learning_items.filter(li => !li.completed_at).length * LEARNING_ITEM_WEIGHT
  const used     = contentUsed + learningUsed
  const capacity = s.stats.END
  return { used, capacity }
}
