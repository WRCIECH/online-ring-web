import type { WeaponClass, AtomicTime, AtomicOrigin, DamageType, StatusType, ContentProductType, RolledPatternDraws } from '../../types/game'
import type { PatternStep } from './weaponPatterns'
import { WEAPON_PATTERNS } from './weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './weaponClasses'

// Shared ordering/traversal rules for "draw" steps across a class's
// pattern — top-level steps in array order, branch() visits each path
// fully in order. Deliberately mirrors (but does not call into)
// workflowGenerator.ts's tile-building walker: this one only cares about
// draw-step ordering, not tiles/edges/frontier, so it's safe to reuse from
// both the weapon-creation roller below and the UI structure preview.

export type SlotKind = 'format' | 'transformation' | 'style' | 'emotion'
export interface SlotRef { kind: SlotKind; occurrenceIndex: number; probability: number }

function slotForDraw(step: PatternStep, counters: Record<SlotKind, number>): SlotRef | null {
  switch (step.kind) {
    case 'drawFormat':         return { kind: 'format', occurrenceIndex: counters.format++, probability: 1 }
    case 'drawTransformation': return { kind: 'transformation', occurrenceIndex: counters.transformation++, probability: 1 }
    case 'drawStyle':          return { kind: 'style', occurrenceIndex: counters.style++, probability: step.probability }
    case 'drawEmotion':        return { kind: 'emotion', occurrenceIndex: counters.emotion++, probability: step.probability }
    default: return null
  }
}

// Groups slots for the remaster round-robin. Two kinds of group:
// - "independent" (no `weights`): a top-level draw is its own group
//   (redrawn independently, e.g. spears' two sequential drawStyle()
//   calls), while every draw inside one branch()'s paths (e.g. halberds'
//   3 parallel drawStyle() calls — one per path, validated by
//   weaponPatterns.ts to be the same kind in every path) forms a single
//   group, redrawn together on that group's round-robin turn so the
//   parallel pieces of content stay in lockstep about *when* they
//   change, even though each still gets its own independent roll and
//   can land on a different value than its siblings.
// - "exclusive" (`weights` present, born from an eitherOr() step): every
//   member shares one group, but only one (chosen by weight) ever
//   resolves to a real value per state — the rest are forced null. See
//   resolveGroupState below.
// listPatternSlots()'s flat order is exactly groups.flatMap(g => g.slots)
// — branches/eitherOrs don't reorder anything relative to the old
// purely-recursive walk.
export interface SlotGroup { slots: SlotRef[]; weights?: number[] }

export function listSlotGroups(steps: PatternStep[]): SlotGroup[] {
  const groups: SlotGroup[] = []
  const counters: Record<SlotKind, number> = { format: 0, transformation: 0, style: 0, emotion: 0 }
  for (const step of steps) {
    if (step.kind === 'branch') {
      const branchSlots: SlotRef[] = []
      for (const path of step.paths) {
        for (const innerStep of path) {
          const slot = slotForDraw(innerStep, counters)
          if (slot) branchSlots.push(slot)
        }
      }
      if (branchSlots.length > 0) groups.push({ slots: branchSlots })
    } else if (step.kind === 'eitherOr') {
      const exSlots: SlotRef[] = []
      const weights: number[] = []
      for (const opt of step.options) {
        const slot = slotForDraw(opt.step, counters)
        if (slot) { exSlots.push(slot); weights.push(opt.weight) }
      }
      groups.push({ slots: exSlots, weights })
    } else {
      const slot = slotForDraw(step, counters)
      if (slot) groups.push({ slots: [slot] })
    }
  }
  return groups
}

export function listPatternSlots(steps: PatternStep[]): SlotRef[] {
  return listSlotGroups(steps).flatMap(g => g.slots)
}

export function countSlotsByKind(steps: PatternStep[]): Record<SlotKind, number> {
  const counts: Record<SlotKind, number> = { format: 0, transformation: 0, style: 0, emotion: 0 }
  for (const slot of listPatternSlots(steps)) counts[slot.kind]++
  return counts
}

export const ATOMIC_TIMES: AtomicTime[] = ['Micro', 'Short', 'Medium', 'Long', 'Deep']

