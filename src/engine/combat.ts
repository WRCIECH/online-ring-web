import type {
  CombatPhase, MoveType, WorkflowGraph, WorkflowTile,
  Enemy, WeaponInstance, Stats,
} from '../types/game'
import { WEAPONS, calcTileReward } from '../data/weapons'
import { WEAPON_CLASSES } from '../data/generators/weaponClasses'
import {
  REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX, REPEAT_DAMAGE_PENALTY, SACRIFICE_MULT,
  FLOW_GAP_HOT_MINS, FLOW_GAP_WARM_MINS, FLOW_GAP_COLD_MINS,
  BASE_STAMINA_COST_LIGHT, BASE_STAMINA_COST_HEAVY,
} from '../data/constants'
import { MOB_CURSES, CURSE_PENALTY_CAP, type MobCurseDef } from '../data/mobCurses'

export interface LogEntry { id: number; text: string; color?: string }

// Per-fight progress toward lifting a mob's curse. `lifted` is permanent for
// streak/one-shot conditions; burnout_shade's `idleGap` condition never sets
// it — that curse is a live, recurring threat rather than a puzzle you solve
// once, so it always carries forward if not actively "in flow" at fight end.
export interface ActiveCurse {
  enemyId: string
  forwardStreak: number
  noRepeatStreak: number
  publishedAny: boolean
  variedAny: boolean
  startedFirstTile: boolean
  heavyMoveDone: boolean
  lifted: boolean
}

export interface CombatState {
  phase: CombatPhase
  // Workflow
  workflow: WorkflowGraph
  currentTileId: string
  // Player
  playerHp: number
  playerMaxHp: number
  playerEstus: number
  playerStamina: number
  playerMaxStamina: number
  // Weapon / stats context
  equippedWeaponId: string
  weaponLevel: number
  playerStats: Stats
  incomingPenalty: number   // from prior abandon; 0.0 = none
  slotBonusMult: Record<string, number>   // per-weapon-id reward multiplier from filled content slots
  consistencyStreak: number   // consecutive completions without switching weapon/content; resets on either
  isRemasterPass: boolean     // true while working a remaster-originated workflow
  bossRushMult: number        // damage multiplier from gap since last boss kill; 1.0 outside boss fights
  // Curses
  activeCurses: ActiveCurse[]
  lastTileCompletionAt: number
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
  | { type: 'SWITCH_WORKFLOW'; workflow: WorkflowGraph; isRemaster?: boolean }
  | { type: 'SWITCH_WEAPON'; weaponId: string; weaponLevel: number }
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
  const moveMult = move === 'Heavy' ? 1.5 : 1.0
  return Math.round(timeMin * 5 * moveMult)
}

// Damage dealt to enemy when a tile is completed
function calcTileDamage(tile: WorkflowTile, move: MoveType, weaponLevel: number): number {
  const timeMin  = tile.time_light / 60           // base off light timer regardless of move
  const moveMult = move === 'Heavy' ? 1.5 : 1.0
  const lvlMult  = 1 + weaponLevel * 0.05         // +5% per weapon level
  return Math.round(timeMin * 8 * moveMult * lvlMult)
}

// Per-weapon Heavy bonus — stacks with the flat 1.5x above; reward only.
function heavyBonusMultFor(weapon: WeaponInstance | undefined, move: MoveType): number {
  if (move !== 'Heavy' || !weapon) return 1.0
  return WEAPON_CLASSES[weapon.weapon_class]?.heavy_bonus_mult ?? 1.0
}

