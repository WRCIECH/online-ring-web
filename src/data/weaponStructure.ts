import type { AtomicStage, WeaponInstance, ContentProductType, AtomicOrigin, DamageType, StatusType } from '../types/game'
import type { PatternStep } from './generators/weaponPatterns'
import { WEAPON_PATTERNS } from './generators/weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './generators/weaponClasses'
import { STAGE_TIME } from './generators/workflowGenerator'
import type { SlotKind } from './generators/patternSlots'

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
  label: 'format' | 'transformation' | 'style' | 'emotion'
  probability: number
  // resolved "primary" (state 0) value for this weapon instance — null if
  // this slot never triggers for this instance, or the instance predates
  // the fixed-per-instance-draws feature (no rolled_draws to resolve from)
  value: ContentProductType | AtomicOrigin | DamageType | StatusType | null
}

export interface BranchNode {
  kind: 'branch'
  paths: PatternNode[][]
}

export type PatternNode = PhaseNode | DrawNode | BranchNode

// Turns a weapon instance's class pattern (WEAPON_PATTERNS) into a
// renderable description of its workflow *shape*, with each draw step
// resolved to that instance's actual fixed "primary" value (see
// RolledPatternDraws in types/game.ts) when available. Mirrors
// workflowGenerator.ts's compileStep skip conditions so a step that could
// never actually occur for this class (e.g. drawStyle on a class with no
// base_damage_types) is omitted here too.
export function describeWeaponPattern(weapon: WeaponInstance): PatternNode[] {
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const steps = WEAPON_PATTERNS[weapon.weapon_class]
  const counters: Record<SlotKind, number> = { transformation: 0, style: 0, emotion: 0 }
  return steps
    .map(step => describeStep(step, cls, weapon, counters))
    .filter((n): n is PatternNode => n !== null)
}

function describeStep(
  step: PatternStep,
  cls: WeaponClassDef,
  weapon: WeaponInstance,
  counters: Record<SlotKind, number>,
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
    case 'drawFormat':
      return { kind: 'draw', label: 'format', probability: 1, value: weapon.rolled_draws?.format ?? null }
    case 'drawTransformation': {
      if (cls.allowed_transformations.length === 0) return null
      const occ = counters.transformation++
      const value = weapon.rolled_draws?.transformation[occ]?.[0] ?? null
      return { kind: 'draw', label: 'transformation', probability: 1, value }
    }
    case 'drawStyle': {
      if (cls.base_damage_types.length === 0) return null
      const occ = counters.style++
      const value = weapon.rolled_draws?.style[occ]?.[0] ?? null
      return { kind: 'draw', label: 'style', probability: step.probability, value }
    }
    case 'drawEmotion': {
      if (!cls.inherent_status) return null
      const occ = counters.emotion++
      const value = weapon.rolled_draws?.emotion[occ]?.[0] ?? null
      return { kind: 'draw', label: 'emotion', probability: step.probability, value }
    }
    case 'branch':
      return {
        kind: 'branch',
        paths: step.paths.map(path =>
          path.map(s => describeStep(s, cls, weapon, counters)).filter((n): n is PatternNode => n !== null)
        ),
      }
  }
}
