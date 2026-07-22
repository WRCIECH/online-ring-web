import type {
  WeaponClass, WeaponRarity, AtomicStage, WorkflowTile, WorkflowEdge, WorkflowGraph, RolledPatternDraws,
  ContentProductType,
} from '../../types/game'
import type { PatternStep } from './weaponPatterns'
import { WEAPON_PATTERNS } from './weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './weaponClasses'
import type { SlotKind } from './patternSlots'

// ── Time tables (seconds), keyed by the 6-stage vocabulary ────────────────
// Carried over 1:1 from the old TileType table: research->Research,
// outline->Plan, draft->Produce, edit->Refine, publish->Publish.
// Promote is a later addition — a quick "announce/cross-post" action.

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

// Rarity adds extra Produce-tile capacity (applied once, to the first
// Produce phase encountered in a pattern).
const RARITY_EXTRA: Record<WeaponRarity, number> = {
  common: 0, Intellectual: 1, rare: 2, epic: 3, legendary: 4,
}

// ── UID ───────────────────────────────────────────────────────────────────

let _seq = 0
export function tid(): string { return `t_${++_seq}_${Math.random().toString(36).slice(2, 6)}` }

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function makeTile(stage: AtomicStage, timeMod = 1.0): WorkflowTile {
  const t = STAGE_TIME[stage]
  return {
    id: tid(), type: stage, name: pickName(stage),
    time_light: Math.round(t.light * timeMod), time_heavy: Math.round(t.heavy * timeMod),
    is_completed: false, repeat_count: 0,
  }
}

// ── Pattern compiler ────────────────────────────────────────────────────────

interface CompileContext {
  cls: WeaponClassDef
  rarity: WeaponRarity
  tiles: WorkflowTile[]
  edges: WorkflowEdge[]
  frontier: string[]                       // tile ids the next step links FROM
  lastResearchBlockTileIds: string[] | null // reset whenever a non-Research phase runs
  produceBoostApplied: boolean             // ensures the rarity bonus only applies once
  rolledDraws?: RolledPatternDraws         // fixed per-instance draws — absent for legacy weapons
  slotCounters: Record<SlotKind, number>   // running per-kind occurrence index while consuming rolledDraws
}

export function compilePattern(
  steps: PatternStep[],
  cls: WeaponClassDef,
  rarity: WeaponRarity,
  rolledDraws?: RolledPatternDraws,
): { tiles: WorkflowTile[]; edges: WorkflowEdge[] } {
  if (steps.length === 0 || steps[0].kind === 'branch') {
    throw new Error(`Pattern for ${cls.id} must start with a phase() step, not branch()`)
  }
  const ctx: CompileContext = {
    cls, rarity, tiles: [], edges: [], frontier: [],
    lastResearchBlockTileIds: null, produceBoostApplied: false,
    rolledDraws, slotCounters: { format: 0 },
  }
  for (const step of steps) compileStep(step, ctx)
  return { tiles: ctx.tiles, edges: ctx.edges }
}

function compileStep(step: PatternStep, ctx: CompileContext): void {
  switch (step.kind) {
    case 'phase':      return compilePhase(step, ctx)
    case 'drawFormat': return compileDrawFormat(ctx)
    case 'fixedDraw':  return compileFixedDraw(step, ctx)
    case 'branch':     return compileBranch(step, ctx)
  }
}

function linkFrontier(ctx: CompileContext, toId: string): void {
  for (const f of ctx.frontier) ctx.edges.push({ from: f, to: toId })
}

