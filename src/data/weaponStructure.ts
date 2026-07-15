import type { AtomicStage, WeaponInstance, ContentProductType, AtomicOrigin, StyleType, Affix } from '../types/game'
import type { TranslationBundle } from '../i18n'
import type { PatternStep } from './generators/weaponPatterns'
import { WEAPON_PATTERNS, drawKindOf } from './generators/weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './generators/weaponClasses'
import { STAGE_TIME } from './generators/workflowGenerator'
import { type SlotKind } from './generators/patternSlots'

export interface PhaseNode {
  kind: 'phase'
  stage: AtomicStage
  min: number
  max: number
  lightSec: number   // time_mod already applied
  heavySec: number
}

export interface DrawNode {
  kind: 'draw'
  label: 'format' | 'transformation' | 'style'
  // resolved "primary" (state 0) value for this weapon instance. A slot
  // that never triggers for this instance (or predates the fixed-per-
  // instance-draws feature, with no rolled_draws to resolve from) is
  // omitted entirely by describeWeaponPattern rather than appearing here
  // as null — there's nothing to show for a dimension this instance
  // simply doesn't have.
  value: ContentProductType | AtomicOrigin | StyleType
  // sequential index among all occurrences of the same label kind within
  // this weapon's pattern — matches the index used by RolledPatternDraws
  // and describeRemasterStates, so callers can correlate per-slot change flags.
  occurrenceIndex: number
}

export interface BranchNode {
  kind: 'branch'
  paths: PatternNode[][]
}

export type PatternNode = PhaseNode | DrawNode | BranchNode

// Shared lookup tables resolving a draw/slot kind to its t.ui label key
// and its t.content.* i18n bucket — used by both the structure preview
// (DrawNode['label']) and the remaster-state carousel (SlotKind).
export const DRAW_LABEL_KEY: Record<DrawNode['label'], string> = {
  format: 'draw_format',
  transformation: 'draw_transformation',
  style: 'draw_style',
}

export const VALUE_BUCKET: Record<DrawNode['label'], keyof TranslationBundle['content']> = {
  format: 'product',
  transformation: 'origin',
  style: 'style',
}

// Turns a weapon instance's class pattern (WEAPON_PATTERNS) into a
// renderable description of its workflow *shape*, with each draw step
// resolved to that instance's actual fixed "primary" value (see
// RolledPatternDraws in types/game.ts) when available. A draw node is
// omitted only when its resolved value is null (e.g. a probability-gated
// drawStyle that didn't trigger) — an empty class-level pool no longer
// disables a draw, it just means any value of that kind is equally likely
// (see rollSlotValue in patternSlots.ts).
export function describeWeaponPattern(weapon: WeaponInstance, stateIndex = 0): PatternNode[] {
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const steps = WEAPON_PATTERNS[weapon.weapon_class]
  const counters: Record<SlotKind, number> = { format: 0, transformation: 0, style: 0 }
  return steps
    .map(step => describeStep(step, cls, weapon, counters, stateIndex))
    .filter((n): n is PatternNode => n != null)
}

function describeStep(
  step: PatternStep,
  cls: WeaponClassDef,
  weapon: WeaponInstance,
  counters: Record<SlotKind, number>,
  stateIndex: number,
): PatternNode | null {
  switch (step.kind) {
    case 'phase': {
      const t = STAGE_TIME[step.stage]
      return {
        kind: 'phase', stage: step.stage, min: step.min, max: step.max,
        lightSec: Math.round(t.light * cls.time_mod),
        heavySec: Math.round(t.heavy * cls.time_mod),
      }
    }
    case 'drawFormat': {
      const occ = counters.format++
      const value = weapon.rolled_draws?.format[occ]?.[stateIndex] ?? null
      return value === null ? null : { kind: 'draw', label: 'format', value, occurrenceIndex: occ }
    }
    case 'drawTransformation': {
      const occ = counters.transformation++
      const value = weapon.rolled_draws?.transformation[occ]?.[stateIndex] ?? null
      return value === null ? null : { kind: 'draw', label: 'transformation', value, occurrenceIndex: occ }
    }
    case 'drawStyle': {
      const occ = counters.style++
      const value = weapon.rolled_draws?.style[occ]?.[stateIndex] ?? null
      return value === null ? null : { kind: 'draw', label: 'style', value, occurrenceIndex: occ }
    }
    case 'branch':
      return {
        kind: 'branch',
        paths: step.paths.map(path =>
          path.map(s => describeStep(s, cls, weapon, counters, stateIndex)).filter((n): n is PatternNode => n !== null)
        ),
      }
    case 'eitherOr': {
      // Every option's counter is incremented regardless of which one
      // actually won (same lockstep indexing rule as the compiler and
      // patternSlots.ts) — only the non-null option (exactly one, or
      // none on a legacy instance with no rolled_draws) becomes the node.
      let result: PatternNode | null = null
      for (const opt of step.options) {
        const kind = drawKindOf(opt.step)!
        const occ = counters[kind]++
        const value = weapon.rolled_draws?.[kind][occ]?.[stateIndex] ?? null
        if (value !== null) result = { kind: 'draw', label: kind, value, occurrenceIndex: occ }
      }
      return result
    }
    case 'fixedDraw': {
      const occ = counters[step.slotKind]++
      return { kind: 'draw', label: step.slotKind, value: step.value, occurrenceIndex: occ }
    }
  }
}

// `rollAffixes` can independently pick more than one damage affix — they both
// apply (composed multiplicatively, see calcWeaponScaledDamage), but shown as
// two separate unexplained chips it reads as a bug. Collapse them into one.
export function mergeAffixesForDisplay(affixes: Affix[]): { id: string; label: string }[] {
  const damage: Affix[] = []
  const passthrough: Affix[] = []
  for (const a of affixes) {
    if (a.damage_mult !== undefined) damage.push(a)
    else passthrough.push(a)
  }

  const out: { id: string; label: string }[] = passthrough.map(a => ({ id: a.id, label: a.label }))

  if (damage.length > 0) {
    const mult = damage.reduce((m, a) => m * (a.damage_mult ?? 1), 1)
    out.push({ id: damage.map(a => a.id).join('+'), label: `+${Math.round((mult - 1) * 100)}% damage` })
  }
  return out
}
