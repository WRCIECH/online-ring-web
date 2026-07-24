// ─────────────────────────────────────────────────────────────────────────────
// Central gameplay constants — tweak here, effects ripple everywhere.
// ─────────────────────────────────────────────────────────────────────────────

// ── Run ──────────────────────────────────────────────────────────────────────

/** Default run length in seconds (48 h). */
export const RUN_DURATION_SECONDS = 172800

/** Maximum estus flasks at run start. */
export const RUN_ESTUS_MAX = 3

/** Minimum active pipeline items required to enter combat. */
export const MIN_PIPELINE_TO_FIGHT = 2

// ── Equip load ───────────────────────────────────────────────────────────────

/** Equip load contributed by each active (non-published) content item. */
export const ARTICLE_EQUIP_WEIGHT = 1.0

// ── Healing ──────────────────────────────────────────────────────────────────

/** Flat HP restored by using an estus flask. */
export const ESTUS_HEAL_HP = 200

export const FLOW_GAP_HOT_MINS   = 15
export const FLOW_GAP_WARM_MINS  = 60
export const FLOW_GAP_COLD_MINS  = 240

export const FLOW_MULT_HOT  = 1.25  // < 15 min since last fight: +25% dmg
export const FLOW_MULT_WARM = 1.10  // < 60 min: +10% dmg
export const FLOW_MULT_COLD = 1.0   // < 240 min: no change
export const FLOW_MULT_DEAD = 1.0   // ≥ 240 min: no change

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
export const FINISHER_MULT = 2.0

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
export const ABANDON_PENALTY = 0.25

/** Scaling damage penalty fraction per repeat attempt on a completed tile (stacks with REPEAT_DAMAGE_PENALTY). */
export const REPEAT_PENALTY_PER_RETRY = 0.15

/** Maximum cumulative scaling repeat penalty (cap). */
export const REPEAT_PENALTY_MAX = 0.60

/** Flat damage penalty when repeating an already-completed tile. */
export const REPEAT_DAMAGE_PENALTY = 0.20

// ── Economy ───────────────────────────────────────────────────────────────────

