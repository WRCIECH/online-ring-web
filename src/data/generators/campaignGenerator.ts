import type { CampaignNode, CampaignEdge, WeaponCampaign, ContentTransformation, WeaponInstance } from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'
import type { ContentTransformationsConfig } from './weaponClasses'
import { ALL_CONTENT_PRODUCTS } from './workflowGenerator'

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
  'Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite',
  'Minimalism', 'Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Intellectual',
  'ProblemSolving', 'Estetic', 'Interactive', 'Cliffhanger', 'Viral', 'Controversy',
  'Comfort', 'Drama', 'Humor', 'Parasocial', 'Wow', 'Hope', 'Fear', 'Desire',
  'Critique', 'Follows', 'AudienceShift', 'DomainTransfer', 'Synthesis', 'RemixFusion',
  'Split', 'Evidence', 'Simplify', 'Technicalize', 'Localize', 'Socratic',
  'Analogy', 'FirstPrinciples', 'DataDriven',
]

export function generateWeaponCampaign(weapon: WeaponInstance): WeaponCampaign {
  const pw       = weapon.poise_weight ?? 8
  const minNodes = Math.max(5, Math.round(pw * 0.5))
  const maxNodes = Math.max(7, Math.round(pw * 0.8))
  const nodeCount = minNodes + Math.floor(Math.random() * (maxNodes - minNodes + 1))
  const maxBranch = 3

  const transformConfig = WEAPON_CLASSES[weapon.weapon_class].content_transformations

  function makeNode(): CampaignNode {
    const cls  = WEAPON_CLASSES[weapon.weapon_class]
    const pool = cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
    const content_type = pool[Math.floor(Math.random() * pool.length)]
    return { id: genId(), name: '', completed: false, published: false, content_type }
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
  }
}
