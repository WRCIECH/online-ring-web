import type {
  AtomicDimensions, AtomicMedium, AtomicMode, AtomicStage,
  AtomicTime, AtomicPub, AtomicOrigin, AtomicPlanning, MovesetVariant, Step, DamageType,
} from '../../types/game'

// ── Weighted random helper ────────────────────────────────────────────────

function pick<T>(items: T[], weights?: number[]): T {
  if (!weights) return items[Math.floor(Math.random() * items.length)]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]; if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// ── Dimension pools ───────────────────────────────────────────────────────

const TIMES: AtomicTime[] = ['Micro','Short','Medium','Long','Deep']

const TIME_WEIGHTS: Record<MovesetVariant, number[]> = {
  Light: [2, 4, 3, 1, 0],
  Heavy: [0, 1, 2, 4, 3],
  Skill: [1, 3, 3, 2, 1],
  Jump:  [5, 3, 1, 0, 0],
}

// ── Consistency validation ────────────────────────────────────────────────

export function validateConsistency(d: AtomicDimensions): boolean {
  if (d.cognitive_mode === 'Consuming' && d.stage !== 'Research') return false
  if (d.cognitive_mode === 'Consuming' && d.publication === 'public') return false
  if (d.cognitive_mode === 'Commentary' && d.stage !== 'React' && d.stage !== 'Connect') return false
  if (d.cognitive_mode === 'Compressing' && d.content_origin === 'New') return false
  if (d.cognitive_mode === 'Expanding'   && d.content_origin === 'New') return false
  if (d.cognitive_mode === 'Remixing' &&
      !['Recycled','Remastered','Revamped','Reboot'].includes(d.content_origin)) return false
  if (d.stage === 'Publish' && (d.time_budget === 'Long' || d.time_budget === 'Deep')) return false
  return true
}

// ── Step name generation ──────────────────────────────────────────────────

const STAGE_VERBS: Partial<Record<AtomicStage, string>> = {
  Ideate:    'Brainstorm ideas',
  Research:  'Study and research reference material',
  Outline:   'Write an outline',
  Generate:  'Write and generate content',
  Glue:      'Order and structure your content',
  Refine:    'Refine and edit',
  Publish:   'Publish your piece',
  Repurpose: 'Repurpose existing content',
  React:     'Write a response',
  Connect:   'Reach out or synthesise',
}

const MEDIUM_SUFFIX: Partial<Record<AtomicMedium, string>> = {
  Audio:   'as audio/voice',
  Video:   'as video',
  Image:   'as an image/visual',
  Outline: 'in outline form',
  Hybrid:  'across formats',
}

const MODE_MODIFIER: Partial<Record<AtomicMode, string>> = {
  Compressing: '— compress ruthlessly',
  Expanding:   '— expand and deepen',
  Remixing:    '— remix from existing work',
  Connecting:  '— connect ideas together',
  Commentary:  '— add your commentary',
}

export function generateStepName(d: AtomicDimensions): string {
  const verb   = STAGE_VERBS[d.stage]    ?? 'Complete a step'
  const suffix = MEDIUM_SUFFIX[d.medium] ?? ''
  const mod    = MODE_MODIFIER[d.cognitive_mode] ?? ''
  return [verb, suffix, mod].filter(Boolean).join(' ')
}

// ── Stat calculation ──────────────────────────────────────────────────────

const TIME_DMG: Record<AtomicTime, number> = { Micro:1, Short:2, Medium:4, Long:7, Deep:12 }
const MODE_MULT: Record<AtomicMode, number> = {
  Creating:1.0, Remixing:0.7, Commentary:0.9, Connecting:1.1,
  Compressing:0.6, Expanding:0.8, Consuming:0.4,
}
const PUB_MULT: Record<AtomicPub, number> = {
  just_work:0.4, private:0.6, draft_published:1.0, public:1.3,
}
const TIME_STA: Record<AtomicTime, number> = { Micro:2, Short:4, Medium:7, Long:10, Deep:18 }
const MEDIUM_STA: Record<AtomicMedium, number> = {
  Writing:1.0, Audio:1.1, Video:1.3, Image:0.9, Design:1.2, Outline:0.6, Hybrid:1.4,
}
const TIME_SECS: Record<AtomicTime, number> = {
  Micro:300, Short:600, Medium:900, Long:1500, Deep:2700,
}

