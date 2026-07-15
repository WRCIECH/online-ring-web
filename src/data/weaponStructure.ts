import type { AtomicStage, WeaponInstance, ContentProductType, Affix } from '../types/game'
import type { TranslationBundle } from '../i18n'
import type { PatternStep } from './generators/weaponPatterns'
import { WEAPON_PATTERNS } from './generators/weaponPatterns'
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
  label: 'format'
  value: ContentProductType
  // sequential index among all format draws within this weapon's pattern —
  // matches the index used by RolledPatternDraws so callers can correlate
  // per-slot change flags.
  occurrenceIndex: number
}

export interface BranchNode {
  kind: 'branch'
  paths: PatternNode[][]
}

export type PatternNode = PhaseNode | DrawNode | BranchNode

// Lookup tables resolving a draw/slot kind to its i18n label key and content
// bucket — used by the structure preview and remaster-state carousel.
export const DRAW_LABEL_KEY: Record<DrawNode['label'], string> = {
  format: 'draw_format',
}

export const VALUE_BUCKET: Record<DrawNode['label'], keyof TranslationBundle['content']> = {
  format: 'product',
}

// Turns a weapon instance's class pattern (WEAPON_PATTERNS) into a
// renderable description of its workflow *shape*, with each draw step
// resolved to that instance's actual fixed "primary" value (see
// RolledPatternDraws in types/game.ts) when available. A draw node is
// omitted only when its resolved value is null — an empty class-level pool
// no longer disables a draw, it just means any value is equally likely
// (see rollPatternDraws in patternSlots.ts).
export function describeWeaponPattern(weapon: WeaponInstance, stateIndex = 0): PatternNode[] {
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const steps = WEAPON_PATTERNS[weapon.weapon_class]
  const counters: Record<SlotKind, number> = { format: 0 }
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
    case 'branch':
      return {
        kind: 'branch',
        paths: step.paths.map(path =>
          path.map(s => describeStep(s, cls, weapon, counters, stateIndex)).filter((n): n is PatternNode => n !== null)
        ),
      }
    case 'fixedDraw': {
      const occ = counters.format++
      return { kind: 'draw', label: 'format', value: step.value, occurrenceIndex: occ }
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
