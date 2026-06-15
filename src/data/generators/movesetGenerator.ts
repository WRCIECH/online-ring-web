import type {
  GeneratedMoveset, MovesetVariant, WeaponClass, WeaponRarity, Step,
  AtomicOrigin, AtomicStage, StatKey, DamageType,
} from '../../types/game'
import type { ContentProductType } from '../contentProducts'
import {
  rollAtomicMove, toStep, calcStaminaCost,
  buildStatusBadge, NO_STATUS_BADGE, UNIFIED_STAGE_CHAIN,
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

const PRODUCT_NOUN: Record<ContentProductType, string> = {
  Plaintext:          'Draft',
  StructuredText:     'Article',
  IllustratedText:    'Feature',
  SingleGraphic:      'Visual',
  Carousel:           'Carousel',
  Infographic:        'Report',
  RawAudio:           'Voice',
  ProducedAudio:      'Podcast',
  ARollVideo:         'Clip',
  SlideshowVideo:     'Slideshow',
  Screencast:         'Tutorial',
  CinematicVideo:     'Film',
  MotionGraphics:     'Motion',
  LiveStream:         'Stream',
  MultimediaPage:     'Feature',
  BranchingNarrative: 'Story',
  AssetPack:          'Pack',
  CurationFeed:       'Digest',
  CommunitySpace:     'Community',
  InteractiveApp:     'App',
  _blank:             'Experiment',
}

const COMBO_SUFFIX: Record<number, string> = {
  2: 'Duo', 3: 'Trio', 4: 'Combo', 5: 'Barrage', 6: 'Cascade', 7: 'Onslaught',
}

// ── All origins for random selection ─────────────────────────────────────

const ALL_ORIGINS: AtomicOrigin[] = [
  'New', 'Commentary', 'Compression', 'Expansion',
  'Recycled', 'Remastered', 'Revamped', 'Reboot',
  'ZoomIn', 'ZoomOut', 'AudienceAlter',
]

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

// ── Stage start weights ───────────────────────────────────────────────────
// Mirrors real writing-time distribution: Research and Produce dominate;
// Outline, Glue, and Publish are comparatively quick.
// Order matches UNIFIED_STAGE_CHAIN: Research Outline Produce Glue Refine Publish
const STAGE_INDICES      = [0, 1, 2, 3, 4, 5]
const STAGE_START_WEIGHTS = [25, 10, 35, 10, 15, 5]

// ── Main roll function ────────────────────────────────────────────────────

export function rollMoveset(
  weaponClass: WeaponClass,
  rarity: WeaponRarity,
  forcedVariant?: MovesetVariant,
): GeneratedMoveset {
  const classDef = WEAPON_CLASSES[weaponClass]
  const dominantProduct = pick(classDef.supported_products) as ContentProductType

  const variantWeights: number[]   = [40, 25, 30, 5]
  const variants: MovesetVariant[] = ['Light', 'Heavy', 'Skill', 'Jump']
  const variant: MovesetVariant    = forcedVariant ?? pick(variants, variantWeights)

  const len   = rollComboLength(variant, rarity)
  const startIdx = pick(STAGE_INDICES, STAGE_START_WEIGHTS)
  let stageIdx = startIdx
  const chain: AtomicStage[] = []
  for (let i = 0; i < len; i++) {
    chain.push(UNIFIED_STAGE_CHAIN[stageIdx])
    if (i < len - 1 && stageIdx < UNIFIED_STAGE_CHAIN.length - 1 && Math.random() < 0.75) {
      stageIdx++
    }
  }

  const dominantOrigin = pick(ALL_ORIGINS)

  const primaryDmgType: DamageType | undefined = classDef.base_damage_types[0]

  // Build steps with product coherence (80% chance same product as previous step)
  let prevProduct: ContentProductType = dominantProduct
  const steps: Step[] = chain.map((stage, i) => {
    const product: ContentProductType = i === 0
      ? dominantProduct
      : Math.random() < 0.8 ? prevProduct : pick(classDef.supported_products) as ContentProductType
    prevProduct = product
    const dims = rollAtomicMove(stage, variant, product, dominantOrigin)
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

  const sampleMove = rollAtomicMove(chain[0] ?? 'Produce', variant, dominantProduct, dominantOrigin)
  const rawStamina = Math.round(
    scaledSteps.reduce((sum) => sum + calcStaminaCost(sampleMove), 0) * staMult
  )
  const totalStamina = Math.max(5, Math.round(rawStamina * classDef.stamina_mod))
  const totalFp = scaledSteps.length > 2 ? 3 : 0

  // Build name: "[TimeAdj] [DmgAdj] [ProductNoun]" + combo suffix for 2+ steps
  const timeLabel = dominantTimeLabel(scaledSteps)
  const timeAdj   = TIME_ADJ[timeLabel] ?? timeLabel
  const dmgAdj    = (primaryDmgType ? DMG_ADJ[primaryDmgType] : null) ?? 'Balanced'
  const noun      = PRODUCT_NOUN[dominantProduct]
  const combo     = COMBO_SUFFIX[scaledSteps.length] ?? ''
  const nameParts = [timeAdj, dmgAdj, noun, combo].filter(Boolean)
  const name      = nameParts.join(' ')

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
    dominant_product: dominantProduct,
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
    types: ['defense', 'block'], rarity: 'common', variant_type: 'Skill', weapon_class: weaponClass,
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