// +5% per consecutive completion without switching weapon/content, capped at +50%.
function consistencyMultFor(streak: number): number {
  return 1.0 + Math.min(0.5, 0.05 * streak)
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
    ? calcTileReward(baseReward, weapon, state.weaponLevel, state.playerStats, tile.content_type, tile.content_origin, tile.damage_type, tile.status)
    : baseReward
  const cursePenalty    = computeCursePenalty(state)
  const slotMult        = state.slotBonusMult[state.equippedWeaponId] ?? 1.0
  const heavyBonusMult   = heavyBonusMultFor(weapon, move)
  const consistencyMult  = consistencyMultFor(state.consistencyStreak)
  const remasterMult     = state.isRemasterPass ? 1.2 : 1.0
  const reward         = Math.round(
    scaledReward * (1 - repeatPenalty) * (1 - state.incomingPenalty) * (1 - cursePenalty.rewardPct)
      * slotMult * heavyBonusMult * consistencyMult * remasterMult
  )
  const isRepeat       = tile.is_completed
  const rawDamage      = calcTileDamage(tile, move, state.weaponLevel)
  const repeatDamage   = isRepeat ? Math.round(rawDamage * (1 - REPEAT_DAMAGE_PENALTY)) : rawDamage
  const wouldFinishAll = state.workflow.tiles.every(t => t.id === tile.id || t.is_completed)
  const finisherMult   = wouldFinishAll ? 3.0 : 1.0
  const damage         = Math.round(repeatDamage * (1 - cursePenalty.damagePct) * remasterMult * state.bossRushMult * finisherMult)
  return { duration, reward, damage }
}

// ── Curses ────────────────────────────────────────────────────────────────

function activeCurseDefs(curses: ActiveCurse[]): Array<{ curse: ActiveCurse; def: MobCurseDef }> {
  const out: Array<{ curse: ActiveCurse; def: MobCurseDef }> = []
  for (const curse of curses) {
    if (curse.lifted) continue
    const def = MOB_CURSES[curse.enemyId]
    if (def) out.push({ curse, def })
  }
  return out
}

function burnoutGapFraction(lastTileCompletionAt: number): number {
  if (!lastTileCompletionAt) return 0
  const gapMin = (Date.now() - lastTileCompletionAt) / 60000
  if (gapMin < FLOW_GAP_HOT_MINS)  return 0
  if (gapMin < FLOW_GAP_WARM_MINS) return 0.33
  if (gapMin < FLOW_GAP_COLD_MINS) return 0.66
  return 1
}

// Live intensity (0..1) of burnout_shade's curse right now — for UI display,
// recomputed every render rather than only on tile completion.
export function getBurnoutPenalty(state: CombatState): number {
  return burnoutGapFraction(state.lastTileCompletionAt)
}

// Combined curse penalty for the NEXT tile completion, based on currently
// active (unlifted) curses and current stamina. Read-only — shared by the
// move-picker preview and the real TIMER_RESULT application so they never
// drift apart.
function computeCursePenalty(state: CombatState): {
  damagePct: number; rewardPct: number; hpCost: number; staminaSpent: number
} {
  let rawDamagePct = 0, rawRewardPct = 0, hpCost = 0
  let staminaLeft = state.playerStamina
  let staminaSpent = 0
  for (const { def } of activeCurseDefs(state.activeCurses)) {
    const fraction = def.condition.type === 'idleGap' ? burnoutGapFraction(state.lastTileCompletionAt) : 1
    if (fraction <= 0) continue
    const cost  = def.penalty.staminaCostPerTile * fraction
    const spent = Math.min(staminaLeft, cost)
    const cushionFrac  = cost > 0 ? spent / cost : 1
    const uncushioned  = 1 - cushionFrac
    rawDamagePct += def.penalty.damagePct * fraction * uncushioned
    rawRewardPct += def.penalty.rewardPct * fraction * uncushioned
    hpCost       += def.penalty.hpDrainPerTile * fraction * uncushioned
    staminaLeft  -= spent
    staminaSpent += spent
  }
  return {
    damagePct:    Math.min(CURSE_PENALTY_CAP, rawDamagePct),
    rewardPct:    Math.min(CURSE_PENALTY_CAP, rawRewardPct),
    hpCost:       Math.round(hpCost),
    staminaSpent: Math.round(staminaSpent),
  }
}

