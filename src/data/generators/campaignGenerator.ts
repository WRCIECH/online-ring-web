import type {
  CampaignNode, CampaignEdge, WeaponCampaign, ContentTransformation, WeaponInstance,
  MediumContentType, HeavyContentType,
  MediumChunk, MediumModeState, HeavyPart, HeavyModeState, ResearchModeState,
} from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'
import type { ContentTransformationsConfig } from './weaponClasses'
import { ALL_CONTENT_PRODUCTS, calcWorkflowTileCounts } from './workflowGenerator'

function genId(): string {
  return 'cn_' + Math.random().toString(36).slice(2, 9)
}

function weightedSample<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function childCount(edges: CampaignEdge[], nodeId: string): number {
  return edges.filter(e => e.from_id === nodeId).length
}

function nodeDepth(_nodes: CampaignNode[], edges: CampaignEdge[], nodeId: string): number {
  let depth = 0
  let cur = nodeId
  const visited = new Set<string>()
  while (true) {
    if (visited.has(cur)) break
    visited.add(cur)
    const parentEdge = edges.find(e => e.to_id === cur)
    if (!parentEdge) break
    cur = parentEdge.from_id
    depth++
    if (depth > 50) break
  }
  return depth
}

function drawEdgeLabel(config: ContentTransformationsConfig): ContentTransformation {
  const { S, A, B, Excluded } = config
  const wildcard = GLOBAL_EDGE_POOL.filter(
    t => !Excluded.includes(t) && !S.includes(t) && !A.includes(t) && !B.includes(t)
  )
  const buckets = [
    { pool: S,        weight: 50 },
    { pool: A,        weight: 25 },
    { pool: B,        weight: 15 },
    { pool: wildcard, weight: 10 },
  ].filter(b => b.pool.length > 0)
  if (buckets.length === 0) {
    const fallback = GLOBAL_EDGE_POOL.filter(t => !Excluded.includes(t))
    return fallback[Math.floor(Math.random() * fallback.length)]
  }
  const bucket = weightedSample(buckets, buckets.map(b => b.weight))
  return bucket.pool[Math.floor(Math.random() * bucket.pool.length)]
}

export function isNodeAvailable(nodes: CampaignNode[], edges: CampaignEdge[], node: CampaignNode): boolean {
  const incoming = edges.filter(e => e.to_id === node.id)
  if (incoming.length === 0) return true  // root node
  return incoming.every(e => nodes.find(n => n.id === e.from_id)?.completed ?? false)
}

const GLOBAL_EDGE_POOL: ContentTransformation[] = [
  'Succinct', 'Verbose', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite',
  'Shock', 'Narration', 'Segmentation', 'Passion',
  'Estetic', 'Cliffhanger', 'Viral', 'Controversy',
  'Comfort', 'Drama', 'Humor', 'Parasocial', 'Wow', 'Hope', 'Fear', 'Desire',
  'Critique', 'Follows', 'AudienceShift', 'Synthesis', 'RemixFusion',
  'Evidence', 'Simplify', 'Technicalize', 'Socratic',
  'Analogy', 'FirstPrinciples', 'DataDriven',
]

// ── Mode generators ────────────────────────────────────────────────────────
// A weapon is permanently assigned exactly one action type (WeaponClassDef.action_type):
// Medium (merged former Micro+Medium, simple linear list), Heavy (linear list of
// generic parts, one type for the whole piece), or Research (a flat work-meter).

export const ALL_MEDIUM_TYPES: MediumContentType[] = [
  'Text', 'Podcast', 'Video', 'LinkShare', 'Poll', 'Question', 'Reply', 'DM',
  'Correct', 'Recycle', 'Interview', 'Graphic', 'Commentary', 'Infographic',
  'Carousel', 'Livestream', 'Q&A', 'Meeting',
]

export const ALL_HEAVY_TYPES: HeavyContentType[] = ['Text', 'Audio/Video', 'Software', 'Community']

// Rolls an integer in [min,max], centered on `mean`, with most mass near the
// center and rare extremes — approximates a bell curve by averaging 3
// independent uniform draws (Irwin-Hall) instead of a single flat roll.
function rollBellCentered(mean: number, spread: number, min: number, max: number): number {
  const u = (Math.random() + Math.random() + Math.random()) / 3
  const offset = (u - 0.5) * 2 * spread
  return Math.max(min, Math.min(max, Math.round(mean + offset)))
}

