import type {
  CombatPhase, MoveType, WorkflowGraph, WorkflowTile,
  Enemy, WeaponInstance, Stats, MobAffinities, MobAffinityConditions, LocationTheme,
} from '../types/game'
import { LOCATION_THEMES } from '../data/locationThemes'
import { WEAPONS, calcWeaponScaledDamage } from '../data/weapons'
import {
  REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX, REPEAT_DAMAGE_PENALTY, SACRIFICE_MULT,
  HEAVY_TIME_BONUS, DMG_PER_MIN,
  FLOW_GAP_HOT_MINS, FLOW_GAP_WARM_MINS, FLOW_GAP_COLD_MINS,
  FLOW_MULT_HOT, FLOW_MULT_WARM, FLOW_MULT_COLD, FLOW_MULT_DEAD,
} from '../data/constants'

export interface LogEntry { id: number; text: string; color?: string }

export interface CombatState {
  phase: CombatPhase
  // Workflow
  workflow: WorkflowGraph
  currentTileId: string
  // Player
  playerHp: number
  playerMaxHp: number
  playerEstus: number
  // Weapon / stats context
  equippedWeaponId: string
  weaponLevel: number
  playerStats: Stats
  incomingPenalty: number   // from prior abandon; 0.0 = none
  consistencyStreak: number   // consecutive completions without switching weapon/content; resets on either
  isRemasterPass: boolean     // true while working a remaster-originated workflow
  // Enemy
  enemyData: Enemy
  isBoss: boolean
  enemyHp: number
  enemyMaxHp: number
  mobsDefeated: number
  // Pending move
  selectedTileId: string | null
  pendingTile: WorkflowTile | null
  pendingMove: MoveType | null
  stepTimer: number
  stepTotal: number
  stepStarted: boolean
  timerExpired: boolean
  // Rune reward — set once, from the defeated enemy's rune_reward, on VICTORY
  runesEarned: number
  // Flow bonus (time since last fight)
  flowMult: number
  // Location theme bonus
  locationTheme?: LocationTheme
  // Log
  log: LogEntry[]
  logId: number
}

export type CombatAction =
  | { type: 'SELECT_TILE'; tileId: string }
  | { type: 'CHOOSE_MOVE'; move: MoveType }
  | { type: 'START_TIMER' }
  | { type: 'TICK'; delta: number }
  | { type: 'TIMER_RESULT'; accomplished: boolean; sacrificeTimeFrac?: number }
  | { type: 'CANCEL_TIMER' }
  | { type: 'USE_ESTUS' }
  | { type: 'ABANDON' }
  | { type: 'SWITCH_WORKFLOW'; workflow: WorkflowGraph; isRemaster?: boolean; consistencyStreak?: number }
  | { type: 'SWITCH_WEAPON'; weaponId: string; weaponLevel: number }
  | { type: 'ADD_LOG'; text: string; color?: string }
  | { type: 'SUPERHIT'; tile: WorkflowTile }

// ── Constants ─────────────────────────────────────────────────────────────

const FAIL_DAMAGE_PER_MIN = 4   // HP damage per minute of tile time on failure

const AFFINITY_MULTS: Record<keyof MobAffinities, number> = {
  love:    2.0,
  like:    1.5,
  dislike: 0.7,
  hate:    0.5,
}

// ── Helpers ───────────────────────────────────────────────────────────────

function log(state: CombatState, text: string, color?: string): CombatState {
  const entry: LogEntry = { id: state.logId + 1, text, color }
  return { ...state, log: [...state.log, entry], logId: state.logId + 1 }
}

function getCompletedIds(graph: WorkflowGraph): Set<string> {
  return new Set(graph.tiles.filter(t => t.is_completed).map(t => t.id))
}

// A tile is reachable only when ALL its predecessors are completed.
// Start tile (no predecessors) is always reachable until done.
export function getReachableTiles(graph: WorkflowGraph): Set<string> {
  const completed = getCompletedIds(graph)
  const reachable = new Set<string>()
  for (const tile of graph.tiles) {
    if (tile.is_completed) continue
    const preds = graph.edges.filter(e => e.to === tile.id).map(e => e.from)
    if (preds.length === 0 || preds.every(p => completed.has(p))) {
      reachable.add(tile.id)
    }
  }
  return reachable
}

// Base (time-driven) damage before any weapon/stat/bonus scaling is applied.
function tileDamageBase(tile: WorkflowTile, move: MoveType): number {
  const timeMin = (move === 'Heavy' ? tile.time_heavy : tile.time_light) / 60
  const moveMult = move === 'Heavy' ? HEAVY_TIME_BONUS : 1.0
  return timeMin * DMG_PER_MIN * moveMult
}

