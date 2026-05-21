import type {
  GeneratedMoveset, MovesetVariant, WeaponClass, WeaponRarity, Step,
} from '../../types/game'
import {
  rollAtomicMove, pickStageChain, toStep, calcStaminaCost,
  type MovesetArchetype,
} from './atomicMove'
import type { AtomicMedium, AtomicOrigin, AtomicPlanning, AtomicPub } from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'
import { registerMoveset } from '../movesets'

// ── Helpers ───────────────────────────────────────────────────────────────

function uid(): string {
  return 'm_' + Math.random().toString(36).slice(2, 10)
}

function pick<T>(items: T[], weights?: number[]): T {
  if (!weights || !weights.length) return items[Math.floor(Math.random() * items.length)]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
  return items[items.length - 1]
}

// ── Rarity multipliers ────────────────────────────────────────────────────

const RARITY_DMG_MULT: Record<WeaponRarity, number> = {
  common: 1.0, magic: 1.1, rare: 1.2, epic: 1.35, legendary: 1.5,
}
const RARITY_STA_MULT: Record<WeaponRarity, number> = {
  common: 1.0, magic: 0.95, rare: 0.9, epic: 0.85, legendary: 0.75,
}

// ── Combo length by variant & rarity ─────────────────────────────────────

function comboLength(variant: MovesetVariant, rarity: WeaponRarity): number {
  const base: Record<MovesetVariant, [number, number]> = {
    Light: [2, 3], Heavy: [3, 5], Skill: [2, 4], Jump: [1, 2],
  }
  const [min, max] = base[variant]
  const rarityBonus = rarity === 'epic' || rarity === 'legendary' ? 1 : 0
  return Math.min(max, min + Math.floor(Math.random() * (max - min + 1)) + rarityBonus)
}

// ── Dominant axis picking ─────────────────────────────────────────────────

const ARCHETYPE_MEDIUM: Record<MovesetArchetype, AtomicMedium[]> = {
  long_form:    ['Writing','Writing','Audio'],
  micro:        ['Writing','Image','Writing'],
  commentary:   ['Writing','Writing','Video'],
  research:     ['Writing','Audio','Outline'],
  compression:  ['Writing','Writing','Outline'],
  remix:        ['Writing','Video','Hybrid'],
  storytelling: ['Writing','Video','Audio'],
  hot_take:     ['Writing','Writing','Audio'],
  async:        ['Writing','Audio','Writing'],
  editing:      ['Writing','Outline','Writing'],
}

const ARCHETYPE_PLANNING: Record<MovesetArchetype, AtomicPlanning> = {
  long_form: 'Planned', micro: 'Spontaneous', commentary: 'Spontaneous',
  research: 'Planned', compression: 'Planned', remix: 'Planned',
  storytelling: 'Planned', hot_take: 'Spontaneous', async: 'Scheduled', editing: 'Planned',
}

const ARCHETYPE_ORIGIN: Record<MovesetArchetype, AtomicOrigin> = {
  long_form: 'New', micro: 'New', commentary: 'New',
  research: 'New', compression: 'Compression', remix: 'Recycled',
  storytelling: 'New', hot_take: 'New', async: 'New', editing: 'Compression',
}

const RARITY_PUB: Record<WeaponRarity, AtomicPub> = {
  common: 'private', magic: 'draft_published', rare: 'public', epic: 'public', legendary: 'public',
}



// ── Main roll function ────────────────────────────────────────────────────

export function rollMoveset(
  weaponClass: WeaponClass,
  rarity: WeaponRarity,
  forcedVariant?: MovesetVariant,
): GeneratedMoveset {
  const classDef = WEAPON_CLASSES[weaponClass]
  const archetype: MovesetArchetype = pick(classDef.preferred_archetypes)

  const variantWeights = [40, 25, 30, 5] // Light, Heavy, Skill, Jump
  const variants: MovesetVariant[] = ['Light','Heavy','Skill','Jump']
  const variant: MovesetVariant = forcedVariant ?? pick(variants, variantWeights)

  const len    = comboLength(variant, rarity)
  const chain  = pickStageChain(archetype, len).slice(0, len)

  const mediums    = ARCHETYPE_MEDIUM[archetype]
  const dominantMedium  = pick(mediums) as AtomicMedium
  const dominantPlanning = ARCHETYPE_PLANNING[archetype]
  const dominantOrigin   = ARCHETYPE_ORIGIN[archetype]
  const targetPub        = RARITY_PUB[rarity]

  const steps: Step[] = chain.map(stage =>
    toStep(rollAtomicMove(stage, variant, archetype, dominantMedium, dominantPlanning, dominantOrigin, targetPub))
  )

  // Apply rarity multipliers
  const dmgMult = RARITY_DMG_MULT[rarity]
  const staMult = RARITY_STA_MULT[rarity]

  const scaledSteps = steps.map(s => ({
    ...s,
    base_damage:  Math.round(s.base_damage * dmgMult),
    poise_damage: Math.round(s.poise_damage * dmgMult),
  }))

  const sampleMove = rollAtomicMove(chain[0] ?? 'Draft', variant, archetype, dominantMedium, dominantPlanning, dominantOrigin, targetPub)
  const totalStamina = Math.round(
    scaledSteps.reduce((sum) => sum + calcStaminaCost(sampleMove), 0) * staMult
  )
  const totalFp = scaledSteps.length > 2 ? 3 : 0

  const archetypeLabel = archetype.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const variantLabel = variant.toLowerCase()
  const name = `${archetypeLabel} (${variantLabel})`

  // Primary scaling stat = first key in the weapon class scaling map
  const primaryStat = (Object.keys(classDef.scaling)[0] ?? 'STR') as import('../../types/game').StatKey

  const id = uid()
  const moveset: GeneratedMoveset = {
    id,
    name,
    scaling_stat: primaryStat,
    stamina_cost: Math.max(5, totalStamina),
    fp_cost: totalFp,
    types: [weaponClass, variant.toLowerCase(), rarity],
    steps: scaledSteps,
    rarity,
    variant_type: variant,
    weapon_class: weaponClass,
    pipeline: { all_steps: [], unlocked_at: [], drops_at: [] },
  }

  registerMoveset(moveset)
  return moveset
}

// Defense movesets — very short reactive tasks
export function rollBlockMoveset(weaponClass: WeaponClass): GeneratedMoveset {
  const id = uid()
  const m: GeneratedMoveset = {
    id, name: 'Block', scaling_stat: 'END', stamina_cost: 0, fp_cost: 0,
    types: ['defense','block'], rarity: 'common', variant_type: 'Skill', weapon_class: weaponClass,
    steps: [{ name: 'Write 3 words describing what you are building right now', time: 25, base_damage: 0, poise_damage: 0 }],
    pipeline: { all_steps: [], unlocked_at: [], drops_at: [] },
  }
  registerMoveset(m)
  return m
}


/** Return active steps for a moveset at the given level (1-10). */
// Pipeline level-gating is removed — always return all steps
export function getActiveSteps(moveset: GeneratedMoveset | { steps: Step[] }): Step[] {
  return moveset.steps
}
