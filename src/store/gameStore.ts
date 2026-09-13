import { create } from 'zustand'
import type { GameState, LocationData, Stats, WeaponInstance, WeaponClass, SublocationType, CampaignNode, Locale, WorkflowGraph, LocationTheme, RewardTier, ContentProductType, ContentTransformation, StatKey, AudienceSectionKey, MediumContentType, HeavyContentType } from '../types/game'
import { DEFAULT_MUSIC_TRACKS } from '../data/combatMusic'
import { ENEMIES } from '../data/enemies'
import { saveGame, loadGame } from '../engine/save'
import { registerWeapon, calcWeaponSellPrice } from '../data/weapons'
import { INITIAL_GAME_TIME_SECONDS, ESTUS_START, ESTUS_HEAL_HP, statLevelCost, weaponUpgradeCost, MAX_ACTIVE_CAMPAIGNS, RESEARCH_FINISH_SUPERHITS } from '../data/constants'
import { rollWeapon } from '../data/generators/weaponGenerator'
import { WEAPON_CLASSES, ALL_WEAPON_CLASSES, type CampaignActionType } from '../data/generators/weaponClasses'
import { CLASS_DEFINITIONS } from '../data/classes'
import { generateWeaponCampaign, isNodeAvailable } from '../data/generators/campaignGenerator'
import type { LocationDef } from '../data/locations'
import { LOCATION_DEFINITIONS } from '../data/locations'
import { REGION_DEFINITIONS } from '../data/regions'

function hydrateRegistries(state: GameState): void {
  state.weapon_instances.forEach(w => registerWeapon(w))
}

// Rolls the class's own weapon plus one more per action type (medium/heavy/research)
// not already covered by it, so every new character starts with all three campaign
// action types available instead of being locked into just one.
function rollStartingWeapons(primaryClass: WeaponClass): WeaponInstance[] {
  const weapons = [rollWeapon(primaryClass, 'common')]
  const covered = new Set<CampaignActionType>([WEAPON_CLASSES[primaryClass].action_type])
  const allTypes: CampaignActionType[] = ['medium', 'heavy', 'research']
  for (const actionType of allTypes) {
    if (covered.has(actionType)) continue
    const classesOfType = ALL_WEAPON_CLASSES.filter(c => WEAPON_CLASSES[c].action_type === actionType)
    const pick = classesOfType[Math.floor(Math.random() * classesOfType.length)]
    weapons.push(rollWeapon(pick, 'common'))
    covered.add(actionType)
  }
  return weapons
}

const DEFAULT_STATS: Stats = { VIG: 2, END: 2, TEXT: 0, VIDEO: 0, AUDIO: 0, GRAPHIC: 0, VELOCITY: 0, DEPTH: 0, PARASOCIAL: 0, FRICTION: 0, INSIGHT: 0 }

export function calcMaxHp(vig: number): number {
  const v = vig + 8
  if (v <= 25) return 300 + v * 12
  if (v <= 40) return 600 + (v - 25) * 18
  return 870 + (v - 40) * 8
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
  // ── T1 audience archetypes + simple content-blocker mobs ──────────────
  { enemy_id: 'glupi',                    tier: 1 },
  { enemy_id: 'glupi',                    tier: 1 },
  { enemy_id: 'glupi',                    tier: 1 },
  { enemy_id: 'brainless',               tier: 1 },
  { enemy_id: 'brainless',               tier: 1 },
  { enemy_id: 'brainless',               tier: 1 },
  { enemy_id: 'czytacz',                 tier: 1 },
  { enemy_id: 'czytacz',                 tier: 1 },
  { enemy_id: 'czytacz',                 tier: 1 },
  { enemy_id: 'zmeczony',                tier: 1 },
  { enemy_id: 'zmeczony',                tier: 1 },
  { enemy_id: 'zmeczony',                tier: 1 },
  { enemy_id: 'sluchowiec',              tier: 1 },
  { enemy_id: 'sluchowiec',              tier: 1 },
  { enemy_id: 'sluchowiec',              tier: 1 },
  { enemy_id: 'baron_pivot',             tier: 1 },
  { enemy_id: 'baron_pivot',             tier: 1 },
  { enemy_id: 'baron_pivot',             tier: 1 },
  { enemy_id: 'architekt_sciany_tekstu', tier: 1 },
  { enemy_id: 'architekt_sciany_tekstu', tier: 1 },
  { enemy_id: 'architekt_sciany_tekstu', tier: 1 },
  { enemy_id: 'wzrokowiec',              tier: 1 },
  { enemy_id: 'wzrokowiec',              tier: 1 },
  { enemy_id: 'wzrokowiec',              tier: 1 },
  // ── T2 strategic engagement/format mobs ───────────────────────────────
  { enemy_id: 'pobudzony',               tier: 2 },
  { enemy_id: 'pobudzony',               tier: 2 },
  { enemy_id: 'sfrustrowany',            tier: 2 },
  { enemy_id: 'sfrustrowany',            tier: 2 },
  { enemy_id: 'intelektualista',         tier: 2 },
  { enemy_id: 'intelektualista',         tier: 2 },
  { enemy_id: 'kolekcjoner_kursow',      tier: 2 },
  { enemy_id: 'kolekcjoner_kursow',      tier: 2 },
  { enemy_id: 'formatowy_purysta',       tier: 2 },
  { enemy_id: 'formatowy_purysta',       tier: 2 },
  { enemy_id: 'algorytmiczny_zombie',    tier: 2 },
  { enemy_id: 'algorytmiczny_zombie',    tier: 2 },
  { enemy_id: 'fabryka_wyswietlen',      tier: 2 },
  { enemy_id: 'fabryka_wyswietlen',      tier: 2 },
]

