import type { CombatPhase, DefenseAction, Enemy, EnemyMove, GeneratedMoveset, Moveset, Stats, Step, WeaponInstance } from '../types/game'
import { ENEMY_MOVES } from '../data/enemyMovesets'
import { MOVES } from '../data/movesets'
import { WEAPONS, calcStepDamage, getWeaponMovesets } from '../data/weapons'
export { getActiveSteps } from '../data/generators/movesetGenerator'

const POISE_WEIGHT_MULT: Record<string, number> = {
  light: 0.5, medium: 1.0, heavy: 1.5, colossal: 2.0,
}
const POISE_VARIANT_MULT: Record<string, number> = {
  Light: 0.7, Heavy: 1.5, Skill: 1.0, Jump: 2.0,
}

function gapMultiplier(lastMs: number): number {
  if (lastMs === 0) return 1.0
  const gapMin = (Date.now() - lastMs) / 60000
  if (gapMin < 15)  return 1.5
  if (gapMin < 60)  return 1.0
  if (gapMin < 240) return 0.5
  return 0.0
}

export const STA_BLOCK        = 15   // STA cost to block (instant, no task)
export const STA_DEFENSE_GAIN = 25   // STA gained from roll success or taking damage
export const STAGGER_PAUSE_MS = 1500

export interface LogEntry { id: number; text: string; color?: string }

export interface CombatState {
  phase: CombatPhase
  // Enemy
  enemyId: string
  enemyData: Enemy
  enemyMaxHp: number
  enemyHp: number
  enemyMaxPoise: number
  enemyPoise: number
  currentMove: EnemyMove | null
  enemySkipTurn: boolean
  // Player
  playerHp: number
  playerMaxHp: number
  playerStamina: number
  playerMaxStamina: number
  playerFp: number
  playerMaxFp: number
  playerEstus: number
  // Run context
  equippedWeapons: string[]
  weaponExtraMovesets: Record<string, string[]>
  playerStats: Stats
  activeWeaponIdx: number
  // Chain/combo
  chainMovesetId: string
  chainStepIdx: number
  // Timer state
  pendingStep: Step | null
  pendingMoveset: Moveset | null
  pendingWeaponId: string
  stepTimer: number
  stepTotal: number
  stepStarted: boolean
  timerIsDefense: boolean
  timerExpired: boolean
  pendingDefenseAction: DefenseAction | null
  defenseParryStep: number
  // XP accumulated this combat (flushed to store on end)
  weaponXpAccumulated: Record<string, number>
  // Moveset XP (seconds of completed steps, per moveset id)
  movesetXpAccumulated: Record<string, number>
  // Weapon kills this combat
  weaponKillsAccumulated: number
  // Timestamp of last moveset completion (for poise gap multiplier)
  lastMovesetCompletionMs: number
  // Heat accumulated this combat per weapon (flushed to store on end)
  weaponHeatAccumulated: Record<string, number>
  // Log
  log: LogEntry[]
  logId: number
}

export type CombatAction =
  | { type: 'STEP_CLICKED'; step: Step; moveset: Moveset; weaponId: string }
  | { type: 'START_TIMER' }
  | { type: 'TICK'; delta: number }
  | { type: 'TIMER_RESULT'; accomplished: boolean }
  | { type: 'CANCEL_TIMER' }
  | { type: 'END_TURN' }
  | { type: 'DEFENSE_CHOSEN'; action: DefenseAction }
  | { type: 'ENTER_PHASE'; phase: CombatPhase }
  | { type: 'SET_WEAPON'; idx: number }
  | { type: 'USE_ESTUS' }

// ── Helpers ───────────────────────────────────────────────────────────────

function log(state: CombatState, text: string, color?: string): CombatState {
  const entry: LogEntry = { id: state.logId + 1, text, color }
  return { ...state, log: [...state.log, entry], logId: state.logId + 1 }
}

function anyMoveAffordable(state: CombatState): boolean {
  for (const wid of state.equippedWeapons) {
    const extra = state.weaponExtraMovesets[wid] ?? []
    for (const m of getWeaponMovesets(wid, extra)) {
      if (state.playerStamina >= m.stamina_cost) return true
    }
  }
  return false
}

function shouldInterrupt(state: CombatState, chainMovesetId: string): boolean {
  if (chainMovesetId !== '') return false
  return Math.random() < state.enemyData.initiative / 20
}

