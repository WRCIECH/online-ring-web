import type {
  GeneratedMoveset, MovesetVariant, WeaponClass, WeaponRarity, Step,
  AtomicMedium, AtomicOrigin, AtomicPlanning, AtomicPub, StatKey, DamageType,
} from '../../types/game'
import {
  rollAtomicMove, pickStageChain, toStep, calcStaminaCost,
  buildStatusBadge, NO_STATUS_BADGE,
  type MovesetArchetype,
} from './atomicMove'
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

// ── Combo length — new distribution per weapons_new.md ───────────────────

// Base weights: 1=20%, 2=40%, 3=30%, 4=9%, 5=0.99%, 6=0.009%, 7=0.001%
const COMBO_BASE_WEIGHTS = [200, 400, 300, 90, 9.9, 0.09, 0.01]
const COMBO_LENGTHS      = [1, 2, 3, 4, 5, 6, 7]

const VARIANT_MAX: Record<MovesetVariant, number> = {
  Light: 3, Heavy: 5, Skill: 4, Jump: 2,
}

function rollComboLength(variant: MovesetVariant, rarity: WeaponRarity): number {
  const rarityBonus = rarity === 'epic' || rarity === 'legendary' ? 1 : 0
  const max = Math.min(7, VARIANT_MAX[variant] + rarityBonus)
  // Roll from base distribution, clamped to max
  const available = COMBO_LENGTHS.slice(0, max)
  const weights   = COMBO_BASE_WEIGHTS.slice(0, max)
  return pick(available, weights)
}

// ── Name component maps ───────────────────────────────────────────────────

const TIME_ADJ: Record<string, string> = {
  Micro: 'Flash', Short: 'Quick', Medium: 'Steady', Long: 'Extended', Deep: 'Deep',
}

const DMG_ADJ: Partial<Record<string, string>> = {
  standard: 'Balanced', strike: 'Striking', slash: 'Slashing', pierce: 'Piercing',
  lightning: 'Electric', fire: 'Fiery', magic: 'Arcane', holy: 'Sacred',
  occult: 'Occult', grafting: 'Grafted', poison: 'Venomous',
}

const ARCHETYPE_NOUN: Record<MovesetArchetype, string> = {
  long_form:    'Manifesto',
  micro:        'Burst',
  commentary:   'Response',
  research:     'Report',
  compression:  'Digest',
  remix:        'Remix',
  storytelling: 'Chronicle',
  hot_take:     'Opinion',
  async:        'Dispatch',
  editing:      'Revision',
}

const COMBO_SUFFIX: Record<number, string> = {
  2: 'Duo', 3: 'Trio', 4: 'Combo', 5: 'Barrage', 6: 'Cascade', 7: 'Onslaught',
}

// ── Dominant axis picking ─────────────────────────────────────────────────

const ARCHETYPE_MEDIUM: Record<MovesetArchetype, AtomicMedium[]> = {
  long_form:    ['Writing','Writing','Audio'],
  micro:        ['Writing','Image','Writing'],
  commentary:   ['Writing','Writing','Video'],
  research:     ['Writing','Audio','Writing'],
  compression:  ['Writing','Writing','Writing'],
  remix:        ['Writing','Video','Hybrid'],
  storytelling: ['Writing','Video','Audio'],
  hot_take:     ['Writing','Writing','Audio'],
  async:        ['Writing','Audio','Writing'],
  editing:      ['Writing','Writing','Writing'],
}

const ARCHETYPE_PLANNING: Record<MovesetArchetype, AtomicPlanning> = {
  long_form: 'Planned', micro: 'Spontaneous', commentary: 'Spontaneous',
  research: 'Planned', compression: 'Planned', remix: 'Planned',
  storytelling: 'Planned', hot_take: 'Spontaneous', async: 'Scheduled', editing: 'Planned',
}

const ARCHETYPE_ORIGIN: Record<MovesetArchetype, AtomicOrigin> = {
  long_form:    'New',
  micro:        'New',
  commentary:   'Commentary',
  research:     'New',
  compression:  'Compression',
  remix:        'Recycled',
  storytelling: 'New',
  hot_take:     'New',
  async:        'New',
  editing:      'ZoomIn',
}

const RARITY_PUB: Record<WeaponRarity, AtomicPub> = {
  common: 'private', magic: 'draft_published', rare: 'public', epic: 'public', legendary: 'public',
}

// ── Time label from average step time ────────────────────────────────────

function dominantTimeLabel(steps: Step[]): string {
  if (!steps.length) return 'Short'
  const avg = steps.reduce((s, step) => s + step.time, 0) / steps.length
  if (avg <= 300)  return 'Micro'
  if (avg <= 600)  return 'Short'
  if (avg <= 900)  return 'Medium'
  if (avg <= 1500) return 'Long'
  return 'Deep'
}

// ── Main roll function ────────────────────────────────────────────────────

