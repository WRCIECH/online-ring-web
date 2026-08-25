import type {
  CampaignNode, CampaignEdge, WeaponCampaign, ContentTransformation, WeaponInstance,
  MicroContentType, HeavyContentType, ContentShift,
  MicroProduct, MicroModeState, MediumPiece, MediumModeState, HeavyModeState,
  PropagandaShift, MediumAudienceShift, StyleShift, ConstraintCategory, NodeConstraint,
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

const ALL_MICRO_TYPES: MicroContentType[] = [
  'Plaintext', 'SingleGraphic', 'Carousel', 'ARollVideo', 'RawAudio', 'LinkShare',
]

const ALL_HEAVY_TYPES: HeavyContentType[] = [
  'Plaintext', 'ARollVideo', 'AssetPack', 'CurationFeed', 'InteractiveApp',
  'Website', '_blank', 'Course', 'Book',
]

const PROPAGANDA_VALUES: PropagandaShift[] = ['enhance', 'weaken', 'focus', 'action']
const AUDIENCE_VALUES: MediumAudienceShift[] = [
  'audience_x', 'lower_self', 'average_self', 'higher_self', 'base_trend_event', 'need_identity_belief',
]
const STYLE_VALUES: StyleShift[] = [
  'narration', 'segmentation', 'socratic', 'enemy_hero', 'slogan_symbol',
  'analogy', 'verbose', 'succinct', 'technicalize', 'simplify', 'evidence', 'data_driven', 'first_principles',
]

function randomConstraint(): NodeConstraint {
  const categoryIndex = Math.floor(Math.random() * 3)
  const categories: ConstraintCategory[] = ['propaganda', 'audience', 'style']
  const category = categories[categoryIndex]
  if (category === 'propaganda') {
    return { category, value: PROPAGANDA_VALUES[Math.floor(Math.random() * PROPAGANDA_VALUES.length)] }
  } else if (category === 'audience') {
    return { category, value: AUDIENCE_VALUES[Math.floor(Math.random() * AUDIENCE_VALUES.length)] }
  } else {
    return { category, value: STYLE_VALUES[Math.floor(Math.random() * STYLE_VALUES.length)] }
  }
}

export function generateMicro(weapon: WeaponInstance): MicroModeState {
  const pw = weapon.poise_weight ?? 8
  const count = Math.max(6, Math.min(10, Math.round(pw * 0.6)))
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const pool: MicroContentType[] = cls.micro_product_pool && cls.micro_product_pool.length > 0
    ? cls.micro_product_pool
    : ALL_MICRO_TYPES
  const transformConfig = cls.content_transformations
  const stylePool = [...transformConfig.S, ...transformConfig.A]

  const products: MicroProduct[] = Array.from({ length: count }, () => {
    const content_type = pool[Math.floor(Math.random() * pool.length)]
    const hasStyle = Math.random() < 0.5
    const style = hasStyle && stylePool.length > 0
      ? stylePool[Math.floor(Math.random() * stylePool.length)]
      : undefined
    return { id: genId(), content_type, style, done_count: 0 }
  })
  return { products, current_index: 0, completed: false }
}

const CONTENT_SHIFT_WEIGHTS: { shift: ContentShift; weight: number }[] = [
  { shift: 'Follows', weight: 50 },
  { shift: 'ZoomIn', weight: 15 },
  { shift: 'ZoomOut', weight: 15 },
  { shift: 'Similar', weight: 15 },
  { shift: 'Opposite', weight: 5 },
]

function drawContentShift(): ContentShift {
  return weightedSample(
    CONTENT_SHIFT_WEIGHTS.map(x => x.shift),
    CONTENT_SHIFT_WEIGHTS.map(x => x.weight),
  )
}

export function generateMedium(weapon: WeaponInstance): MediumModeState {
  const pw = weapon.poise_weight ?? 8
  const count = Math.max(8, Math.min(15, Math.round(pw * 0.9)))
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const level1_type = cls.medium_level1_type
  const level2_type = cls.medium_level2_type

  const pieces: MediumPiece[] = Array.from({ length: count }, (_, i) => ({
    id: genId(),
    name: `Part ${i + 1}`,
    level1_type,
    level2_type,
    link_type: drawContentShift(),
    constraint: randomConstraint(),
    level1_done: false,
    level2_done: false,
  }))
  return { pieces, completed: false }
}

export function generateHeavy(weapon: WeaponInstance): HeavyModeState {
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const pool: HeavyContentType[] = cls.heavy_product_pool && cls.heavy_product_pool.length > 0
    ? cls.heavy_product_pool
    : ALL_HEAVY_TYPES
  const product_type = pool[Math.floor(Math.random() * pool.length)]
  const { research, produce } = calcWorkflowTileCounts(weapon.weapon_class, weapon.rarity)
  const scale = 1.5 + Math.random() * 0.5   // 1.5–2.0×
  const research_count = Math.max(4, Math.round(research * scale))
  const produce_count = Math.max(4, Math.round(produce * scale))
  return { product_type, research_count, produce_count, research_done: 0, produce_done: 0, completed: false }
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

  return {
    id: genId(),
    nodes,
    edges,
    created_at: Date.now(),
    completed: false,
    micro: generateMicro(weapon),
    medium: generateMedium(weapon),
    heavy: generateHeavy(weapon),
  }
}
