import type { AtomicStage, WeaponClass } from '../../types/game'

// ── DSL ──────────────────────────────────────────────────────────────────
//
// A pattern is a flat sequence of steps describing how a weapon's combat
// workflow is built. Only `phase()` costs time (it materializes actual
// tiles); the draw* calls just "color" the tiles around them with what the
// player is making — format (product), transformation (origin), style
// (damage type) and emotion (status) — without adding extra time on their
// own (drawFormat/drawTransformation each still add exactly one dedicated
// Plan tile; drawStyle/drawEmotion add one Plan tile only if their roll
// succeeds and the weapon class has a non-empty candidate pool for it).
//
// Patterns don't carry their own candidate lists — those live on
// WeaponClassDef (supported_products, allowed_transformations,
// base_damage_types, inherent_status). This keeps a pattern terse: it's
// purely the shape, while the per-class "what can be drawn" data lives in
// one other place (weaponClasses.ts).

export type PatternStep =
  | { kind: 'phase'; stage: AtomicStage; min: number; max: number }
  | { kind: 'drawFormat' }
  | { kind: 'drawTransformation' }
  | { kind: 'drawStyle'; probability: number }
  | { kind: 'drawEmotion'; probability: number }
  | { kind: 'branch'; paths: PatternStep[][] }

export function phase(stage: AtomicStage, min = 1, max = min): PatternStep {
  if (min < 1) throw new Error(`phase('${stage}'): min must be >= 1, got ${min}`)
  if (max < min) throw new Error(`phase('${stage}'): max (${max}) must be >= min (${min})`)
  return { kind: 'phase', stage, min, max }
}
export function drawFormat(): PatternStep { return { kind: 'drawFormat' } }
export function drawTransformation(): PatternStep { return { kind: 'drawTransformation' } }
export function drawStyle(probability = 1): PatternStep { return { kind: 'drawStyle', probability } }
export function drawEmotion(probability = 1): PatternStep { return { kind: 'drawEmotion', probability } }
export function branch(...paths: PatternStep[][]): PatternStep {
  if (paths.length < 2) throw new Error('branch() requires at least 2 paths')
  return { kind: 'branch', paths }
}

// ── Per-weapon-class patterns ───────────────────────────────────────────
//
// Daggers and Fists are exactly as specified. Everything else is a first
// draft, tiered by poise_weight (light/medium/heavy/colossal), for review:
// light = simple linear (Dagger-shaped); medium = same shape with a wider
// Produce range and a transformation draw added; heavy = wider Produce
// range plus one branch+merge into a final Publish; colossal = nested
// branches approximating the old four-way dual-hub shape. drawEmotion()
// is only included for classes that actually have an `inherent_status`
// (otherwise it would be a structural no-op — left out for clarity).

export const WEAPON_PATTERNS: Record<WeaponClass, PatternStep[]> = {
  // ── light ──────────────────────────────────────────────────────────────
  daggers: [
    phase('Research'), drawFormat(), drawStyle(0.5), drawEmotion(0.5),
    phase('Produce', 1, 2), phase('Refine'), phase('Publish'),
  ],
  fists: [
    phase('Research'), drawFormat(), drawStyle(0.25), drawEmotion(0.25),
    phase('Produce', 1), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  bows: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.3),
    phase('Produce', 1, 2), phase('Refine'), phase('Publish'),
  ],
  thrusting_swords: [
    phase('Research'), drawFormat(), drawStyle(0.3), drawEmotion(0.6),
    phase('Produce', 1, 2), phase('Refine'), phase('Publish'),
  ],
  torches: [
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(0.5),
    phase('Produce', 1, 2), phase('Refine'), phase('Publish'),
  ],

  // ── medium ─────────────────────────────────────────────────────────────
  straight_swords: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  katanas: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4), drawEmotion(0.5),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  spears: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  axes: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  heavy_thrusting: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4), drawEmotion(0.5),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  curved_swords: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  twinblades: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4), drawEmotion(0.5),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  flails: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4), drawEmotion(0.5),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  halberds: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  whips: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4), drawEmotion(0.5),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],
  crossbows: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 1, 3), phase('Refine'), phase('Publish'),
  ],

  // ── heavy ──────────────────────────────────────────────────────────────
  greatswords: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  hammers: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  curved_greatswords: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  great_hammers: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5), drawEmotion(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  great_axes: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  great_spears: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  reapers: [
    phase('Research', 1, 2), drawFormat(), drawTransformation(), drawStyle(0.5), drawEmotion(0.5),
    phase('Produce', 2, 4), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],

  // ── colossal ───────────────────────────────────────────────────────────
  colossal_swords: [
    phase('Research', 2, 3), drawFormat(), drawTransformation(), drawEmotion(0.6),
    phase('Produce', 3, 5),
    branch(
      [phase('Refine', 1, 2), drawStyle(0.5)],
      [phase('Refine', 1, 2)],
    ),
    phase('Refine'), phase('Publish'),
  ],
  colossal_weapons: [
    phase('Research', 2, 3), drawFormat(), drawTransformation(), drawEmotion(0.7),
    phase('Produce', 3, 5),
    branch(
      [phase('Refine', 1, 2), drawStyle(0.5)],
      [phase('Refine', 1, 2), branch([phase('Produce', 1)], [phase('Produce', 1)])],
    ),
    phase('Refine'), phase('Publish'), phase('Publish'),
  ],
  greatbows: [
    phase('Research', 2, 3), drawFormat(), drawTransformation(), drawEmotion(0.6),
    phase('Produce', 3, 5),
    branch(
      [phase('Refine', 1, 2), drawStyle(0.5)],
      [phase('Refine', 1, 2)],
    ),
    phase('Refine'), phase('Publish'),
  ],
  ballistas: [
    phase('Research', 2, 3), drawFormat(), drawTransformation(), drawEmotion(0.6),
    phase('Produce', 3, 5),
    branch(
      [phase('Refine', 1, 2), drawStyle(0.5)],
      [phase('Refine', 1, 2)],
    ),
    phase('Refine'), phase('Publish'),
  ],
}
