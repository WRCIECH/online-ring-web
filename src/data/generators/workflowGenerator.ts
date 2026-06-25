import type {
  WeaponClass, WeaponRarity, AtomicStage, WorkflowTile, WorkflowEdge, WorkflowGraph, RolledPatternDraws,
  ContentProductType, AtomicOrigin, DamageType, StatusType,
} from '../../types/game'
import type { PatternStep } from './weaponPatterns'
import { WEAPON_PATTERNS, drawKindOf } from './weaponPatterns'
import { WEAPON_CLASSES, type WeaponClassDef } from './weaponClasses'
import type { SlotKind } from './patternSlots'
import { pickWeighted } from './patternSlots'

// ── Time tables (seconds), keyed by the 6-stage vocabulary ────────────────
// Carried over 1:1 from the old TileType table: research->Research,
// outline->Plan, draft->Produce, edit->Refine, publish->Publish.
// Promote is a later addition — a quick "announce/cross-post" action.

export const STAGE_TIME: Record<AtomicStage, { light: number; heavy: number }> = {
  Research: { light: 300, heavy: 900 },
  Plan:     { light: 240, heavy: 600 },
  Produce:  { light: 600, heavy: 1800 },
  Refine:   { light: 360, heavy: 900 },
  Publish:  { light: 180, heavy: 300 },
  Promote:  { light: 120, heavy: 240 },
}

// ── Tile name generation ──────────────────────────────────────────────────

const STAGE_NAMES: Record<AtomicStage, string[]> = {
  Research: [
    'Find evidence and reference material',
    'Gather examples and data points',
    'Research your topic and sources',
    'Read and annotate your references',
    'Collect supporting material',
  ],
  Plan: [
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
  ],
  Refine: [
    'Cut the fat and tighten sentences',
    'Review and revise the draft',
    'Refine clarity and flow',
    'Polish the language',
    'Edit for concision and impact',
  ],
  Publish: [
    'Finalise and format for publishing',
    'Put it out — commit to publishing',
    'Prepare the final version',
    'Review before hitting publish',
  ],
  Promote: [
    'Share it across your channels',
    'Write the announcement post',
    "Tell your audience it's live",
    'Cross-post to other platforms',
    'Pin it and spread the word',
  ],
}

function pickName(stage: AtomicStage): string {
  const pool = STAGE_NAMES[stage]
  return pool[Math.floor(Math.random() * pool.length)]
}

// Rarity adds extra Produce-tile capacity (applied once, to the first
// Produce phase encountered in a pattern).
const RARITY_EXTRA: Record<WeaponRarity, number> = {
  common: 0, magic: 1, rare: 2, epic: 3, legendary: 4,
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
    rolledDraws, slotCounters: { format: 0, transformation: 0, style: 0, emotion: 0 },
  }
  for (const step of steps) compileStep(step, ctx)
  return { tiles: ctx.tiles, edges: ctx.edges }
}

