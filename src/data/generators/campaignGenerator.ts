import type { CampaignNode, CampaignEdge, WeaponCampaign, AtomicOrigin, StyleType, WeaponInstance } from '../../types/game'

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

function drawEdgeLabel(
  pool: (AtomicOrigin | StyleType)[],
): AtomicOrigin | StyleType | null {
  if (Math.random() < 0.50) return null
  const effectivePool = pool.length > 0 ? pool : GLOBAL_EDGE_POOL
  return effectivePool[Math.floor(Math.random() * effectivePool.length)]
}

export function isNodeAvailable(nodes: CampaignNode[], edges: CampaignEdge[], node: CampaignNode): boolean {
  const incoming = edges.filter(e => e.to_id === node.id)
  if (incoming.length === 0) return true  // root node
  return incoming.every(e => nodes.find(n => n.id === e.from_id)?.completed ?? false)
}

const ALL_ATOMIC_ORIGINS: AtomicOrigin[] = ['New', 'Compression', 'Expansion', 'ZoomIn', 'ZoomOut', 'Similar', 'Opposite']
const ALL_STYLE_TYPES: StyleType[]    = ['Minimalism', 'Shock', 'Narration', 'Segmentation', 'Fast', 'Passion', 'Intellectual', 'ProblemSolving', 'Estetic', 'Interactive', 'Cliffhanger', 'Viral', 'Controversy', 'Comfort', 'Drama', 'Humor', 'Parasocial', 'Wow', 'Hope', 'Fear', 'Desire']
const GLOBAL_EDGE_POOL: (AtomicOrigin | StyleType)[] = [...ALL_ATOMIC_ORIGINS, ...ALL_STYLE_TYPES]

const NODE_COUNT_BY_WEIGHT: Record<string, [number, number]> = {
  light:    [5, 7],
  medium:   [7, 10],
  heavy:    [10, 13],
  colossal: [13, 15],
}

export function generateWeaponCampaign(weapon: WeaponInstance): WeaponCampaign {
  const [minNodes, maxNodes] = NODE_COUNT_BY_WEIGHT[weapon.poise_weight ?? 'medium'] ?? [7, 10]
  const nodeCount = minNodes + Math.floor(Math.random() * (maxNodes - minNodes + 1))
  const maxBranch = 3

  const edgePool = GLOBAL_EDGE_POOL

  function makeNode(): CampaignNode {
    return { id: genId(), name: '', completed: false, published: false }
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
    edges.push({ from_id: parent.id, to_id: child.id, label: drawEdgeLabel(edgePool) })
  }

  return {
    id: genId(),
    nodes,
    edges,
    created_at: Date.now(),
    completed: false,
  }
}