// Medium chunk count — a long linear list of small pieces.
function linearItemCount(poiseWeight: number): number {
  return rollBellCentered(poiseWeight * 0.9, 4, 3, 15)
}

// Heavy part count — a single big, focused piece of work, so it should read
// as much shorter than Medium's chunk list. Mean ~5-6 for most Heavy classes
// (poise_weight 10-18), still scaling a bit with the class's weight.
function heavyItemCount(poiseWeight: number): number {
  return rollBellCentered(2 + poiseWeight * 0.25, 2, 3, 9)
}

export function generateMediumChunks(weapon: WeaponInstance): MediumModeState {
  const pw = weapon.poise_weight ?? 8
  const count = linearItemCount(pw)

  const chunks: MediumChunk[] = Array.from({ length: count }, (_, i) => ({
    id: genId(),
    name: `Part ${i + 1}`,
    content_type: i === 0 ? 'Text' : ALL_MEDIUM_TYPES[Math.floor(Math.random() * ALL_MEDIUM_TYPES.length)],
    done: false,
  }))
  return { chunks, completed: false }
}

export function generateHeavyParts(weapon: WeaponInstance): HeavyModeState {
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const pool: HeavyContentType[] = cls.heavy_product_pool && cls.heavy_product_pool.length > 0
    ? cls.heavy_product_pool
    : ALL_HEAVY_TYPES
  const product_type = pool[Math.floor(Math.random() * pool.length)]
  const pw = weapon.poise_weight ?? 8
  const count = heavyItemCount(pw)

  const parts: HeavyPart[] = Array.from({ length: count }, (_, i) => ({
    id: genId(),
    name: `Part ${i + 1}`,
    done: false,
  }))
  return { product_type, parts, completed: false }
}

export function generateResearch(): ResearchModeState {
  return { done_steps: 0 }
}

export function generateWeaponCampaign(weapon: WeaponInstance): WeaponCampaign {
  const pw       = weapon.poise_weight ?? 8
  const clsDef   = WEAPON_CLASSES[weapon.weapon_class]
  const [minNodes, maxNodes] = clsDef.campaign_nodes
    ?? [Math.max(5, Math.round(pw * 0.5)), Math.max(7, Math.round(pw * 0.8))]
  const nodeCount = minNodes + Math.floor(Math.random() * (maxNodes - minNodes + 1))
  const maxBranch = 3

  const transformConfig = WEAPON_CLASSES[weapon.weapon_class].content_transformations

  function makeNode(): CampaignNode {
    const cls  = WEAPON_CLASSES[weapon.weapon_class]
    const pool = cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
    const content_type = pool[Math.floor(Math.random() * pool.length)]
    const { research, produce } = calcWorkflowTileCounts(weapon.weapon_class, weapon.rarity)
    return { id: genId(), name: '', completed: false, published: false, content_type, node_research: research, node_produce: produce }
  }

  const root = makeNode()
  const nodes: CampaignNode[] = [root]
  const edges: CampaignEdge[] = []

  while (nodes.length < nodeCount) {
    const eligible = nodes.filter(n => childCount(edges, n.id) < maxBranch)
    if (!eligible.length) break
    const depths  = eligible.map(n => nodeDepth(nodes, edges, n.id))
    const maxD    = Math.max(...depths)
    const weights = depths.map(d => maxD - d + 1)
    const parent  = weightedSample(eligible, weights)
    const child   = makeNode()
    nodes.push(child)
    edges.push({ from_id: parent.id, to_id: child.id, label: drawEdgeLabel(transformConfig) })
  }

  const actionType = clsDef.action_type
  const modeFields =
    actionType === 'heavy'    ? { heavy: generateHeavyParts(weapon) } :
    actionType === 'research' ? { research: generateResearch() } :
    { medium: generateMediumChunks(weapon) }

  return {
    id: genId(),
    nodes,
    edges,
    created_at: Date.now(),
    completed: false,
    ...modeFields,
  }
}
