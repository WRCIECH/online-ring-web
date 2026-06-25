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

// Groups slots for the remaster round-robin: a top-level draw is its own
// group (redrawn independently, e.g. spears' two sequential drawStyle()
// calls), while every draw inside one branch()'s paths (e.g. halberds' 3
// parallel drawStyle() calls — one per path, validated by weaponPatterns.ts
// to be the same kind in every path) forms a single group, redrawn together
// on that group's round-robin turn so the parallel pieces of content stay
// in lockstep about *when* they change, even though each still gets its
// own independent roll and can land on a different value than its siblings.
// listPatternSlots()'s flat order is exactly groups.flat() — branches don't
// reorder anything relative to the old purely-recursive walk.
export function listSlotGroups(steps: PatternStep[]): SlotRef[][] {
  const groups: SlotRef[][] = []
  const counters: Record<SlotKind, number> = { format: 0, transformation: 0, style: 0, emotion: 0 }
  for (const step of steps) {
    if (step.kind === 'branch') {
      const branchGroup: SlotRef[] = []
      for (const path of step.paths) {
        for (const innerStep of path) {
          const slot = slotForDraw(innerStep, counters)
          if (slot) branchGroup.push(slot)
        }
      }
      if (branchGroup.length > 0) groups.push(branchGroup)
    } else {
      const slot = slotForDraw(step, counters)
      if (slot) groups.push([slot])
    }
  }
  return groups
}

export function listPatternSlots(steps: PatternStep[]): SlotRef[] {
  return listSlotGroups(steps).flat()
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

// `exclude` is only passed on remaster rerolls (states 1..N) — the initial
// state-0 roll has no previous value to avoid repeating. An empty
// class-level pool for any of the 4 kinds means "no restriction" — any
// value from the full universe for that kind is equally likely — rather
// than disabling the draw.
function rollSlotValue(cls: WeaponClassDef, slot: SlotRef, exclude?: SlotValue): SlotValue {
  if (slot.kind === 'format') {
    const pool = cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
    return exclude !== undefined ? pickExcluding(pool, exclude) : pick(pool)
  }
  if (slot.kind === 'transformation') {
    const pool = cls.allowed_transformations.length > 0 ? cls.allowed_transformations : ALL_TRANSFORMATIONS_EXCEPT_NEW
    return exclude !== undefined ? pickExcluding(pool, exclude) : pick(pool)
  }
  if (slot.kind === 'style') {
    if (Math.random() >= slot.probability) return null
    const pool = cls.base_damage_types.length > 0 ? cls.base_damage_types : ALL_DAMAGE_TYPES
    return exclude !== undefined ? pickExcluding(pool, exclude) : pick(pool)
  }
  // emotion
  if (Math.random() >= slot.probability) return null
  const pool = cls.inherent_status.length > 0 ? cls.inherent_status : ALL_STATUS_TYPES
  return exclude !== undefined ? pickExcluding(pool, exclude) : pick(pool)
}

// Rolls a weapon instance's full fixed draw sequence once, at creation
// time. State 0 is "primary" (normal content); states 1..N are pre-rolled
// remaster targets, each differing from the previous state by exactly one
// *group* (round-robin across listSlotGroups()) — a group is one slot for
// a top-level draw, or every draw inside one branch()'s paths together
// (see listSlotGroups), so branch-parallel siblings always redraw in the
// same step, each independently, rather than waiting their own separate
// turns.
export function rollPatternDraws(weaponClass: WeaponClass): RolledPatternDraws {
  const cls = WEAPON_CLASSES[weaponClass]
  const steps = WEAPON_PATTERNS[weaponClass]
  const groups = listSlotGroups(steps)
  const slots = groups.flat()
  const N = cls.remaster_steps

  const groupFlatIndices: number[][] = []
  let flatIdx = 0
  for (const group of groups) {
    groupFlatIndices.push(group.map(() => flatIdx++))
  }

  // states[stateIndex][slotIndex] = value at that state for that slot.
  // State 0 is content that hasn't been remixed yet, so Transformation is
  // always 'New' there — the allowed_transformations pool (Similar,
  // Opposite, Remastered, ...) only makes sense once a remaster actually
  // happens, starting at state 1.
  const states: SlotValue[][] = [
    slots.map(slot => slot.kind === 'transformation' ? 'New' : rollSlotValue(cls, slot)),
  ]
  for (let i = 1; i <= N; i++) {
    const next = states[i - 1].slice()
    if (groups.length > 0) {
      const groupIdx = (i - 1) % groups.length
      for (const idx of groupFlatIndices[groupIdx]) next[idx] = rollSlotValue(cls, slots[idx], states[i - 1][idx])
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