const TIER_MULTS: Record<number, number> = { 1: 0.65, 2: 1.0, 3: 1.35, 4: 1.60 }

function calcTierCounts(numSublocations: number): [number, number, number] {
  const mobs = Math.max(3, numSublocations - 1)
  const t1 = Math.max(1, Math.round(mobs * 0.30))
  const t2 = Math.max(1, Math.round(mobs * 0.42))
  const t3 = Math.max(1, mobs - t1 - t2)
  return [t1, t2, t3]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateLocationSequence(
  numSublocations: number,
  difficulty: number,
  theme: LocationTheme,
  runCount: number,
): LocationData[] {
  const [t1, t2, t3] = calcTierCounts(numSublocations)
  const tier1    = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 1)).slice(0, t1)
  const tier2    = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 2)).slice(0, t2)
  const tier3    = shuffle(ENCOUNTER_POOL.filter(e => e.tier === 3)).slice(0, t3)
  const bossPool = ENCOUNTER_POOL.filter(e => e.tier === 4)
  const boss     = [bossPool[Math.floor(Math.random() * bossPool.length)]]
  const ordered  = [...tier1, ...tier2, ...tier3, ...boss]

  const diffMult = 1.0 + difficulty * 0.05
  const runMult  = 1.0 + Math.min(20, runCount) * 0.03

  return ordered.map((enc, i) => {
    const baseMult = TIER_MULTS[enc.tier] ?? 1.0
    const isLast   = i === ordered.length - 1
    if (isLast) {
      const bossEnemy = ENEMIES[enc.enemy_id]
      return {
        enemy_id: enc.enemy_id,
        name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
        mult: baseMult * diffMult * runMult,
        tier: enc.tier,
        sublocation_type: 'boss' as SublocationType,
        boss_name: bossEnemy?.boss_name ?? bossEnemy?.name ?? enc.enemy_id,
        locationTheme: theme,
      }
    }
    const position = i / ordered.length
    const eliteChance = 0.15 + position * 0.1
    const eventChance = 0.10
    const roll = Math.random()
    let type: SublocationType = 'mob'
    if (roll < eventChance) type = 'event'
    else if (roll < eventChance + eliteChance) type = 'elite'
    let event_type: 'trial' | undefined
    if (type === 'event') {
      if (Math.random() < 0.6) type = 'mob'
      else event_type = 'trial'
    }
    const finalMult = (type === 'elite' ? baseMult * 1.3 : baseMult) * diffMult * runMult
    return {
      enemy_id: enc.enemy_id,
      name: LOCATION_NAMES[i] ?? `Location ${i + 1}`,
      mult: finalMult, tier: enc.tier,
      sublocation_type: type,
      locationTheme: theme,
      ...(event_type ? { event_type } : {}),
    }
  })
}

function initialState(): GameState {
  const startWeapon = rollWeapon('straight_swords', 'common')
  return {
    stats: { ...DEFAULT_STATS },
    player_class: '',
    total_levels_spent: 1,
    runes: 0, lost_runes: 0, lost_rune_location: '', lost_rune_node_index: -1,
    owned_weapons: [startWeapon.instance_id],
    weapon_instances: [startWeapon],
    weapon_level: { [startWeapon.instance_id]: 0 },
    current_hp: calcMaxHp(DEFAULT_STATS.VIG),
    run_count: 0, run_active: false,
    run_location_sequence: [],
    run_current_index: 0,
    run_duration_seconds: INITIAL_GAME_TIME_SECONDS,
    game_time_end: 0,
    run_estus_count: ESTUS_START,
    run_defeated_enemies: [],
    pending_encounter: null,
    pending_run_reward: '',
    run_location_name: '',
    completed_locations: [],
    workflow_progress: {},
    content_streak: {},
    active_content_id: null,
    pending_weapon_id: null,
    weapon_campaigns: {},
    campaign_library: [],

    total_task_time_s: 0,
    node_time_spent: {},
    locale: 'pl',
    stat_modifications_used: {},
    completed_regions: [],
    current_region_id: 'region_0',
    game_won: false,
    rewards: { C: 0, B1: 0, B2: 0, A1: 0, A2: 0, S: 0 },
    reward_names: {},
    reward_used_count: {},
    pending_superhits: 0,
    run_music_seed: 0,
    music_tracks: DEFAULT_MUSIC_TRACKS,
    audiences: [],
  }
}

export interface GameStore extends GameState {
  maxHp: () => number

  // Run management
  startRun:            (loc: LocationDef) => void
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
  addEstus:          (n: number) => void
  drinkEstus:        () => boolean

  // Weapon inventory
  addWeaponInstance: (w: WeaponInstance) => void
  unlockWeapon:      (id: string) => void
  upgradeWeapon:     (weaponId: string) => boolean
  sellWeapon:        (weaponInstanceId: string) => void

  // Rune economy
  addRunes:         (amount: number) => void
  dropRunes:        (location: string, nodeIndex: number) => void
  recoverRunes:     () => void
  spendRunesOnStat: (stat: keyof Stats) => boolean

  // Abandon penalty

  saveWorkflowProgress: (workflow: WorkflowGraph) => void
  setActiveContentId:   (id: string) => void
  setPendingWeaponId:   (id: string | null) => void
  clearActiveWorkflow:  () => void    // clears active node's progress + active_content_id
  saveContentStreak:    (nodeId: string, streak: number) => void
  clearContentStreak:   (nodeId: string) => void

