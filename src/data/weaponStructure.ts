import type { AtomicStage, WeaponInstance, ContentProductType, AtomicOrigin, DamageType, StatusType, Affix } from '../types/game'
import type { TranslationBundle } from '../i18n'
import type { PatternStep } from './generators/weaponPatterns'
import { WEAPON_PATTERNS } from './generators/weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './generators/weaponClasses'
import { STAGE_TIME } from './generators/workflowGenerator'
import { listPatternSlots, type SlotKind } from './generators/patternSlots'

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
  // resolved "primary" (state 0) value for this weapon instance. A slot
  // that never triggers for this instance (or predates the fixed-per-
  // instance-draws feature, with no rolled_draws to resolve from) is
  // omitted entirely by describeWeaponPattern rather than appearing here
  // as null — there's nothing to show for a dimension this instance
  // simply doesn't have.
  value: ContentProductType | AtomicOrigin | DamageType | StatusType
}

export interface BranchNode {
  kind: 'branch'
  paths: PatternNode[][]
}

export type PatternNode = PhaseNode | DrawNode | BranchNode

// Shared lookup tables resolving a draw/slot kind to its t.ui label key
// and its t.content.* i18n bucket — used by both the structure preview
// (DrawNode['label'], which includes 'format') and the remaster-state
// carousel (SlotKind, which doesn't — format never varies by state).
export const DRAW_LABEL_KEY: Record<DrawNode['label'], string> = {
  format: 'draw_format',
  transformation: 'draw_transformation',
  style: 'draw_style',
  emotion: 'draw_emotion',
}

export const VALUE_BUCKET: Record<DrawNode['label'], keyof TranslationBundle['content']> = {
  format: 'product',
  transformation: 'origin',
  style: 'dmg_type',
  emotion: 'status',
}

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
    case 'drawFormat': {
      const value = weapon.rolled_draws?.format ?? null
      return value === null ? null : { kind: 'draw', label: 'format', value }
    }
    case 'drawTransformation': {
      if (cls.allowed_transformations.length === 0) return null
      const occ = counters.transformation++
      const value = weapon.rolled_draws?.transformation[occ]?.[0] ?? null
      return value === null ? null : { kind: 'draw', label: 'transformation', value }
    }
    case 'drawStyle': {
      if (cls.base_damage_types.length === 0) return null
      const occ = counters.style++
      const value = weapon.rolled_draws?.style[occ]?.[0] ?? null
      return value === null ? null : { kind: 'draw', label: 'style', value }
    }
    case 'drawEmotion': {
      if (cls.inherent_status.length === 0) return null
      const occ = counters.emotion++
      const value = weapon.rolled_draws?.emotion[occ]?.[0] ?? null
      return value === null ? null : { kind: 'draw', label: 'emotion', value }
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

export interface RemasterSlotView {
  kind: SlotKind
  occurrenceIndex: number
  value: AtomicOrigin | DamageType | StatusType | null   // null = absent at this state
  changed: boolean   // differs from this slot's value at the previous state (always false at state 0)
}

// Describes every pre-rolled remaster state (0 = primary, 1..N = the
// weapon's pre-rolled remaster targets) for a weapon instance, one row
// per state, one entry per transformation/style/emotion occurrence in
// that class's pattern. Returns [] when there's nothing to preview: no
// rolled_draws (legacy weapon instance) or zero such occurrences at all.
// Unlike describeWeaponPattern, slots with a null value are NOT omitted
// here — the carousel compares across states, so a stable slot list per
// page (with explicit "absent" entries) is more legible than one whose
// shape shifts page to page.
export function describeRemasterStates(weapon: WeaponInstance): RemasterSlotView[][] {
  if (!weapon.rolled_draws) return []
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const steps = WEAPON_PATTERNS[weapon.weapon_class]
  const slots = listPatternSlots(steps)
  if (slots.length === 0) return []

  const N = cls.remaster_steps
  const rolled = weapon.rolled_draws
  const states: RemasterSlotView[][] = []
  for (let stateIndex = 0; stateIndex <= N; stateIndex++) {
    const row = slots.map(slot => {
      const value = rolled[slot.kind][slot.occurrenceIndex]?.[stateIndex] ?? null
      const prevValue = stateIndex === 0 ? value : (rolled[slot.kind][slot.occurrenceIndex]?.[stateIndex - 1] ?? null)
      return {
        kind: slot.kind,
        occurrenceIndex: slot.occurrenceIndex,
        value,
        changed: stateIndex > 0 && value !== prevValue,
      }
    })
    states.push(row)
  }
  return states
}

type AffixCategory = 'damage' | 'stamina' | 'fp'

function affixCategory(a: Affix): AffixCategory | null {
  if (a.damage_mult !== undefined) return 'damage'
  if (a.stamina_mult !== undefined) return 'stamina'
  if (a.fp_mult !== undefined) return 'fp'
  return null
}

// `rollAffixes` can independently pick more than one affix that boosts the
// same stat (e.g. two separate "+X% damage" rolls) — they do both apply
// (composed multiplicatively, see calcWeaponScaledDamage), but shown as two
// separate unexplained chips it reads as a bug. Collapse same-category
// affixes into one chip with the combined multiplier.
export function mergeAffixesForDisplay(affixes: Affix[]): { id: string; label: string }[] {
  const byCategory: Record<AffixCategory, Affix[]> = { damage: [], stamina: [], fp: [] }
  const passthrough: Affix[] = []
  for (const a of affixes) {
    const cat = affixCategory(a)
    if (cat) byCategory[cat].push(a)
    else passthrough.push(a)
  }

  const out: { id: string; label: string }[] = passthrough.map(a => ({ id: a.id, label: a.label }))

  if (byCategory.damage.length > 0) {
    const mult = byCategory.damage.reduce((m, a) => m * (a.damage_mult ?? 1), 1)
    out.push({ id: byCategory.damage.map(a => a.id).join('+'), label: `+${Math.round((mult - 1) * 100)}% damage` })
  }
  if (byCategory.stamina.length > 0) {
    const mult = byCategory.stamina.reduce((m, a) => m * (a.stamina_mult ?? 1), 1)
    out.push({ id: byCategory.stamina.map(a => a.id).join('+'), label: `-${Math.round((1 - mult) * 100)}% stamina cost` })
  }
  if (byCategory.fp.length > 0) {
    const mult = byCategory.fp.reduce((m, a) => m * (a.fp_mult ?? 1), 1)
    out.push({ id: byCategory.fp.map(a => a.id).join('+'), label: `-${Math.round((1 - mult) * 100)}% mana cost` })
  }
  return out
}
