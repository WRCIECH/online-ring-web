import type { AtomicStage, WorkflowTile, WorkflowGraph, ContentProductType, EmotionType } from '../types/game'
import type { TranslationBundle } from '../i18n/types'
import { CONTENT_TYPE_STATS } from './contentTypeScaling'
import { STATUS_TYPE_STATS } from './statusTypeScaling'

export const STAGE_COLOR: Record<AtomicStage, string> = {
  Research: '#334488',
  Plan:     '#335566',
  Produce:  '#664422',
  Refine:   '#445533',
}

export interface TileBadge {
  key: string
  label: string
  detail?: string   // hover text — translated description when `t` is passed, else "Scales with X + Y"
  color?: string
}

function statsLine(stats: string[]): string {
  return stats.length === 0 ? 'Starting point' : `Scales with ${stats.join(' + ')}`
}

export interface EffectiveTags {
  content_type?: ContentProductType
  status?:       EmotionType
}

// Once a content dimension is introduced on a tile (e.g. content_type
// "LiveStream" drawn at the Research→Plan step), it describes the piece as a
// whole from that point on — every later tile inherits it for display, so the
// player keeps seeing what they committed to even though only the
// introducing tile actually carries the field. Walked in topological order so
// branch/merge shapes (e.g. Fist) resolve correctly.
export function computeEffectiveTags(workflow: WorkflowGraph): Map<string, EffectiveTags> {
  const result = new Map<string, EffectiveTags>()
  const tileById = new Map(workflow.tiles.map(t => [t.id, t]))
  const predecessorsOf = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  for (const tile of workflow.tiles) indegree.set(tile.id, 0)
  for (const e of workflow.edges) {
    predecessorsOf.set(e.to, [...(predecessorsOf.get(e.to) ?? []), e.from])
    indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1)
  }

  const queue: string[] = workflow.tiles.filter(t => (indegree.get(t.id) ?? 0) === 0).map(t => t.id)
  const processed = new Set<string>()
  while (queue.length > 0) {
    const id = queue.shift()!
    if (processed.has(id)) continue
    processed.add(id)
    const tile = tileById.get(id)
    if (!tile) continue

    const preds = predecessorsOf.get(id) ?? []
    const inherited = preds.length > 0 ? result.get(preds[0]) ?? {} : {}
    result.set(id, {
      content_type: tile.content_type ?? inherited.content_type,
      status:       tile.status       ?? inherited.status,
    })

    for (const e of workflow.edges) {
      if (e.from !== id) continue
      const newDeg = (indegree.get(e.to) ?? 0) - 1
      indegree.set(e.to, newDeg)
      if (newDeg <= 0) queue.push(e.to)
    }
  }
  return result
}

// "What are we about to do" badges for a tile: stage first (colored, e.g.
// Research), then whichever content dimensions apply (content type, origin,
// damage type, status) — e.g. Livestream, Similar, Lightning, Hope. Pass
// `effective` (from computeEffectiveTags) to include dimensions introduced
// earlier in the workflow and still in force; omit it to show only what's
// tagged directly on this tile. Pass `t` (useT()) to label status/damage-type
// badges with the player-facing translated badge_label (e.g. "Nadzieja"
// instead of the internal "Hope") and to fill `detail` with the translated
// flavour description (falls back to the mechanical "Scales with X" hint
// when no translation entry exists, e.g. for an unmapped key).
export function getTileBadges(tile: WorkflowTile, effective?: EffectiveTags, t?: TranslationBundle): TileBadge[] {
  const tags: EffectiveTags = effective ?? tile
  const stageDetail = t?.content.stage[tile.type]?.detail
  const badges: TileBadge[] = [
    { key: 'stage', label: tile.type, color: STAGE_COLOR[tile.type], detail: stageDetail },
  ]
  if (tags.content_type) {
    const info   = CONTENT_TYPE_STATS[tags.content_type]
    const entry  = t?.content.product[tags.content_type]
    badges.push({ key: 'contentType', label: entry?.badge_label ?? info.label, detail: entry?.detail ?? statsLine(info.stats) })
  }
  if (tags.status) {
    const info  = STATUS_TYPE_STATS[tags.status]
    const entry = t?.content.emotion[tags.status]
    badges.push({ key: 'status', label: entry?.badge_label ?? info.label, detail: entry?.detail ?? statsLine(info.stats) })
  }
  return badges
}
