import type { WeaponClass, WeaponRarity, TileType, WorkflowTile, WorkflowEdge, WorkflowGraph } from '../../types/game'

// ── Time tables (seconds) ─────────────────────────────────────────────────

const TILE_TIME_LIGHT: Record<TileType, number> = {
  research: 300,   // 5 min
  outline:  240,   // 4 min
  draft:    600,   // 10 min
  edit:     360,   // 6 min
  publish:  180,   // 3 min
  promote:  120,   // 2 min
}

const TILE_TIME_HEAVY: Record<TileType, number> = {
  research: 900,   // 15 min
  outline:  600,   // 10 min
  draft:    1800,  // 30 min
  edit:     900,   // 15 min
  publish:  300,   // 5 min
  promote:  240,   // 4 min
}

// ── Tile name generation ──────────────────────────────────────────────────

const TILE_NAMES: Record<TileType, string[]> = {
  research: [
    'Find evidence and reference material',
    'Gather examples and data points',
    'Research your topic and sources',
    'Read and annotate your references',
    'Collect supporting material',
  ],
  outline: [
    'Map the full structure',
    'Draft your table of contents',
    'Arrange your main points',
    'Plan the narrative arc',
    'Outline section by section',
  ],
  draft: [
    'Write your first full draft',
    'Produce the opening section',
    'Write continuously without stopping',
    'Draft the core argument',
    'Write the body section',
  ],
  edit: [
    'Cut the fat and tighten sentences',
    'Review and revise the draft',
    'Refine clarity and flow',
    'Polish the language',
    'Edit for concision and impact',
  ],
  publish: [
    'Finalise and format for publishing',
    'Put it out — commit to publishing',
    'Prepare the final version',
    'Review before hitting publish',
  ],
  promote: [
    'Write the hook and teaser',
    'Draft the social copy',
    'Prepare the distribution message',
  ],
}

