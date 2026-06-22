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
// drawTransformation() is deliberately left out of every pattern below —
// it's reserved for a future "remaster/transformation stages" feature and
// will be set explicitly there instead. Promote is appended after the
// final Publish for every class except poise_weight 'light' ones (quick
// content doesn't get a separate promo step) — see comments per group.

export const WEAPON_PATTERNS: Record<WeaponClass, PatternStep[]> = {
  // ── concretely specified ─────────────────────────────────────────────
  daggers: [
    phase('Research'), drawFormat(), drawStyle(0.5), drawEmotion(0.5),
    phase('Produce', 1), phase('Refine'), phase('Publish'),
  ],
  fists: [
    phase('Research'), drawFormat(), drawStyle(0.25), drawEmotion(0.25),
    phase('Produce', 1), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')]),
    phase('Publish'),
  ],
  straight_swords: [
    phase('Research', 2), drawFormat(), drawStyle(1),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  greatswords: [
    phase('Research', 3), drawFormat(), drawStyle(1),
    phase('Produce', 5), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  colossal_swords: [
    phase('Research', 4), drawFormat(), drawStyle(1),
    phase('Produce', 8), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  curved_swords: [
    phase('Research', 2), drawFormat(), drawEmotion(1),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  curved_greatswords: [
    phase('Research', 3), drawFormat(), drawEmotion(1),
    phase('Produce', 5), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],

  // ── specific/distinct emotions, storytelling-flavored — E always rolls ──
  katanas: [
    phase('Research', 2), drawFormat(), drawEmotion(1),
    phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  reapers: [
    phase('Research', 3), drawFormat(), drawEmotion(1),
    phase('Produce', 4), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  torches: [   // light tier — no Promote
    phase('Research'), drawFormat(), drawEmotion(1),
    phase('Produce', 2), phase('Refine'), phase('Publish'),
  ],

  // ── energizing emotion/style, long produce ──────────────────────────────
  hammers: [
    phase('Research'), drawFormat(), drawStyle(1), drawEmotion(0.6),
    phase('Produce', 4), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  great_hammers: [
    phase('Research', 2), drawFormat(), drawStyle(1), drawEmotion(0.6),
    phase('Produce', 6), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],

  // ── double build — 2 parallel Produce+Refine chains ─────────────────────
  axes: [
    phase('Research'), drawFormat(), drawStyle(0.5),
    branch([phase('Produce', 2), phase('Refine')], [phase('Produce', 2), phase('Refine')]),
    phase('Publish'), phase('Promote'),
  ],
  great_axes: [
    phase('Research', 2), drawFormat(), drawStyle(0.6),
    branch([phase('Produce', 3), phase('Refine')], [phase('Produce', 3), phase('Refine')]),
    phase('Publish'), phase('Promote'),
  ],

  // ── publish, draw, publish again; great/heavy = 3-chain Produce ────────
  spears: [
    phase('Research'), drawFormat(), drawStyle(0.4),
    phase('Produce', 2), phase('Refine'), phase('Publish'),
    drawStyle(0.4), phase('Publish'), phase('Promote'),
  ],
  thrusting_swords: [   // light tier — no Promote
    phase('Research'), drawFormat(), drawEmotion(0.4),
    phase('Produce', 1), phase('Refine'), phase('Publish'),
    drawEmotion(0.4), phase('Publish'),
  ],
  heavy_thrusting: [   // "heavy" variant of thrusting_swords -> 3-chain
    phase('Research'), drawFormat(), drawEmotion(0.5),
    branch([phase('Produce', 2)], [phase('Produce', 2)], [phase('Produce', 2)]),
    phase('Refine'), phase('Publish'),
    drawEmotion(0.5), phase('Publish'), phase('Promote'),
  ],
  great_spears: [   // "great" variant of spears -> 3-chain
    phase('Research', 2), drawFormat(), drawStyle(0.5),
    branch([phase('Produce', 2)], [phase('Produce', 2)], [phase('Produce', 2)]),
    phase('Refine'), phase('Publish'),
    drawStyle(0.5), phase('Publish'), phase('Promote'),
  ],
  halberds: [   // standalone heavy pole weapon, grouped with this set -> 3-chain
    phase('Research', 2), drawFormat(), drawStyle(0.5),
    branch([phase('Produce', 2)], [phase('Produce', 2)], [phase('Produce', 2)]),
    phase('Refine'), phase('Publish'),
    drawStyle(0.5), phase('Publish'), phase('Promote'),
  ],

  // ── very long research/plan, big finish dmg (ranged group) ─────────────
  bows: [   // light tier — no Promote
    phase('Research', 3), drawFormat(), drawStyle(0.3),
    phase('Produce', 3), phase('Refine'), phase('Publish'),
  ],
  crossbows: [
    phase('Research', 3), drawFormat(), drawStyle(0.3),
    phase('Produce', 3), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  greatbows: [
    phase('Research', 4), drawFormat(), drawEmotion(0.5),
    phase('Produce', 5), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  ballistas: [
    phase('Research', 4), drawFormat(), drawEmotion(0.5),
    phase('Produce', 6), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],

  // ── quadruple build / lots of publish-promote ───────────────────────────
  twinblades: [
    phase('Research'), drawFormat(), drawEmotion(0.5),
    branch([phase('Produce', 1)], [phase('Produce', 1)], [phase('Produce', 1)], [phase('Produce', 1)]),
    phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  flails: [
    phase('Research'), drawFormat(), drawEmotion(0.4),
    phase('Produce', 2), phase('Refine'),
    branch([phase('Publish'), phase('Promote')], [phase('Publish'), phase('Promote')]),
    phase('Publish'), phase('Promote'),
  ],

  // ── fully original — zero hints given ───────────────────────────────────
  colossal_weapons: [   // biggest pattern in the game, matches its 2.4 dmg_mult
    phase('Research', 4), drawFormat(), drawStyle(0.5), drawEmotion(0.6),
    branch(
      [phase('Produce', 3), phase('Refine')],
      [phase('Produce', 3), phase('Refine')],
      [phase('Produce', 3), phase('Refine')],
    ),
    phase('Publish'), phase('Promote'), phase('Publish'), phase('Promote'),
  ],
  whips: [   // "series and content cycles" -> two small produce/publish/promote cycles
    phase('Research'), drawFormat(), drawEmotion(0.4),
    phase('Produce', 1), phase('Refine'), phase('Publish'), phase('Promote'),
    drawStyle(0.3),
    phase('Produce', 1), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
}