function getDefenseTask(state: CombatState, action: DefenseAction, parryStep: number) {
  const move = state.currentMove
  if (!move) return null
  if (action === 'roll')  return move.dodge_task
  if (action === 'block') {
    const wid = state.equippedWeapons[0]
    const weapon = WEAPONS[wid]
    if (!weapon) return null
    const ms = MOVES[weapon.defense_movesets.block]
    return ms?.steps[0] ?? null
  }
  if (action === 'parry') {
    if (parryStep === 0) return move.parry_task
    const wid = state.equippedWeapons[0]
    const weapon = WEAPONS[wid]
    if (!weapon) return null
    const ms = MOVES[weapon.defense_movesets.parry]
    return ms?.steps[0] ?? null
  }
  return null
}

function enterPlayerAttack(state: CombatState): CombatState {
  return {
    ...state,
    phase: 'PLAYER_ATTACK',
    timerIsDefense: false,
    pendingDefenseAction: null,
    defenseParryStep: 0,
    stepStarted: false,
    timerExpired: false,
  }
}

function enterEnemyAttack(state: CombatState): CombatState {
  // Select random enemy move immediately
  const moveIds = state.enemyData.moveset
  const moveId  = moveIds[Math.floor(Math.random() * moveIds.length)]
  const move    = ENEMY_MOVES[moveId] ?? null
  let s: CombatState = { ...state, phase: 'ENEMY_ATTACK' as CombatPhase, currentMove: move }
  if (move) s = log(s, `The ${state.enemyData.name} uses ${move.name}!`, '#e85555')
  return s
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initCombatState(
  enemyId: string,
  enemyData: Enemy,
  enemyMult: number,
  equippedWeapons: string[],
  weaponExtraMovesets: Record<string, string[]>,
  playerStats: Stats,
  playerHp: number, playerMaxHp: number,
  playerStamina: number, playerMaxStamina: number,
  playerFp: number, playerMaxFp: number,
  playerEstus: number,
): CombatState {
  const maxHp = Math.floor(enemyData.max_hp * enemyMult)
  const first = log({
    phase: 'PLAYER_ATTACK',
    enemyId, enemyData,
    enemyMaxHp: maxHp, enemyHp: maxHp,
    enemyMaxPoise: enemyData.max_poise, enemyPoise: enemyData.max_poise,
    currentMove: null, enemySkipTurn: false,
    playerHp, playerMaxHp,
    playerStamina, playerMaxStamina,
    playerFp, playerMaxFp,
    playerEstus,
    equippedWeapons, weaponExtraMovesets, playerStats,
    activeWeaponIdx: 0,
    chainMovesetId: '', chainStepIdx: 0,
    pendingStep: null, pendingMoveset: null, pendingWeaponId: '',
    stepTimer: 0, stepTotal: 1, stepStarted: false,
    timerIsDefense: false, timerExpired: false,
    pendingDefenseAction: null, defenseParryStep: 0,
    weaponXpAccumulated: {},
    movesetXpAccumulated: {},
    weaponKillsAccumulated: 0,
    lastMovesetCompletionMs: 0,
    weaponHeatAccumulated: {},
    log: [], logId: 0,
  }, `You face ${enemyData.name}.`, '#c9a93a')
  return log(first, enemyData.description, '#7a7570')
}

// ── Reducer ───────────────────────────────────────────────────────────────

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {

    case 'USE_ESTUS': {
      if (state.playerEstus <= 0) return state
      const heal = Math.floor(state.playerMaxHp * 0.40)
      const newHp = Math.min(state.playerMaxHp, state.playerHp + heal)
      return log(
        { ...state, playerHp: newHp, playerEstus: state.playerEstus - 1 },
        `You drink an estus flask — restored ${newHp - state.playerHp} HP.`, '#44aa88'
      )
    }

    case 'SET_WEAPON':
      return { ...state, activeWeaponIdx: action.idx }

    case 'STEP_CLICKED': {
      const total = Math.max(action.step.time, 1)
      return {
        ...state,
        phase: 'STEP_TIMER',
        pendingStep: action.step,
        pendingMoveset: action.moveset,
        pendingWeaponId: action.weaponId,
        stepTimer: total, stepTotal: total,
        stepStarted: false, timerExpired: false,
        timerIsDefense: false,
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
      if (state.timerIsDefense) {
        if (!state.stepStarted && !state.timerExpired) {
          // Cancel from preview → go back to defense panel (re-enter ENEMY_ATTACK without re-choosing move)
          return { ...state, phase: 'ENEMY_ATTACK', stepStarted: false, timerExpired: false }
        }
        // Gave up mid-defense → full damage
        const dmg = state.currentMove?.damage ?? 0
        const newHp = Math.max(0, state.playerHp - dmg)
        let s = log(
          { ...state, playerHp: newHp, stepStarted: false, timerExpired: false, timerIsDefense: false },
          'You gave up defending — full damage taken!', '#e85555'
        )
        if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
        return enterPlayerAttack(s)
      }
      // Attack cancel
      if (state.stepStarted || state.timerExpired) {
        const sta = Math.max(0, state.playerStamina - (state.pendingMoveset?.stamina_cost ?? 5))
        return { ...log({ ...state, playerStamina: sta }, 'Task abandoned — stamina drained.', '#cc8833'),
                 phase: 'PLAYER_ATTACK', stepStarted: false, timerExpired: false }
      }
      return { ...state, phase: 'PLAYER_ATTACK', stepStarted: false, timerExpired: false }
    }

    case 'TIMER_RESULT': {
      // ── Defense result ─────────────────────────────────────────────────
      if (state.timerIsDefense) {
        const action2 = state.pendingDefenseAction!
        const move    = state.currentMove!

        if (!action.accomplished) {
          // All defense failures: full damage, no STA gain
          const dmg   = move.damage
          const newHp = Math.max(0, state.playerHp - dmg)
          const msg   = action2 === 'parry' && state.defenseParryStep === 1
            ? `Parry failed — ${dmg} damage, no stamina gain!`
            : `Defense failed — ${dmg} damage taken!`
          let s = log({ ...state, playerHp: newHp, timerIsDefense: false, timerExpired: false }, msg, '#e85555')
          if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
          return enterPlayerAttack(s)
        }

        // Succeeded
        switch (action2) {
          case 'roll': {
            // Roll success: gain STA, no damage
            const newSta = Math.min(state.playerMaxStamina, state.playerStamina + STA_DEFENSE_GAIN)
            return enterPlayerAttack(log(
              { ...state, playerStamina: newSta },
              `You roll away — no damage. (+${STA_DEFENSE_GAIN} STA)`, '#55cc55'
            ))
          }
          case 'parry': {
            if (state.defenseParryStep === 0) {
              // Step 1 done — proceed to step 2, no STA cost
              const task  = getDefenseTask(state, 'parry', 1)
              const total = Math.max((task as Step)?.time ?? 20, 1)
              const step2: Step = { name: (task as Step)?.name ?? '', time: total, base_damage: 0, poise_damage: 0 }
              let s = log(state, 'Parry step 1! Now the counter-move…', '#88cc44')
              return { ...s, defenseParryStep: 1, pendingStep: step2, stepTimer: total, stepTotal: total, stepStarted: false, timerExpired: false }
            } else {
              // Step 2 done — counter-damage + full STA restore
              const counterDmg = move.damage
              const newEnemyHp = Math.max(0, state.enemyHp - counterDmg)
              const newPoise   = Math.max(0, state.enemyPoise - move.poise_damage)
              let s = log(
                { ...state, playerStamina: state.playerMaxStamina, enemyHp: newEnemyHp, enemyPoise: newPoise },
                `Perfect parry! ${counterDmg} counter-damage. Full stamina restored!`, '#44ee44'
              )
              if (newEnemyHp <= 0) return { ...s, phase: 'VICTORY', weaponKillsAccumulated: state.weaponKillsAccumulated + 1 }
              if (newPoise <= 0)   return { ...s, enemyPoise: 0, phase: 'ENEMY_STAGGERED' }
              return enterPlayerAttack(s)
            }
          }
          default: return enterPlayerAttack(state)
        }
      }

      // ── Attack result ──────────────────────────────────────────────────
      if (!action.accomplished) {
        const sta = Math.max(0, state.playerStamina - (state.pendingMoveset?.stamina_cost ?? 5))
        let s = log({ ...state, playerStamina: sta, timerExpired: false }, 'Task failed — stamina drained.', '#cc8833')
        return { ...s, phase: 'PLAYER_ATTACK', stepStarted: false }
      }

      const step    = state.pendingStep!
      const moveset = state.pendingMoveset!
      const weapon  = WEAPONS[state.pendingWeaponId]
      const wi      = weapon as WeaponInstance | undefined
      const dmg     = weapon ? calcStepDamage(step, moveset, weapon, state.playerStats) : step.base_damage

      // Poise: gap × weapon-weight × variant multipliers
      const gapMult      = gapMultiplier(state.lastMovesetCompletionMs)
      const weaponMult   = POISE_WEIGHT_MULT[wi?.poise_weight ?? 'medium'] ?? 1.0
      const gm           = moveset as GeneratedMoveset | null
      const variantMult  = gm?.variant_type ? (POISE_VARIANT_MULT[gm.variant_type] ?? 1.0) : 1.0
      const poiseBase    = step.poise_damage
      const poiseReset   = gapMult === 0 ? state.enemyMaxPoise : state.enemyPoise
      const scaledPoise  = Math.round(poiseBase * gapMult * weaponMult * variantMult)

      const newEnemyHp    = Math.max(0, state.enemyHp - dmg)
      const newEnemyPoise = Math.max(0, poiseReset - scaledPoise)
      const newStamina    = Math.max(0, state.playerStamina - moveset.stamina_cost)

      // Advance or reset chain
      const usedId = moveset.id
      const allSteps = moveset.steps
      const usedIdx = (state.chainMovesetId === usedId && usedId !== '') ? state.chainStepIdx : 0
      const nextIdx = usedIdx + 1
      const newChainId  = nextIdx < allSteps.length ? usedId : ''
      const newChainIdx = nextIdx < allSteps.length ? nextIdx : 0

      // Moveset XP: accumulate step.time (seconds of committed work) per moveset
      const prevMsXp = state.movesetXpAccumulated[moveset.id] ?? 0
      const newMsXpAcc = { ...state.movesetXpAccumulated, [moveset.id]: prevMsXp + step.time }

      // Heat: one increment per successful step
      const prevHeat  = state.weaponHeatAccumulated[state.pendingWeaponId] ?? 0
      const newHeatAcc = { ...state.weaponHeatAccumulated, [state.pendingWeaponId]: prevHeat + 1 }

      const flowSuffix = gapMult === 1.5 ? ' [flow]' : (gapMult === 0.5 ? ' [stale]' : '')

      let s = log(
        { ...state, enemyHp: newEnemyHp, enemyPoise: newEnemyPoise, playerStamina: newStamina,
          chainMovesetId: newChainId, chainStepIdx: newChainIdx, timerExpired: false, stepStarted: false,
          movesetXpAccumulated: newMsXpAcc,
          lastMovesetCompletionMs: Date.now(),
          weaponHeatAccumulated: newHeatAcc },
        `You complete ${step.name} — ${dmg} damage!${flowSuffix}`, '#ffffff'
      )

      if (s.enemyHp <= 0) return { ...s, phase: 'VICTORY', weaponKillsAccumulated: state.weaponKillsAccumulated + 1 }
      if (s.enemyPoise <= 0) return { ...s, enemyPoise: 0, phase: 'ENEMY_STAGGERED' }

      if (!anyMoveAffordable(s)) {
        s = log(s, 'Stamina exhausted — enemy seizes the moment.', '#ccaa44')
        return enterEnemyAttack(s)
      }
      if (shouldInterrupt(s, newChainId)) {
        s = log(s, `The ${s.enemyData.name} interrupts!`, '#e85555')
        return enterEnemyAttack(s)
      }
      return { ...s, phase: 'PLAYER_ATTACK' }
    }

    case 'END_TURN':
      return enterEnemyAttack(state)

    case 'DEFENSE_CHOSEN': {
      const act = action.action
      if (act === 'flee') {
        return log({ ...state, phase: 'DEFEAT' }, 'You retreat. The run is over.', '#7a7570')
      }
      // Block — instant, no timer, costs STA
      if (act === 'block') {
        const newSta = Math.max(0, state.playerStamina - STA_BLOCK)
        return enterPlayerAttack(log(
          { ...state, playerStamina: newSta },
          `You brace and absorb the blow. No damage. (−${STA_BLOCK} STA)`, '#ccaa44'
        ))
      }
      // Take hit — instant, lose HP, gain STA
      if (act === 'take') {
        const dmg    = state.currentMove?.damage ?? 0
        const newHp  = Math.max(0, state.playerHp - dmg)
        const newSta = Math.min(state.playerMaxStamina, state.playerStamina + STA_DEFENSE_GAIN)
        let s = log(
          { ...state, playerHp: newHp, playerStamina: newSta },
          `You take the full hit — ${dmg} damage. (+${STA_DEFENSE_GAIN} STA)`, '#e85555'
        )
        if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
        return enterPlayerAttack(s)
      }
      // Roll / Parry — start defense timer
      const task = getDefenseTask(state, act, 0)
      if (!task) return state
      const total = Math.max((task as Step).time ?? 20, 1)
      return {
        ...state,
        timerIsDefense: true,
        pendingDefenseAction: act,
        defenseParryStep: 0,
        phase: 'STEP_TIMER',
        pendingStep: { name: (task as Step).name ?? '', time: total, base_damage: 0, poise_damage: 0 },
        stepTimer: total, stepTotal: total, stepStarted: false, timerExpired: false,
      }
    }

    case 'ENTER_PHASE': {
      if (action.phase === 'ENEMY_ATTACK') return enterEnemyAttack(state)
      if (action.phase === 'PLAYER_ATTACK') return enterPlayerAttack(state)
      return { ...state, phase: action.phase }
    }

    default:
      return state
  }
}
