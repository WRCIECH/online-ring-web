/**
 * atomicMove.ts
 *
 * Procedural building blocks for moveset steps.
 *
 * Responsibilities:
 *   - Dimension pools and weighted random selection
 *   - Consistency validation for AtomicDimensions
 *   - Step name generation from stage + product + origin
 *   - Stat calculations (damage, poise, stamina, FP, time)
 *   - Unified stage chain
 *   - Badge assembly — chip labels, details, and colors
 *
 * Source-of-truth for content-type, damage-type, and status
 * labels/details lives in contentDescriptions.ts; only badge
 * colors and workflow-stage descriptions are defined here.
 */

import type {
  AtomicDimensions, AtomicStage,
  AtomicTime, AtomicOrigin, MovesetVariant,
  Step, StepBadge, DamageType, StatusType,
} from '../../types/game'
import type { ContentProductType } from '../contentProducts'
import { CONTENT_ORIGIN_INFO, DMG_TYPE_INFO, STATUS_INFO, STAGE_INFO, PRODUCT_INFO } from '../contentDescriptions'

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(items: T[], weights?: number[]): T {
  if (!weights) return items[Math.floor(Math.random() * items.length)]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
  return items[items.length - 1]
}

// ── Dimension pools ───────────────────────────────────────────────────────────

const TIMES: AtomicTime[] = ['Micro', 'Short', 'Medium', 'Long', 'Deep']

const TIME_WEIGHTS: Record<MovesetVariant, number[]> = {
  Light: [2, 4, 3, 1, 0],
  Heavy: [0, 1, 2, 4, 3],
  Skill: [1, 3, 3, 2, 1],
  Jump:  [5, 3, 1, 0, 0],
}

// ── Consistency validation ────────────────────────────────────────────────────

export function validateConsistency(d: AtomicDimensions): boolean {
  if (d.stage === 'Publish' && (d.time_budget === 'Long' || d.time_budget === 'Deep')) return false
  return true
}

// ── Step name generation ──────────────────────────────────────────────────────

const STAGE_VERBS: Record<AtomicStage, string> = {
  Research:  'Find evidence, examples, and reference material',
  Outline:   'Map the full structure before you write a word',
  Produce:   'Write your first full draft — commit without stopping',
  Glue:      'Arrange and connect your pieces into a coherent whole',
  Refine:    'Cut the fat, tighten sentences, and elevate the writing',
  Publish:   'Put it out — finalise, format, and commit to publishing',
}

const PRODUCT_SUFFIX: Partial<Record<ContentProductType, string>> = {
  IllustratedText:    'with visuals',
  SingleGraphic:      'as a graphic',
  Carousel:           'as a carousel',
  Infographic:        'as an infographic',
  RawAudio:           'as audio',
  ProducedAudio:      'as produced audio',
  ARollVideo:         'as video',
  SlideshowVideo:     'as a slideshow',
  Screencast:         'as a screencast',
  CinematicVideo:     'as cinematic video',
  MotionGraphics:     'as motion graphics',
  LiveStream:         'for live stream',
  MultimediaPage:     'as a web feature',
  BranchingNarrative: 'as interactive content',
  AssetPack:          'as an asset pack',
  CurationFeed:       'as a curation',
  CommunitySpace:     'for community',
  InteractiveApp:     'as a tool/app',
}

const ORIGIN_MODIFIER: Partial<Record<AtomicOrigin, string>> = {
  Compression:   '— compress ruthlessly',
  Recycled:      '— remix from existing work',
  Remastered:    '— remix from existing work',
  Revamped:      '— remix from existing work',
  Reboot:        '— rebuild from scratch',
  ZoomIn:        '— zoom in on one element',
  ZoomOut:       '— zoom out to the bigger picture',
  AudienceAlter: '— reframe for a new audience',
  Commentary:    '— add your commentary',
}

export function generateStepName(d: AtomicDimensions): string {
  const verb   = STAGE_VERBS[d.stage]
  const suffix = PRODUCT_SUFFIX[d.product] ?? ''
  const mod    = ORIGIN_MODIFIER[d.content_origin] ?? ''
  return [verb, suffix, mod].filter(Boolean).join(' ')
}

// ── Stat tables ───────────────────────────────────────────────────────────────

const TIME_SECS:  Record<AtomicTime,   number> = { Micro:300,  Short:600,  Medium:900, Long:1500, Deep:2700 }
const TIME_DMG:   Record<AtomicTime,   number> = { Micro:1,    Short:2,    Medium:4,   Long:7,    Deep:12   }
const TIME_STA:   Record<AtomicTime,   number> = { Micro:2,    Short:4,    Medium:7,   Long:10,   Deep:18   }