  // Class & character init
  initClass: (classId: string) => void

  // Campaign (per weapon)
  assignCampaignToWeapon:       (weaponId: string, defaultName?: string) => void
  renameCampaignNode:           (weaponId: string, nodeId: string, name: string) => void
  completeCampaignNode:         (weaponId: string, nodeId: string, workflow: WorkflowGraph) => void
  publishCampaignNode:          (weaponId: string, nodeId: string) => void
  useSuperhitOnNode:            (weaponId: string, nodeId: string) => void
  promoteNode:                  (weaponId: string, nodeId: string) => void
  renameCampaign:               (weaponId: string, name: string) => void
  applyLibraryCampaignToWeapon: (campaignId: string, weaponId: string) => void
  activateCampaign:             (weaponId: string) => void
  detachCampaign:               (weaponId: string) => void
  setCampaignSkipAllowance:     (weaponInstanceId: string, value: number) => void

  // Campaign node tile allocation (pre-activation budget distribution)
  setNodeTileAllocation: (weaponId: string, nodeId: string, research: number, produce: number) => void

  // Campaign modification actions (spend stat modification slots on inactive campaigns)
  modifyNodeContentType: (weaponId: string, nodeId: string, newType: ContentProductType, stat: StatKey) => boolean
  resetNodeContentType:  (weaponId: string, nodeId: string) => void
  modifyEdgeLabel:       (weaponId: string, fromId: string, toId: string, newLabel: ContentTransformation | null, stat: StatKey) => boolean
  resetEdgeLabel:        (weaponId: string, fromId: string, toId: string) => void

  // Medium/Heavy mode modification actions (spend stat budget; blocked when campaign active)
  modifyMediumChunkType:  (weaponId: string, chunkId: string, newType: MediumContentType, stat: StatKey) => boolean
  modifyHeavyProductType: (weaponId: string, newType: HeavyContentType, stat: StatKey) => boolean
  // Reset actions (restore original value, refund stat)
  resetMediumChunkType:  (weaponId: string, chunkId: string) => void
  resetHeavyProductType: (weaponId: string) => void

  // Campaign finalization
  finalizeCampaign: (weaponId: string, freshCampaignName?: string) => void

  // Medium/Heavy/Research campaign actions
  renameMediumChunk:      (weaponId: string, chunkId: string, name: string) => void
  renameHeavyPart:        (weaponId: string, partId: string, name: string) => void
  completeMediumChunk:    (weaponId: string, chunkId: string) => void
  completeHeavyPart:      (weaponId: string, partId: string) => void
  completeResearchStep:   (weaponId: string) => void
  finishResearch:         (weaponId: string) => void
  consumeSuperhitCharge:  () => void

  // External rewards
  addReward:    (tier: RewardTier) => void
  useReward:    (tier: RewardTier) => void
  mergeRewards: (tier: RewardTier) => void
  renameReward: (tier: RewardTier, name: string) => void

  // Analytics
  addTaskTime: (seconds: number) => void
  recordNodeTime: (nodeId: string, stage: 'Research' | 'Produce', seconds: number) => void

  // World regions
  setCurrentRegion: (regionId: string) => void

  // Locale
  setLocale: (locale: Locale) => void

  // Music playlist
  setMusicTracks: (tracks: string[]) => void

  // Audience profiles
  createAudience:     (id: string, name: string) => void
  deleteAudience:     (id: string) => void
  renameAudience:     (id: string, name: string) => void
  addAudienceItem:    (audienceId: string, section: AudienceSectionKey, text: string) => void
  updateAudienceItem: (audienceId: string, section: AudienceSectionKey, itemId: string, text: string) => void
  deleteAudienceItem: (audienceId: string, section: AudienceSectionKey, itemId: string) => void

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

  startRun: (loc: LocationDef) => {
    const runCount = get().run_count
    const seq = generateLocationSequence(loc.numSublocations, loc.difficulty, loc.theme, runCount)
    const currentEnd = get().game_time_end
    set({
      run_active: true,
      run_location_sequence: seq,
      run_current_index: 0,
      run_duration_seconds: loc.runDuration,
      game_time_end: currentEnd === 0
        ? Math.floor(Date.now() / 1000) + INITIAL_GAME_TIME_SECONDS
        : currentEnd,
      run_defeated_enemies: [],
      current_hp: calcMaxHp(get().stats.VIG),
      run_location_name: loc.id,
      run_music_seed: Math.floor(Math.random() * 10000),
      // workflow_progress and content_streak are campaign data that span multiple runs — do NOT clear
      active_content_id: null,
      pending_weapon_id: null,
    })
    get().save()
  },

  advanceRun: () => {
    set(s => ({ run_current_index: s.run_current_index + 1 }))
    get().save()
  },

  endRunVictory: () => {
    set(s => {
      const completedLocs = s.completed_locations.includes(s.run_location_name)
        ? s.completed_locations
        : [...s.completed_locations, s.run_location_name]

      const loc    = LOCATION_DEFINITIONS.find(l => l.id === s.run_location_name)
      const regionId = loc?.region_id ?? 'region_0'
      const region   = REGION_DEFINITIONS.find(r => r.id === regionId)
      const isGateBoss = loc?.is_final_location === true

      const completedRegions = isGateBoss && !s.completed_regions.includes(regionId)
        ? [...s.completed_regions, regionId]
        : s.completed_regions

      const gameWon = s.game_won || (isGateBoss && region?.isFinalRegion === true)

      return {
        run_active:         false,
        run_count:          s.run_count + 1,
        completed_locations: completedLocs,
        completed_regions:  completedRegions,
        game_won:           gameWon,
        run_estus_count:    s.run_estus_count + 1,
        game_time_end:      s.game_time_end + s.run_duration_seconds,
      }
    })
    get().save()
  },

