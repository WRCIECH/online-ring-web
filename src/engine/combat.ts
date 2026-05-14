import type { CombatPhase, DefenseAction, Enemy, EnemyMove, Moveset, Stats, Step } from '../types/game'
import { ENEMY_MOVES } from '../data/enemyMovesets'
import { MOVES } from '../data/movesets'
import { WEAPONS, calcStepDamage, getWeaponMovesets } from '../data/weapons'

export const STA_ROLL        = 15
export const STA_BLOCK       = 20
export const STA_PARRY       = 25
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
    playerStamina: state.playerMaxStamina,  // full restore each round
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
    log: [], logId: 0,
  }, `You face ${enemyData.name}.`, '#c9a93a')
  return log(first, enemyData.description, '#7a7570')
}

// ── Reducer ───────────────────────────────────────────────────────────────

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {

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
          // Failed defense
          const isParryStep2 = action2 === 'parry' && state.defenseParryStep === 1
          const dmg = isParryStep2 ? move.block_damage : move.damage
          const newHp = Math.max(0, state.playerHp - dmg)
          const msg = isParryStep2
            ? `Parry step 2 missed — ${dmg} damage (partial block).`
            : `Defense failed — ${dmg} damage taken!`
          let s = log({ ...state, playerHp: newHp, timerIsDefense: false, timerExpired: false }, msg, '#e85555')
          if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
          return enterPlayerAttack(s)
        }

        // Succeeded
        switch (action2) {
          case 'roll': {
            const sta = Math.max(0, state.playerStamina - STA_ROLL)
            return enterPlayerAttack(log({ ...state, playerStamina: sta }, 'You roll away — no damage.', '#55cc55'))
          }
          case 'block': {
            const sta = Math.max(0, state.playerStamina - STA_BLOCK)
            const dmg = move.block_damage
            const newHp = Math.max(0, state.playerHp - dmg)
            let s = log({ ...state, playerHp: newHp, playerStamina: sta }, `You block! Took ${dmg} damage.`, '#ccaa44')
            if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
            return enterPlayerAttack(s)
          }
          case 'parry': {
            if (state.defenseParryStep === 0) {
              // Step 1 done — start step 2
              const task = getDefenseTask(state, 'parry', 1)
              const total = Math.max((task as Step)?.time ?? 20, 1)
              let s = log({ ...state, playerStamina: Math.max(0, state.playerStamina - STA_PARRY / 2) },
                'Parry step 1 done! Now the counter-move…', '#88cc44')
              return { ...s, defenseParryStep: 1, stepTimer: total, stepTotal: total, stepStarted: false, timerExpired: false }
            } else {
              // Step 2 done — perfect parry
              const sta = Math.max(0, state.playerStamina - STA_PARRY / 2)
              const poiseDmg = move.poise_damage
              const newPoise = Math.max(0, state.enemyPoise - poiseDmg)
              let s = log({ ...state, playerStamina: sta, enemyPoise: newPoise },
                'Perfect parry! No damage — enemy poise broken.', '#44ee44')
              if (newPoise <= 0) return { ...s, enemyPoise: 0, phase: 'ENEMY_STAGGERED' }
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
      const dmg     = weapon ? calcStepDamage(step, moveset, weapon, state.playerStats) : step.base_damage
      const poiseDmg = step.poise_damage

      const newEnemyHp    = Math.max(0, state.enemyHp - dmg)
      const newEnemyPoise = Math.max(0, state.enemyPoise - poiseDmg)
      const newStamina    = Math.max(0, state.playerStamina - moveset.stamina_cost)

      // Advance or reset chain
      const usedId = moveset.id
      const allSteps = moveset.steps
      const usedIdx = (state.chainMovesetId === usedId && usedId !== '') ? state.chainStepIdx : 0
      const nextIdx = usedIdx + 1
      const newChainId  = nextIdx < allSteps.length ? usedId : ''
      const newChainIdx = nextIdx < allSteps.length ? nextIdx : 0

      let s = log(
        { ...state, enemyHp: newEnemyHp, enemyPoise: newEnemyPoise, playerStamina: newStamina,
          chainMovesetId: newChainId, chainStepIdx: newChainIdx, timerExpired: false, stepStarted: false },
        `You complete ${step.name} — ${dmg} damage!`, '#ffffff'
      )

      if (s.enemyHp <= 0) return { ...s, phase: 'VICTORY' }
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
      if (act === 'take') {
        const dmg = state.currentMove?.damage ?? 0
        const newHp = Math.max(0, state.playerHp - dmg)
        let s = log({ ...state, playerHp: newHp }, `You take the full hit — ${dmg} damage!`, '#e85555')
        if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
        return enterPlayerAttack(s)
      }
      if (act === 'flee') {
        return log({ ...state, phase: 'DEFEAT' }, 'You retreat. The run is over.', '#7a7570')
      }
      // Roll/Block/Parry — start defense timer
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