const REMIX_ORIGINS: AtomicOrigin[] = [
  'Recycled','Remastered','Revamped','Reboot','ZoomIn','ZoomOut','AudienceAlter',
]
const ORIGIN_MULT: Partial<Record<AtomicOrigin, number>> = {
  Commentary: 0.9,  Compression: 0.6,
  Recycled: 0.7, Remastered: 0.7, Revamped: 0.7, Reboot: 0.7,
  ZoomIn: 0.7,   ZoomOut: 0.7,   AudienceAlter: 0.7,
}

// Stamina multiplier per product type, grouped by category
const PRODUCT_STA: Record<ContentProductType, number> = {
  // Text
  Plaintext:          1.0,
  StructuredText:     1.0,
  IllustratedText:    1.1,
  // Visual
  SingleGraphic:      0.85,
  Carousel:           1.0,
  Infographic:        1.15,
  // Audio
  RawAudio:           1.0,
  ProducedAudio:      1.2,
  // Video
  ARollVideo:         1.1,
  SlideshowVideo:     1.2,
  Screencast:         1.15,
  CinematicVideo:     1.5,
  MotionGraphics:     1.4,
  // Hybrid
  LiveStream:         1.1,
  MultimediaPage:     1.5,
  BranchingNarrative: 1.6,
  AssetPack:          1.3,
  CurationFeed:       0.9,
  CommunitySpace:     1.2,
  InteractiveApp:     1.7,
  // Exotic
  _blank:             1.0,
}

// ── Stat calculations ─────────────────────────────────────────────────────────

export function calcDamage(d: AtomicDimensions):      number { return Math.round(TIME_DMG[d.time_budget] * (ORIGIN_MULT[d.content_origin] ?? 1.0) * 10) }
export function calcPoiseDamage(d: AtomicDimensions): number { return Math.round(TIME_DMG[d.time_budget] * 1.5) }
export function calcStaminaCost(d: AtomicDimensions): number { return Math.round(TIME_STA[d.time_budget] * PRODUCT_STA[d.product]) }
export function calcStepTime(d: AtomicDimensions):    number { return TIME_SECS[d.time_budget] }

export function calcFpCost(d: AtomicDimensions): number {
  const base = (d.content_origin === 'Compression'        ? 5 : 0) +
               (REMIX_ORIGINS.includes(d.content_origin)   ? 3 : 0)
  const deep = (d.time_budget === 'Deep' && base === 0)    ? 3 : 0
  return base + deep
}

// ── Unified stage chain ───────────────────────────────────────────────────────

export const UNIFIED_STAGE_CHAIN: AtomicStage[] =
  ['Research', 'Outline', 'Produce', 'Glue', 'Refine', 'Publish']

// ── Roll function ─────────────────────────────────────────────────────────────

export function rollAtomicMove(
  stage: AtomicStage,
  variant: MovesetVariant,
  dominantProduct: ContentProductType,
  dominantOrigin: AtomicOrigin
): AtomicDimensions {
  const timeWeights = TIME_WEIGHTS[variant]
  for (let i = 0; i < 20; i++) {
    const time_budget = pick(TIMES, timeWeights)
    const dim: AtomicDimensions = {
      product: dominantProduct, stage,
      time_budget, content_origin: dominantOrigin
    }
    if (validateConsistency(dim)) return dim
  }
  // Guaranteed-valid fallback
  return { product: 'Plaintext', stage: 'Produce',
           time_budget: 'Medium', content_origin: 'New' }
}

// ── Badge colors ──────────────────────────────────────────────────────────────
// Labels and details for origins, damage types, and statuses come from
// contentDescriptions.ts.  Only colors and workflow-specific (stage/product)
// details are defined here.

const STAGE_BADGE_COLOR: Record<AtomicStage, string> = {
  Research:  '#5599dd',
  Outline:   '#44aaaa',
  Produce:   '#cc9933',
  Glue:      '#669966',
  Refine:    '#7799bb',
  Publish:   '#66aa55',
}

