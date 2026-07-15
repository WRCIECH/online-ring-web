import type { AtomicStage, WeaponClass, ContentProductType } from '../../types/game'

// ── DSL ──────────────────────────────────────────────────────────────────
//
// A pattern is a flat sequence of steps describing how a weapon's combat
// workflow is built. Only `phase()` costs time (it materializes actual
// tiles); `drawFormat()` adds one dedicated Plan tile carrying the content
// product type drawn from the weapon class's supported_products pool.
// `branch()` picks one parallel path at compile time.
//
// Style and transformation draws have moved to the campaign graph
// (CampaignEdge.label) and are no longer part of per-weapon pattern
// generation. Patterns only carry the workflow *shape* now; the campaign
// graph carries the content-dimension annotations.

export type PatternStep =
  | { kind: 'phase'; stage: AtomicStage; min: number; max: number }
  | { kind: 'drawFormat' }
  | { kind: 'branch'; paths: PatternStep[][] }
  | { kind: 'fixedDraw'; slotKind: DrawKind; value: ContentProductType }

export type DrawKind = 'format'

export function drawKindOf(step: PatternStep): DrawKind | null {
  if (step.kind === 'drawFormat') return 'format'
  if (step.kind === 'fixedDraw' && step.slotKind === 'format') return 'format'
  return null
}

export function phase(stage: AtomicStage, min = 1, max = min): PatternStep {
  if (min < 1) throw new Error(`phase('${stage}'): min must be >= 1, got ${min}`)
  if (max < min) throw new Error(`phase('${stage}'): max (${max}) must be >= min (${min})`)
  return { kind: 'phase', stage, min, max }
}
export function drawFormat(): PatternStep { return { kind: 'drawFormat' } }

// Fixed draw: pin a single content product type permanently for this weapon instance.
export function format(value: ContentProductType): PatternStep {
  return { kind: 'fixedDraw', slotKind: 'format', value }
}

export function branch(...paths: PatternStep[][]): PatternStep {
  if (paths.length < 2) throw new Error('branch() requires at least 2 paths')
  return { kind: 'branch', paths }
}

// ── Per-weapon-class patterns ───────────────────────────────────────────
//
// drawFormat() is unconditional — an empty supported_products pool is a
// wildcard (see rollSlotValue in patternSlots.ts), not a disable.

export const WEAPON_PATTERNS: Record<WeaponClass, PatternStep[]> = {
  // ── light / quick ───────────────────────────────────────────────────
  daggers: [
    phase('Research'), drawFormat(),
    phase('Produce', 1), phase('Refine'),
  ],
  fists: [
    phase('Research'), drawFormat(),
    phase('Produce', 1), phase('Produce', 1), phase('Refine'),
  ],
  bows: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine'),
  ],
  torches: [
    phase('Research'), drawFormat(),
    phase('Produce', 2), phase('Refine'),
  ],

  // ── standard ────────────────────────────────────────────────────────
  straight_swords: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
  ],
  thrusting_swords: [
    phase('Research'), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
  ],
  flails: [
    phase('Research'), drawFormat(),
    phase('Produce', 2), phase('Refine'),
  ],
  crossbows: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
  ],

  // ── medium ──────────────────────────────────────────────────────────
  hammers: [
    phase('Research', 2, 4), drawFormat(),
    phase('Produce', 3, 6), phase('Refine', 2, 4),
  ],
  katanas: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
  ],
  reapers: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
  ],
  heavy_thrusting: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 4), phase('Refine', 2),
    phase('Produce', 4), phase('Refine', 2),
  ],
  halberds: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 2), phase('Refine'),
  ],
  whips: [
    phase('Research', 4), drawFormat(),
    phase('Produce', 8), phase('Refine', 3),
  ],
  axes: [
    phase('Research', 3), drawFormat(), phase('Produce', 1),
    phase('Research', 2), phase('Produce', 5), phase('Refine', 2),
  ],
  twinblades: [
    phase('Research', 6), drawFormat(), phase('Produce', 2),
    phase('Research', 4), phase('Produce', 8), phase('Refine', 3),
  ],

  // ── long-form / deep ────────────────────────────────────────────────
  greatswords: [
    phase('Research', 3), drawFormat(),
    phase('Produce', 5), phase('Refine', 3),
  ],
  spears: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 2), phase('Refine', 1),
  ],
  great_spears: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 2), phase('Refine', 1),
  ],
  curved_swords: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 2), phase('Refine', 1),
    phase('Produce', 1), phase('Refine', 1),
  ],
  curved_greatswords: [
    phase('Research', 2), drawFormat(),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 3), phase('Refine', 2),
    phase('Produce', 2), phase('Refine', 1),
  ],

  // ── heavy ───────────────────────────────────────────────────────────
  great_axes: [
    phase('Research', 6), drawFormat(), phase('Produce', 2),
    phase('Research', 4), phase('Produce', 8), phase('Refine', 3),
  ],
  great_hammers: [
    phase('Research', 4, 8), drawFormat(),
    phase('Produce', 6, 10), phase('Refine', 3, 6),
  ],

  // ── colossal ────────────────────────────────────────────────────────
  colossal_swords: [
    phase('Research', 4), drawFormat(),
    phase('Produce', 8), phase('Refine', 3),
  ],
  colossal_weapons: [
    phase('Research', 4), drawFormat(),
    phase('Produce', 12, 16), phase('Refine', 3),
  ],
  greatbows: [
    phase('Research', 4), drawFormat(),
    phase('Produce', 8), phase('Refine', 2),
  ],
  ballistas: [
    phase('Research', 10), drawFormat(),
    phase('Produce', 5), phase('Refine', 2),
  ],
}
