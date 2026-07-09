import type { CampaignNode, Campaign } from '../../types/game'
import { CLASS_DEFINITIONS } from '../classes'

function genId(): string {
  return 'cn_' + Math.random().toString(36).slice(2, 9)
}

function nodeDepth(nodes: CampaignNode[], node: CampaignNode): number {
  let depth = 0
  let curId: string | null = node.parent_id
  while (curId !== null) {
    const parent = nodes.find(n => n.id === curId)
    if (!parent) break
    curId = parent.parent_id
    depth++
    if (depth > 50) break
  }
  return depth
}

function childCount(nodes: CampaignNode[], node: CampaignNode): number {
  return nodes.filter(n => n.parent_id === node.id).length
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

export function isNodeAvailable(nodes: CampaignNode[], node: CampaignNode): boolean {
  if (node.parent_id === null) return true
  const parent = nodes.find(n => n.id === node.parent_id)
  return parent?.completed ?? false
}

export function generateCampaign(classId: string, name = ''): Campaign {
  const cls = CLASS_DEFINITIONS.find(c => c.id === classId)
  const velocityBonus = cls ? Math.max(0, cls.startingStats.VELOCITY - 8) : 0
  const depthBonus    = cls ? Math.max(0, cls.startingStats.DEPTH    - 8) : 0

  const baseCount = 8 + Math.floor(Math.random() * 7)   // 8–14
  const nodeCount = Math.min(20, baseCount + Math.floor(velocityBonus / 3))
  const maxBranch = depthBonus > 5 ? 2 : 3

  const root: CampaignNode = { id: genId(), name: '', parent_id: null, completed: false }
  const nodes: CampaignNode[] = [root]

  while (nodes.length < nodeCount) {
    const eligible = nodes.filter(n => childCount(nodes, n) < maxBranch)
    if (!eligible.length) break
    const depths  = eligible.map(n => nodeDepth(nodes, n))
    const maxD    = Math.max(...depths)
    // Bias toward shallower nodes so the tree fans out naturally
    const weights = depths.map(d => maxD - d + 1)
    const parent  = weightedSample(eligible, weights)
    nodes.push({ id: genId(), name: '', parent_id: parent.id, completed: false })
  }

  return {
    id: genId(),
    name,
    class_id: classId,
    nodes,
    created_at: Date.now(),
    completed: false,
  }
}