// Wildcard fallbacks used when a class's pool for a kind is empty — see
// rollSlotValue. Exhaustive literal lists (no runtime reflection over a
// TS union exists); keep in sync with the corresponding type in
// types/game.ts / contentProducts.ts if a value is ever added or removed.
const ALL_CONTENT_PRODUCTS: ContentProductType[] = [
  'Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'Infographic',
  'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo',
  'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'AssetPack',
  'CurationFeed', 'CommunitySpace', 'InteractiveApp', '_blank',
]
// Excludes 'New' — that value is reserved for the state-0 "fresh,
// unremixed" sentinel (always forced separately in rollPatternDraws) and
// shouldn't turn up as a wildcard remix target at states 1+.
const ALL_TRANSFORMATIONS_EXCEPT_NEW: AtomicOrigin[] = [
  'Compression', 'Expansion', 'Recycled', 'Remastered', 'Revamped', 'Reboot',
  'ZoomIn', 'ZoomOut', 'AudienceAlter', 'Commentary', 'Similar', 'Opposite',
]
const ALL_DAMAGE_TYPES: DamageType[] = [
  'standard', 'strike', 'slash', 'pierce', 'lightning', 'fire', 'magic', 'holy', 'occult', 'grafting', 'poison',
]
const ALL_STATUS_TYPES: StatusType[] = [
  'bleed', 'scarlet_rot', 'frostbite', 'madness', 'sleep', 'death_blight', 'glintstone',
  'frenzy_flame', 'devotion', 'yearning', 'dread', 'murmur', 'grace',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Weighted index pick for "exclusive" groups (eitherOr) — returns which
// member wins this round. Exported for workflowGenerator.ts's legacy
// (pre-rolled_draws) compile-time fallback, which needs the same logic.
export function pickWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] <= 0) continue
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

type SlotValue = ContentProductType | AtomicOrigin | DamageType | StatusType | null

// Picks from `pool`, excluding `exclude` when an alternative actually
// exists — used on remaster rerolls so a "redraw" can't silently land back
// on the exact same value it's replacing (which, for a small/skewed pool
// like halberds' 2:1 pierce/slash, would otherwise read as "nothing
// changed" purely by chance).
function pickExcluding<T extends SlotValue>(pool: readonly T[], exclude: SlotValue): T {
  const filtered = pool.filter(v => v !== exclude)
  return pick(filtered.length > 0 ? filtered : pool)
}

// Effective candidate pool for a kind — an empty class-level pool means
// "no restriction" (the wildcard fallback), rather than disabling the draw.
function poolFor(cls: WeaponClassDef, kind: SlotKind): readonly NonNullable<SlotValue>[] {
  if (kind === 'format') return cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
  if (kind === 'transformation') return cls.allowed_transformations.length > 0 ? cls.allowed_transformations : ALL_TRANSFORMATIONS_EXCEPT_NEW
  if (kind === 'style') return cls.base_damage_types.length > 0 ? cls.base_damage_types : ALL_DAMAGE_TYPES
  return cls.inherent_status.length > 0 ? cls.inherent_status : ALL_STATUS_TYPES
}

// `exclude` is only passed on remaster rerolls (states 1..N) — the initial
// state-0 roll has no previous value to avoid repeating.
function rollSlotValue(cls: WeaponClassDef, slot: SlotRef, exclude?: SlotValue): SlotValue {
  if (slot.kind === 'style' || slot.kind === 'emotion') {
    if (Math.random() >= slot.probability) return null
  }
  const pool = poolFor(cls, slot.kind)
  return exclude !== undefined ? pickExcluding(pool, exclude) : pick(pool)
}

// Whether a group's reroll can ever produce a visible change at all —
// used to keep the round-robin from giving a turn to a group that's
// structurally incapable of one (e.g. a lone probability-1 drawStyle()
// whose class has a single-value base_damage_types pool: every reroll is
// forced to land back on that same value). An exclusive (eitherOr) group
// always can, regardless of pool size — resolveGroupState's kind-switch
// guard above guarantees it. An independent group can if any member
// either isn't always-on (probability < 1, so it can flip to/from null)
// or has a pool with at least 2 distinct values to land on.
function groupCanChange(cls: WeaponClassDef, group: SlotGroup): boolean {
  if (group.weights) return true
  return group.slots.some(slot => slot.probability < 1 || new Set(poolFor(cls, slot.kind)).size >= 2)
}

// Resolves one group's values for one state, used for both the initial
// state-0 roll (prev === null) and every remaster reroll (prev = that
// group's values at the previous state, indexed the same as group.slots).
// - independent group (no weights): every member rolls on its own,
//   excluding its own previous value on a reroll.
// - exclusive group (weights present, from eitherOr()): pick one member
//   by weight; only it rolls a real value (same exclusion rule), every
//   other member is forced null.
function resolveGroupState(cls: WeaponClassDef, group: SlotGroup, prev: SlotValue[] | null): SlotValue[] {
  if (!group.weights) {
    return group.slots.map((slot, i) => {
      if (prev === null && slot.kind === 'transformation') return 'New'
      return rollSlotValue(cls, slot, prev !== null ? prev[i] : undefined)
    })
  }

  const rollWinnerValue = (idx: number): SlotValue => {
    const slot = group.slots[idx]
    if (prev === null && slot.kind === 'transformation') return 'New'
    return rollSlotValue(cls, slot, prev !== null ? prev[idx] : undefined)
  }

  let winnerIdx = pickWeighted(group.weights)
  let value = rollWinnerValue(winnerIdx)
  // Guard against a true no-op: the same option won again *and* its pool
  // couldn't actually produce a different value (e.g. a single-value
  // pool defeats rollSlotValue's own pickExcluding fallback) — force a
  // kind-switch instead, which is always a visible change (one slot
  // goes value -> null, another null -> value).
  if (prev !== null) {
    const prevWinnerIdx = group.slots.findIndex((_, i) => prev[i] !== null)
    if (winnerIdx === prevWinnerIdx && value === prev[winnerIdx]) {
      winnerIdx = pickWeighted(group.weights.map((w, i) => (i === winnerIdx ? 0 : w)))
      value = rollWinnerValue(winnerIdx)
    }
  }

  return group.slots.map((_, i) => (i === winnerIdx ? value : null))
}