  endRunFailure: () => { set({ run_active: false, active_content_id: null }); get().save() },

  setPendingEncounter: (loc) => { set({ pending_encounter: loc }); get().save() },
  setPendingReward:    (id)  => set({ pending_run_reward: id }),
  syncCombatResult:    (hp, estus) => set({ current_hp: hp, run_estus_count: estus }),
  addDefeatedEnemy:    (id)  => set(s => ({ run_defeated_enemies: [...s.run_defeated_enemies, id] })),

  takePlayerDamage: (amount) => set(s => ({ current_hp: Math.max(0, s.current_hp - amount) })),
  healPlayer:       (amount) => set(s => ({
    current_hp: Math.min(calcMaxHp(s.stats.VIG), s.current_hp + amount),
  })),

  addEstus: (n) => { set(s => ({ run_estus_count: s.run_estus_count + n })); get().save() },

  drinkEstus: () => {
    const s = get()
    if (s.run_estus_count <= 0) return false
    const healAmount = ESTUS_HEAL_HP
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

  sellWeapon: (weaponInstanceId) => {
    set(s => {
      const instance = s.weapon_instances.find(w => w.instance_id === weaponInstanceId)
      const sellPrice = instance ? calcWeaponSellPrice(instance) : 75
      const { [weaponInstanceId]: _dropped, ...remainingCampaigns } = s.weapon_campaigns
      return {
        owned_weapons:    s.owned_weapons.filter(id => id !== weaponInstanceId),
        weapon_instances: s.weapon_instances.filter(w => w.instance_id !== weaponInstanceId),
        weapon_level:     Object.fromEntries(Object.entries(s.weapon_level).filter(([k]) => k !== weaponInstanceId)),
        weapon_campaigns: remainingCampaigns,
        runes: s.runes + sellPrice,
      }
    })
    get().save()
  },

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


  saveWorkflowProgress: (workflow) => {
    const id = get().active_content_id
    if (!id) return
    set(s => ({ workflow_progress: { ...s.workflow_progress, [id]: workflow } }))
    get().save()
  },
  setActiveContentId:   (id)       => { set({ active_content_id: id }); get().save() },
  setPendingWeaponId:   (id)       => { set({ pending_weapon_id: id }); get().save() },
  clearActiveWorkflow:  () => {
    const id = get().active_content_id
    set(s => {
      if (!id) return { active_content_id: null }
      const { [id]: _, ...restWf } = s.workflow_progress
      const { [id]: __, ...restSt } = s.content_streak
      return { workflow_progress: restWf, content_streak: restSt, active_content_id: null }
    })
    get().save()
  },

  saveContentStreak: (nodeId, streak) => {
    set(s => ({ content_streak: { ...s.content_streak, [nodeId]: streak } }))
    get().save()
  },
  clearContentStreak: (nodeId) => {
    set(s => {
      const { [nodeId]: _, ...rest } = s.content_streak
      return { content_streak: rest }
    })
    get().save()
  },

  initClass: (classId) => {
    const cls = CLASS_DEFINITIONS.find(c => c.id === classId)
    if (!cls) return
    const weapons = rollStartingWeapons(cls.weaponClass)
    weapons.forEach(registerWeapon)
    set({
      player_class: classId,
      stats: { ...cls.startingStats },
      total_levels_spent: 1,
      runes: 0, lost_runes: 0, lost_rune_location: '', lost_rune_node_index: -1,
      owned_weapons: weapons.map(w => w.instance_id),
      weapon_instances: weapons,
      weapon_level: Object.fromEntries(weapons.map(w => [w.instance_id, 0])),
      current_hp: calcMaxHp(cls.startingStats.VIG),
      weapon_campaigns: {},
      workflow_progress: {},
      content_streak: {},
      active_content_id: null,
      pending_superhits: 0,
      stat_modifications_used: {},
      completed_regions: [],
      current_region_id: 'region_0',
      game_won: false,
    })
    get().save()
  },

  assignCampaignToWeapon: (weaponId, defaultName) => {
    const weapon = get().weapon_instances.find(w => w.instance_id === weaponId)
    if (!weapon) return
    const campaign = { ...generateWeaponCampaign(weapon), activated: false, campaign_name: defaultName, skip_allowance: 0 }
    set(s => ({ weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: campaign } }))
    get().save()
  },

