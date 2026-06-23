import type { AtomicStage, WeaponClass } from '../types/game'
import type { PatternStep } from './generators/weaponPatterns'
import { WEAPON_PATTERNS } from './generators/weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './generators/weaponClasses'
import { STAGE_TIME } from './generators/workflowGenerator'

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
}

export interface BranchNode {
  kind: 'branch'
  paths: PatternNode[][]
}

export type PatternNode = PhaseNode | DrawNode | BranchNode

// Turns a weapon class's abstract pattern (WEAPON_PATTERNS) into a
// renderable description of its workflow *shape* — independent of any
// rolled WorkflowGraph. Mirrors workflowGenerator.ts's compileStep skip
// conditions so a step that could never actually occur for this class
// (e.g. drawStyle on a class with no base_damage_types) is omitted here too.
export function describeWeaponPattern(weaponClass: WeaponClass): PatternNode[] {
  const cls = WEAPON_CLASSES[weaponClass]
  const steps = WEAPON_PATTERNS[weaponClass]
  return steps.map(step => describeStep(step, cls)).filter((n): n is PatternNode => n !== null)
}

function describeStep(step: PatternStep, cls: WeaponClassDef): PatternNode | null {
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
      return { kind: 'draw', label: 'format', probability: 1 }
    case 'drawTransformation':
      return cls.allowed_transformations.length === 0
        ? null
        : { kind: 'draw', label: 'transformation', probability: 1 }
    case 'drawStyle':
      return cls.base_damage_types.length === 0
        ? null
        : { kind: 'draw', label: 'style', probability: step.probability }
    case 'drawEmotion':
      return !cls.inherent_status
        ? null
        : { kind: 'draw', label: 'emotion', probability: step.probability }
    case 'branch':
      return {
        kind: 'branch',
        paths: step.paths.map(path => path.map(s => describeStep(s, cls)).filter((n): n is PatternNode => n !== null)),
      }
  }
}
