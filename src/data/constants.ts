// ─────────────────────────────────────────────────────────────────────────────
// Central gameplay constants — tweak here, effects ripple everywhere.
// ─────────────────────────────────────────────────────────────────────────────

// ── Run ──────────────────────────────────────────────────────────────────────

/** Starting time budget for the entire game in seconds (100 h). */
export const INITIAL_GAME_TIME_SECONDS = 360000

/** Estus flasks at game start (not reset per run). */
export const ESTUS_START = 3

/** Probability of finding an estus flask when defeating a mob. */
export const ESTUS_MOB_DROP_CHANCE = 0.05

/** Minimum active pipeline items required to enter combat. */
export const MIN_PIPELINE_TO_FIGHT = 2

/** Maximum number of weapon campaigns that may be `activated` at once. */
export const MAX_ACTIVE_CAMPAIGNS = 6

// ── Campaign step durations (Medium/Heavy/Research) — fixed, not weapon-class-scaled ──

/** Medium chunk timer, in seconds — set in stone (10 min). */
export const MEDIUM_CHUNK_SECS = 600

/** Heavy part / Research step timer, in seconds — set in stone (25 min). */
export const CAMPAIGN_STEP_SECS = 1500

/** Flat Superhit damage — global charge pool, not derived from any one weapon. */
export const SUPERHIT_DMG = 300

/** Superhit charges granted when the player declares a research effort finished. */
export const RESEARCH_FINISH_SUPERHITS = 3

// ── Weapon usage balance (encourage spreading work across active weapons) ──────

/** Rolling window, in days, used to measure how evenly work is spread across active
 *  weapons. Explicitly a tunable variable — may change later. */
export const WEAPON_BALANCE_WINDOW_DAYS = 7

/** Minimum total minutes logged across the whole active roster before any bonus/penalty
 *  applies (scales with roster size) — avoids wild swings from one early action. */
export const WEAPON_BALANCE_WARMUP_MINUTES_PER_WEAPON = 25

/** Damage-multiplier swing per 100% relative deviation from a weapon's ideal share
 *  (1 / active-weapon-count). E.g. 0.35 = a weapon sitting at 2× its ideal share
 *  (100% over) takes a −35% damage penalty before clamping. */
export const WEAPON_BALANCE_SCALE = 0.35

/** Hard floor/ceiling on the resulting multiplier, however extreme the imbalance. */
export const WEAPON_BALANCE_MIN_MULT = 0.6
export const WEAPON_BALANCE_MAX_MULT = 1.4

// ── Equip load ───────────────────────────────────────────────────────────────

/** Equip load contributed by each active (non-published) content item. */
export const ARTICLE_EQUIP_WEIGHT = 1.0

// ── Healing ──────────────────────────────────────────────────────────────────

/** Flat HP restored by using an estus flask. */
export const ESTUS_HEAL_HP = 200

// ── Combat — Heavy attack damage ─────────────────────────────────────────────
// Heavy damage scales with the tile's actual time_heavy (not a flat multiple of
// time_light) — a stage taking 3x as long as its Light version deals ~3x the
// damage, on top of this bonus for the extra time invested.

/** Damage bonus on top of the time-ratio scaling for choosing Heavy. */
export const HEAVY_TIME_BONUS = 1.15

/** Base enemy damage per minute of task time (before weapon and stat scaling). */
export const DMG_PER_MIN = 3

// ── Combat — stagger ─────────────────────────────────────────────────────────

/** Duration of the stagger pause between phases in ms. */
export const STAGGER_PAUSE_MS = 1500

/** Damage multiplier when the final workflow tile completes (was 3.0). */

// ── Combat — status buildup ───────────────────────────────────────────────────

/** Status buildup added per hit. */
export const STATUS_BUILDUP_PER_HIT = 35

// ── Sacrifice (skip task early at HP cost) ────────────────────────────────────

/** Multiplier applied to self-damage when sacrificing time remaining on a task. */
export const SACRIFICE_MULT = 2.0

/** Seconds after combat start before an idle player is kicked back to the map. */
export const IDLE_KICK_MS = 2 * 60 * 1000

/** Seconds the player has to publish content after defeating a boss. */
export const BOSS_PUBLISH_TIME_S = 600

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

/** Flat damage penalty fraction applied when abandoning a workflow (next run). */


/** Damage penalty fraction by repeat count (index 0 = 1st repeat; capped at last entry). */
export const REPEAT_PENALTY_TABLE = [0.20, 0.35, 0.50, 0.60, 0.70, 0.75, 0.80, 0.85, 0.90] as const

// ── Economy ───────────────────────────────────────────────────────────────────

