import type { WeaponClass, AtomicTime, AtomicOrigin, DamageType, StatusType, RolledPatternDraws } from '../../types/game'
import type { PatternStep } from './weaponPatterns'
import { WEAPON_PATTERNS } from './weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './weaponClasses'

// Shared ordering/traversal rules for "draw" steps across a class's
// pattern — top-level steps in array order, branch() visits each path
// fully in order. Deliberately mirrors (but does not call into)
// workflowGenerator.ts's tile-building walker: this one only cares about
// draw-step ordering, not tiles/edges/frontier, so it's safe to reuse from
// both the weapon-creation roller below and the UI structure preview.

export type SlotKind = 'transformation' | 'style' | 'emotion'
export interface SlotRef { kind: SlotKind; occurrenceIndex: number; probability: number }

export function listPatternSlots(steps: PatternStep[]): SlotRef[] {
  const out: SlotRef[] = []
  const counters: Record<SlotKind, number> = { transformation: 0, style: 0, emotion: 0 }
  function walk(list: PatternStep[]): void {
    for (const step of list) {
      switch (step.kind) {
        case 'drawTransformation':
          out.push({ kind: 'transformation', occurrenceIndex: counters.transformation++, probability: 1 })
          break
        case 'drawStyle':
          out.push({ kind: 'style', occurrenceIndex: counters.style++, probability: step.probability })
          break
        case 'drawEmotion':
          out.push({ kind: 'emotion', occurrenceIndex: counters.emotion++, probability: step.probability })
          break
        case 'branch':
          for (const path of step.paths) walk(path)
          break
        case 'phase':
        case 'drawFormat':
          break
      }
    }
  }
  walk(steps)
  return out
}

export function countSlotsByKind(steps: PatternStep[]): Record<SlotKind, number> {
  const counts: Record<SlotKind, number> = { transformation: 0, style: 0, emotion: 0 }
  for (const slot of listPatternSlots(steps)) counts[slot.kind]++
  return counts
}

export const ATOMIC_TIMES: AtomicTime[] = ['Micro', 'Short', 'Medium', 'Long', 'Deep']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

type SlotValue = AtomicOrigin | DamageType | StatusType | null

function rollSlotValue(cls: WeaponClassDef, slot: SlotRef): SlotValue {
  if (slot.kind === 'transformation') {
    const pool = cls.allowed_transformations
    return pool.length === 0 ? null : pick(pool)
  }
  if (slot.kind === 'style') {
    const pool = cls.base_damage_types
    return (pool.length === 0 || Math.random() >= slot.probability) ? null : pick(pool)
  }
  // emotion
  return (!cls.inherent_status || Math.random() >= slot.probability) ? null : cls.inherent_status
}

// Rolls a weapon instance's full fixed draw sequence once, at creation
// time. State 0 is "primary" (normal content); states 1..N are pre-rolled
// remaster targets, each differing from the previous state by exactly one
// slot (round-robin across all transformation/style/emotion occurrences).
export function rollPatternDraws(weaponClass: WeaponClass): RolledPatternDraws {
  const cls = WEAPON_CLASSES[weaponClass]
  const steps = WEAPON_PATTERNS[weaponClass]
  const slots = listPatternSlots(steps)
  const N = cls.remaster_steps

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
    if (slots.length > 0) {
      const changeIdx = (i - 1) % slots.length
      next[changeIdx] = rollSlotValue(cls, slots[changeIdx])
    }
    states.push(next)
  }

  const transformation: (AtomicOrigin | null)[][] = []
  const style: (DamageType | null)[][] = []
  const emotion: (StatusType | null)[][] = []

  slots.forEach((slot, slotIdx) => {
    const sequence = states.map(state => state[slotIdx])
    if (slot.kind === 'transformation') transformation.push(sequence as (AtomicOrigin | null)[])
    if (slot.kind === 'style')          style.push(sequence as (DamageType | null)[])
    if (slot.kind === 'emotion')        emotion.push(sequence as (StatusType | null)[])
  })

  return {
    format: pick(cls.supported_products),
    transformation,
    style,
    emotion,
    length: pick(ATOMIC_TIMES),
  }
}
