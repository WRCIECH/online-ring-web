import type { CombatPhase, DefenseAction, Enemy, EnemyMove, GeneratedMoveset, Moveset, Step, Stats, WeaponClass, WeaponInstance, WeaponRarity } from '../types/game'
import { ENEMY_MOVES } from '../data/enemyMovesets'
import { MOVES } from '../data/movesets'
import { WEAPONS, calcStepDamage, getWeaponMovesets } from '../data/weapons'
import { rollMoveset } from '../data/generators/movesetGenerator'
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

export const STA_BLOCK        = 15
export const STA_DEFENSE_GAIN = 25
export const STAGGER_PAUSE_MS = 1500

// ── Weapon-class mechanics ─────────────────────────────────────────────────
export interface ClassMod {
  dmgMult:     number        // HP damage multiplier on main hit
  poiseMult:   number        // poise damage multiplier
  staCoeff:    number        // stamina cost multiplier (< 1 = cheaper; 0 = free)
  dualStrike:  boolean       // auto second hit at 40% of main damage
  gapOverride: number | null // override flow-state gap (ranged = always 1.0)
  selfDmg:     number        // damage dealt to self per hit (axes)
  staGain:     number        // stamina restored after hit (fists)
  tag:         string        // short UI label; empty = no bonus
}

// chainIdx: the step index being executed in the current chain (0 = first/not chaining)
export function getClassMod(wclass: WeaponClass | undefined, chainIdx: number): ClassMod {
  const b: ClassMod = { dmgMult: 1, poiseMult: 1, staCoeff: 1, dualStrike: false, gapOverride: null, selfDmg: 0, staGain: 0, tag: '' }
  switch (wclass) {
    case 'twinblades':
      return { ...b, dualStrike: true, tag: '⚔ Dual' }
    case 'spears': case 'great_spears': case 'halberds':
      return { ...b, poiseMult: 1.5, tag: '⋯ Reach' }
    case 'curved_swords': case 'curved_greatswords':
      return chainIdx > 0 ? { ...b, staCoeff: 0.7, tag: '〜 Flow' } : { ...b, tag: '〜 Flow (combo)' }
    case 'daggers': case 'thrusting_swords': case 'heavy_thrusting':
      return { ...b, dmgMult: 1.2, tag: '◈ Precise' }
    case 'katanas':
      return { ...b, dmgMult: 1.15, tag: '⊘ Swift' }
    case 'bows': case 'greatbows': case 'crossbows': case 'ballistas':
      return { ...b, dmgMult: 1.5, poiseMult: 0, gapOverride: 1.0, tag: '⟶ Ranged' }
    case 'reapers': case 'whips': case 'flails':
      return { ...b, poiseMult: 1.6, tag: '⊛ Grim' }
    case 'colossal_swords': case 'colossal_weapons': case 'great_hammers': case 'great_axes':
      return { ...b, dmgMult: 0.85, poiseMult: 2.5, tag: '⊕ Crush' }
    // ── Formerly unclassed ─────────────────────────────────────────────
    case 'straight_swords':
      return { ...b, dmgMult: 1.1, poiseMult: 1.1, tag: '≈ Balanced' }
    case 'greatswords': {
      const m = parseFloat((1 + chainIdx * 0.15).toFixed(2))
      return { ...b, dmgMult: m, tag: chainIdx > 0 ? `↑ ×${m}` : '↑ Momentum' }
    }
    case 'hammers':
      return { ...b, dmgMult: 0.8, poiseMult: 2.0, tag: '⊗ Stagger' }
    case 'axes':
      return { ...b, dmgMult: 1.25, selfDmg: 5, tag: '✗ Reckless' }
    case 'fists':
      return { ...b, staCoeff: 0, staGain: 8, tag: '◉ Relentless' }
    case 'torches':
      return { ...b, dmgMult: 1.2, poiseMult: 0, tag: '≋ Attrition' }
    default:
      return b
  }
}

// Generated roll moveset per enemy type (weapon class + rarity aligned with mob character)
const ENEMY_ROLL_CONFIG: Record<string, { wclass: WeaponClass; rarity: WeaponRarity }> = {
  procrastination_mob:  { wclass: 'daggers',         rarity: 'common' },
  burnout_shade:        { wclass: 'fists',            rarity: 'common' },
  hater:                { wclass: 'hammers',          rarity: 'magic'  },
  blank_page_omen:      { wclass: 'straight_swords',  rarity: 'magic'  },
  comparison_engine:    { wclass: 'thrusting_swords', rarity: 'rare'   },
  fear_phantom:         { wclass: 'spears',           rarity: 'magic'  },
  perfectionism_knight: { wclass: 'axes',             rarity: 'rare'   },
}

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
  weaponLevels: Record<string, number>
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
  // Player stats (for stat-scaling damage)
  playerStats: Stats
  // Timestamp of last moveset completion (for poise gap multiplier)
  lastMovesetCompletionMs: number
  // Heat accumulated this combat per weapon (flushed to store on end)
  weaponHeatAccumulated: Record<string, number>
  // Enemy roll moveset (generated from mob's archetype; steps chain across rolls)
  enemyRollMoveset: GeneratedMoveset | null
  enemyRollStep: number       // next step index (advances on each successful roll)
  hasRolledSuccessfully: boolean
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
    const wi    = WEAPONS[wid] as WeaponInstance | undefined
    const extra = state.weaponExtraMovesets[wid] ?? []
    for (const m of getWeaponMovesets(wid, extra)) {
      const cls = getClassMod(wi?.weapon_class, state.chainStepIdx)
      const actualCost = Math.floor(m.stamina_cost * cls.staCoeff)
      if (state.playerStamina >= actualCost) return true
    }
  }
  return false
}