// Damage dealt to enemy when a tile is completed.
export function calcTileDamage(
  tile: WorkflowTile, move: MoveType, weapon: WeaponInstance | undefined,
  weaponLevel: number, stats: Stats,
): number {
  const base = tileDamageBase(tile, move)
  return weapon
    ? calcWeaponScaledDamage(base, weapon, weaponLevel, stats, tile.content_type, tile.content_origin, tile.style_type, tile.status)
    : Math.round(base)
}

// +5% per consecutive completion without switching weapon/content, capped at +50%.
function consistencyMultFor(streak: number): number {
  return 1.0 + Math.min(0.5, 0.05 * streak)
}

// Mob-affinity mult only (love/like/dislike/hate from the enemy definition).
export function calcAffinityMultiplier(tile: WorkflowTile, enemy: Enemy): number {
  const { affinities } = enemy
  if (!affinities) return 1
  let mult = 1
  for (const [tier, conditions] of Object.entries(affinities) as [keyof MobAffinities, MobAffinityConditions][]) {
    if (!conditions) continue
    const matched =
      (tile.content_type  != null && conditions.products?.includes(tile.content_type))   ||
      (tile.content_origin != null && conditions.origins?.includes(tile.content_origin))  ||
      (tile.style_type   != null && conditions.styles?.includes(tile.style_type))         ||
      (tile.status        != null && conditions.emotions?.includes(tile.status))           ||
      (conditions.stages?.includes(tile.type))
    if (matched) mult *= AFFINITY_MULTS[tier]
  }
  return mult
}

// +20% if tile content/stage matches the location theme's focus.
export function calcThemeBonus(tile: WorkflowTile, locationTheme?: LocationTheme): number {
  if (!locationTheme) return 1
  const theme = LOCATION_THEMES[locationTheme]
  const themeMatch =
    (tile.content_type != null && theme.contentFocus.includes(tile.content_type)) ||
    (theme.stageFocus.length > 0 && theme.stageFocus.includes(tile.type))
  return themeMatch ? 1.20 : 1
}

// One named factor in the damage chain — `active` is true whenever it's
// actually pulling the number away from 1.0 right now.
export interface DamageMultiplier {
  key:    string
  value:  number    // multiplicative factor; <1 is a penalty, >1 is a bonus
  active: boolean
}

