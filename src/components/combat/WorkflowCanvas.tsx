import { useEffect, useLayoutEffect, useRef, useMemo, useState, useCallback } from 'react'
import type { WorkflowGraph, WorkflowTile, SublocationType, MobAffinities } from '../../types/game'
import { getReachableTiles, REPEAT_DAMAGE_PENALTY } from '../../engine/combat'
import { getTileBadges, computeEffectiveTags } from '../../data/tileBadges'
import { spiralLayout } from '../../engine/spiralLayout'
import { drawEdge, drawTile, TILE, type TileState } from '../../engine/workflowRenderer'
import EnemyCenterpiece from './EnemyCenterpiece'
import { useT } from '../../i18n'
import s from './WorkflowCanvas.module.css'

export interface EnemyOverlayProps {
  enemyId: string
  name: string
  description: string
  hp: number
  maxHp: number
  isBoss: boolean
  sublocationtype?: SublocationType
  affinities?: MobAffinities
}

interface Props {
  workflow:      WorkflowGraph
  selectedTileId: string | null
  onSelectTile:  (id: string, screenX: number, screenY: number) => void
  enemy?:        EnemyOverlayProps
}

// ── Layout constants ──────────────────────────────────────────────────────
const H_GAP   = 8    // gap between tiles sharing a spiral step (branch lanes)
const PAD     = 20
const MIN_W   = 100

// Spiral step constants — DR must clear TILE + H_GAP so consecutive coils
// don't overlap; DTHETA chosen so the coil opens up steadily. R0 is pushed
// out past MOB_FOOTPRINT_R so the first ring of tiles clears the enemy
// centerpiece sitting at the spiral's origin.
const SPIRAL_R0     = 125
const SPIRAL_DR     = 9
const SPIRAL_DTHETA = 0.65
const MOB_FOOTPRINT_R = 100

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const sc = secs % 60
  return m > 0 ? (sc > 0 ? `${m}m ${sc}s` : `${m}m`) : `${sc}s`
}

// ── Layout ────────────────────────────────────────────────────────────────

interface Pos { x: number; y: number }

function layoutGraph(graph: WorkflowGraph): {
  positions: Map<string, Pos>
  canvasW: number
  canvasH: number
  center: Pos
} {
  const layer = new Map<string, number>()
  const queue = [graph.start_id]
  layer.set(graph.start_id, 0)
  const visited = new Set([graph.start_id])

  while (queue.length > 0) {
    const cur  = queue.shift()!
    const curL = layer.get(cur) ?? 0
    for (const e of graph.edges) {
      if (e.from === cur && !visited.has(e.to)) {
        visited.add(e.to)
        layer.set(e.to, curL + 1)
        queue.push(e.to)
      }
    }
  }

  const byLayer = new Map<number, string[]>()
  for (const t of graph.tiles) {
    const l   = layer.get(t.id) ?? 0
    const arr = byLayer.get(l) ?? []
    arr.push(t.id)
    byLayer.set(l, arr)
  }

  const numLayers = Math.max(...byLayer.keys()) + 1
  const layersArr: string[][] = []
  for (let l = 0; l < numLayers; l++) layersArr.push(byLayer.get(l) ?? [])

  const centers = spiralLayout(layersArr, {
    cx: 0, cy: 0,
    r0: SPIRAL_R0, dr: SPIRAL_DR, dtheta: SPIRAL_DTHETA,
    laneGap: TILE + H_GAP,
  })

  let minX = -MOB_FOOTPRINT_R, minY = -MOB_FOOTPRINT_R
  let maxX = MOB_FOOTPRINT_R,  maxY = MOB_FOOTPRINT_R
  for (const c of centers.values()) {
    minX = Math.min(minX, c.x - TILE / 2)
    minY = Math.min(minY, c.y - TILE / 2)
    maxX = Math.max(maxX, c.x + TILE / 2)
    maxY = Math.max(maxY, c.y + TILE / 2)
  }

  const canvasW = Math.max(MIN_W, maxX - minX + PAD * 2)
  const canvasH = maxY - minY + PAD * 2

  const positions = new Map<string, Pos>()
  for (const [id, c] of centers) {
    positions.set(id, {
      x: c.x - TILE / 2 - minX + PAD,
      y: c.y - TILE / 2 - minY + PAD,
    })
  }

  const center: Pos = { x: -minX + PAD, y: -minY + PAD }

  return { positions, canvasW, canvasH, center }
}

