/**
 * atomicMove.ts
 *
 * Procedural building blocks for moveset steps.
 *
 * Responsibilities:
 *   - Dimension pools and weighted random selection
 *   - Consistency validation for AtomicDimensions
 *   - Step name generation from stage + medium + mode
 *   - Stat calculations (damage, poise, stamina, FP, time)
 *   - Stage chains per archetype
 *   - Badge assembly — chip labels, details, and colors
 *
 * Source-of-truth for content-type, damage-type, and status
 * labels/details lives in contentDescriptions.ts; only badge
 * colors and workflow-stage/medium descriptions are defined here.
 */

import type {
  AtomicDimensions, AtomicMedium, AtomicMode, AtomicStage,
  AtomicTime, AtomicPub, AtomicOrigin, AtomicPlanning, MovesetVariant,
  Step, StepBadge, DamageType, StatusType,
} from '../../types/game'
import { CONTENT_ORIGIN_INFO, DMG_TYPE_INFO, STATUS_INFO, STAGE_INFO, MEDIUM_INFO } from '../contentDescriptions'

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
  if (d.cognitive_mode === 'Consuming'   && d.stage !== 'Research')                                             return false
  if (d.cognitive_mode === 'Consuming'   && d.publication === 'public')                                         return false
  if (d.cognitive_mode === 'Commentary'  && d.stage !== 'Generate')                                             return false
  if (d.cognitive_mode === 'Compressing' && d.content_origin === 'New')                                         return false
  if (d.cognitive_mode === 'Expanding'   && d.content_origin === 'New')                                         return false
  if (d.cognitive_mode === 'Remixing'    &&
      !['Recycled','Remastered','Revamped','Reboot','ZoomIn','ZoomOut','AudienceAlter']
        .includes(d.content_origin))                                                                             return false
  if (d.stage === 'Publish' && (d.time_budget === 'Long' || d.time_budget === 'Deep'))                          return false
  return true
}

// ── Step name generation ──────────────────────────────────────────────────────

const STAGE_VERBS: Record<AtomicStage, string> = {
  Ideate:    'Brainstorm every possible angle, hook, and format',
  Research:  'Find evidence, examples, and reference material',
  Outline:   'Map the full structure before you write a word',
  Generate:  'Write your first full draft — commit without stopping',
  Glue:      'Arrange and connect your pieces into a coherent whole',
  Refine:    'Cut the fat, tighten sentences, and elevate the writing',
  Publish:   'Put it out — finalise, format, and commit to publishing',
}

const MEDIUM_SUFFIX: Partial<Record<AtomicMedium, string>> = {
  Audio:  'as audio/voice',
  Video:  'as video',
  Image:  'as an image/visual',
  Hybrid: 'across formats',
}

const MODE_MODIFIER: Partial<Record<AtomicMode, string>> = {
  Compressing: '— compress ruthlessly',
  Expanding:   '— expand and deepen',
  Remixing:    '— remix from existing work',
  Connecting:  '— connect ideas together',
  Commentary:  '— add your commentary',
}

export function generateStepName(d: AtomicDimensions): string {
  const verb   = STAGE_VERBS[d.stage]
  const suffix = MEDIUM_SUFFIX[d.medium] ?? ''
  const mod    = MODE_MODIFIER[d.cognitive_mode] ?? ''
  return [verb, suffix, mod].filter(Boolean).join(' ')
}

// ── Stat tables ───────────────────────────────────────────────────────────────

const TIME_SECS:  Record<AtomicTime,   number> = { Micro:300,  Short:600,  Medium:900, Long:1500, Deep:2700 }
const TIME_DMG:   Record<AtomicTime,   number> = { Micro:1,    Short:2,    Medium:4,   Long:7,    Deep:12   }
const TIME_STA:   Record<AtomicTime,   number> = { Micro:2,    Short:4,    Medium:7,   Long:10,   Deep:18   }

const MODE_MULT:  Record<AtomicMode,   number> = {
  Creating:1.0, Remixing:0.7, Commentary:0.9, Connecting:1.1,
  Compressing:0.6, Expanding:0.8, Consuming:0.4,
}
const PUB_MULT:   Record<AtomicPub,    number> = {
  just_work:0.4, private:0.6, draft_published:1.0, public:1.3,
}
const MEDIUM_STA: Record<AtomicMedium, number> = {
  Writing:1.0, Audio:1.1, Video:1.3, Image:0.9, Hybrid:1.4,
}

// ── Stat calculations ─────────────────────────────────────────────────────────

export function calcDamage(d: AtomicDimensions):      number { return Math.round(TIME_DMG[d.time_budget] * MODE_MULT[d.cognitive_mode] * PUB_MULT[d.publication] * 10) }
export function calcPoiseDamage(d: AtomicDimensions): number { return Math.round(TIME_DMG[d.time_budget] * 1.5) }
export function calcStaminaCost(d: AtomicDimensions): number { return Math.round(TIME_STA[d.time_budget] * MEDIUM_STA[d.medium]) }
export function calcStepTime(d: AtomicDimensions):    number { return TIME_SECS[d.time_budget] }

