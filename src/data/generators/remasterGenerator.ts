import type { WeaponClass, WorkflowGraph, WorkflowTile, WorkflowEdge, AtomicTime } from '../../types/game'
import { WEAPON_PATTERNS } from './weaponPatterns'
import { WEAPON_CLASSES } from './weaponClasses'
import { makeTile } from './workflowGenerator'

const ATOMIC_TIMES: AtomicTime[] = ['Micro', 'Short', 'Medium', 'Long', 'Deep']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// A remaster pass re-tags an already-completed ContentItem along the
// Transformation/Length/Style/Emotion axes without redoing the underlying
// Research/Produce/Refine/Publish work. Shape is derived from the weapon's
// own original pattern: one Transformation + one Length retag always
// (neither axis appears in any original pattern today), plus one Style
// retag per drawStyle() occurrence and one Emotion retag per drawEmotion()
// occurrence in that weapon's WEAPON_PATTERNS entry — classes whose
// pattern draws Style twice (e.g. the spear group) get two Style retags.
// Every tile is a standalone 'Plan' tile, forced (no probability roll —
// remastering is a deliberate choice), chained linearly with no branching.
export function generateRemasterWorkflow(weaponClass: WeaponClass): WorkflowGraph {
  const cls = WEAPON_CLASSES[weaponClass]
  const original = WEAPON_PATTERNS[weaponClass]
  const styleCount = original.filter(s => s.kind === 'drawStyle').length
  const emotionCount = original.filter(s => s.kind === 'drawEmotion').length

  const tiles: WorkflowTile[] = []
  const edges: WorkflowEdge[] = []

  function push(tile: WorkflowTile): void {
    if (tiles.length > 0) edges.push({ from: tiles[tiles.length - 1].id, to: tile.id })
    tiles.push(tile)
  }

  const transformTile = makeTile('Plan')
  transformTile.content_origin = pick(cls.allowed_transformations)
  push(transformTile)

  const lengthTile = makeTile('Plan')
  lengthTile.time_budget = pick(ATOMIC_TIMES)
  push(lengthTile)

  for (let i = 0; i < styleCount; i++) {
    const t = makeTile('Plan')
    if (cls.base_damage_types.length > 0) t.damage_type = pick(cls.base_damage_types)
    push(t)
  }

  for (let i = 0; i < emotionCount; i++) {
    const t = makeTile('Plan')
    if (cls.inherent_status) t.status = cls.inherent_status
    push(t)
  }

  return {
    tiles,
    edges,
    start_id: tiles[0].id,
    end_id: tiles[tiles.length - 1].id,
  }
}