// Advances each active curse's progress after a tile completion, lifting
// any whose condition is now satisfied. burnout_shade's idleGap condition
// never permanently lifts — see the ActiveCurse comment.
function advanceCurses(
  curses: ActiveCurse[], tile: WorkflowTile, move: MoveType, isRepeat: boolean, isFirstTileEver: boolean,
): { curses: ActiveCurse[]; newlyLifted: string[] } {
  const newlyLifted: string[] = []
  const updated = curses.map(curse => {
    if (curse.lifted) return curse
    const def = MOB_CURSES[curse.enemyId]
    if (!def) return curse
    const next: ActiveCurse = {
      ...curse,
      forwardStreak:    isRepeat ? 0 : curse.forwardStreak + 1,
      noRepeatStreak:   isRepeat ? 0 : curse.noRepeatStreak + 1,
      publishedAny:     curse.publishedAny || tile.type === 'Publish',
      variedAny:        curse.variedAny || !!(tile.content_type || tile.content_origin || tile.damage_type || tile.status),
      heavyMoveDone:    curse.heavyMoveDone || move === 'Heavy',
      startedFirstTile: curse.startedFirstTile || isFirstTileEver,
    }
    let lifted = false
    switch (def.condition.type) {
      case 'forwardStreak':  lifted = next.forwardStreak  >= (def.condition.count ?? 1); break
      case 'noRepeatStreak': lifted = next.noRepeatStreak >= (def.condition.count ?? 1); break
      case 'firstTile':      lifted = next.startedFirstTile; break
      case 'publish':        lifted = next.publishedAny; break
      case 'variety':        lifted = next.variedAny; break
      case 'heavyMove':      lifted = next.heavyMoveDone; break
      case 'idleGap':        lifted = false; break
    }
    if (lifted) newlyLifted.push(def.name)
    return { ...next, lifted }
  })
  return { curses: updated, newlyLifted }
}

