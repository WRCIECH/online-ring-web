import type { AtomicStage, WeaponClass, ContentProductType, AtomicOrigin, StyleType, EmotionType } from '../../types/game'

// ── DSL ──────────────────────────────────────────────────────────────────
//
// A pattern is a flat sequence of steps describing how a weapon's combat
// workflow is built. Only `phase()` costs time (it materializes actual
// tiles); the draw* calls just "color" the tiles around them with what the
// player is making — format (product), transformation (origin), style
// and emotion — without adding extra time on their
// own (drawFormat/drawTransformation each still add exactly one dedicated
// Plan tile; drawStyle/drawEmotion add one Plan tile only if their roll
// succeeds and the weapon class has a non-empty candidate pool for it).
//
// Patterns don't carry their own candidate lists — those live on
// WeaponClassDef (supported_products, allowed_transformations,
// styles, emotions). This keeps a pattern terse: it's
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
  | { kind: 'fixedDraw'; slotKind: DrawKind; value: ContentProductType | AtomicOrigin | StyleType | EmotionType }

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

// Fixed draws: pin a single value permanently — never changed by remaster.
export function format(value: ContentProductType): PatternStep         { return { kind: 'fixedDraw', slotKind: 'format',         value } }
export function transformation(value: AtomicOrigin): PatternStep       { return { kind: 'fixedDraw', slotKind: 'transformation', value } }
export function style(value: StyleType): PatternStep                  { return { kind: 'fixedDraw', slotKind: 'style',          value } }
export function emotion(value: EmotionType): PatternStep                { return { kind: 'fixedDraw', slotKind: 'emotion',        value } }

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
  straight_swords: [
    phase('Research', 2), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  greatswords: [
    phase('Research', 3), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 5), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  colossal_swords: [
    phase('Research', 4), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 8), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  fists: [
    phase('Research'), drawFormat(), phase('Produce', 1), 
    branch(
      [drawTransformation(), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 1), phase('Publish')],
      [drawTransformation(), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 1), phase('Publish')],
      [drawTransformation(), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 1), phase('Publish')],
  ), ],
  flails: [
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(1),
    phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote', 3, 5),
  ],

  curved_swords: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(1),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('Compression'), phase('Produce', 2), phase('Refine', 1), phase('Publish'),
    transformation('Compression'), phase('Produce', 1), phase('Refine', 1), phase('Publish'),
  ],
  curved_greatswords: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(1),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('Expansion'), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('Expansion'), phase('Produce', 2), phase('Refine', 1), phase('Publish'),
  ],
  katanas: [
    phase('Research', 2), drawFormat(), drawTransformation(), style('Narration'),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    style('Narration'), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
  ],
  reapers: [
    phase('Research', 2), drawFormat(), drawTransformation(), style('Segmentation'),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    style('Segmentation'), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
  ],
  torches: [   
    phase('Research'), drawFormat(), drawTransformation(), drawEmotion(),
    phase('Produce', 2), phase('Refine'), phase('Publish'),
  ],
  spears: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('Similar'), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('Similar'), phase('Produce', 2), phase('Refine', 1), phase('Publish'),
  ],
  great_spears: [   // "great" variant of spears -> 3-chain
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('ZoomIn'), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('ZoomOut'), phase('Produce', 2), phase('Refine', 1), phase('Publish'),
  ],
  crossbows: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    transformation('Opposite'), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
  ],
  axes: [
    phase('Research', 3), drawFormat(), phase('Produce', 1),
    branch(
      [drawTransformation(), phase('Research', 2), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 5), phase('Refine', 2), phase('Publish')],
      [drawTransformation(), phase('Research', 2), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 5), phase('Refine', 2), phase('Publish')],
    ),
  ],
  great_axes: [
    phase('Research', 6), drawFormat(), phase('Produce', 2),
    branch(
      [drawTransformation(), phase('Research', 4), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 8), phase('Refine', 3), phase('Publish')],
      [drawTransformation(), phase('Research', 4), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 8), phase('Refine', 3), phase('Publish')],
    ),
  ],
  twinblades: [
    phase('Research', 6), drawFormat(), phase('Produce', 2),
    branch(
      [drawTransformation(), phase('Research', 4), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 8), phase('Refine', 3), phase('Publish')],
      [drawTransformation(), phase('Research', 4), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 8), phase('Refine', 3), phase('Publish')],
      [drawTransformation(), phase('Research', 4), eitherOr(drawStyle(), drawEmotion()), phase('Produce', 8), phase('Refine', 3), phase('Publish')],
    ),
  ],
  hammers: [
    phase('Research', 2, 4), drawFormat(), drawTransformation(), drawStyle(), drawEmotion(),
    phase('Produce', 3, 6), phase('Refine', 2, 4), phase('Publish'), phase('Promote'),
  ],
  great_hammers: [
    phase('Research', 4, 8), drawFormat(), drawTransformation(), drawStyle(), drawEmotion(),
    phase('Produce', 6, 10), phase('Refine', 3, 6), phase('Publish'), phase('Promote'),
  ],
  thrusting_swords: [ 
    phase('Research'), drawFormat(), drawTransformation(), drawStyle(0.5), drawEmotion(),
    phase('Produce', 3), phase('Refine', 2), phase('Publish'),
    drawEmotion(), phase('Produce', 3), phase('Refine', 2), phase('Publish'),
  ],
  heavy_thrusting: [
    phase('Research', 2), drawFormat(), drawTransformation(), drawStyle(0.75), drawEmotion(),
    phase('Produce', 4), phase('Refine', 2), phase('Publish'),
    drawEmotion(), phase('Produce', 4), phase('Refine', 2), phase('Publish'),
  ],
  halberds: [   // standalone heavy pole weapon, grouped with this set -> 3-chain
    phase('Research', 2), drawTransformation(), drawFormat(),
    branch(
      [drawStyle(1.0), phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote')],
      [drawStyle(1.0), phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote')],
      [drawStyle(1.0), phase('Produce', 2), phase('Refine'), phase('Publish'), phase('Promote')],
    ),
  ],
  bows: [   
    phase('Research', 2), drawFormat(), drawTransformation(), drawEmotion(),
    phase('Produce', 3), phase('Refine'), phase('Publish'),
  ],
  greatbows: [
    phase('Research', 4), drawFormat(), drawTransformation(), eitherOr(drawEmotion(), drawStyle()),
    phase('Produce', 8), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  ballistas: [
    phase('Research', 10), drawFormat(), drawTransformation(), eitherOr(drawEmotion(), drawStyle()),
    phase('Produce', 5), phase('Refine', 2), phase('Publish'), phase('Promote'),
  ],
  colossal_weapons: [   
    phase('Research', 4), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 12, 16), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
  whips: [   
    phase('Research', 4), drawFormat(), drawTransformation(), eitherOr(drawStyle(), drawEmotion()),
    phase('Produce', 8), phase('Refine', 3), phase('Publish'), phase('Promote'),
  ],
}

// ── Branch-draw validation ──────────────────────────────────────────────
//
// Branches may draw inside their paths — including eitherOr() and multiple
// draw kinds per path (e.g. each path has its own drawTransformation() plus
// eitherOr(drawStyle(), drawEmotion())). The only remaining constraint:
// direct drawStyle/drawEmotion steps inside a branch (not wrapped in
// eitherOr) must use probability 1 so parallel paths never silently drop
// a draw that sibling paths kept. eitherOr wrapping already enforces this
// at eitherOr() construction time, so those options don't need a second check.
function validateBranch(cls: WeaponClass, step: { paths: PatternStep[][] }): void {
  for (const path of step.paths) {
    const draws = path
      .flatMap(s => s.kind === 'eitherOr' ? s.options.map(o => o.step) : [s])
      .filter(s => drawKindOf(s) !== null)
    for (const draw of draws) {
      if ((draw.kind === 'drawStyle' || draw.kind === 'drawEmotion') && draw.probability !== 1)
        throw new Error(`${cls}: branch-nested ${draw.kind} must use probability 1, got ${draw.probability}`)
    }
  }
}

for (const [cls, steps] of Object.entries(WEAPON_PATTERNS)) {
  for (const step of steps) if (step.kind === 'branch') validateBranch(cls as WeaponClass, step)
}