  renameCampaignNode: (weaponId, nodeId, name) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      return {
        weapon_campaigns: {
          ...s.weapon_campaigns,
          [weaponId]: { ...c, nodes: c.nodes.map(n => n.id === nodeId ? { ...n, name } : n) },
        },
      }
    })
    get().save()
  },

  completeCampaignNode: (weaponId, nodeId, _workflow) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      const node = c.nodes.find(n => n.id === nodeId)
      if (!node) return s
      const updated: CampaignNode = { ...node, completed: true }
      const nodes = c.nodes.map(n => n.id === nodeId ? updated : n)
      const publishedCount = nodes.filter(n => n.published).length
      const skipAllowance = c.skip_allowance ?? 0
      const campaignDone = publishedCount >= nodes.length - skipAllowance
      const { [nodeId]: _, ...streakRest } = s.content_streak
      return {
        weapon_campaigns: {
          ...s.weapon_campaigns,
          [weaponId]: { ...c, nodes, completed: campaignDone },
        },
        content_streak: streakRest,
      }
    })
    get().save()
  },

  publishCampaignNode: (weaponId, nodeId) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      const nodes = c.nodes.map(n => n.id === nodeId ? { ...n, published: true } : n)
      const publishedCount = nodes.filter(n => n.published).length
      const skipAllowance = c.skip_allowance ?? 0
      const campaignDone = publishedCount >= nodes.length - skipAllowance
      const updatedCampaign = { ...c, nodes, completed: campaignDone }
      const library = campaignDone
        ? [...s.campaign_library.filter(lc => lc.id !== updatedCampaign.id), updatedCampaign]
        : s.campaign_library
      return {
        weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: updatedCampaign },
        campaign_library: library,
      }
    })
    get().save()
  },

  renameCampaign: (weaponId, name) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      return { weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: { ...c, campaign_name: name } } }
    })
    get().save()
  },

  applyLibraryCampaignToWeapon: (campaignId, weaponId) => {
    const libraryEntry = get().campaign_library.find(c => c.id === campaignId)
    const weapon = get().weapon_instances.find(w => w.instance_id === weaponId)
    if (!libraryEntry || !weapon) return
    const fresh = { ...generateWeaponCampaign(weapon), campaign_name: libraryEntry.campaign_name, activated: false, skip_allowance: 0 }
    set(s => ({ weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: fresh } }))
    get().save()
  },

  activateCampaign: (weaponId) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c || c.activated) return s
      const activeCount = Object.values(s.weapon_campaigns).filter(wc => wc.activated).length
      if (activeCount >= MAX_ACTIVE_CAMPAIGNS) return s
      return { weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: { ...c, activated: true } } }
    })
    get().save()
  },

  detachCampaign: (weaponId) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      const zeroed = {
        ...c,
        activated: false,
        nodes: c.nodes.map(n => ({
          ...n,
          superhit_used: true,
          promotes_consumed: n.promote_count ?? 0,
        })),
      }
      return {
        weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: zeroed },
      }
    })
    get().save()
  },

  setCampaignSkipAllowance: (weaponId, value) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c || c.activated) return s
      const otherUsed = Object.entries(s.weapon_campaigns)
        .filter(([id]) => id !== weaponId)
        .reduce((sum, [, cam]) => sum + (cam.skip_allowance ?? 0), 0)
      const clamped = Math.max(0, Math.min(s.stats.END - otherUsed, value))
      const publishedCount = c.nodes.filter(n => n.published).length
      const campaignDone = publishedCount >= c.nodes.length - clamped
      return {
        weapon_campaigns: {
          ...s.weapon_campaigns,
          [weaponId]: { ...c, skip_allowance: clamped, completed: campaignDone },
        },
      }
    })
    get().save()
  },

  setNodeTileAllocation: (weaponId, nodeId, research, produce) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c || c.activated) return s
      return {
        weapon_campaigns: {
          ...s.weapon_campaigns,
          [weaponId]: {
            ...c,
            nodes: c.nodes.map(n =>
              n.id === nodeId ? { ...n, node_research: research, node_produce: produce } : n
            ),
          },
        },
      }
    })
    get().save()
  },

  modifyNodeContentType: (weaponId, nodeId, newType, stat) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true) return false
    const remaining = (s.stats[stat] ?? 0) - (s.stat_modifications_used[stat] ?? 0)
    if (remaining <= 0) return false
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c,
          nodes: c.nodes.map(n => {
            if (n.id !== nodeId) return n
            return {
              ...n,
              content_type: newType,
              content_type_modified: true,
              content_type_modified_stat: stat,
              original_content_type: n.content_type_modified ? n.original_content_type : n.content_type,
            }
          }),
        },
      },
      workflow_progress: (() => { const { [nodeId]: _, ...rest } = prev.workflow_progress; return rest })(),
      stat_modifications_used: { ...prev.stat_modifications_used, [stat]: (prev.stat_modifications_used[stat] ?? 0) + 1 },
    }))
    get().save()
    return true
  },

  resetNodeContentType: (weaponId, nodeId) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true) return
    const node = c.nodes.find(n => n.id === nodeId)
    if (!node?.content_type_modified) return
    const refundStat = node.content_type_modified_stat
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c,
          nodes: c.nodes.map(n => {
            if (n.id !== nodeId) return n
            const { content_type_modified: _a, original_content_type, content_type_modified_stat: _b, ...rest } = n
            return { ...rest, content_type: original_content_type }
          }),
        },
      },
      workflow_progress: (() => { const { [nodeId]: _, ...rest } = prev.workflow_progress; return rest })(),
      ...(refundStat ? {
        stat_modifications_used: {
          ...prev.stat_modifications_used,
          [refundStat]: Math.max(0, (prev.stat_modifications_used[refundStat] ?? 0) - 1),
        },
      } : {}),
    }))
    get().save()
  },

  modifyEdgeLabel: (weaponId, fromId, toId, newLabel, stat) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true) return false
    const remaining = (s.stats[stat] ?? 0) - (s.stat_modifications_used[stat] ?? 0)
    if (remaining <= 0) return false
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c,
          edges: c.edges.map(e => {
            if (e.from_id !== fromId || e.to_id !== toId) return e
            return {
              ...e,
              label: newLabel,
              label_modified: true,
              label_modified_stat: stat,
              original_label: e.label_modified ? e.original_label : e.label,
            }
          }),
        },
      },
      stat_modifications_used: { ...prev.stat_modifications_used, [stat]: (prev.stat_modifications_used[stat] ?? 0) + 1 },
    }))
    get().save()
    return true
  },

  resetEdgeLabel: (weaponId, fromId, toId) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true) return
    const edge = c.edges.find(e => e.from_id === fromId && e.to_id === toId)
    if (!edge?.label_modified) return
    const refundStat = edge.label_modified_stat
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c,
          edges: c.edges.map(e => {
            if (e.from_id !== fromId || e.to_id !== toId) return e
            const { label_modified: _a, original_label, label_modified_stat: _b, ...rest } = e
            return { ...rest, label: original_label ?? null }
          }),
        },
      },
      ...(refundStat ? {
        stat_modifications_used: {
          ...prev.stat_modifications_used,
          [refundStat]: Math.max(0, (prev.stat_modifications_used[refundStat] ?? 0) - 1),
        },
      } : {}),
    }))
    get().save()
  },

  modifyMediumChunkType: (weaponId, chunkId, newType, stat) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true || !c.medium) return false
    const remaining = (s.stats[stat] ?? 0) - (s.stat_modifications_used[stat] ?? 0)
    if (remaining <= 0) return false
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c, medium: { ...c.medium!, chunks: c.medium!.chunks.map(ch => ch.id !== chunkId ? ch : {
            ...ch, content_type: newType, type_modified: true, type_modified_stat: stat,
            original_content_type: ch.type_modified ? ch.original_content_type : ch.content_type,
          }) },
        },
      },
      stat_modifications_used: { ...prev.stat_modifications_used, [stat]: (prev.stat_modifications_used[stat] ?? 0) + 1 },
    }))
    get().save()
    return true
  },

  resetMediumChunkType: (weaponId, chunkId) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true || !c.medium) return
    const ch = c.medium.chunks.find(x => x.id === chunkId)
    if (!ch?.type_modified) return
    const refundStat = ch.type_modified_stat
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c, medium: { ...c.medium!, chunks: c.medium!.chunks.map(x => {
            if (x.id !== chunkId) return x
            const { type_modified: _a, original_content_type, type_modified_stat: _b, ...rest } = x
            return { ...rest, content_type: original_content_type ?? x.content_type }
          }) },
        },
      },
      ...(refundStat ? { stat_modifications_used: { ...prev.stat_modifications_used, [refundStat]: Math.max(0, (prev.stat_modifications_used[refundStat] ?? 0) - 1) } } : {}),
    }))
    get().save()
  },

  modifyHeavyProductType: (weaponId, newType, stat) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true || !c.heavy) return false
    const remaining = (s.stats[stat] ?? 0) - (s.stat_modifications_used[stat] ?? 0)
    if (remaining <= 0) return false
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c, heavy: {
            ...c.heavy!, product_type: newType, product_type_modified: true, product_type_modified_stat: stat,
            original_product_type: c.heavy!.product_type_modified ? c.heavy!.original_product_type : c.heavy!.product_type,
          },
        },
      },
      stat_modifications_used: { ...prev.stat_modifications_used, [stat]: (prev.stat_modifications_used[stat] ?? 0) + 1 },
    }))
    get().save()
    return true
  },

  resetHeavyProductType: (weaponId) => {
    const s = get()
    const c = s.weapon_campaigns[weaponId]
    if (!c || c.activated === true || !c.heavy?.product_type_modified) return
    const refundStat = c.heavy.product_type_modified_stat
    const origType = c.heavy.original_product_type ?? c.heavy.product_type
    set(prev => ({
      weapon_campaigns: {
        ...prev.weapon_campaigns,
        [weaponId]: {
          ...c, heavy: {
            ...c.heavy!,
            product_type: origType,
            product_type_modified: false, original_product_type: undefined, product_type_modified_stat: undefined,
          },
        },
      },
      ...(refundStat ? { stat_modifications_used: { ...prev.stat_modifications_used, [refundStat]: Math.max(0, (prev.stat_modifications_used[refundStat] ?? 0) - 1) } } : {}),
    }))
    get().save()
  },

  finalizeCampaign: (weaponId, freshCampaignName) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign || !campaign.completed) return s

      const weapon = s.weapon_instances.find(w => w.instance_id === weaponId)
      if (!weapon) return s

      const carried = campaign.nodes
        .filter(n => n.published)
        .reduce((acc, n) => {
          const base     = n.superhit_used ? 0 : 1
          const promotes = (n.promote_count ?? 0) - (n.promotes_consumed ?? 0)
          return acc + base + Math.max(0, promotes)
        }, 0)

      const newDoneCount = (campaign.done_count ?? 0) + 1
      const updated = { ...campaign, done_count: newDoneCount }

      const freshCampaign = { ...generateWeaponCampaign(weapon), activated: false, ordinal: newDoneCount + 1, campaign_name: freshCampaignName, skip_allowance: 0 }

      return {
        weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: freshCampaign },
        campaign_library: [
          ...s.campaign_library.filter(c => c.id !== campaign.id),
          updated,
        ],
        pending_superhits: (s.pending_superhits ?? 0) + carried,
      }
    })
    get().save()
  },

  renameMediumChunk: (weaponId, chunkId, name) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign?.medium) return s
      const chunks = campaign.medium.chunks.map(ch => ch.id === chunkId ? { ...ch, name, named: true } : ch)
      return { weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: { ...campaign, medium: { ...campaign.medium, chunks } } } }
    })
    get().save()
  },

  renameHeavyPart: (weaponId, partId, name) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign?.heavy) return s
      const parts = campaign.heavy.parts.map(p => p.id === partId ? { ...p, name, named: true } : p)
      return { weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: { ...campaign, heavy: { ...campaign.heavy, parts } } } }
    })
    get().save()
  },

  completeMediumChunk: (weaponId, chunkId) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign?.medium) return s
      const chunks = campaign.medium.chunks
      const idx = chunks.findIndex(ch => ch.id === chunkId)
      // Enforce strict order — a chunk can only be completed once every earlier one is done.
      if (idx === -1 || chunks.slice(0, idx).some(ch => !ch.done)) return s
      const updatedChunks = chunks.map(ch => ch.id === chunkId ? { ...ch, done: true } : ch)
      const completed = campaign.medium.completed || updatedChunks.every(ch => ch.done)
      const updated = { ...campaign, medium: { ...campaign.medium, chunks: updatedChunks, completed } }
      return {
        weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: updated },
        pending_superhits: (s.pending_superhits ?? 0) + 1,
      }
    })
    get().save()
  },

  completeHeavyPart: (weaponId, partId) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign?.heavy) return s
      const parts = campaign.heavy.parts
      const idx = parts.findIndex(p => p.id === partId)
      // Enforce strict order — a part can only be completed once every earlier one is done.
      if (idx === -1 || parts.slice(0, idx).some(p => !p.done)) return s
      const updatedParts = parts.map(p => p.id === partId ? { ...p, done: true } : p)
      const completed = campaign.heavy.completed || updatedParts.every(p => p.done)
      const updated = { ...campaign, heavy: { ...campaign.heavy, parts: updatedParts, completed } }
      return {
        weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: updated },
        pending_superhits: (s.pending_superhits ?? 0) + 1,
      }
    })
    get().save()
  },

  completeResearchStep: (weaponId) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign?.research) return s
      const done_steps = campaign.research.done_steps + 1
      const updated = { ...campaign, research: { ...campaign.research, done_steps } }
      return { weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: updated } }
    })
    get().save()
  },

  // Declares the whole research effort finished — grants a flat bonus, once, and
  // resets the counter so the next round of steps has to earn it again.
  finishResearch: (weaponId) => {
    set(s => {
      const campaign = s.weapon_campaigns[weaponId]
      if (!campaign?.research || campaign.research.done_steps <= 0) return s
      const updated = { ...campaign, research: { ...campaign.research, done_steps: 0 } }
      return {
        weapon_campaigns: { ...s.weapon_campaigns, [weaponId]: updated },
        pending_superhits: (s.pending_superhits ?? 0) + RESEARCH_FINISH_SUPERHITS,
      }
    })
    get().save()
  },

  consumeSuperhitCharge: () => {
    set(s => {
      const current = s.pending_superhits ?? 0
      if (current <= 0) return s
      return { pending_superhits: current - 1 }
    })
    get().save()
  },

  useSuperhitOnNode: (weaponId, nodeId) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      return {
        weapon_campaigns: {
          ...s.weapon_campaigns,
          [weaponId]: {
            ...c,
            nodes: c.nodes.map(n => {
              if (n.id !== nodeId) return n
              if (!n.superhit_used) return { ...n, superhit_used: true }
              return { ...n, promotes_consumed: (n.promotes_consumed ?? 0) + 1 }
            }),
          },
        },
      }
    })
    get().save()
  },

  promoteNode: (weaponId, nodeId) => {
    set(s => {
      const c = s.weapon_campaigns[weaponId]
      if (!c) return s
      return {
        weapon_campaigns: {
          ...s.weapon_campaigns,
          [weaponId]: {
            ...c,
            nodes: c.nodes.map(n =>
              n.id === nodeId && (n.promote_count ?? 0) < 3
                ? { ...n, promote_count: (n.promote_count ?? 0) + 1 }
                : n
            ),
          },
        },
      }
    })
    get().save()
  },

  addTaskTime: (seconds) => {
    set(s => ({ total_task_time_s: (s.total_task_time_s ?? 0) + seconds }))
    get().save()
  },

  recordNodeTime: (nodeId, stage, seconds) => {
    set(s => {
      const prev = s.node_time_spent[nodeId] ?? { Research: 0, Produce: 0 }
      return {
        total_task_time_s: (s.total_task_time_s ?? 0) + seconds,
        node_time_spent: {
          ...s.node_time_spent,
          [nodeId]: { ...prev, [stage]: prev[stage] + seconds },
        },
      }
    })
    get().save()
  },

  addReward: (tier) => {
    set(s => ({ rewards: { ...s.rewards, [tier]: (s.rewards[tier] ?? 0) + 1 } }))
    get().save()
  },

  useReward: (tier) => {
    set(s => {
      const cur = s.rewards[tier] ?? 0
      if (cur <= 0) return s
      return {
        rewards: { ...s.rewards, [tier]: cur - 1 },
        reward_used_count: { ...(s.reward_used_count ?? {}), [tier]: ((s.reward_used_count ?? {})[tier] ?? 0) + 1 },
      }
    })
    get().save()
  },

  mergeRewards: (tier) => {
    const MERGE_UP: Record<RewardTier, RewardTier[]> = {
      C:  ['B1', 'B2'],
      B1: ['A1', 'A2'],
      B2: ['A1', 'A2'],
      A1: ['S'],
      A2: ['S'],
      S:  [],
    }
    const targets = MERGE_UP[tier]
    if (!targets.length) return
    set(s => {
      const cur = s.rewards[tier] ?? 0
      if (cur < 3) return s
      const target = targets[Math.floor(Math.random() * targets.length)] as RewardTier
      return {
        rewards: {
          ...s.rewards,
          [tier]: cur - 3,
          [target]: (s.rewards[target] ?? 0) + 1,
        },
      }
    })
    get().save()
  },

  renameReward: (tier, name) => {
    set(s => ({ reward_names: { ...s.reward_names, [tier]: name || undefined } }))
    get().save()
  },

  setCurrentRegion: (regionId) => { set({ current_region_id: regionId }); get().save() },

  setLocale: (locale) => { set({ locale }); get().save() },
  setMusicTracks: (tracks) => { set({ music_tracks: tracks }); get().save() },

  createAudience: (id, name) => {
    const sections = Object.fromEntries([
      'sociological_trends','long_term_trends','short_term_trends','needs_explanations',
      'identities_values','attitudes_beliefs','symbols_slogans','heroes_enemies',
      'myths_reflexes','narratives_frames',
    ].map(k => [k, []])) as unknown as Record<AudienceSectionKey, { id: string; text: string }[]>
    set(s => ({ audiences: [...(s.audiences ?? []), { id, name, sections }] }))
    get().save()
  },

  deleteAudience: (id) => {
    set(s => ({ audiences: (s.audiences ?? []).filter(a => a.id !== id) }))
    get().save()
  },

  renameAudience: (id, name) => {
    set(s => ({ audiences: (s.audiences ?? []).map(a => a.id === id ? { ...a, name } : a) }))
    get().save()
  },

  addAudienceItem: (audienceId, section, text) => {
    const item = { id: crypto.randomUUID(), text }
    set(s => ({
      audiences: (s.audiences ?? []).map(a => a.id !== audienceId ? a : {
        ...a, sections: { ...a.sections, [section]: [...a.sections[section], item] },
      }),
    }))
    get().save()
  },

  updateAudienceItem: (audienceId, section, itemId, text) => {
    set(s => ({
      audiences: (s.audiences ?? []).map(a => a.id !== audienceId ? a : {
        ...a, sections: {
          ...a.sections,
          [section]: a.sections[section].map(i => i.id === itemId ? { ...i, text } : i),
        },
      }),
    }))
    get().save()
  },

  deleteAudienceItem: (audienceId, section, itemId) => {
    set(s => ({
      audiences: (s.audiences ?? []).map(a => a.id !== audienceId ? a : {
        ...a, sections: {
          ...a.sections,
          [section]: a.sections[section].filter(i => i.id !== itemId),
        },
      }),
    }))
    get().save()
  },

  save: () => saveGame(get()),

  load: () => {
    const data = loadGame()
    if (!data) return false
    // Migration safety
    if (!data.locale)                    data.locale                    = 'pl'
    if (!data.weapon_campaigns)          data.weapon_campaigns          = {}
    if (!data.campaign_library)          data.campaign_library          = []
    if (!data.stat_modifications_used)   data.stat_modifications_used   = {}
    if (!data.completed_regions)         data.completed_regions         = []
    if (!data.current_region_id)         data.current_region_id         = 'region_0'
    if (data.game_won === undefined)     data.game_won                  = false
    // Legacy campaigns (pre-activated field) were all active by definition
    for (const wid of Object.keys(data.weapon_campaigns)) {
      const c = data.weapon_campaigns[wid]
      if (c && c.activated === undefined) c.activated = true
    }
    if (!data.total_task_time_s)    data.total_task_time_s    = 0
    if (!data.node_time_spent)      data.node_time_spent      = {}
    if (data.active_content_id === undefined)  data.active_content_id  = null
    if (data.pending_weapon_id === undefined)  data.pending_weapon_id  = null
    if (!data.content_streak)                  data.content_streak     = {}
    if (data.game_time_end === undefined)      data.game_time_end      = 0
    // Migrate legacy single active_workflow → per-node workflow_progress
    if (!data.workflow_progress) {
      data.workflow_progress = {}
      const legacy = (data as unknown as Record<string, unknown>).active_workflow
      if (legacy && data.active_content_id) {
        data.workflow_progress[data.active_content_id] = legacy as WorkflowGraph
      }
    }
    delete (data as unknown as Record<string, unknown>).active_workflow
    // Remove legacy fields
    delete (data as unknown as Record<string, unknown>).content_items
    delete (data as unknown as Record<string, unknown>).active_campaign
    delete (data as unknown as Record<string, unknown>).past_campaigns
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

export const selectRunRemainingSeconds = (s: GameStore) =>
  s.game_time_end > 0
    ? Math.max(0, s.game_time_end - Date.now() / 1000)
    : Infinity   // game not yet started — no urgency

export const selectIsRunExpired = (s: GameStore) =>
  s.run_active && s.game_time_end > 0 && selectRunRemainingSeconds(s) <= 0

export const selectCurrentLocation = (s: GameStore) =>
  s.run_location_sequence[s.run_current_index] ?? null

export const selectEnemyData = (s: GameStore) => {
  const loc = selectCurrentLocation(s)
  if (!loc) return null
  return ENEMIES[loc.enemy_id] ?? null
}

export const selectAvailableNodes = (s: GameStore, weaponId: string): CampaignNode[] => {
  const c = s.weapon_campaigns[weaponId]
  if (!c) return []
  return c.nodes.filter(n => !n.completed && n.name.trim() !== '' && isNodeAvailable(c.nodes, c.edges, n))
}

export const selectRemainingModifications = (s: GameStore): Partial<Record<StatKey, number>> => {
  const result: Partial<Record<StatKey, number>> = {}
  const modStats: StatKey[] = ['TEXT','VIDEO','AUDIO','GRAPHIC','VELOCITY','DEPTH','PARASOCIAL','FRICTION','INSIGHT']
  for (const stat of modStats) {
    result[stat] = (s.stats[stat] ?? 0) - (s.stat_modifications_used[stat] ?? 0)
  }
  return result
}