function compileStep(step: PatternStep, ctx: CompileContext): void {
  switch (step.kind) {
    case 'phase':              return compilePhase(step, ctx)
    case 'drawFormat':         return compileDrawFormat(ctx)
    case 'drawTransformation': return compileDrawTransformation(ctx)
    case 'drawStyle':          return compileDrawStyle(step, ctx)
    case 'drawEmotion':        return compileDrawEmotion(step, ctx)
    case 'branch':             return compileBranch(step, ctx)
    case 'eitherOr':           return compileEitherOr(step, ctx)
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

type DrawValue = ContentProductType | AtomicOrigin | DamageType | StatusType

// Shared tail for every draw kind: format/transformation also retag the
// preceding Research block (and require one to exist — a structural
// pattern requirement, independent of whether a value was actually
// rolled); all 4 kinds append one Plan tile carrying the value.
function applyDrawResult(ctx: CompileContext, kind: SlotKind, value: DrawValue): void {
  if (kind === 'format' || kind === 'transformation') {
    if (ctx.lastResearchBlockTileIds === null) {
      const fnName = kind === 'format' ? 'drawFormat' : 'drawTransformation'
      throw new Error(`${fnName}() in ${ctx.cls.id}'s pattern has no preceding phase('Research', ...) block`)
    }
    for (const id of ctx.lastResearchBlockTileIds) {
      const t = ctx.tiles.find(t => t.id === id)!
      if (kind === 'format') t.content_type = value as ContentProductType
      else t.content_origin = value as AtomicOrigin
    }
  }
  const planTile = makeTile('Plan', ctx.cls.time_mod)
  if (kind === 'format') planTile.content_type = value as ContentProductType
  else if (kind === 'transformation') planTile.content_origin = value as AtomicOrigin
  else if (kind === 'style') planTile.damage_type = value as DamageType
  else planTile.status = value as StatusType
  ctx.tiles.push(planTile)
  linkFrontier(ctx, planTile.id)
  ctx.frontier = [planTile.id]
}

function compileDrawFormat(ctx: CompileContext): void {
  const pool = ctx.cls.supported_products
  const value = ctx.rolledDraws
    ? (ctx.rolledDraws.format[ctx.slotCounters.format++]?.[0] ?? pool[Math.floor(Math.random() * pool.length)])
    : pool[Math.floor(Math.random() * pool.length)]
  applyDrawResult(ctx, 'format', value)
}

function compileDrawTransformation(ctx: CompileContext): void {
  let value: ReturnType<typeof resolveTransformation>
  if (ctx.rolledDraws) {
    value = ctx.rolledDraws.transformation[ctx.slotCounters.transformation++]?.[0] ?? null
  } else {
    value = resolveTransformation(ctx.cls)
  }
  if (value === null) return
  applyDrawResult(ctx, 'transformation', value)
}

function resolveTransformation(cls: WeaponClassDef) {
  const pool = cls.allowed_transformations
  return pool.length === 0 ? null : pool[Math.floor(Math.random() * pool.length)]
}

function compileDrawStyle(step: { probability: number }, ctx: CompileContext): void {
  let value: ReturnType<typeof resolveStyle>
  if (ctx.rolledDraws) {
    value = ctx.rolledDraws.style[ctx.slotCounters.style++]?.[0] ?? null
  } else {
    value = resolveStyle(ctx.cls, step.probability)
  }
  if (value === null) return
  applyDrawResult(ctx, 'style', value)
}

function resolveStyle(cls: WeaponClassDef, probability: number) {
  const pool = cls.base_damage_types
  return (pool.length === 0 || Math.random() >= probability) ? null : pool[Math.floor(Math.random() * pool.length)]
}

function compileDrawEmotion(step: { probability: number }, ctx: CompileContext): void {
  let value: ReturnType<typeof resolveEmotion>
  if (ctx.rolledDraws) {
    value = ctx.rolledDraws.emotion[ctx.slotCounters.emotion++]?.[0] ?? null
  } else {
    value = resolveEmotion(ctx.cls, step.probability)
  }
  if (value === null) return
  applyDrawResult(ctx, 'emotion', value)
}

function resolveEmotion(cls: WeaponClassDef, probability: number) {
  const pool = cls.inherent_status
  return (pool.length === 0 || Math.random() >= probability) ? null : pool[Math.floor(Math.random() * pool.length)]
}

// A pre-rolled instance's rolled_draws already enforces "exactly one
// option non-null" (see patternSlots.ts's resolveGroupState) — every
// option's counter still needs incrementing to stay in lockstep with how
// patternSlots.ts indexed them, even the losing ones. Legacy weapons (no
// rolled_draws) instead do a live weighted pick and only ever resolve the
// winner.
function compileEitherOr(step: { options: { step: PatternStep; weight: number }[] }, ctx: CompileContext): void {
  if (ctx.rolledDraws) {
    let resolvedKind: SlotKind | null = null
    let resolvedValue: DrawValue | null = null
    for (const opt of step.options) {
      const kind = drawKindOf(opt.step)!
      const occ = ctx.slotCounters[kind]++
      const value = ctx.rolledDraws[kind][occ]?.[0] ?? null
      if (value !== null) { resolvedKind = kind; resolvedValue = value }
    }
    if (resolvedKind !== null && resolvedValue !== null) applyDrawResult(ctx, resolvedKind, resolvedValue)
    return
  }
  const winnerIdx = pickWeighted(step.options.map(o => o.weight))
  const winner = step.options[winnerIdx]
  const kind = drawKindOf(winner.step)!
  const value = legacyResolveKind(ctx.cls, kind)
  if (value !== null) applyDrawResult(ctx, kind, value)
}

function legacyResolveKind(cls: WeaponClassDef, kind: SlotKind): DrawValue | null {
  if (kind === 'format') {
    const pool = cls.supported_products
    return pool[Math.floor(Math.random() * pool.length)]
  }
  if (kind === 'transformation') return resolveTransformation(cls)
  if (kind === 'style') return resolveStyle(cls, 1)
  return resolveEmotion(cls, 1)
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
    if (last.type === 'Publish' || last.type === 'Promote') {
      last.name = `${last.type} — break the curse`
    } else {
      console.warn(`Boss workflow for ${weaponClass} ends in ${last.type}, not Publish/Promote`)
    }
  }

  return {
    tiles,
    edges,
    start_id: tiles[0].id,
    end_id:   tiles[tiles.length - 1].id,
  }
}
