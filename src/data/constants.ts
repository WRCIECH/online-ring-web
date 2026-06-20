// ─────────────────────────────────────────────────────────────────────────────
// Central gameplay constants — tweak here, effects ripple everywhere.
// ─────────────────────────────────────────────────────────────────────────────

// ── Run ──────────────────────────────────────────────────────────────────────

/** Default run length in seconds (48 h). */
export const RUN_DURATION_SECONDS = 172800

/** Maximum estus flasks at run start and after a Site of Grace rest. */
export const RUN_ESTUS_MAX = 3

/** Minimum active pipeline items required to enter combat. */
export const MIN_PIPELINE_TO_FIGHT = 2

/** Maximum weapons the player may equip for a run. */
export const MAX_RUN_WEAPONS = 2

// ── Equip load ───────────────────────────────────────────────────────────────

/** Equip load contributed by each active (non-published) content item. */
export const ARTICLE_EQUIP_WEIGHT = 1.0

/** Equip load contributed by each active (non-completed) learning item. */
export const LEARNING_ITEM_WEIGHT = 1.0

// ── Healing ──────────────────────────────────────────────────────────────────

/** Fraction of max HP restored by using an estus flask. */
export const ESTUS_HEAL_FRACTION = 0.40

/** Fraction of max HP restored by resting at a Site of Grace. */
export const GRACE_HEAL_FRACTION = 0.60

/** Estus flasks recovered by resting at a Site of Grace. */
export const GRACE_ESTUS_GAIN = 1

/** Maximum estus flasks a player can have (cap applied on grace rest). */
export const GRACE_ESTUS_CAP = 3

// ── Combat — stamina ─────────────────────────────────────────────────────────

/** Stamina cost to perform a block. */
export const STA_BLOCK = 15

/** Stamina restored on a successful defense (roll/parry/block). */
export const STA_DEFENSE_GAIN = 25

// ── Combat — flow-state gap multiplier ───────────────────────────────────────

/** Minutes of idle gap below which the player gets the flow-state bonus. */
export const FLOW_GAP_HOT_MINS   = 15
/** Minutes of idle gap below which damage is at baseline (no bonus/malus). */
export const FLOW_GAP_WARM_MINS  = 60
/** Minutes of idle gap below which damage is halved. */
export const FLOW_GAP_COLD_MINS  = 240

/** Damage multiplier when gap < FLOW_GAP_HOT_MINS (flow state). */
export const FLOW_MULT_HOT   = 1.5
/** Damage multiplier when gap is between hot and warm thresholds. */
export const FLOW_MULT_WARM  = 1.0
/** Damage multiplier when gap is between warm and cold thresholds. */
export const FLOW_MULT_COLD  = 0.5
/** Damage multiplier when gap exceeds FLOW_GAP_COLD_MINS (fully cold). */
export const FLOW_MULT_DEAD  = 0.0

// ── Combat — weapon overheat ─────────────────────────────────────────────────

/** Damage penalty per use over the weapon's heat threshold (as a fraction). */
export const OVERHEAT_PENALTY_PER_USE = 0.025

/** Maximum overheat damage penalty (as a fraction; 0.75 = −75%). */
export const OVERHEAT_PENALTY_MAX = 0.75

// ── Combat — stagger ─────────────────────────────────────────────────────────

/** Duration of the stagger pause between phases in ms. */
export const STAGGER_PAUSE_MS = 1500

// ── Combat — status buildup ───────────────────────────────────────────────────

/** Status buildup added per hit. */
export const STATUS_BUILDUP_PER_HIT = 35

// ── Damage type multipliers ───────────────────────────────────────────────────

/** Damage multiplier when hitting a weakness. */
export const DMG_WEAKNESS_MULT   = 1.3
/** Damage multiplier when hitting a resistance. */
export const DMG_RESISTANCE_MULT = 0.7

// ── Sacrifice (skip task early at HP cost) ────────────────────────────────────

/** Multiplier applied to self-damage when sacrificing time remaining on a task. */
export const SACRIFICE_MULT = 2.0

// ── Momentum damage bonus ─────────────────────────────────────────────────────

/** How long the post-victory momentum bonus lasts (ms). */
export const MOMENTUM_DURATION_MS = 30 * 60 * 1000

/** Starting bonus multiplier above 1.0 (0.30 = +30%). */
export const MOMENTUM_MAX_BONUS = 0.30

/** Seconds after combat start before an idle player is kicked back to the map. */
export const IDLE_KICK_MS = 2 * 60 * 1000

/** Seconds the player has to publish content after defeating a boss. */
export const BOSS_PUBLISH_TIME_S = 600

/**
 * Returns the current damage multiplier from the momentum bonus.
 * Decays linearly from 1.30 → 1.00 over MOMENTUM_DURATION_MS.
 */
export function momentumMult(lastVictoryTime: number): number {
  if (!lastVictoryTime) return 1
  const elapsed = Date.now() - lastVictoryTime
  if (elapsed >= MOMENTUM_DURATION_MS) return 1
  return 1 + MOMENTUM_MAX_BONUS * (1 - elapsed / MOMENTUM_DURATION_MS)
}

// ── Leveling ─────────────────────────────────────────────────────────────────

/** Base stat value for all stats at character creation. */
export const STAT_BASE = 8

/** Rune cost to level a stat once given total levels already spent. */
export function statLevelCost(totalLevelsSpent: number): number {
  return Math.floor(500 + totalLevelsSpent * 100 + totalLevelsSpent ** 2 * 20)
}

/** Rune cost to upgrade a weapon from currentLevel → currentLevel+1. */
export function weaponUpgradeCost(currentLevel: number): number {
  return (currentLevel + 1) * 500
}

// ── Workflow mechanics ────────────────────────────────────────────────────

/** Flat reward penalty fraction applied when abandoning a workflow (next run). */
export const ABANDON_PENALTY = 0.25

/** Reward penalty fraction per repeat attempt on a completed tile. */
export const REPEAT_PENALTY_PER_RETRY = 0.15

/** Maximum cumulative repeat penalty (cap). */
export const REPEAT_PENALTY_MAX = 0.60