function shouldInterrupt(state: CombatState, chainMovesetId: string): boolean {
  if (chainMovesetId !== '') return false
  return Math.random() < state.enemyData.initiative / 20
}

function getDefenseTask(state: CombatState, action: DefenseAction) {
  const move = state.currentMove
  if (!move) return null
  if (action === 'roll') {
    if (state.enemyRollMoveset) {
      return state.enemyRollMoveset.steps[state.enemyRollStep] ?? move.dodge_task
    }
    return move.dodge_task
  }
  if (action === 'block') {
    const wid = state.equippedWeapons[0]
    const weapon = WEAPONS[wid]
    if (!weapon) return null
    const ms = MOVES[weapon.defense_movesets.block]
    return ms?.steps[0] ?? null
  }
  if (action === 'parry') return move.publish_task
  return null
}

function enterPlayerAttack(state: CombatState): CombatState {
  const next: CombatState = {
    ...state,
    phase: 'PLAYER_ATTACK',
    timerIsDefense: false,
    pendingDefenseAction: null,
    stepStarted: false,
    timerExpired: false,
  }
  if (!anyMoveAffordable(next)) {
    return enterEnemyAttack(log(next, 'No stamina to act — enemy seizes the moment.', '#ccaa44'))
  }
  return next
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
  weaponLevels: Record<string, number>,
  playerHp: number, playerMaxHp: number,
  playerStamina: number, playerMaxStamina: number,
  playerFp: number, playerMaxFp: number,
  playerEstus: number,
  playerStats: Stats,
): CombatState {
  const maxHp = Math.floor(enemyData.max_hp * enemyMult)
  const rollCfg = ENEMY_ROLL_CONFIG[enemyId]
  const enemyRollMoveset = rollCfg ? rollMoveset(rollCfg.wclass, rollCfg.rarity, 'Light') : null
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
    equippedWeapons, weaponExtraMovesets, weaponLevels,
    activeWeaponIdx: 0,
    chainMovesetId: '', chainStepIdx: 0,
    pendingStep: null, pendingMoveset: null, pendingWeaponId: '',
    stepTimer: 0, stepTotal: 1, stepStarted: false,
    timerIsDefense: false, timerExpired: false,
    pendingDefenseAction: null,
    playerStats,
    lastMovesetCompletionMs: 0,
    weaponHeatAccumulated: {},
    enemyRollMoveset,
    enemyRollStep: 0,
    hasRolledSuccessfully: false,
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
          const dmg   = move.damage
          const newHp = Math.max(0, state.playerHp - dmg)
          const msg   = action2 === 'parry'
            ? `Parry failed — ${dmg} damage taken!`
            : `Defense failed — ${dmg} damage taken!`
          let s = log({ ...state, playerHp: newHp, timerIsDefense: false, timerExpired: false }, msg, '#e85555')
          if (newHp <= 0) return { ...s, phase: 'DEFEAT' }
          return enterPlayerAttack(s)
        }

        // Succeeded
        switch (action2) {
          case 'roll': {
            const newSta   = Math.min(state.playerMaxStamina, state.playerStamina + STA_DEFENSE_GAIN)
            const steps    = state.enemyRollMoveset?.steps ?? []
            const nextStep = steps.length > 0
              ? (state.enemyRollStep + 1) % steps.length
              : 0
            const stepLabel = steps.length > 1
              ? ` [step ${state.enemyRollStep + 1}/${steps.length}]`
              : ''
            return enterPlayerAttack(log(
              { ...state, playerStamina: newSta,
                enemyRollStep: nextStep,
                hasRolledSuccessfully: true },
              `You roll away — no damage. (+${STA_DEFENSE_GAIN} STA)${stepLabel}`, '#55cc55'
            ))
          }
          case 'parry': {
            const counterDmg = move.damage
            const newEnemyHp = Math.max(0, state.enemyHp - counterDmg)
            const newPoise   = Math.max(0, state.enemyPoise - move.poise_damage)
            let s = log(
              { ...state, playerStamina: state.playerMaxStamina, enemyHp: newEnemyHp, enemyPoise: newPoise },
              `Published! ${counterDmg} counter-damage. Full stamina restored!`, '#44ee44'
            )
            if (newEnemyHp <= 0) return { ...s, phase: 'VICTORY' }
            if (newPoise <= 0)   return { ...s, enemyPoise: 0, phase: 'ENEMY_STAGGERED' }
            return enterPlayerAttack(s)
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
      const level   = state.weaponLevels[state.pendingWeaponId] ?? 0
      const gm      = moveset as GeneratedMoveset | null

      // Chain depth for this step (used by momentum weapons and flow bonus)
      const usedIdx = (state.chainMovesetId === moveset.id && moveset.id !== '') ? state.chainStepIdx : 0

      // Weapon-class mechanics
      const cls = getClassMod(wi?.weapon_class, usedIdx)

      // HP damage (class dmgMult × level-scaled base × stat scaling)
      const baseDmg  = weapon ? calcStepDamage(step, weapon, level, state.playerStats) : step.base_damage
      const finalDmg = Math.floor(baseDmg * cls.dmgMult)
      const dualDmg  = cls.dualStrike ? Math.floor(finalDmg * 0.4) : 0
      const totalDmg = finalDmg + dualDmg

      // Poise: (gap override or real gap) × weight × variant × class poiseMult
      const gapMult     = cls.gapOverride ?? gapMultiplier(state.lastMovesetCompletionMs)
      const weaponMult  = POISE_WEIGHT_MULT[wi?.poise_weight ?? 'medium'] ?? 1.0
      const variantMult = gm?.variant_type ? (POISE_VARIANT_MULT[gm.variant_type] ?? 1.0) : 1.0
      const poiseReset  = gapMult === 0 ? state.enemyMaxPoise : state.enemyPoise
      const scaledPoise = Math.round(step.poise_damage * gapMult * weaponMult * variantMult * cls.poiseMult)

      // Stamina (class staCoeff reduces cost for flow weapons in-chain)
      const newStamina = Math.max(0, state.playerStamina - Math.floor(moveset.stamina_cost * cls.staCoeff))

      // FP: skill movesets cost FP; constant (light/heavy) movesets do not
      const isConstant = weapon?.constant_movesets?.includes(moveset.id) ?? false
      const fpCost     = isConstant ? 0 : (moveset.fp_cost ?? 0)
      const newFp      = Math.max(0, state.playerFp - fpCost)

      const newEnemyHp    = Math.max(0, state.enemyHp - totalDmg)
      const newEnemyPoise = Math.max(0, poiseReset - scaledPoise)

      // Self-effects: axes deal self-damage; fists restore stamina
      const postHp      = cls.selfDmg > 0 ? Math.max(1, state.playerHp - cls.selfDmg) : state.playerHp
      const postStamina = cls.staGain  > 0 ? Math.min(state.playerMaxStamina, newStamina + cls.staGain) : newStamina

      // Advance or reset chain (usedIdx already computed above)
      const allSteps    = moveset.steps
      const nextIdx     = usedIdx + 1
      const newChainId  = nextIdx < allSteps.length ? moveset.id : ''
      const newChainIdx = nextIdx < allSteps.length ? nextIdx : 0

      // Heat: one increment per successful step
      const prevHeat   = state.weaponHeatAccumulated[state.pendingWeaponId] ?? 0
      const newHeatAcc = { ...state.weaponHeatAccumulated, [state.pendingWeaponId]: prevHeat + 1 }

      const flowSuffix  = gapMult === 1.5 ? ' [flow]' : (gapMult === 0.5 ? ' [stale]' : '')
      const classSuffix = cls.dualStrike
        ? ` ⚔ +${dualDmg} off-hand`
        : cls.selfDmg > 0
        ? ` ✗ -${cls.selfDmg}HP self`
        : cls.staGain > 0
        ? ` ◉ +${cls.staGain}STA`
        : cls.staCoeff < 1
        ? ` 〜 -${moveset.stamina_cost - Math.floor(moveset.stamina_cost * cls.staCoeff)}STA`
        : ''

      let s = log(
        { ...state, enemyHp: newEnemyHp, enemyPoise: newEnemyPoise, playerHp: postHp,
          playerStamina: postStamina, playerFp: newFp,
          chainMovesetId: newChainId, chainStepIdx: newChainIdx, timerExpired: false, stepStarted: false,
          lastMovesetCompletionMs: Date.now(),
          weaponHeatAccumulated: newHeatAcc },
        `You complete ${step.name} — ${finalDmg} damage!${flowSuffix}${classSuffix}`, '#ffffff'
      )

      if (s.enemyHp <= 0) return { ...s, phase: 'VICTORY' }
      if (s.enemyPoise <= 0) return { ...s, enemyPoise: 0, phase: 'ENEMY_STAGGERED' }

      if (shouldInterrupt(s, newChainId)) {
        s = log(s, `The ${s.enemyData.name} interrupts!`, '#e85555')
        return enterEnemyAttack(s)
      }
      return enterPlayerAttack(s)
    }

    case 'END_TURN':
      return enterEnemyAttack(state)

    case 'DEFENSE_CHOSEN': {
      const act = action.action
      if (act === 'flee') {
        return log({ ...state, phase: 'FLED' }, 'You retreat safely. Runes are preserved.', '#7a7570')
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
      const task = getDefenseTask(state, act)
      if (!task) return state
      const total = Math.max((task as Step).time ?? 20, 1)
      return {
        ...state,
        timerIsDefense: true,
        pendingDefenseAction: act,
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