// ── Renderer ──────────────────────────────────────────────────────────────

function render(
  ctx: CanvasRenderingContext2D,
  graph: WorkflowGraph,
  positions: Map<string, Pos>,
  canvasW: number,
  canvasH: number,
  selectedTileId: string | null,
  reachable: Set<string>,
): void {
  ctx.clearRect(0, 0, canvasW, canvasH)

  // Edges
  for (const e of graph.edges) {
    const from = positions.get(e.from)
    const to   = positions.get(e.to)
    if (!from || !to) continue
    const fromTile = graph.tiles.find(t => t.id === e.from)
    const toTile   = graph.tiles.find(t => t.id === e.to)
    drawEdge(
      ctx,
      from.x + TILE / 2, from.y + TILE / 2,
      to.x   + TILE / 2, to.y   + TILE / 2,
      !!fromTile?.is_completed && !toTile?.is_completed,
    )
  }

  // Tiles
  for (const tile of graph.tiles) {
    const p = positions.get(tile.id)
    if (!p) continue
    const done  = tile.is_completed
    const reach = reachable.has(tile.id)
    let state: TileState
    if (tile.id === selectedTileId) state = 'selected'
    else if (done)                   state = 'done'
    else if (!reach)                 state = 'locked'
    else                             state = 'reachable'
    drawTile(ctx, p.x, p.y, tile.type, state, TILE, tile.repeat_count)
  }
}

// ── Zoom / pan ────────────────────────────────────────────────────────────
const MIN_SCALE = 0.4
const MAX_SCALE = 2.2
const ZOOM_STEP = 1.08
const DRAG_THRESHOLD = 4

interface ViewState { scale: number; x: number; y: number }
interface DragState { startX: number; startY: number; viewX: number; viewY: number; moved: boolean }

// ── Component ─────────────────────────────────────────────────────────────

