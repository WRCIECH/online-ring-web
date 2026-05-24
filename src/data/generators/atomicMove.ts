import type {
  AtomicDimensions, AtomicMedium, AtomicMode, AtomicStage,
  AtomicTime, AtomicPub, AtomicOrigin, AtomicPlanning, MovesetVariant,
  Step, StepBadge, DamageType, StatusType,
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
      !['Recycled','Remastered','Revamped','Reboot','ZoomIn','ZoomOut','AudienceAlter'].includes(d.content_origin)) return false
  if (d.stage === 'Publish' && (d.time_budget === 'Long' || d.time_budget === 'Deep')) return false
  return true
}

// ── Step name generation ──────────────────────────────────────────────────

const STAGE_VERBS: Partial<Record<AtomicStage, string>> = {
  Ideate:    'Brainstorm every possible angle, hook, and format',
  Research:  'Find evidence, examples, and reference material',
  Outline:   'Map the full structure before you write a word',
  Generate:  'Write your first full draft — commit without stopping',
  Glue:      'Arrange and connect your pieces into a coherent whole',
  Refine:    'Cut the fat, tighten sentences, and elevate the writing',
  Publish:   'Put it out — finalise, format, and commit to publishing',
  Repurpose: 'Reshape the content for a new context or platform',
  React:     'Write your honest take on the existing content',
  Connect:   'Reach out, synthesise ideas, or close the loop',
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

// ── Badge data ────────────────────────────────────────────────────────────

const STAGE_BADGE_DETAIL: Record<AtomicStage, string> = {
  Ideate:    'Free-form idea generation — maximum volume, no self-editing.',
  Research:  'Actively gather evidence, examples, and reference material.',
  Outline:   'Plan the full structure before writing a word.',
  Generate:  'Write your raw first draft — commit without stopping.',
  Glue:      'Connect and order pieces into a coherent narrative.',
  Refine:    'Cut the fat, tighten sentences, and elevate the writing.',
  Publish:   'Format, finalise, and commit to releasing.',
  Repurpose: 'Reshape for a new context, platform, or format.',
  React:     'Write your honest take on existing content.',
  Connect:   'Synthesise ideas or close the loop with collaborators.',
}

const MEDIUM_BADGE_DETAIL: Record<AtomicMedium, string> = {
  Writing: 'Written content — articles, posts, essays, scripts, or any text-based format.',
  Audio:   'Produce or record audio — podcast, voice note, or narration.',
  Video:   'Create video content — record, edit, or script for video.',
  Image:   'Create or source visuals — graphics, photos, or illustrations.',
  Design:  'Visual design work — thumbnails, slides, or brand assets.',
  Outline: 'Structural planning — wireframes, document maps, or schemas.',
  Hybrid:  'Cross-format work combining two or more media types.',
}

const ORIGIN_BADGE_LABEL: Record<AtomicOrigin, string> = {
  New:           'New Content',
  Compression:   'Compress',
  Expansion:     'Expand',
  Recycled:      'Recycle',
  Remastered:    'Remaster',
  Revamped:      'Revamp',
  Reboot:        'Reboot',
  ZoomIn:        'Zoom In',
  ZoomOut:       'Zoom Out',
  AudienceAlter: 'Reframe',
  Commentary:    'React',
}

const ORIGIN_BADGE_DETAIL: Record<AtomicOrigin, string> = {
  New:           'Original work — no prior version, created from scratch.',
  Compression:   'Condensing existing content into a shorter, denser form.',
  Expansion:     'Growing existing content into a fuller, deeper version.',
  Recycled:      'Adapting existing content for a new platform or format.',
  Remastered:    'Updating older content with current standards and data.',
  Revamped:      'Injecting new angles or elements into existing content.',
  Reboot:        'Starting fresh on a topic you have covered before.',
  ZoomIn:        'Deep-diving into one specific element of a broader piece.',
  ZoomOut:       'Recontextualising a topic within a much larger frame.',
  AudienceAlter: 'Adapting the same message for a different target audience.',
  Commentary:    'Adding your perspective on top of existing content.',
}

const DMG_TYPE_BADGE_LABEL: Partial<Record<DamageType, string>> = {
  strike:    'Striking',
  slash:     'Slashing',
  pierce:    'Piercing',
  lightning: 'Electric',
  fire:      'Fiery',
  magic:     'Arcane',
  holy:      'Sacred',
  occult:    'Occult',
  grafting:  'Grafted',
  poison:    'Venomous',
}

const DMG_TYPE_BADGE_DETAIL: Partial<Record<DamageType, string>> = {
  strike:    'Impact — stops people mid-scroll with an unexpected reframe.',
  slash:     'Sharp opinion — direct, confident, no hedging.',
  pierce:    'Evidence-based — gets through defences with research and data.',
  lightning: 'Trend-riding — catches a wave while it is still breaking.',
  fire:      'Urgency — time-sensitive, hot topic energy.',
  magic:     'Educational — teaches or explains something genuinely new.',
  holy:      'Evergreen — timeless value that stays relevant for years.',
  occult:    'Niche — speaks directly to a devoted specific audience.',
  grafting:  'Hybrid — combines disciplines or formats unexpectedly.',
  poison:    'Slow-burn — lingers in the mind, builds over time.',
}

const DMG_TYPE_BADGE_COLOR: Partial<Record<DamageType, string>> = {
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

export function buildBadges(d: AtomicDimensions, damageType?: DamageType): StepBadge[] {
  const badges: StepBadge[] = []

  // 1. Stage (always shown)
  badges.push({ label: d.stage, detail: STAGE_BADGE_DETAIL[d.stage] ?? d.stage })

  // 2. Medium (always shown)
  badges.push({ label: d.medium, detail: MEDIUM_BADGE_DETAIL[d.medium] })

  // 3. Content origin (always shown)
  badges.push({
    label:  ORIGIN_BADGE_LABEL[d.content_origin],
    detail: ORIGIN_BADGE_DETAIL[d.content_origin],
  })

  // 4. Damage type (only when not standard)
  if (damageType && damageType !== 'standard') {
    const label  = DMG_TYPE_BADGE_LABEL[damageType]
    const detail = DMG_TYPE_BADGE_DETAIL[damageType]
    const color  = DMG_TYPE_BADGE_COLOR[damageType]
    if (label && detail) badges.push({ label, detail, color })
  }

  return badges
}

// ── Status badges ─────────────────────────────────────────────────────────

const STATUS_BADGE_LABEL: Record<StatusType, string> = {
  bleed:        'Viral',
  scarlet_rot:  'Polarise',
  frostbite:    'Envy',
  madness:      'Hot Take',
  sleep:        'Comfort',
  death_blight: 'Drama',
  glintstone:   'Wow',
  frenzy_flame: 'Humour',
  devotion:     'Devotion',
  yearning:     'FOMO',
  dread:        'Anxiety',
  murmur:       'Intrigue',
  grace:        'Wholesome',
}

const STATUS_BADGE_DETAIL: Record<StatusType, string> = {
  bleed:        'Bleed — triggers a viral/brainrot wave once buildup fills.',
  scarlet_rot:  'Scarlet Rot — polarises the audience into opposing tribal camps.',
  frostbite:    'Frostbite — freezes attention through envy and compulsive hate-watching.',
  madness:      'Madness — hot take energy that risks chaos and backlash.',
  sleep:        'Sleep — comfort content that soothes and builds quiet loyalty.',
  death_blight: 'Death Blight — explosive drama that ends things permanently.',
  glintstone:   'Glintstone — intellectual wow effect delivered through genuine knowledge.',
  frenzy_flame: 'Frenzy Flame — pure humour, satire, or roast energy.',
  devotion:     'Devotion — parasocial bond that turns followers into true believers.',
  yearning:     'Yearning — FOMO and desire triggered by exclusivity or urgency.',
  dread:        'Dread — anxiety and doomscrolling driven by fear of falling behind.',
  murmur:       'Murmur — rumour and intrigue that spreads and multiplies.',
  grace:        'Grace — wholesome inspiration that restores the audience\'s faith in humanity.',
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

export function buildStatusBadge(statusType: StatusType): StepBadge {
  return {
    label:  STATUS_BADGE_LABEL[statusType],
    detail: STATUS_BADGE_DETAIL[statusType],
    color:  STATUS_BADGE_COLOR[statusType],
  }
}

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
