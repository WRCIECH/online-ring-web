import type { WeaponClass, WorkflowGraph, WorkflowTile, WorkflowEdge, RolledPatternDraws } from '../../types/game'
import { WEAPON_PATTERNS } from './weaponPatterns'
import { WEAPON_CLASSES } from './weaponClasses'
import { makeTile, tid } from './workflowGenerator'
import { ATOMIC_TIMES, countSlotsByKind } from './patternSlots'

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// A remaster pass re-tags an already-completed ContentItem along the
// Format/Transformation/Length/Style/Emotion axes without redoing the
// underlying Research/Produce/Refine/Publish work. Shape is derived from
// the weapon's own original pattern: one Format + one Transformation + one
// Length retag always (none of those three axes appear in any original
// pattern today), plus one Style retag per drawStyle() occurrence and one
// Emotion retag per drawEmotion() occurrence in that weapon's
// WEAPON_PATTERNS entry — classes whose pattern draws Style twice (e.g.
// the spear group) get two Style retags. Every tile is a standalone 'Plan'
// tile, forced (no probability roll — remastering is a deliberate choice),
// chained linearly with no branching. When `rolledDraws` is present (i.e.
// this weapon instance was created after the fixed-per-instance-draws
// feature shipped), Format/Style/Emotion values come from their pre-rolled
// `stateIndex` state instead of a fresh roll; Length comes from its single
// fixed value. Falls back to fresh `pick()` rolls when absent (legacy
// weapon instances).
export function generateRemasterWorkflow(
  weaponClass: WeaponClass,
  rolledDraws?: RolledPatternDraws,
  stateIndex = 0,
): WorkflowGraph {
  const cls = WEAPON_CLASSES[weaponClass]
  const pattern = WEAPON_PATTERNS[weaponClass]
  const counts = countSlotsByKind(pattern)

  const tiles: WorkflowTile[] = []
  const edges: WorkflowEdge[] = []

  function push(tile: WorkflowTile): void {
    if (tiles.length > 0) edges.push({ from: tiles[tiles.length - 1].id, to: tile.id })
    tiles.push(tile)
  }

  for (let i = 0; i < counts.format; i++) {
    const t = makeTile('Plan', cls.time_mod)
    t.content_type = rolledDraws
      ? (rolledDraws.format[i]?.[stateIndex] ?? undefined)
      : pick(cls.supported_products)
    push(t)
  }

  const transformTile = makeTile('Plan', cls.time_mod)
  transformTile.content_origin = rolledDraws
    ? (rolledDraws.transformation[0]?.[stateIndex] ?? undefined)
    : pick(cls.allowed_transformations)
  push(transformTile)

  const lengthTile = makeTile('Plan', cls.time_mod)
  lengthTile.time_budget = rolledDraws ? rolledDraws.length : pick(ATOMIC_TIMES)
  push(lengthTile)

  for (let i = 0; i < counts.style; i++) {
    const t = makeTile('Plan', cls.time_mod)
    if (rolledDraws) {
      t.style_type = rolledDraws.style[i]?.[stateIndex] ?? undefined
    } else if (cls.styles.length > 0) {
      t.style_type = pick(cls.styles)
    }
    push(t)
  }

  for (let i = 0; i < counts.emotion; i++) {
    const t = makeTile('Plan', cls.time_mod)
    if (rolledDraws) {
      t.status = rolledDraws.emotion[i]?.[stateIndex] ?? undefined
    } else if (cls.emotions.length > 0) {
      t.status = pick(cls.emotions)
    }
    push(t)
  }

  return {
    tiles,
    edges,
    start_id: tiles[0].id,
    end_id: tiles[tiles.length - 1].id,
  }
}

// Re-tags an already-played workflow in place: same tiles, same edges, same
// stage shape — only content_type / content_origin / style_type / status
// get redrawn, and only on the tiles that originally carried that dimension.
// This is what a remaster pass should use whenever the content item has a
// snapshot of its prior workflow (ContentItem.last_workflow); it keeps the
// full Research→Produce→Refine→Publish structure intact instead of
// collapsing to the short Plan-only retag chain generateRemasterWorkflow()
// produces for content that has never been played (no snapshot yet).
// When `rolledDraws` is present, content_type/content_origin/style_type/
// status are all reassigned from `rolledDraws`' per-occurrence state
// sequence at `stateIndex`, consumed in tile storage order (which matches
// pattern-traversal order 1:1 for these four, each occurrence tagging
// exactly one tile). Falls back to fresh `pick()` rolls per tile when
// absent (legacy weapon instances).
export function regenerateWorkflowKeepingStructure(
  original: WorkflowGraph,
  weaponClass: WeaponClass,
  rolledDraws?: RolledPatternDraws,
  stateIndex = 0,
): WorkflowGraph {
  const cls = WEAPON_CLASSES[weaponClass]
  const idMap = new Map<string, string>()
  const counters = { format: 0, transformation: 0, style: 0, emotion: 0 }

  const tiles: WorkflowTile[] = original.tiles.map(orig => {
    const newId = tid()
    idMap.set(orig.id, newId)
    const tile: WorkflowTile = {
      id: newId,
      type: orig.type,
      name: orig.name,
      time_light: orig.time_light,
      time_heavy: orig.time_heavy,
      is_completed: false,
      repeat_count: 0,
    }
    if (orig.content_type) {
      tile.content_type = rolledDraws
        ? (rolledDraws.format[counters.format++]?.[stateIndex] ?? undefined)
        : pick(cls.supported_products)
    }
    if (orig.content_origin) {
      tile.content_origin = rolledDraws
        ? (rolledDraws.transformation[counters.transformation++]?.[stateIndex] ?? undefined)
        : pick(cls.allowed_transformations)
    }
    if (orig.style_type) {
      if (rolledDraws) {
        tile.style_type = rolledDraws.style[counters.style++]?.[stateIndex] ?? undefined
      } else if (cls.styles.length > 0) {
        tile.style_type = pick(cls.styles)
      }
    }
    if (orig.status) {
      if (rolledDraws) {
        tile.status = rolledDraws.emotion[counters.emotion++]?.[stateIndex] ?? undefined
      } else if (cls.emotions.length > 0) {
        tile.status = pick(cls.emotions)
      }
    }
    return tile
  })

  const edges: WorkflowEdge[] = original.edges.map(e => ({
    from: idMap.get(e.from)!,
    to:   idMap.get(e.to)!,
  }))

  return {
    tiles,
    edges,
    start_id: idMap.get(original.start_id)!,
    end_id:   idMap.get(original.end_id)!,
  }
}
