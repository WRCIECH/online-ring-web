import type { CampaignNode, CampaignEdge, WeaponCampaign, AtomicOrigin, StyleType, WeaponInstance, ContentProductType } from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'
import { ContentRegistry } from '../contentProducts'

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
  if (pool.length === 0) return null
  if (Math.random() < 0.33) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export function isNodeAvailable(nodes: CampaignNode[], edges: CampaignEdge[], node: CampaignNode): boolean {
  const incoming = edges.filter(e => e.to_id === node.id)
  if (incoming.length === 0) return true  // root node
  return incoming.every(e => nodes.find(n => n.id === e.from_id)?.completed ?? false)
}

const NODE_COUNT_BY_WEIGHT: Record<string, [number, number]> = {
  light:    [5, 7],
  medium:   [7, 10],
  heavy:    [10, 13],
  colossal: [13, 15],
}

const ALL_PRODUCT_TYPES = Object.keys(ContentRegistry.Products) as ContentProductType[]

function pickForComplexity(pool: ContentProductType[], target: number): ContentProductType {
  const sorted = [...pool].sort((a, b) =>
    Math.abs(ContentRegistry.Products[a].complexity - target) -
    Math.abs(ContentRegistry.Products[b].complexity - target)
  )
  const exact = sorted.filter(p => ContentRegistry.Products[p].complexity === target)
  const candidates = exact.length > 0 ? exact : sorted
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function generateWeaponCampaign(weapon: WeaponInstance): WeaponCampaign {
  const cls = WEAPON_CLASSES[weapon.weapon_class]
  const [minNodes, maxNodes] = NODE_COUNT_BY_WEIGHT[weapon.poise_weight ?? 'medium'] ?? [7, 10]
  const nodeCount = minNodes + Math.floor(Math.random() * (maxNodes - minNodes + 1))
  const maxBranch = 3

  const edgePool: (AtomicOrigin | StyleType)[] = [
    ...(cls.allowed_transformations as AtomicOrigin[]),
    ...(cls.styles as StyleType[]),
  ]

  const productPool = cls.supported_products.length > 0 ? cls.supported_products : ALL_PRODUCT_TYPES

  function makeNode(): CampaignNode {
    return {
      id: genId(),
      name: '',
      completed: false,
      published: false,
      content_type: '_blank',
      required_subworkflows: 2,
      subworkflow_count: 0,
    }
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

  // Second pass: assign content_type and required_subworkflows based on depth
  const maxDepth = Math.max(...nodes.map(n => nodeDepth(nodes, edges, n.id)), 0)
  for (const node of nodes) {
    const depth = nodeDepth(nodes, edges, node.id)
    const target = maxDepth === 0 ? 1 : Math.round(1 + (depth / maxDepth) * 4)
    node.content_type = pickForComplexity(productPool, target)
    node.required_subworkflows = Math.max(2, ContentRegistry.Products[node.content_type].complexity)
  }

  return {
    id: genId(),
    nodes,
    edges,
    created_at: Date.now(),
    completed: false,
  }
}
