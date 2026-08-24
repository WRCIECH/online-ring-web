import type {
  WeaponClass, WeaponRarity, AtomicStage, WorkflowTile, WorkflowEdge, WorkflowGraph,
  ContentProductType,
} from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'

// ── Time tables (seconds) ─────────────────────────────────────────────────

export const STAGE_TIME: Record<AtomicStage, { light: number; heavy: number }> = {
  Research: { light: 480, heavy: 1500 },
  Produce:  { light: 480, heavy: 1500 },
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

export function calcWorkflowTileCounts(
  weaponClass: WeaponClass,
  _rarity: WeaponRarity,
): { research: number; produce: number } {
  const cls = WEAPON_CLASSES[weaponClass]
  const research = Math.max(1, Math.round(cls.poise_weight * cls.research_weight))
  const produce  = Math.max(1, cls.poise_weight - research)
  return { research, produce }
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
  'LiveStream', 'AssetPack',
  'CurationFeed', 'CommunitySpace', 'InteractiveApp', '_blank',
]

export { ALL_CONTENT_PRODUCTS }

// ── Main export ───────────────────────────────────────────────────────────

export function generateWorkflow(
  weaponClass: WeaponClass,
  _rarity: WeaponRarity,
  isBoss = false,
  contentType?: ContentProductType,
  researchOverride?: number,
  produceOverride?: number,
): WorkflowGraph {
  const cls         = WEAPON_CLASSES[weaponClass]
  const researchCount = researchOverride !== undefined
    ? researchOverride
    : Math.max(1, Math.round(cls.poise_weight * cls.research_weight))
  const produceCount  = produceOverride !== undefined
    ? Math.max(1, produceOverride)
    : Math.max(1, cls.poise_weight - Math.max(1, Math.round(cls.poise_weight * cls.research_weight)))

  const pool = cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
  const effectiveType: ContentProductType =
    contentType ?? pool[Math.floor(Math.random() * pool.length)]

  const researchTiles = Array.from({ length: researchCount }, () => {
    const t = makeTile('Research', cls.time_mod)
    t.content_type = effectiveType
    return t
  })
  const produceTiles = Array.from({ length: produceCount }, () => makeTile('Produce', cls.time_mod))

  // All tiles except the final Produce are free to do in any order from the start.
  // The final Produce tile is gated: it requires every other tile to be completed first.
  const freeTiles  = [...researchTiles, ...produceTiles.slice(0, -1)]
  const finalTile  = produceTiles[produceTiles.length - 1]

  if (isBoss) finalTile.name += ' — break the curse'

  const allTiles: WorkflowTile[] = [...freeTiles, finalTile]

  // Each free tile → finalTile edge (so getReachableTiles unlocks it when all free tiles are done)
  const edges: WorkflowEdge[] = freeTiles.map(t => ({ from: t.id, to: finalTile.id }))

  const advId = tid()
  allTiles.push({
    id: advId,
    type: 'Produce',
    name: 'Advance',
    time_light: 0, time_heavy: 0,
    is_completed: false, repeat_count: 0,
    is_advance: true,
  })
  edges.push({ from: finalTile.id, to: advId })

  // start_id points to the first free tile; if there are no free tiles (1R 1P edge case),
  // the final tile itself is the only tile and has no predecessors, so it's immediately reachable.
  return {
    tiles:    allTiles,
    edges,
    start_id: (freeTiles[0] ?? finalTile).id,
    end_id:   advId,
  }
}
