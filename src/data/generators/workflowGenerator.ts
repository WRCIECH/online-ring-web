import type {
  WeaponClass, WeaponRarity, AtomicStage, WorkflowTile, WorkflowEdge, WorkflowGraph, RolledPatternDraws,
  ContentProductType,
} from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'

// ── Time tables (seconds) ─────────────────────────────────────────────────

export const STAGE_TIME: Record<AtomicStage, { light: number; heavy: number }> = {
  Research: { light: 300, heavy: 900 },
  Produce:  { light: 600, heavy: 1800 },
}

// ── Tile name generation ──────────────────────────────────────────────────

const STAGE_NAMES: Record<AtomicStage, string[]> = {
  Research: [
    'Find evidence and reference material',
    'Gather examples and data points',
    'Research your topic and sources',
    'Read and annotate your references',
    'Collect supporting material',
    'Map the full structure',
    'Draft your table of contents',
    'Arrange your main points',
    'Plan the narrative arc',
    'Outline section by section',
  ],
  Produce: [
    'Write your first full draft',
    'Produce the opening section',
    'Write continuously without stopping',
    'Draft the core argument',
    'Write the body section',
    'Cut the fat and tighten sentences',
    'Review and revise the draft',
    'Refine clarity and flow',
    'Polish the language',
    'Edit for concision and impact',
  ],
}

function pickName(stage: AtomicStage): string {
  const pool = STAGE_NAMES[stage]
  return pool[Math.floor(Math.random() * pool.length)]
}

// Rarity adds extra Produce tiles.
const RARITY_EXTRA: Record<WeaponRarity, number> = {
  common: 0, Intellectual: 1, rare: 2, epic: 3, legendary: 4,
}

// ── UID ───────────────────────────────────────────────────────────────────

let _seq = 0
export function tid(): string { return `t_${++_seq}_${Math.random().toString(36).slice(2, 6)}` }

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}
// suppress unused warning — kept for potential external use
void randInt

export function makeTile(stage: AtomicStage, timeMod = 1.0): WorkflowTile {
  const t = STAGE_TIME[stage]
  return {
    id: tid(), type: stage, name: pickName(stage),
    time_light: Math.round(t.light * timeMod), time_heavy: Math.round(t.heavy * timeMod),
    is_completed: false, repeat_count: 0,
  }
}

// ── Content product wildcard ──────────────────────────────────────────────

const ALL_CONTENT_PRODUCTS: ContentProductType[] = [
  'Plaintext', 'StructuredText', 'IllustratedText', 'SingleGraphic', 'Carousel', 'Infographic',
  'RawAudio', 'ProducedAudio', 'ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo',
  'MotionGraphics', 'LiveStream', 'MultimediaPage', 'BranchingNarrative', 'AssetPack',
  'CurationFeed', 'CommunitySpace', 'InteractiveApp', '_blank',
]

export { ALL_CONTENT_PRODUCTS }

// ── Main export ───────────────────────────────────────────────────────────

export function generateWorkflow(
  weaponClass: WeaponClass,
  rarity: WeaponRarity,
  isBoss = false,
  rolledDraws?: RolledPatternDraws,
): WorkflowGraph {
  const cls         = WEAPON_CLASSES[weaponClass]
  const rarityBonus = RARITY_EXTRA[rarity] ?? 0
  const researchCount = Math.max(1, Math.round(cls.poise_weight * cls.research_weight))
  const produceCount  = Math.max(1, cls.poise_weight - researchCount + rarityBonus)

  const pool = cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
  const contentType: ContentProductType =
    rolledDraws?.format?.[0]?.[0] ?? pool[Math.floor(Math.random() * pool.length)]

  const researchTiles = Array.from({ length: researchCount }, () => {
    const t = makeTile('Research', cls.time_mod)
    t.content_type = contentType
    return t
  })
  const produceTiles = Array.from({ length: produceCount }, () => makeTile('Produce', cls.time_mod))

  const allTiles: WorkflowTile[] = [...researchTiles, ...produceTiles]
  const edges: WorkflowEdge[] = allTiles.slice(0, -1).map((t, i) => ({
    from: t.id, to: allTiles[i + 1].id,
  }))

  if (isBoss) allTiles[allTiles.length - 1].name += ' — break the curse'

  const lastId = allTiles[allTiles.length - 1].id
  const advId  = tid()
  allTiles.push({
    id: advId,
    type: 'Produce',
    name: 'Advance',
    time_light: 0, time_heavy: 0,
    is_completed: false, repeat_count: 0,
    is_advance: true,
  })
  edges.push({ from: lastId, to: advId })

  return {
    tiles:    allTiles,
    edges,
    start_id: allTiles[0].id,
    end_id:   advId,
  }
}