function compilePhase(step: { stage: AtomicStage; min: number; max: number }, ctx: CompileContext): void {
  let max = step.max
  if (step.stage === 'Produce' && !ctx.produceBoostApplied) {
    max += RARITY_EXTRA[ctx.rarity] ?? 0
    ctx.produceBoostApplied = true
  }
  const count = randInt(step.min, max)
  const newTiles = Array.from({ length: count }, () => makeTile(step.stage, ctx.cls.time_mod))
  ctx.tiles.push(...newTiles)

  linkFrontier(ctx, newTiles[0].id)
  for (let i = 0; i < newTiles.length - 1; i++) {
    ctx.edges.push({ from: newTiles[i].id, to: newTiles[i + 1].id })
  }

  ctx.frontier = [newTiles[newTiles.length - 1].id]
  ctx.lastResearchBlockTileIds = step.stage === 'Research' ? newTiles.map(t => t.id) : null
}

function applyDrawResult(ctx: CompileContext, value: ContentProductType): void {
  if (ctx.lastResearchBlockTileIds === null) {
    throw new Error(`drawFormat() in ${ctx.cls.id}'s pattern has no preceding phase('Research', ...) block`)
  }
  for (const id of ctx.lastResearchBlockTileIds) {
    const t = ctx.tiles.find(t => t.id === id)!
    t.content_type = value
  }
  const planTile = makeTile('Research', ctx.cls.time_mod)
  planTile.content_type = value
  ctx.tiles.push(planTile)
  linkFrontier(ctx, planTile.id)
  ctx.frontier = [planTile.id]
}

function compileDrawFormat(ctx: CompileContext): void {
  const pool = ctx.cls.supported_products
  const occ = ctx.slotCounters.format++
  const value: ContentProductType = ctx.rolledDraws
    ? (ctx.rolledDraws.format[occ]?.[0] ?? pool[Math.floor(Math.random() * pool.length)])
    : pool[Math.floor(Math.random() * pool.length)]
  applyDrawResult(ctx, value)
}

function compileFixedDraw(step: Extract<PatternStep, { kind: 'fixedDraw' }>, ctx: CompileContext): void {
  const occ = ctx.slotCounters.format++
  const value: ContentProductType = ctx.rolledDraws
    ? ((ctx.rolledDraws.format[occ]?.[0] as ContentProductType) ?? step.value)
    : step.value

  if (ctx.lastResearchBlockTileIds !== null) {
    for (const id of ctx.lastResearchBlockTileIds) {
      const t = ctx.tiles.find(t => t.id === id)!
      t.content_type = value
    }
  }

  const planTile = makeTile('Research', ctx.cls.time_mod)
  planTile.content_type = value
  ctx.tiles.push(planTile)
  linkFrontier(ctx, planTile.id)
  ctx.frontier = [planTile.id]
}

function compileBranch(step: { paths: PatternStep[][] }, ctx: CompileContext): void {
  const startFrontier = ctx.frontier
  const endFrontiers: string[][] = []
  for (const path of step.paths) {
    ctx.frontier = startFrontier
    ctx.lastResearchBlockTileIds = null
    for (const innerStep of path) compileStep(innerStep, ctx)
    endFrontiers.push(ctx.frontier)
  }
  ctx.frontier = endFrontiers.flat()
  ctx.lastResearchBlockTileIds = null
}

// ── Main export ───────────────────────────────────────────────────────────

export function generateWorkflow(
  weaponClass: WeaponClass,
  rarity: WeaponRarity,
  isBoss = false,
  rolledDraws?: RolledPatternDraws,
): WorkflowGraph {
  const cls = WEAPON_CLASSES[weaponClass]
  const pattern = WEAPON_PATTERNS[weaponClass]
  const { tiles, edges } = compilePattern(pattern, cls, rarity, rolledDraws)

  if (isBoss) {
    const last = tiles[tiles.length - 1]
    last.name = `${last.type} — break the curse`
  }

  const lastId = tiles[tiles.length - 1].id
  const advId  = tid()
  tiles.push({
    id: advId,
    type: tiles[tiles.length - 1].type,
    name: 'Advance',
    time_light: 0, time_heavy: 0,
    is_completed: false,
    repeat_count: 0,
    is_advance: true,
  })
  edges.push({ from: lastId, to: advId })

  return {
    tiles,
    edges,
    start_id: tiles[0].id,
    end_id:   advId,
  }
}
