import type {
  CombatPhase, MoveType, WorkflowGraph, WorkflowTile,
  Enemy, WeaponInstance, Stats,
} from '../types/game'
import { WEAPONS, calcTileReward } from '../data/weapons'
import { REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX, REPEAT_DAMAGE_PENALTY, SACRIFICE_MULT } from '../data/constants'

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
  // Accumulators
  runesEarned: number
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
  | { type: 'ADD_LOG'; text: string; color?: string }

// ── Constants ─────────────────────────────────────────────────────────────

const FAIL_DAMAGE_PER_MIN = 8   // HP damage per minute of tile time on failure

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


function tileRewardBase(tile: WorkflowTile, move: MoveType): number {
  const timeMin  = move === 'Heavy' ? tile.time_heavy / 60 : tile.time_light / 60
  const moveMult = move === 'Heavy' ? 1.5 : move === 'Jump' ? 0.8 : 1.0
  return Math.round(timeMin * 5 * moveMult)
}

// Damage dealt to enemy when a tile is completed
function calcTileDamage(tile: WorkflowTile, move: MoveType, weaponLevel: number): number {
  const timeMin  = tile.time_light / 60           // base off light timer regardless of move
  const moveMult = move === 'Heavy' ? 1.5 : move === 'Jump' ? 0.8 : 1.0
  const lvlMult  = 1 + weaponLevel * 0.05         // +5% per weapon level
  return Math.round(timeMin * 8 * moveMult * lvlMult)
}