// Rolls a weapon instance's full fixed draw sequence once, at creation
// time. State 0 is "primary" (normal content); states 1..N are pre-rolled
// remaster targets, each differing from the previous state by exactly one
// *group* (round-robin across the changeable groups from listSlotGroups()
// — see groupCanChange) — a group is one slot for a top-level draw, every
// draw inside one branch()'s paths together, or every option of one
// eitherOr() together (see listSlotGroups), so branch-parallel siblings
// always redraw in the same step (each independently), and an eitherOr's
// options always get a fresh weighted re-decision in the same step (only
// one ever non-null).
export function rollPatternDraws(weaponClass: WeaponClass): RolledPatternDraws {
  const cls = WEAPON_CLASSES[weaponClass]
  const steps = WEAPON_PATTERNS[weaponClass]
  const groups = listSlotGroups(steps)
  const slots = groups.flatMap(g => g.slots)
  const N = cls.remaster_steps

  const groupFlatIndices: number[][] = []
  let flatIdx = 0
  for (const group of groups) {
    groupFlatIndices.push(group.slots.map(() => flatIdx++))
  }

  // Round-robin only cycles through groups that can actually produce a
  // visible change (groupCanChange) — a group stuck on a single-value,
  // always-on pool (e.g. straight_swords' lone drawStyle(1) against
  // base_damage_types: ['standard']) would otherwise "take a turn" that's
  // guaranteed to do nothing.
  const changeableGroupIdxs = groups.map((_, i) => i).filter(i => groupCanChange(cls, groups[i]))

  // states[stateIndex][slotIndex] = value at that state for that slot.
  const states: SlotValue[][] = [
    groups.flatMap(group => resolveGroupState(cls, group, null)),
  ]
  for (let i = 1; i <= N; i++) {
    const next = states[i - 1].slice()
    if (groups.length > 0) {
      const groupIdx = changeableGroupIdxs.length > 0
        ? changeableGroupIdxs[(i - 1) % changeableGroupIdxs.length]
        : (i - 1) % groups.length
      const group = groups[groupIdx]
      const flatIndicesForGroup = groupFlatIndices[groupIdx]
      const prevForGroup = flatIndicesForGroup.map(idx => states[i - 1][idx])
      // groupCanChange only rules out groups that can *never* change —
      // a probability<1 single-value slot (e.g. spears' drawStyle(0.4)
      // against base_damage_types: ['pierce']) can still randomly land
      // back on the same null/value state by chance on any given reroll.
      // Retry a bounded number of times rather than accept a no-op —
      // changeable groups always have *some* chance of differing, so
      // this converges fast in practice and only exists as a safety cap.
      let resolved = resolveGroupState(cls, group, prevForGroup)
      for (let attempt = 0; attempt < 50 && resolved.every((v, j) => v === prevForGroup[j]); attempt++) {
        resolved = resolveGroupState(cls, group, prevForGroup)
      }
      flatIndicesForGroup.forEach((idx, j) => { next[idx] = resolved[j] })
    }
    states.push(next)
  }

  const format: (ContentProductType | null)[][] = []
  const transformation: (AtomicOrigin | null)[][] = []
  const style: (DamageType | null)[][] = []
  const emotion: (StatusType | null)[][] = []

  slots.forEach((slot, slotIdx) => {
    const sequence = states.map(state => state[slotIdx])
    if (slot.kind === 'format')         format.push(sequence as (ContentProductType | null)[])
    if (slot.kind === 'transformation') transformation.push(sequence as (AtomicOrigin | null)[])
    if (slot.kind === 'style')          style.push(sequence as (DamageType | null)[])
    if (slot.kind === 'emotion')        emotion.push(sequence as (StatusType | null)[])
  })

  return {
    format,
    transformation,
    style,
    emotion,
    length: pick(ATOMIC_TIMES),
  }
}
