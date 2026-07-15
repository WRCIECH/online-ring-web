import type { WeaponClass, AtomicTime, ContentProductType, RolledPatternDraws } from '../../types/game'
import type { PatternStep } from './weaponPatterns'
import { WEAPON_PATTERNS } from './weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './weaponClasses'

// Shared ordering/traversal rules for "draw" steps across a class's
// pattern — top-level steps in array order, branch() visits each path
// fully in order. Deliberately mirrors (but does not call into)
// workflowGenerator.ts's tile-building walker: this one only cares about
// draw-step ordering, not tiles/edges/frontier, so it's safe to reuse from
// both the weapon-creation roller below and the UI structure preview.

export type SlotKind = 'format'
export interface SlotRef {
  kind: SlotKind
  occurrenceIndex: number
  probability: number
  fixedValue?: ContentProductType
}

function slotForDraw(step: PatternStep, counters: Record<SlotKind, number>): SlotRef | null {
  switch (step.kind) {
    case 'drawFormat': return { kind: 'format', occurrenceIndex: counters.format++, probability: 1 }
    case 'fixedDraw':  return { kind: 'format', occurrenceIndex: counters.format++, probability: 1, fixedValue: step.value }
    default: return null
  }
}

export interface SlotGroup {
  slots: SlotRef[]
  fixed?: boolean
}

export function listSlotGroups(steps: PatternStep[]): SlotGroup[] {
  const groups: SlotGroup[] = []
  const counters: Record<SlotKind, number> = { format: 0 }
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
    } else if (step.kind === 'fixedDraw') {
      const slot = slotForDraw(step, counters)
      if (slot) groups.push({ slots: [slot], fixed: true })
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
  const counts: Record<SlotKind, number> = { format: 0 }
  for (const slot of listPatternSlots(steps)) counts[slot.kind]++
  return counts
}

export const ATOMIC_TIMES: AtomicTime[] = ['Micro', 'Short', 'Medium', 'Long', 'Deep']

// Wildcard fallback when a class's supported_products pool is empty — means
// "no restriction" rather than disabling the draw. Keep in sync with
// ContentProductType in contentProducts.ts.
const ALL_CONTENT_PRODUCTS: ContentProductType[] = [
  'Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'Infographic',
  'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo',
  'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'AssetPack',
  'CurationFeed', 'CommunitySpace', 'InteractiveApp', '_blank',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

type SlotValue = ContentProductType | null

function poolFor(cls: WeaponClassDef): readonly ContentProductType[] {
  return cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
}

export function rollPatternDraws(weaponClass: WeaponClass): RolledPatternDraws {
  const cls = WEAPON_CLASSES[weaponClass]
  const steps = WEAPON_PATTERNS[weaponClass]
  const groups = listSlotGroups(steps)
  const slots = groups.flatMap(g => g.slots)

  const state: SlotValue[] = groups.flatMap(group =>
    group.fixed
      ? group.slots.map(slot => slot.fixedValue ?? null)
      : group.slots.map(() => pick(poolFor(cls)))
  )

  const format: (ContentProductType | null)[][] = []
  slots.forEach((slot, slotIdx) => {
    if (slot.kind === 'format') format.push([state[slotIdx] as ContentProductType | null])
  })

  return { format, length: pick(ATOMIC_TIMES) }
}