export function rollMoveset(
  weaponClass: WeaponClass,
  rarity: WeaponRarity,
  forcedVariant?: MovesetVariant,
): GeneratedMoveset {
  const classDef  = WEAPON_CLASSES[weaponClass]
  const archetype: MovesetArchetype = pick(classDef.preferred_archetypes)

  const variantWeights: number[]    = [40, 25, 30, 5]
  const variants: MovesetVariant[]  = ['Light','Heavy','Skill','Jump']
  const variant: MovesetVariant     = forcedVariant ?? pick(variants, variantWeights)

  const len   = rollComboLength(variant, rarity)
  const chain = pickStageChain(archetype).slice(0, len)

  const mediumPool       = ARCHETYPE_MEDIUM[archetype]
  const dominantMedium   = pick(mediumPool) as AtomicMedium
  const dominantPlanning = ARCHETYPE_PLANNING[archetype]
  const dominantOrigin   = ARCHETYPE_ORIGIN[archetype]
  const targetPub        = RARITY_PUB[rarity]

  const primaryDmgType: DamageType | undefined = classDef.base_damage_types[0]

  // Build steps with medium coherence (80% chance same medium as previous step)
  let prevMedium: AtomicMedium = dominantMedium
  const steps: Step[] = chain.map((stage, i) => {
    const medium: AtomicMedium = i === 0
      ? dominantMedium
      : Math.random() < 0.8 ? prevMedium : (pick(mediumPool) as AtomicMedium)
    prevMedium = medium
    const dims = rollAtomicMove(stage, variant, archetype, medium, dominantPlanning, dominantOrigin, targetPub)
    return toStep(dims, primaryDmgType)
  })

  // Apply rarity multipliers to damage/poise
  const dmgMult = RARITY_DMG_MULT[rarity]
  const staMult = RARITY_STA_MULT[rarity]

  let scaledSteps = steps.map(s => ({
    ...s,
    base_damage:  Math.round(s.base_damage * dmgMult),
    poise_damage: Math.round(s.poise_damage * dmgMult),
  }))

  // Apply weapon class time_mod and stamina_mod
  if (classDef.time_mod !== 1.0) {
    scaledSteps = scaledSteps.map(s => ({
      ...s,
      time: Math.max(15, Math.round(s.time * classDef.time_mod)),
    }))
  }

  const sampleMove = rollAtomicMove(chain[0] ?? 'Produce', variant, archetype, dominantMedium, dominantPlanning, dominantOrigin, targetPub)
  const rawStamina = Math.round(
    scaledSteps.reduce((sum) => sum + calcStaminaCost(sampleMove), 0) * staMult
  )
  const totalStamina = Math.max(5, Math.round(rawStamina * classDef.stamina_mod))
  const totalFp = scaledSteps.length > 2 ? 3 : 0

  // Build name: "[TimeAdj] [DmgAdj] [ArchetypeNoun]" + combo suffix for 2+ steps
  const timeLabel  = dominantTimeLabel(scaledSteps)
  const timeAdj    = TIME_ADJ[timeLabel] ?? timeLabel
  const dmgAdj     = (primaryDmgType ? DMG_ADJ[primaryDmgType] : null) ?? 'Balanced'
  const noun       = ARCHETYPE_NOUN[archetype]
  const combo      = COMBO_SUFFIX[scaledSteps.length] ?? ''
  const nameParts  = [timeAdj, dmgAdj, noun, combo].filter(Boolean)
  const name       = nameParts.join(' ')

  const primaryStat = (Object.keys(classDef.scaling)[0] ?? 'STR') as StatKey

  // Infusion: Skill movesets carry the class's infused_scaling
  const infusion = (variant === 'Skill' && classDef.infused_scaling)
    ? classDef.infused_scaling
    : undefined

  // Status buildup: from inherent class status
  const status_buildup = classDef.inherent_status ?? undefined

  // Inject status badge (or no-status badge) into every step's badge array
  const statusBadge = status_buildup ? buildStatusBadge(status_buildup) : NO_STATUS_BADGE
  scaledSteps = scaledSteps.map(s => ({ ...s, badges: [...(s.badges ?? []), statusBadge] }))

  const id = uid()
  const moveset: GeneratedMoveset = {
    id,
    name,
    scaling_stat: primaryStat,
    stamina_cost: totalStamina,
    fp_cost: totalFp,
    types: [weaponClass, variant.toLowerCase(), rarity],
    steps: scaledSteps,
    rarity,
    variant_type: variant,
    weapon_class: weaponClass,
    pipeline: { all_steps: [], unlocked_at: [], drops_at: [] },
    primary_damage_type: primaryDmgType,
    content_origin: dominantOrigin,
    dominant_medium: dominantMedium,
    ...(infusion ? { infusion } : {}),
    ...(status_buildup ? { status_buildup } : {}),
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
export function getActiveSteps(moveset: GeneratedMoveset | { steps: Step[] }): Step[] {
  return moveset.steps
}