function buildActiveCurses(enemyId: string, incomingCurseIds: string[]): ActiveCurse[] {
  const ids = [...new Set([...incomingCurseIds, enemyId])]
  return ids
    .filter(id => MOB_CURSES[id])
    .map(enemyId => ({
      enemyId, forwardStreak: 0, noRepeatStreak: 0, publishedAny: false,
      variedAny: false, startedFirstTile: false, heavyMoveDone: false, lifted: false,
    }))
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initCombatState(
  workflow: WorkflowGraph,
  enemy: Enemy,
  enemyId: string,
  equippedWeaponId: string,
  weaponLevel: number,
  playerHp: number,
  playerMaxHp: number,
  playerEstus: number,
  playerStats: Stats,
  incomingPenalty: number,
  incomingCurseIds: string[],
  playerStamina: number,
  playerMaxStamina: number,
  slotBonusMult: Record<string, number> = {},
  isRemasterPass = false,
  bossRushMult = 1.0,
): CombatState {
  const activeCurses = buildActiveCurses(enemyId, incomingCurseIds)
  let state: CombatState = {
    phase: 'PLAYER_TURN',
    workflow,
    currentTileId: workflow.start_id,
    playerHp, playerMaxHp,
    playerEstus,
    playerStamina, playerMaxStamina,
    equippedWeaponId, weaponLevel, playerStats,
    incomingPenalty,
    slotBonusMult,
    consistencyStreak: 0, isRemasterPass, bossRushMult,
    activeCurses, lastTileCompletionAt: 0,
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
  for (const curse of activeCurses) {
    const def = MOB_CURSES[curse.enemyId]
    if (def) state = log(state, `☠ Curse active: ${def.name} — ${def.flavor}`, '#8855cc')
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
        ? calcTileReward(baseReward, weapon, state.weaponLevel, state.playerStats, tile.content_type, tile.content_origin, tile.damage_type, tile.status)
        : baseReward
      const cursePenalty    = computeCursePenalty(state)
      const slotMult        = state.slotBonusMult[state.equippedWeaponId] ?? 1.0
      const heavyBonusMult  = heavyBonusMultFor(weapon, move)
      const consistencyMult = consistencyMultFor(state.consistencyStreak)
      const remasterMult    = state.isRemasterPass ? 1.2 : 1.0
      const finalReward   = Math.round(
        scaledReward * (1 - repeatPenalty) * (1 - state.incomingPenalty) * (1 - cursePenalty.rewardPct)
          * slotMult * heavyBonusMult * consistencyMult * remasterMult
      )

      const isFirstTileEver = !state.workflow.tiles.some(t => t.is_completed)
      const updatedTiles = state.workflow.tiles.map(t => {
        if (t.id !== tile.id) return t
        return { ...t, is_completed: true, repeat_count: t.repeat_count + 1 }
      })
      const newWorkflow = { ...state.workflow, tiles: updatedTiles }
      const allTilesDone = newWorkflow.tiles.every(t => t.is_completed)
      const finisherMult  = allTilesDone ? 3.0 : 1.0

      const isRepeat      = tile.is_completed
      const rawDamage     = calcTileDamage(tile, move, state.weaponLevel)
      const repeatDamage  = isRepeat ? Math.round(rawDamage * (1 - REPEAT_DAMAGE_PENALTY)) : rawDamage
      const damage        = Math.round(repeatDamage * (1 - cursePenalty.damagePct) * remasterMult * state.bossRushMult * finisherMult)
      const newEnemyHp    = Math.max(0, state.enemyHp - damage)
      const staminaCost   = (move === 'Heavy' ? BASE_STAMINA_COST_HEAVY : BASE_STAMINA_COST_LIGHT)
        * (weapon ? WEAPON_CLASSES[weapon.weapon_class]?.stamina_mod ?? 1.0 : 1.0)
      const newStamina    = Math.max(0, state.playerStamina - cursePenalty.staminaSpent - staminaCost)
      const hpAfterCurse  = Math.max(0, state.playerHp - cursePenalty.hpCost)

      let s = log(
        { ...state, workflow: newWorkflow, runesEarned: state.runesEarned + finalReward,
          currentTileId: tile.id, enemyHp: newEnemyHp,
          playerHp: hpAfterCurse, playerStamina: newStamina, lastTileCompletionAt: Date.now(),
          consistencyStreak: state.consistencyStreak + 1,
          timerExpired: false, stepStarted: false,
          pendingTile: null, pendingMove: null, selectedTileId: null },
        `✓ ${tile.name}. ✦ +${finalReward} runes. ⚔ −${damage} HP${isRepeat ? ' (repeat)' : ''}.`,
        '#c9a93a'
      )
      if (repeatPenalty > 0) {
        s = log(s, `Repeat penalty: −${Math.round(repeatPenalty * 100)}% runes, −${Math.round(REPEAT_DAMAGE_PENALTY * 100)}% dmg`, '#888')
      }
      if (allTilesDone) {
        s = log(s, '⚡ Final tile — 3× damage!', '#e6bf33')
      }
      if (cursePenalty.hpCost > 0 || cursePenalty.staminaSpent > 0) {
        s = log(s, `☠ Curse drain — ${cursePenalty.hpCost} HP (stamina cushioned ${cursePenalty.staminaSpent})`, '#8855cc')
      }
      if (hpAfterCurse <= 0) return { ...s, phase: 'DEFEAT' }

      const { curses: advancedCurses, newlyLifted } = advanceCurses(
        s.activeCurses, tile, move, isRepeat, isFirstTileEver,
      )
      s = { ...s, activeCurses: advancedCurses }
      for (const liftedName of newlyLifted) {
        s = log(s, `✦ Curse broken — ${liftedName}`, '#66ddaa')
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

    case 'SWITCH_WORKFLOW': {
      if (state.phase !== 'PLAYER_TURN') return state
      return log(
        { ...state, workflow: action.workflow, currentTileId: action.workflow.start_id,
          selectedTileId: null, pendingTile: null, pendingMove: null,
          consistencyStreak: 0, isRemasterPass: action.isRemaster ?? false },
        'A new piece of work begins — the fight continues.', '#c9a93a'
      )
    }

    case 'SWITCH_WEAPON': {
      if (state.phase !== 'PLAYER_TURN') return state
      if (action.weaponId === state.equippedWeaponId) return state
      const newWeapon = WEAPONS[action.weaponId] as WeaponInstance | undefined
      return log(
        { ...state, equippedWeaponId: action.weaponId, weaponLevel: action.weaponLevel,
          selectedTileId: null, pendingTile: null, pendingMove: null,
          consistencyStreak: 0 },
        `You switch to ${newWeapon?.name ?? action.weaponId}.`, '#88aadd'
      )
    }

    case 'ADD_LOG':
      return log(state, action.text, action.color ?? '#c9a93a')

    default:
      return state
  }
}

// Re-export constants for UI
export { ABANDON_PENALTY, REPEAT_PENALTY_PER_RETRY, REPEAT_PENALTY_MAX, REPEAT_DAMAGE_PENALTY } from '../data/constants'