// Badge color grouped by product category
const PRODUCT_BADGE_COLOR: Record<ContentProductType, string> = {
  // Text — grey family
  Plaintext:          '#888888',
  StructuredText:     '#aaaaaa',
  IllustratedText:    '#9999bb',
  // Visual — cyan family
  SingleGraphic:      '#44aacc',
  Carousel:           '#33bbdd',
  Infographic:        '#22ccee',
  // Audio — purple family
  RawAudio:           '#9966cc',
  ProducedAudio:      '#bb44cc',
  // Video — red family
  ARollVideo:         '#cc4444',
  SlideshowVideo:     '#dd5533',
  Screencast:         '#cc5566',
  CinematicVideo:     '#dd3333',
  MotionGraphics:     '#cc3355',
  // Hybrid — green family
  LiveStream:         '#44aa77',
  MultimediaPage:     '#55bb66',
  BranchingNarrative: '#66cc55',
  AssetPack:          '#77bb44',
  CurationFeed:       '#88aa33',
  CommunitySpace:     '#44bb88',
  InteractiveApp:     '#33ccaa',
  // Exotic
  _blank:             '#cc44aa',
}

const ORIGIN_BADGE_COLOR: Record<AtomicOrigin, string> = {
  New:           '#cc9933',
  Compression:   '#cc7733',
  Expansion:     '#558844',
  Recycled:      '#449988',
  Remastered:    '#4466bb',
  Revamped:      '#775599',
  Reboot:        '#bb3333',
  ZoomIn:        '#334499',
  ZoomOut:       '#4488aa',
  AudienceAlter: '#996677',
  Commentary:    '#bb8833',
}

const DMG_TYPE_BADGE_COLOR: Record<DamageType, string> = {
  standard:  '#888888',
  strike:    '#cc9944',
  slash:     '#cc4444',
  pierce:    '#44aacc',
  lightning: '#ccbb33',
  fire:      '#cc5522',
  magic:     '#7744cc',
  holy:      '#ccaa44',
  occult:    '#8833aa',
  grafting:  '#448833',
  poison:    '#557733',
}

const STATUS_BADGE_COLOR: Record<StatusType, string> = {
  bleed:        '#dd4455',
  scarlet_rot:  '#bb3333',
  frostbite:    '#44ccee',
  madness:      '#ee5544',
  sleep:        '#9988cc',
  death_blight: '#8833bb',
  glintstone:   '#4488ff',
  frenzy_flame: '#ffaa22',
  devotion:     '#ee6688',
  yearning:     '#ddaa33',
  dread:        '#336688',
  murmur:       '#556677',
  grace:        '#88cc66',
}

// ── Badge assembly ────────────────────────────────────────────────────────────

/** Builds the first 4 badges for a step. The 5th (status) is injected by movesetGenerator. */
export function buildBadges(d: AtomicDimensions, damageType?: DamageType): StepBadge[] {
  const dmgKey      = damageType ?? 'standard'
  const stageInfo   = STAGE_INFO[d.stage]
  const productInfo = PRODUCT_INFO[d.product]
  const originInfo  = CONTENT_ORIGIN_INFO[d.content_origin]
  const dmgInfo     = DMG_TYPE_INFO[dmgKey]
  return [
    // 1. Stage — what workflow phase this step belongs to
    { label: stageInfo.badge_label,   detail: stageInfo.detail,   color: STAGE_BADGE_COLOR[d.stage]      },
    // 2. Product — what content format is being produced
    { label: productInfo.badge_label, detail: productInfo.detail, color: PRODUCT_BADGE_COLOR[d.product]  },
    // 3. Content origin — new vs derivative vs recontextualised
    { label: originInfo.badge_label,  detail: originInfo.detail,  color: ORIGIN_BADGE_COLOR[d.content_origin] },
    // 4. Damage type — the content style that powers this move
    { label: dmgInfo.badge_label,     detail: dmgInfo.detail,     color: DMG_TYPE_BADGE_COLOR[dmgKey]    },
  ]
}

export function buildStatusBadge(statusType: StatusType): StepBadge {
  const info = STATUS_INFO[statusType]
  return { label: info.badge_label, detail: info.detail, color: STATUS_BADGE_COLOR[statusType] }
}

export const NO_STATUS_BADGE: StepBadge = {
  label:  'No Status',
  detail: 'This weapon carries no emotional status effect. Damage and stamina are its only tools.',
  color:  '#556677',
}

// ── Step factory ──────────────────────────────────────────────────────────────

export function toStep(d: AtomicDimensions, damageType?: DamageType): Step {
  return {
    name:         generateStepName(d),
    time:         calcStepTime(d),
    base_damage:  calcDamage(d),
    poise_damage: calcPoiseDamage(d),
    stage:        d.stage,
    badges:       buildBadges(d, damageType),
    ...(damageType ? { damage_type: damageType } : {}),
  }
}
