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
  | { kind: 'eitherOr'; options: { step: PatternStep; weight: number }[] }

export type DrawKind = 'format' | 'transformation' | 'style' | 'emotion'

export function drawKindOf(step: PatternStep): DrawKind | null {
  switch (step.kind) {
    case 'drawFormat': return 'format'
    case 'drawTransformation': return 'transformation'
    case 'drawStyle': return 'style'
    case 'drawEmotion': return 'emotion'
    default: return null
  }
}

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

// A weighted choice among draw steps where exactly one always resolves to a
// real value and the rest are forced null for that occurrence (re-decided
// independently every time this group gets a remaster round-robin turn —
// see patternSlots.ts's "exclusive" groups). Replaces the awkward
// "two independent probability-gated draws" shape (e.g. daggers' old
// drawStyle(0.5), drawEmotion(0.5), which could yield neither or both)
// with a single always-exactly-one choice. Weight is always given
// explicitly via the tuple form — never read from a draw step's own
// `probability`, which would silently mean two different things in two
// contexts.
export type EitherOrOption = PatternStep | [PatternStep, number]

export function eitherOr(...options: EitherOrOption[]): PatternStep {
  if (options.length < 2) throw new Error('eitherOr() requires at least 2 options')
  const normalized = options.map(o => Array.isArray(o) ? { step: o[0], weight: o[1] } : { step: o, weight: 1 })

  const kindsSeen = new Set<DrawKind>()
  for (const { step, weight } of normalized) {
    const kind = drawKindOf(step)
    if (kind === null) throw new Error(`eitherOr(): every option must be drawFormat/drawTransformation/drawStyle/drawEmotion, got '${step.kind}'`)
    if (kindsSeen.has(kind)) throw new Error(`eitherOr(): duplicate draw kind '${kind}' among options`)
    kindsSeen.add(kind)
    if (weight <= 0) throw new Error(`eitherOr(): weight must be > 0, got ${weight} for '${kind}'`)
    if ((step.kind === 'drawStyle' || step.kind === 'drawEmotion') && step.probability !== 1) {
      throw new Error(`eitherOr(): '${kind}' option must use probability 1 (weight is given separately), got ${step.probability}`)
    }
  }
  return { kind: 'eitherOr', options: normalized }
}

// ── Per-weapon-class patterns ───────────────────────────────────────────
//
// drawTransformation() always follows drawFormat() — both are unconditional
// (no probability, and an empty allowed_transformations/supported_products
// pool is a wildcard rather than a disable, see weaponClasses.ts), so this
// gives every weapon a permanent, always-present Transformation draw
// alongside its Format draw. Promote is appended after the final Publish
// for every class except poise_weight 'light' ones (quick content doesn't
// get a separate promo step) — see comments per group.