export function calcDamage(d: AtomicDimensions): number {
  return Math.round(TIME_DMG[d.time_budget] * MODE_MULT[d.cognitive_mode] * PUB_MULT[d.publication] * 10)
}

export function calcStaminaCost(d: AtomicDimensions): number {
  return Math.round(TIME_STA[d.time_budget] * MEDIUM_STA[d.medium])
}

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

export function calcPoiseDamage(d: AtomicDimensions): number {
  return Math.round(TIME_DMG[d.time_budget] * 1.5)
}

export function calcStepTime(d: AtomicDimensions): number {
  return TIME_SECS[d.time_budget]
}

// ── Stage chains per archetype ────────────────────────────────────────────

export type MovesetArchetype =
  | 'long_form' | 'micro' | 'commentary' | 'research'
  | 'compression' | 'remix' | 'storytelling' | 'hot_take'
  | 'async' | 'editing'

const STAGE_CHAINS: Record<MovesetArchetype, AtomicStage[][]> = {
  long_form:    [['Outline','Generate','Refine','Publish'], ['Ideate','Outline','Generate','Refine','Publish']],
  micro:        [['Ideate','Publish'], ['Generate','Publish']],
  commentary:   [['Research','React','Publish'], ['Research','React','Glue','Publish']],
  research:     [['Research','Glue','Publish'], ['Research','Outline','Generate','Publish']],
  compression:  [['Generate','Refine','Publish'], ['Research','Refine','Publish']],
  remix:        [['Research','Repurpose','Publish'], ['Repurpose','Refine','Publish']],
  storytelling: [['Ideate','Outline','Generate','Glue','Refine','Publish']],
  hot_take:     [['Generate','Publish'], ['Ideate','Generate','Publish']],
  async:        [['Outline','Generate','Publish'], ['Generate','Refine','Publish']],
  editing:      [['Research','Refine','Publish'], ['Generate','Refine','Repurpose','Publish']],
}

export function pickStageChain(archetype: MovesetArchetype, comboLength: number): AtomicStage[] {
  const chains = STAGE_CHAINS[archetype] ?? STAGE_CHAINS.long_form
  let best = chains[0]
  for (const chain of chains) {
    if (Math.abs(chain.length - comboLength) < Math.abs(best.length - comboLength)) best = chain
  }
  return best
}

// ── Mode by stage ─────────────────────────────────────────────────────────

function modeForStage(stage: AtomicStage, archetype: MovesetArchetype): AtomicMode {
  switch (stage) {
    case 'Research': return 'Consuming'
    case 'React':    return 'Commentary'
    case 'Glue':     return 'Connecting'
    case 'Connect':  return 'Connecting'
    case 'Repurpose':
      return pick(['Remixing','Compressing'] as AtomicMode[], [3, 1])
    case 'Refine':
      if (archetype === 'compression' || archetype === 'editing') return 'Compressing'
      if (archetype === 'remix') return 'Remixing'
      return 'Creating'
    default: return 'Creating'
  }
}

// ── Main roll function ────────────────────────────────────────────────────

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
  let attempts = 0
  while (attempts < 20) {
    attempts++
    const time_budget    = pick(TIMES, timeWeights)
    const cognitive_mode = modeForStage(stage, archetype)

    const publication: AtomicPub =
      stage === 'Publish' || stage === 'Repurpose' ? targetPub
      : stage === 'Refine' ? pick(['draft_published','private'] as AtomicPub[], [2,1])
      : 'just_work'

    const dim: AtomicDimensions = {
      medium:         dominantMedium,
      cognitive_mode,
      stage,
      time_budget,
      publication,
      content_origin: dominantOrigin,
      planning:       dominantPlanning,
    }
    if (validateConsistency(dim)) return dim
  }
  return {
    medium: 'Writing', cognitive_mode: 'Creating', stage: 'Generate',
    time_budget: 'Medium', publication: 'just_work',
    content_origin: 'New', planning: 'Planned',
  }
}

export function toStep(d: AtomicDimensions, damageType?: DamageType): Step {
  return {
    name:         generateStepName(d),
    time:         calcStepTime(d),
    base_damage:  calcDamage(d),
    poise_damage: calcPoiseDamage(d),
    ...(damageType ? { damage_type: damageType } : {}),
  }
}