function pickName(type: TileType): string {
  const pool = TILE_NAMES[type]
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Graph shape definitions ───────────────────────────────────────────────

type GraphShape = 'linear' | 'branch' | 'hub' | 'dual_branch'

// Map weapon size category → shape + tile count range
interface ShapeSpec {
  shape: GraphShape
  minTiles: number
  maxTiles: number
}

const SMALL_CLASSES: WeaponClass[] = [
  'daggers', 'bows', 'torches', 'fists', 'thrusting_swords', 'crossbows',
]
const LARGE_CLASSES: WeaponClass[] = [
  'greatswords', 'twinblades', 'reapers', 'great_axes', 'great_spears',
  'curved_greatswords', 'great_hammers',
]
const COLOSSAL_CLASSES: WeaponClass[] = [
  'colossal_swords', 'colossal_weapons', 'greatbows', 'ballistas',
]

function getShapeSpec(_cls: WeaponClass): ShapeSpec {
  if (COLOSSAL_CLASSES.includes(_cls)) return { shape: 'dual_branch', minTiles: 12, maxTiles: 16 }
  if (LARGE_CLASSES.includes(_cls))    return { shape: 'branch',      minTiles: 8,  maxTiles: 12 }
  if (SMALL_CLASSES.includes(_cls))    return { shape: 'linear',      minTiles: 4,  maxTiles: 6  }
  return { shape: 'branch', minTiles: 6, maxTiles: 9 }
}

// Rarity adds extra tiles
const RARITY_EXTRA: Record<WeaponRarity, number> = {
  common: 0, magic: 1, rare: 2, epic: 3, legendary: 4,
}

// ── Stage sequence for tile types ─────────────────────────────────────────

const STAGE_SEQUENCE: TileType[] = ['research', 'outline', 'draft', 'edit', 'publish']

function tileTypeForPosition(pos: number, total: number): TileType {
  const frac = pos / Math.max(1, total - 1)
  const idx  = Math.min(STAGE_SEQUENCE.length - 1, Math.floor(frac * STAGE_SEQUENCE.length))
  return STAGE_SEQUENCE[idx]
}

// ── UID ───────────────────────────────────────────────────────────────────

let _seq = 0
function tid(): string { return `t_${++_seq}_${Math.random().toString(36).slice(2, 6)}` }

// ── Graph builders ────────────────────────────────────────────────────────

function makeTile(type: TileType): WorkflowTile {
  return {
    id: tid(), type, name: pickName(type),
    time_light: TILE_TIME_LIGHT[type],
    time_heavy: TILE_TIME_HEAVY[type],
    is_completed: false, repeat_count: 0,
  }
}

function buildLinear(count: number): { tiles: WorkflowTile[]; edges: WorkflowEdge[] } {
  const tiles = Array.from({ length: count }, (_, i) => makeTile(tileTypeForPosition(i, count)))
  const edges: WorkflowEdge[] = tiles.slice(0, -1).map((t, i) => ({ from: t.id, to: tiles[i + 1].id }))
  return { tiles, edges }
}

function buildBranch(count: number): { tiles: WorkflowTile[]; edges: WorkflowEdge[] } {
  // Structure: start → [branch A (2-3 tiles), branch B (2-3 tiles)] → merge → end
  const branchSize = Math.max(2, Math.floor((count - 3) / 2))
  const startTile  = makeTile('research')
  const mergeTile  = makeTile('edit')
  const endTile    = makeTile('publish')

  const branchACount = branchSize
  const branchBCount = count - 3 - branchACount
  const branchA = Array.from({ length: Math.max(1, branchACount) }, (_, i) =>
    makeTile(tileTypeForPosition(i + 1, count)))
  const branchB = Array.from({ length: Math.max(1, branchBCount) }, (_, i) =>
    makeTile(tileTypeForPosition(i + 1, count)))

  const tiles = [startTile, ...branchA, ...branchB, mergeTile, endTile]
  const edges: WorkflowEdge[] = [
    { from: startTile.id, to: branchA[0].id },
    { from: startTile.id, to: branchB[0].id },
    ...branchA.slice(0, -1).map((t, i) => ({ from: t.id, to: branchA[i + 1].id })),
    ...branchB.slice(0, -1).map((t, i) => ({ from: t.id, to: branchB[i + 1].id })),
    { from: branchA[branchA.length - 1].id, to: mergeTile.id },
    { from: branchB[branchB.length - 1].id, to: mergeTile.id },
    { from: mergeTile.id, to: endTile.id },
  ]
  return { tiles, edges }
}

function buildDualBranch(count: number): { tiles: WorkflowTile[]; edges: WorkflowEdge[] } {
  // Two sets of branches with a central hub
  const startTile = makeTile('research')
  const hub1      = makeTile('outline')
  const hub2      = makeTile('edit')
  const endTile   = makeTile('publish')

  const perBranch = Math.max(2, Math.floor((count - 4) / 4))
  const branches  = Array.from({ length: 4 }, () =>
    Array.from({ length: perBranch }, (_, i) => makeTile(tileTypeForPosition(i + 1, count)))
  )

  const allBranchTiles = branches.flat()
  const tiles = [startTile, hub1, ...allBranchTiles, hub2, endTile]
  const edges: WorkflowEdge[] = [
    { from: startTile.id, to: hub1.id },
    { from: branches[0][0].id, to: branches[0].length > 1 ? branches[0][1].id : hub2.id },
    { from: branches[1][0].id, to: branches[1].length > 1 ? branches[1][1].id : hub2.id },
    ...branches[0].slice(0, -1).map((t, i) => ({ from: t.id, to: branches[0][i + 1].id })),
    ...branches[1].slice(0, -1).map((t, i) => ({ from: t.id, to: branches[1][i + 1].id })),
    ...branches[2].slice(0, -1).map((t, i) => ({ from: t.id, to: branches[2][i + 1].id })),
    ...branches[3].slice(0, -1).map((t, i) => ({ from: t.id, to: branches[3][i + 1].id })),
    { from: hub1.id, to: branches[0][0].id },
    { from: hub1.id, to: branches[1][0].id },
    { from: hub2.id, to: branches[2][0].id },
    { from: hub2.id, to: branches[3][0].id },
    { from: branches[0][branches[0].length - 1].id, to: hub2.id },
    { from: branches[1][branches[1].length - 1].id, to: hub2.id },
    { from: branches[2][branches[2].length - 1].id, to: endTile.id },
    { from: branches[3][branches[3].length - 1].id, to: endTile.id },
    { from: hub2.id, to: endTile.id },
  ]

  // Deduplicate edges
  const seen = new Set<string>()
  const uniqueEdges = edges.filter(e => {
    const key = `${e.from}:${e.to}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { tiles, edges: uniqueEdges }
}

// ── Contamination placement ───────────────────────────────────────────────

// ── Main export ───────────────────────────────────────────────────────────

export function generateWorkflow(
  weaponClass: WeaponClass,
  rarity: WeaponRarity,
  isBoss = false,
): WorkflowGraph {
  const spec = getShapeSpec(weaponClass)
  const extra = RARITY_EXTRA[rarity] ?? 0
  const targetCount = spec.minTiles + Math.floor(Math.random() * (spec.maxTiles - spec.minTiles + 1)) + extra

  let tiles: WorkflowTile[]
  let edges: WorkflowEdge[]

  if (spec.shape === 'dual_branch') {
    ({ tiles, edges } = buildDualBranch(targetCount))
  } else if (spec.shape === 'branch') {
    ({ tiles, edges } = buildBranch(targetCount))
  } else {
    ({ tiles, edges } = buildLinear(targetCount))
  }

  // Boss: make the last tile a mandatory publish gate
  if (isBoss) {
    const lastIdx = tiles.length - 1
    tiles[lastIdx] = {
      ...tiles[lastIdx],
      type: 'publish',
      name: 'Publish — break the curse',
    }
  }

  return {
    tiles,
    edges,
    start_id: tiles[0].id,
    end_id:   tiles[tiles.length - 1].id,
  }
}