export function formatMultiplierPct(value: number): string {
  const pct = Math.round((value - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `−${Math.abs(pct)}%`
}

// Preview of a move's outcome — mirrors the CHOOSE_MOVE/TIMER_RESULT success math exactly.
export function previewMove(state: CombatState, tile: WorkflowTile, move: MoveType): {
  duration: number
  damage:   number
  multipliers: DamageMultiplier[]
} {
  const duration       = move === 'Heavy' ? tile.time_heavy : tile.time_light
  const weapon         = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined
  const repeatPenalty   = Math.min(REPEAT_PENALTY_MAX, tile.repeat_count * REPEAT_PENALTY_PER_RETRY)
  const consistencyMult  = consistencyMultFor(state.consistencyStreak)
  const remasterMult     = state.isRemasterPass ? 1.2 : 1.0
  const affinityMult     = calcAffinityMultiplier(tile, state.enemyData)
  const themeBonus       = calcThemeBonus(tile, state.locationTheme)
  const isRepeat       = tile.is_completed
  const rawDamage      = calcTileDamage(tile, move, weapon, state.weaponLevel, state.playerStats)
  const repeatDamage   = isRepeat ? Math.round(rawDamage * (1 - REPEAT_DAMAGE_PENALTY)) : rawDamage
  const wouldFinishAll = state.workflow.tiles.every(t => t.id === tile.id || t.is_completed)
  const finisherMult   = wouldFinishAll ? 3.0 : 1.0
  const damage         = Math.round(
    repeatDamage * (1 - repeatPenalty) * (1 - state.incomingPenalty)
      * consistencyMult * remasterMult * affinityMult * themeBonus * finisherMult * state.flowMult
  )
  const multipliers: DamageMultiplier[] = [
    { key: 'heavyBonus',    value: HEAVY_TIME_BONUS,          active: move === 'Heavy' },
    { key: 'repeatFlat',    value: 1 - REPEAT_DAMAGE_PENALTY, active: isRepeat },
    { key: 'repeatScaling', value: 1 - repeatPenalty,         active: repeatPenalty > 0 },
    { key: 'abandon',       value: 1 - state.incomingPenalty, active: state.incomingPenalty > 0 },
    { key: 'affinity',      value: affinityMult,              active: affinityMult !== 1.0 },
    { key: 'theme',         value: themeBonus,                active: themeBonus !== 1.0 },
    { key: 'streak',        value: consistencyMult,           active: state.consistencyStreak > 0 },
    { key: 'remaster',      value: 1.2,                       active: state.isRemasterPass },
    { key: 'finisher',      value: 3.0,                       active: wouldFinishAll },
    { key: 'flow',          value: state.flowMult,            active: state.flowMult !== 1.0 },
  ]
  return { duration, damage, multipliers }
}

// Returns the flow-state damage multiplier based on gap since last fight end.
export function calcFlowMult(lastFightEndedAt: number | undefined): number {
  if (!lastFightEndedAt) return 1.0
  const gapMins = (Date.now() - lastFightEndedAt) / 60000
  if (gapMins < FLOW_GAP_HOT_MINS)  return FLOW_MULT_HOT
  if (gapMins < FLOW_GAP_WARM_MINS) return FLOW_MULT_WARM
  if (gapMins < FLOW_GAP_COLD_MINS) return FLOW_MULT_COLD
  return FLOW_MULT_DEAD
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initCombatState(
  workflow: WorkflowGraph,
  enemy: Enemy,
  _enemyId: string,
  equippedWeaponId: string,
  weaponLevel: number,
  playerHp: number,
  playerMaxHp: number,
  playerEstus: number,
  playerStats: Stats,
  incomingPenalty: number,
  isRemasterPass = false,
  spawnAsBoss = false,
  locationTheme?: LocationTheme,
  flowMult = 1.0,
): CombatState {
  // Derive boss version when the encounter is a boss slot but the enemy entry
  // is a regular mob — scale HP ×2 and swap in the boss display name.
  const isBoss = spawnAsBoss || enemy.is_boss
  const effectiveEnemy: Enemy = (spawnAsBoss && !enemy.is_boss)
    ? { ...enemy, max_hp: enemy.max_hp * 2, name: enemy.boss_name ?? enemy.name }
    : enemy

  let state: CombatState = {
    phase: 'PLAYER_TURN',
    workflow,
    currentTileId: workflow.start_id,
    playerHp, playerMaxHp,
    playerEstus,
    equippedWeaponId, weaponLevel, playerStats,
    incomingPenalty,
    consistencyStreak: 0, isRemasterPass,
    enemyData: effectiveEnemy, isBoss,
    enemyHp: effectiveEnemy.max_hp, enemyMaxHp: effectiveEnemy.max_hp,
    mobsDefeated: 0,
    selectedTileId: null,
    pendingTile: null, pendingMove: null,
    stepTimer: 0, stepTotal: 1,
    stepStarted: false, timerExpired: false,
    runesEarned: 0,
    flowMult,
    locationTheme,
    log: [], logId: 0,
  }
  state = log(state, `${effectiveEnemy.name} — complete tiles to deal damage. Drain HP to win.`, '#c9a93a')
  state = log(state, effectiveEnemy.description, '#7a7570')
  if (incomingPenalty > 0) {
    state = log(state, `⚠ Abandon penalty active: −${Math.round(incomingPenalty * 100)}% damage.`, '#cc6622')
  }
  if (isBoss) {
    state = log(state, '⚡ Boss encounter — this enemy has 2× HP.', '#cc4488')
  }
  if (flowMult > 1.0) {
    const tier = flowMult >= FLOW_MULT_HOT ? 'HOT' : 'WARM'
    state = log(state, `⚡ Flow ${tier}: +${Math.round((flowMult - 1) * 100)}% damage from consecutive fights.`, '#44ccff')
  }
  return state
}

// ── Reducer ───────────────────────────────────────────────────────────────

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {

    case 'SELECT_TILE': {
      if (state.phase !== 'PLAYER_TURN') return state
      const tile = state.workflow.tiles.find(t => t.id === action.tileId)
      if (!tile) return state
      // Allow completed tiles (repeat with penalty) and reachable tiles
      if (!tile.is_completed && !getReachableTiles(state.workflow).has(action.tileId)) return state
      return { ...state, selectedTileId: action.tileId }
    }

    case 'CHOOSE_MOVE': {
      if (state.phase !== 'PLAYER_TURN' || !state.selectedTileId) return state
      const tile = state.workflow.tiles.find(t => t.id === state.selectedTileId)
      if (!tile) return state
      const move = action.move
      const duration = move === 'Heavy' ? tile.time_heavy : tile.time_light
      return {
        ...state,
        phase: 'STEP_TIMER',
        pendingTile: tile,
        pendingMove: move,
        stepTimer: duration,
        stepTotal: duration,
        stepStarted: false,
        timerExpired: false,
      }
    }

    case 'START_TIMER':
      return { ...state, stepStarted: true }

    case 'TICK': {
      if (!state.stepStarted || state.timerExpired) return state
      const newTimer = state.stepTimer - action.delta
      if (newTimer <= 0) return { ...state, stepTimer: 0, timerExpired: true, stepStarted: false }
      return { ...state, stepTimer: newTimer }
    }

    case 'CANCEL_TIMER': {
      if (state.stepStarted || state.timerExpired) {
        const tile   = state.pendingTile
        const dmg    = tile ? Math.round((tile.time_light / 60) * FAIL_DAMAGE_PER_MIN) : 5
        const newHp  = Math.max(0, state.playerHp - dmg)
        let s = log(
          { ...state, playerHp: newHp, stepStarted: false, timerExpired: false },
          `Task abandoned — ${dmg} HP lost to corruption.`, '#cc8833'
        )
        if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
        return { ...s, phase: 'PLAYER_TURN', pendingTile: null, pendingMove: null, selectedTileId: null }
      }
      return { ...state, phase: 'PLAYER_TURN', pendingTile: null, pendingMove: null, selectedTileId: null }
    }

    case 'TIMER_RESULT': {
      const tile = state.pendingTile!
      const move = state.pendingMove!

      if (!action.accomplished) {
        const dmg   = Math.round((tile.time_light / 60) * FAIL_DAMAGE_PER_MIN)
        const newHp = Math.max(0, state.playerHp - dmg)
        let s = log(
          { ...state, playerHp: newHp, timerExpired: false, stepStarted: false },
          `Task failed — ${dmg} HP lost.`, '#cc4444'
        )
        if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
        return { ...s, phase: 'PLAYER_TURN', pendingTile: null, pendingMove: null, selectedTileId: null }
      }

      const weapon        = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined
      const repeatPenalty   = Math.min(REPEAT_PENALTY_MAX, tile.repeat_count * REPEAT_PENALTY_PER_RETRY)
      const consistencyMult = consistencyMultFor(state.consistencyStreak)
      const remasterMult    = state.isRemasterPass ? 1.2 : 1.0
      const affinityMult    = calcAffinityMultiplier(tile, state.enemyData)
      const themeBonus      = calcThemeBonus(tile, state.locationTheme)

      const updatedTiles = state.workflow.tiles.map(t => {
        if (t.id !== tile.id) return t
        return { ...t, is_completed: true, repeat_count: t.repeat_count + 1 }
      })
      const newWorkflow = { ...state.workflow, tiles: updatedTiles }
      const allTilesDone = newWorkflow.tiles.every(t => t.is_completed)
      const finisherMult  = allTilesDone ? 3.0 : 1.0

      const isRepeat      = tile.is_completed
      const rawDamage     = calcTileDamage(tile, move, weapon, state.weaponLevel, state.playerStats)
      const repeatDamage  = isRepeat ? Math.round(rawDamage * (1 - REPEAT_DAMAGE_PENALTY)) : rawDamage
      const damage        = Math.round(
        repeatDamage * (1 - repeatPenalty) * (1 - state.incomingPenalty)
          * consistencyMult * remasterMult * affinityMult * themeBonus * finisherMult * state.flowMult
      )
      const newEnemyHp    = Math.max(0, state.enemyHp - damage)

      let s = log(
        { ...state, workflow: newWorkflow,
          currentTileId: tile.id, enemyHp: newEnemyHp,
          consistencyStreak: state.consistencyStreak + 1,
          timerExpired: false, stepStarted: false,
          pendingTile: null, pendingMove: null, selectedTileId: null },
        `✓ ${tile.name}. ⚔ −${damage} HP${isRepeat ? ' (repeat)' : ''}.`,
        '#c9a93a'
      )
      if (repeatPenalty > 0) {
        s = log(s, `Repeat penalty: −${Math.round(repeatPenalty * 100)}% dmg (+ flat −${Math.round(REPEAT_DAMAGE_PENALTY * 100)}%)`, '#888')
      }
      if (affinityMult !== 1.0) {
        const tier = affinityMult > 1 ? (affinityMult >= 2 ? 'LOVE' : 'LIKE') : (affinityMult <= 0.5 ? 'HATE' : 'DISLIKE')
        s = log(s, `Affinity: ${tier} ×${affinityMult.toFixed(1)}`, affinityMult > 1 ? '#44dd88' : '#dd6644')
      }
      if (themeBonus !== 1.0) {
        s = log(s, `Location theme match +20%`, '#88ccff')
      }
      if (allTilesDone) {
        s = log(s, '⚡ Final tile — 3× damage!', '#e6bf33')
      }

      if (action.sacrificeTimeFrac !== undefined && action.sacrificeTimeFrac > 0) {
        const selfDmg     = Math.round(damage * action.sacrificeTimeFrac * SACRIFICE_MULT)
        const sacrificeHp = Math.max(0, s.playerHp - selfDmg)
        s = log({ ...s, playerHp: sacrificeHp }, `⚔ Sacrifice — ${selfDmg} self-damage`, '#cc3333')
        if (sacrificeHp <= 0) return { ...s, phase: 'DEFEAT' }
      }

      if (newEnemyHp <= 0) {
        s = log(
          { ...s, enemyHp: 0, mobsDefeated: s.mobsDefeated + 1, runesEarned: state.enemyData.rune_reward },
          `⚔ ${state.enemyData.name} slain! ✦ +${state.enemyData.rune_reward} runes.`,
          '#55cc77'
        )
        return { ...s, phase: 'VICTORY' }
      }

      return { ...s, phase: 'PLAYER_TURN' }
    }

    case 'USE_ESTUS': {
      if (state.playerEstus <= 0) return state
      const heal  = Math.floor(state.playerMaxHp * 0.40)
      const newHp = Math.min(state.playerMaxHp, state.playerHp + heal)
      return log(
        { ...state, playerHp: newHp, playerEstus: state.playerEstus - 1 },
        `You drink an estus flask — restored ${newHp - state.playerHp} HP.`, '#44aa88'
      )
    }

    case 'ABANDON': {
      return log({ ...state, phase: 'FLED' },
        'You abandon the workflow. Next workflow will be penalised.', '#7a7570')
    }

    case 'SWITCH_WORKFLOW': {
      if (state.phase !== 'PLAYER_TURN') return state
      return log(
        { ...state, workflow: action.workflow, currentTileId: action.workflow.start_id,
          selectedTileId: null, pendingTile: null, pendingMove: null,
          consistencyStreak: action.consistencyStreak ?? 0,
          isRemasterPass: action.isRemaster ?? false },
        'A new piece of work begins — the fight continues.', '#c9a93a'
      )
    }

    case 'SWITCH_WEAPON': {
      if (state.phase !== 'PLAYER_TURN') return state
      if (action.weaponId === state.equippedWeaponId) return state
      const newWeapon = WEAPONS[action.weaponId] as WeaponInstance | undefined
      return log(
        { ...state, equippedWeaponId: action.weaponId, weaponLevel: action.weaponLevel,
          selectedTileId: null, pendingTile: null, pendingMove: null },
        `You switch to ${newWeapon?.name ?? action.weaponId}.`, '#88aadd'
      )
    }

    case 'ADD_LOG':
      return log(state, action.text, action.color ?? '#c9a93a')

    case 'SUPERHIT': {
      const tile    = action.tile
      const weapon  = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined
      const rawDmg  = calcTileDamage(tile, 'Light', weapon, state.weaponLevel, state.playerStats)
      const damage  = Math.round(rawDmg * 5)
      const newEnemyHp = Math.max(0, state.enemyHp - damage)
      let s = log(
        { ...state, enemyHp: newEnemyHp, selectedTileId: null },
        `💥 SUPERHIT! ⚔ −${damage} HP (5× light attack)`,
        '#eecc44'
      )
      if (newEnemyHp <= 0) {
        s = log(
          { ...s, enemyHp: 0, mobsDefeated: s.mobsDefeated + 1, runesEarned: state.enemyData.rune_reward },
          `⚔ ${state.enemyData.name} slain! ✦ +${state.enemyData.rune_reward} runes.`,
          '#55cc77'
        )
        return { ...s, phase: 'VICTORY' }
      }
      return { ...s, phase: 'PLAYER_TURN' }
    }

    default:
      return state
  }
}

// Re-export constants for UI
export { ABANDON_PENALTY, REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX, REPEAT_DAMAGE_PENALTY } from '../data/constants'