export function calcFpCost(d: AtomicDimensions): number {
  const base =
    (d.cognitive_mode === 'Connecting'  ? 5 : 0) +
    (d.cognitive_mode === 'Compressing' ? 5 : 0) +
    (d.cognitive_mode === 'Expanding'   ? 3 : 0) +
    (d.cognitive_mode === 'Remixing'    ? 3 : 0)
  const deep = (d.time_budget === 'Deep' &&
    !['Connecting','Compressing','Expanding','Remixing'].includes(d.cognitive_mode)) ? 3 : 0
  return base + deep
}

// ── Archetypes and stage chains ───────────────────────────────────────────────

export type MovesetArchetype =
  | 'long_form' | 'micro' | 'commentary' | 'research'
  | 'compression' | 'remix' | 'storytelling' | 'hot_take'
  | 'async' | 'editing'

const STAGE_CHAINS: Record<MovesetArchetype, AtomicStage[]> = {
  long_form:    ['Ideate','Outline','Generate','Refine','Publish'],
  micro:        ['Ideate','Generate','Publish'],
  commentary:   ['Research','Generate','Glue','Publish'],
  research:     ['Research','Outline','Generate','Publish'],
  compression:  ['Research','Generate','Refine','Publish'],
  remix:        ['Research','Generate','Refine','Publish'],
  storytelling: ['Ideate','Outline','Generate','Glue','Refine','Publish'],
  hot_take:     ['Ideate','Generate','Publish'],
  async:        ['Outline','Generate','Refine','Publish'],
  editing:      ['Research','Generate','Refine','Publish'],
}

export function pickStageChain(archetype: MovesetArchetype): AtomicStage[] {
  return STAGE_CHAINS[archetype] ?? STAGE_CHAINS.long_form
}

// ── Cognitive mode per stage ──────────────────────────────────────────────────

function modeForStage(stage: AtomicStage, archetype: MovesetArchetype): AtomicMode {
  switch (stage) {
    case 'Research':  return 'Consuming'
    case 'Glue':      return 'Connecting'
    case 'Generate':
      if (archetype === 'commentary') return 'Commentary'
      return 'Creating'
    case 'Refine':
      if (archetype === 'compression' || archetype === 'editing') return 'Compressing'
      if (archetype === 'remix')                                   return 'Remixing'
      return 'Creating'
    default:          return 'Creating'
  }
}

// ── Roll function ─────────────────────────────────────────────────────────────

export function rollAtomicMove(
  stage: AtomicStage,
  variant: MovesetVariant,
  archetype: MovesetArchetype,
  dominantMedium: AtomicMedium,
  dominantPlanning: AtomicPlanning,
  dominantOrigin: AtomicOrigin,
  targetPub: AtomicPub,
): AtomicDimensions {
  const timeWeights = TIME_WEIGHTS[variant]
  for (let i = 0; i < 20; i++) {
    const time_budget    = pick(TIMES, timeWeights)
    const cognitive_mode = modeForStage(stage, archetype)
    const publication: AtomicPub =
      stage === 'Publish' ? targetPub
      : stage === 'Refine' ? pick(['draft_published', 'private'] as AtomicPub[], [2, 1])
      : 'just_work'
    const dim: AtomicDimensions = {
      medium: dominantMedium, cognitive_mode, stage,
      time_budget, publication, content_origin: dominantOrigin, planning: dominantPlanning,
    }
    if (validateConsistency(dim)) return dim
  }
  // Guaranteed-valid fallback
  return { medium:'Writing', cognitive_mode:'Creating', stage:'Generate',
           time_budget:'Medium', publication:'just_work', content_origin:'New', planning:'Planned' }
}

// ── Badge colors ──────────────────────────────────────────────────────────────
// Labels and details for origins, damage types, and statuses come from
// contentDescriptions.ts.  Only colors and workflow-specific (stage/medium)
// details are defined here.

const STAGE_BADGE_COLOR: Record<AtomicStage, string> = {
  Ideate:    '#9977cc',
  Research:  '#5599dd',
  Outline:   '#44aaaa',
  Generate:  '#cc9933',
  Glue:      '#669966',
  Refine:    '#7799bb',
  Publish:   '#66aa55',
}

const MEDIUM_BADGE_COLOR: Record<AtomicMedium, string> = {
  Writing: '#999999',
  Audio:   '#9966cc',
  Video:   '#cc4444',
  Image:   '#44aacc',
  Hybrid:  '#88aa44',
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
  const dmgKey     = damageType ?? 'standard'
  const stageInfo  = STAGE_INFO[d.stage]
  const mediumInfo = MEDIUM_INFO[d.medium]
  const originInfo = CONTENT_ORIGIN_INFO[d.content_origin]
  const dmgInfo    = DMG_TYPE_INFO[dmgKey]
  return [
    // 1. Stage — what workflow phase this step belongs to
    { label: stageInfo.badge_label,  detail: stageInfo.detail,  color: STAGE_BADGE_COLOR[d.stage]  },
    // 2. Medium — what format or channel is being used
    { label: mediumInfo.badge_label, detail: mediumInfo.detail, color: MEDIUM_BADGE_COLOR[d.medium] },
    // 3. Content origin — new vs derivative vs recontextualised
    { label: originInfo.badge_label, detail: originInfo.detail, color: ORIGIN_BADGE_COLOR[d.content_origin] },
    // 4. Damage type — the content style that powers this move
    { label: dmgInfo.badge_label,    detail: dmgInfo.detail,    color: DMG_TYPE_BADGE_COLOR[dmgKey] },
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