// Preview of a move's outcome — mirrors the CHOOSE_MOVE/TIMER_RESULT success math exactly,
// so the move-picker tooltip never drifts from the actual reward/damage dealt.
export function previewMove(state: CombatState, tile: WorkflowTile, move: MoveType): {
  duration: number
  reward:   number
  damage:   number
} {
  const duration       = move === 'Heavy' ? tile.time_heavy : tile.time_light
  const repeatPenalty  = Math.min(REPEAT_PENALTY_MAX, tile.repeat_count * REPEAT_PENALTY_PER_RETRY)
  const baseReward     = tileRewardBase(tile, move)
  const weapon         = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined
  const scaledReward   = weapon
    ? calcTileReward(baseReward, weapon, state.weaponLevel, state.playerStats, tile.content_type)
    : baseReward
  const reward         = Math.round(scaledReward * (1 - repeatPenalty) * (1 - state.incomingPenalty))
  const isRepeat       = tile.is_completed
  const rawDamage      = calcTileDamage(tile, move, state.weaponLevel)
  const damage         = isRepeat ? Math.round(rawDamage * (1 - REPEAT_DAMAGE_PENALTY)) : rawDamage
  return { duration, reward, damage }
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initCombatState(
  workflow: WorkflowGraph,
  enemy: Enemy,
  equippedWeaponId: string,
  weaponLevel: number,
  playerHp: number,
  playerMaxHp: number,
  playerEstus: number,
  playerStats: Stats,
  incomingPenalty: number,
): CombatState {
  let state: CombatState = {
    phase: 'PLAYER_TURN',
    workflow,
    currentTileId: workflow.start_id,
    playerHp, playerMaxHp,
    playerEstus,
    equippedWeaponId, weaponLevel, playerStats,
    incomingPenalty,
    enemyData: enemy, isBoss: enemy.is_boss,
    enemyHp: enemy.max_hp, enemyMaxHp: enemy.max_hp,
    mobsDefeated: 0,
    selectedTileId: null,
    pendingTile: null, pendingMove: null,
    stepTimer: 0, stepTotal: 1,
    stepStarted: false, timerExpired: false,
    runesEarned: 0,
    log: [], logId: 0,
  }
  state = log(state, `${enemy.name} — complete tiles to deal damage. Drain HP to win.`, '#c9a93a')
  state = log(state, enemy.description, '#7a7570')
  if (incomingPenalty > 0) {
    state = log(state, `⚠ Abandon penalty active: −${Math.round(incomingPenalty * 100)}% rewards.`, '#cc6622')
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
        // Give up mid-task — drain some HP
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
      // Cancelled before start — just go back
      return { ...state, phase: 'PLAYER_TURN', pendingTile: null, pendingMove: null, selectedTileId: null }
    }

    case 'TIMER_RESULT': {
      const tile = state.pendingTile!
      const move = state.pendingMove!

      if (!action.accomplished) {
        // Failed — take HP damage proportional to tile duration
        const dmg   = Math.round((tile.time_light / 60) * FAIL_DAMAGE_PER_MIN)
        const newHp = Math.max(0, state.playerHp - dmg)
        let s = log(
          { ...state, playerHp: newHp, timerExpired: false, stepStarted: false },
          `Task failed — ${dmg} HP lost.`, '#cc4444'
        )
        if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
        return { ...s, phase: 'PLAYER_TURN', pendingTile: null, pendingMove: null, selectedTileId: null }
      }

      // Success — complete the tile
      const repeatPenalty = Math.min(REPEAT_PENALTY_MAX, tile.repeat_count * REPEAT_PENALTY_PER_RETRY)
      const baseReward    = tileRewardBase(tile, move)
      const weapon        = WEAPONS[state.equippedWeaponId] as WeaponInstance | undefined
      const scaledReward  = weapon
        ? calcTileReward(baseReward, weapon, state.weaponLevel, state.playerStats, tile.content_type)
        : baseReward
      const finalReward   = Math.round(
        scaledReward * (1 - repeatPenalty) * (1 - state.incomingPenalty)
      )

      const updatedTiles = state.workflow.tiles.map(t => {
        if (t.id !== tile.id) return t
        return { ...t, is_completed: true, repeat_count: t.repeat_count + 1 }
      })
      const newWorkflow = { ...state.workflow, tiles: updatedTiles }

      const isRepeat   = tile.is_completed
      const rawDamage  = calcTileDamage(tile, move, state.weaponLevel)
      const damage     = isRepeat ? Math.round(rawDamage * (1 - REPEAT_DAMAGE_PENALTY)) : rawDamage
      const newEnemyHp = Math.max(0, state.enemyHp - damage)

      let s = log(
        { ...state, workflow: newWorkflow, runesEarned: state.runesEarned + finalReward,
          currentTileId: tile.id, enemyHp: newEnemyHp,
          timerExpired: false, stepStarted: false,
          pendingTile: null, pendingMove: null, selectedTileId: null },
        `✓ ${tile.name}. ✦ +${finalReward} runes. ⚔ −${damage} HP${isRepeat ? ' (repeat)' : ''}.`,
        '#c9a93a'
      )
      if (repeatPenalty > 0) {
        s = log(s, `Repeat penalty: −${Math.round(repeatPenalty * 100)}% runes, −${Math.round(REPEAT_DAMAGE_PENALTY * 100)}% dmg`, '#888')
      }

      // Sacrifice: finishing early at HP cost — applied before the victory
      // check so a killing blow still costs HP.
      if (action.sacrificeTimeFrac !== undefined && action.sacrificeTimeFrac > 0) {
        const selfDmg     = Math.round(damage * action.sacrificeTimeFrac * SACRIFICE_MULT)
        const sacrificeHp = Math.max(0, s.playerHp - selfDmg)
        s = log({ ...s, playerHp: sacrificeHp }, `⚔ Sacrifice — ${selfDmg} self-damage`, '#cc3333')
        if (sacrificeHp <= 0) return { ...s, phase: 'DEFEAT' }
      }

      if (newEnemyHp <= 0) {
        s = log(
          { ...s, enemyHp: 0, mobsDefeated: s.mobsDefeated + 1 },
          `⚔ ${state.enemyData.name} slain!`,
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

    case 'ADD_LOG':
      return log(state, action.text, action.color ?? '#c9a93a')

    default:
      return state
  }
}

// Re-export constants for UI
export { ABANDON_PENALTY, REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX, REPEAT_DAMAGE_PENALTY } from '../data/constants'