export const WEAPON_PATTERNS: Record<WeaponClass, PatternStep[]> = {
  // ── concretely specified ─────────────────────────────────────────────
  daggers: [
    phase('Research'), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 1), phase('Refine'), phase('Publish'),
  ],
  fists: [
    phase('Research'), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 1), phase('Refine'),
    branch([phase('Publish')], [phase('Publish')], [phase('Publish')]),
  ],
  straight_swords: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawStyle(1),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  greatswords: [
    phase('Research', 3), drawFormat(), drawTransformation(), drawStyle(1),
    phase('Produce', 5), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  colossal_swords: [
    phase('Research', 4), drawFormat(), drawTransformation(), drawStyle(1),
    phase('Produce', 8), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  curved_swords: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(1),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  curved_greatswords: [
    phase('Research', 3), drawFormat(), drawTransformation(), drawEmotion(1),
    phase('Produce', 5), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],

  // ── specific/distinct emotions, storytelling-flavored — E always rolls ──
  katanas: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawStyle(0.5), drawEmotion(1),
    phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  reapers: [
    phase('Research', 3), drawFormat(), drawTransformation(), drawStyle(0.6), drawEmotion(1),
    phase('Produce', 4), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  torches: [   // light tier — no Promote
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(1),
    phase('Produce', 2), phase('Refine'), phase('Publish'),
  ],

  // ── energizing emotion/style, long produce ──────────────────────────────
  hammers: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(1), drawEmotion(0.6),
    phase('Produce', 4), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  great_hammers: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawStyle(1), drawEmotion(0.6),
    phase('Produce', 6), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],

  // ── double build — 2 parallel Produce+Refine chains ─────────────────────
  axes: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.5),
    branch([phase('Produce', 2), phase('Refine')], [phase('Produce', 2), phase('Refine')]),
    phase('Publish'), phase('Promote'),
  ],
  great_axes: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawStyle(0.6),
    branch([phase('Produce', 3), phase('Refine')], [phase('Produce', 3), phase('Refine')]),
    phase('Publish'), phase('Promote'),
  ],

  // ── publish, draw, publish again; great/heavy = 3-chain Produce ────────
  spears: [
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.4),
    phase('Produce', 2), phase('Refine'), phase('Publish'),
    drawStyle(0.4), phase('Publish'), phase('Promote'),
  ],
  thrusting_swords: [   // light tier — no Promote
    phase('Research'), drawFormat(), drawTransformation(), eitherOr([drawStyle(), 3], [drawEmotion(), 4]),
    phase('Produce', 1), phase('Refine'), phase('Publish'),
    drawEmotion(0.4), phase('Publish'),
  ],
  heavy_thrusting: [   // "heavy" variant of thrusting_swords -> 3-chain
    phase('Research'), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    branch([phase('Produce', 2)], [phase('Produce', 2)], [phase('Produce', 2)]),
    phase('Refine'), phase('Publish'),
    drawEmotion(0.5), phase('Publish'), phase('Promote'),
  ],
  great_spears: [   // "great" variant of spears -> 3-chain
    phase('Research', 2), drawFormat(), drawTransformation(), drawStyle(0.5),
    branch([phase('Produce', 2)], [phase('Produce', 2)], [phase('Produce', 2)]),
    phase('Refine'), phase('Publish'),
    drawStyle(0.5), phase('Publish'), phase('Promote'),
  ],
  halberds: [   // standalone heavy pole weapon, grouped with this set -> 3-chain
    phase('Research', 2), drawTransformation(), drawFormat(),
    branch(
      [drawStyle(1.0), phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote')],
      [drawStyle(1.0), phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote')],
      [drawStyle(1.0), phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote')],
    ),
  ],

  // ── very long research/plan, big finish dmg (ranged group) ─────────────
  bows: [   // light tier — no Promote
    phase('Research', 3), drawFormat(), drawTransformation(), drawStyle(0.3),
    phase('Produce', 3), phase('Refine'), phase('Publish'),
  ],
  crossbows: [
    phase('Research', 3), drawFormat(), drawTransformation(), drawStyle(0.3),
    phase('Produce', 3), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  greatbows: [
    phase('Research', 4), drawFormat(), drawTransformation(), drawEmotion(0.5),
    phase('Produce', 5), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  ballistas: [
    phase('Research', 4), drawFormat(), drawTransformation(), drawEmotion(0.5),
    phase('Produce', 6), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],

  // ── quadruple build / lots of publish-promote ───────────────────────────
  twinblades: [
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(0.5),
    branch([phase('Produce', 1)], [phase('Produce', 1)], [phase('Produce', 1)], [phase('Produce', 1)]),
    phase('Refine'), phase('Publish'), phase('Promote'),
  ],
  flails: [
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(0.4),
    phase('Produce', 2), phase('Refine'),
    branch([phase('Publish'), phase('Promote')], [phase('Publish'), phase('Promote')]),
    phase('Publish'), phase('Promote'),
  ],

  // ── fully original — zero hints given ───────────────────────────────────
  colossal_weapons: [   // biggest pattern in the game, matches its 2.4 dmg_mult
    phase('Research', 4), drawFormat(), drawTransformation(), eitherOr([drawStyle(), 5], [drawEmotion(), 6]),
    branch(
      [phase('Produce', 3), phase('Refine')],
      [phase('Produce', 3), phase('Refine')],
      [phase('Produce', 3), phase('Refine')],
    ),
    phase('Publish'), phase('Promote'), phase('Publish'), phase('Promote'),
  ],
  whips: [   // "series and content cycles" -> two small produce/publish/promote cycles
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(0.4),
    phase('Produce', 1), phase('Refine'), phase('Publish'), phase('Promote'),
    drawStyle(0.3),
    phase('Produce', 1), phase('Refine'), phase('Publish'), phase('Promote'),
  ],
}

// ── Branch-draw validation ──────────────────────────────────────────────
//
// A branch may draw inside its paths (e.g. halberds: 3 parallel pieces of
// content, each with its own Style) instead of sharing every draw before
// the branch (the axes/twinblades/etc. shape, where the branch only
// multiplies Produce/Refine). When it does, exactly one draw-kind may vary
// per branch, drawn in every path exactly once, always at probability 1 —
// so the N parallel pieces of content stay symmetric (every one gets a
// value for that kind, never null) and a future edit can't accidentally
// mix kinds across paths or skip one. Validated eagerly at module load,
// same as phase()/branch() throwing on invalid construction above.
//
// eitherOr() isn't supported inside a branch path yet — drawKindOf()
// returns null for it (it's not itself a single draw), so without this
// explicit check it would silently be treated as "not a draw" rather
// than rejected.
function validateBranch(cls: WeaponClass, step: { paths: PatternStep[][] }): void {
  for (const path of step.paths) {
    if (path.some(s => s.kind === 'eitherOr')) {
      throw new Error(`${cls}: eitherOr() inside a branch() path isn't supported yet`)
    }
  }
  const perPath = step.paths.map(path => path.filter(s => drawKindOf(s) !== null))
  const kindsUsed = new Set(perPath.flatMap(draws => draws.map(d => drawKindOf(d)!)))
  if (kindsUsed.size === 0) return   // existing draw-free branches (axes, twinblades, ...) stay valid
  if (kindsUsed.size > 1) {
    throw new Error(`${cls}: branch mixes draw kinds across paths (${[...kindsUsed].join(', ')}) — exactly one kind may vary per branch`)
  }
  const [onlyKind] = kindsUsed
  for (const draws of perPath) {
    if (draws.length !== 1) {
      throw new Error(`${cls}: every path in this branch must draw exactly one ${onlyKind} (found ${draws.length} in one path)`)
    }
    const draw = draws[0]
    if ((draw.kind === 'drawStyle' || draw.kind === 'drawEmotion') && draw.probability !== 1) {
      throw new Error(`${cls}: branch-nested ${draw.kind} must use probability 1, got ${draw.probability}`)
    }
  }
}

for (const [cls, steps] of Object.entries(WEAPON_PATTERNS)) {
  for (const step of steps) if (step.kind === 'branch') validateBranch(cls as WeaponClass, step)
}