export default function WorkflowCanvas({ workflow, selectedTileId, onSelectTile, enemy }: Props) {
  const t = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<{ tile: WorkflowTile; cx: number; cy: number } | null>(null)
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const dragRef = useRef<DragState | null>(null)

  const { positions, canvasW, canvasH, center } = useMemo(
    () => layoutGraph(workflow),
    [workflow.tiles.length, workflow.edges.length],
  )
  const reachable = useMemo(() => getReachableTiles(workflow), [workflow])
  const effectiveTags = useMemo(() => computeEffectiveTags(workflow), [workflow])

  // Reset pan/zoom to a fit-the-whole-spiral view only when a genuinely new
  // workflow graph starts — the start tile id stays stable across
  // tile-completion updates within one fight. useLayoutEffect (not
  // useEffect) so the fitted view applies before paint, avoiding a one-frame
  // flash at the previous zoom/pan.
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const fitScale = Math.min(rect.width / canvasW, rect.height / canvasH, 1)
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitScale))
    setView({
      scale,
      x: canvasW / 2 - center.x * scale,
      y: rect.height / 2 - center.y * scale,
    })
  }, [workflow.start_id, canvasW, canvasH])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr      = window.devicePixelRatio || 1
    canvas.width   = canvasW * dpr
    canvas.height  = canvasH * dpr
    ctx.scale(dpr, dpr)
    render(ctx, workflow, positions, canvasW, canvasH, selectedTileId, reachable)
  }, [workflow, positions, canvasW, canvasH, selectedTileId, reachable])

  // Pan via left-mouse-button drag, captured at the window level so the
  // drag keeps tracking even if the cursor leaves the canvas.
  useEffect(() => {
    if (!isPanning) return
    function onMove(e: MouseEvent) {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) d.moved = true
      setView(v => ({ ...v, x: d.viewX + dx, y: d.viewY + dy }))
    }
    function onUp() { setIsPanning(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning])

  function handleViewportMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y, moved: false }
    setIsPanning(true)
    setHovered(null)
  }

  // Attached as a native, non-passive listener — React's synthetic onWheel
  // is passive by default, so preventDefault() inside it is a silent no-op.
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect   = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    setView(v => {
      const factor   = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const ratio    = 1 - newScale / v.scale
      return { scale: newScale, x: v.x + mouseX * ratio, y: v.y + mouseY * ratio }
    })
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  function hitTest(e: React.MouseEvent<HTMLCanvasElement>): WorkflowTile | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect   = canvas.getBoundingClientRect()
    const sx     = canvasW / rect.width
    const sy     = canvasH / rect.height
    const mx     = (e.clientX - rect.left) * sx
    const my     = (e.clientY - rect.top)  * sy
    for (const tile of workflow.tiles) {
      const p = positions.get(tile.id)
      if (p && mx >= p.x && mx <= p.x + TILE && my >= p.y && my <= p.y + TILE) return tile
    }
    return null
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragRef.current?.moved) { dragRef.current = null; return }
    dragRef.current = null
    const tile = hitTest(e)
    if (!tile) return
    const canvas = canvasRef.current
    const p = positions.get(tile.id)
    if (!canvas || !p) return
    const rect = canvas.getBoundingClientRect()
    const sx   = rect.width  / canvasW
    const sy   = rect.height / canvasH
    const screenX = rect.left + (p.x + TILE / 2) * sx
    const screenY = rect.top  + (p.y + TILE / 2) * sy
    onSelectTile(tile.id, screenX, screenY)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragRef.current) return
    const tile = hitTest(e)
    if (tile) setHovered({ tile, cx: e.clientX + 16, cy: e.clientY - 8 })
    else setHovered(null)
  }

  const canvasCursor = isPanning
    ? 'grabbing'
    : hovered && (hovered.tile.is_completed || reachable.has(hovered.tile.id))
      ? 'pointer'
      : 'grab'

  return (
    <div
      ref={viewportRef}
      className={s.viewport}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onMouseDown={handleViewportMouseDown}
    >
      <div
        className={s.stage}
        style={{
          width: canvasW, height: canvasH,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
        }}
      >
        <canvas
          ref={canvasRef}
          className={s.canvas}
          style={{ width: canvasW, height: canvasH, cursor: canvasCursor }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        />
        {enemy && (
          <EnemyCenterpiece
            x={center.x} y={center.y}
            enemyId={enemy.enemyId}
            name={enemy.name}
            description={enemy.description}
            hp={enemy.hp}
            maxHp={enemy.maxHp}
            isBoss={enemy.isBoss}
            sublocationtype={enemy.sublocationtype}
            affinities={enemy.affinities}
          />
        )}
      </div>
      {hovered && (() => {
        const hovBadges = getTileBadges(hovered.tile, effectiveTags.get(hovered.tile.id), t)
        return (
        <div className={s.tooltip} style={{ left: hovered.cx, top: hovered.cy }}>
          <div className={s.ttBadgeRow}>
            {hovBadges.map(b => (
              <span
                key={b.key}
                className={s.ttBadge}
                style={b.color ? { borderColor: b.color, color: b.color } : undefined}
              >
                {b.label}
              </span>
            ))}
          </div>
          {hovBadges.filter(b => b.detail).map(b => (
            <div key={b.key} className={s.ttBadgeDetail}>
              <span className={s.ttBadgeDetailLabel}>{b.label}:</span> {b.detail}
            </div>
          ))}
          {hovered.tile.is_completed && (
            <>
              <span className={s.ttDone}>✓ Completed — repeat allowed</span>
              <span className={s.ttRepeat}>−{Math.round(REPEAT_DAMAGE_PENALTY * 100)}% dmg penalty</span>
              <span className={s.ttTimes}>
                Light {fmtTime(hovered.tile.time_light)} · Heavy {fmtTime(hovered.tile.time_heavy)}
              </span>
            </>
          )}
          {!hovered.tile.is_completed && !reachable.has(hovered.tile.id) && (
            <span className={s.ttLocked}>Locked — complete previous tiles first</span>
          )}
          {!hovered.tile.is_completed && reachable.has(hovered.tile.id) && (
            <span className={s.ttTimes}>
              Light {fmtTime(hovered.tile.time_light)} · Heavy {fmtTime(hovered.tile.time_heavy)}
            </span>
          )}
        </div>
        )
      })()}
    </div>
  )
}
