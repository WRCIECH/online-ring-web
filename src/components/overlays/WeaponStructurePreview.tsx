import { useMemo, useState, useEffect, useRef } from 'react'
import type { WeaponInstance, AtomicStage } from '../../types/game'
import { describeWeaponPattern, DRAW_LABEL_KEY, VALUE_BUCKET, type PatternNode } from '../../data/weaponStructure'
import { spiralLayout, type SpiralPos } from '../../engine/spiralLayout'
import { drawEdge, drawTile } from '../../engine/workflowRenderer'
import { useT, type TranslationBundle } from '../../i18n'
import s from './WeaponStructurePreview.module.css'

interface Props { weapon: WeaponInstance }

interface FlatItem { id: string; node: PatternNode }
interface Edge { from: string; to: string }

const NODE_SIZE  = 18   // tile size in the compact preview (vs TILE=28 in combat)
const DRAW_SIZE  = 10   // gold square for unresolved draw nodes
const LANE_GAP   = 34
const SPIRAL_R0  = 20
const SPIRAL_DR  = 26
const SPIRAL_DTHETA = 1.15
const PAD        = 14

function fmtMin(secs: number): string {
  return `${Math.round(secs / 60)}m`
}

function buildSpiralGraph(nodes: PatternNode[]): { layers: FlatItem[][]; edges: Edge[] } {
  const layers: FlatItem[][] = []
  const edges: Edge[] = []
  let counter = 0
  const nextId = () => `n${counter++}`
  let frontier: string[] = []

  for (const node of nodes) {
    if (node.kind === 'branch') {
      const chains = node.paths.map(path => path.map(n => ({ id: nextId(), node: n })))
      const maxLen = Math.max(0, ...chains.map(c => c.length))
      for (let i = 0; i < maxLen; i++) {
        const layer: FlatItem[] = []
        for (const chain of chains) if (chain[i]) layer.push(chain[i])
        layers.push(layer)
      }
      for (const chain of chains) {
        if (chain.length === 0) continue
        for (const fid of frontier) edges.push({ from: fid, to: chain[0].id })
        for (let i = 0; i < chain.length - 1; i++) edges.push({ from: chain[i].id, to: chain[i + 1].id })
      }
      const nextFrontier = chains.map(c => c[c.length - 1]?.id).filter((x): x is string => !!x)
      if (nextFrontier.length > 0) frontier = nextFrontier
    } else {
      const item: FlatItem = { id: nextId(), node }
      layers.push([item])
      for (const fid of frontier) edges.push({ from: fid, to: item.id })
      frontier = [item.id]
    }
  }
  return { layers, edges }
}

function tooltipText(node: PatternNode, t: TranslationBundle): { title: string; sub?: string } {
  if (node.kind === 'phase') {
    const countLabel = node.min === node.max ? `×${node.min}` : `×${node.min}–${node.max}`
    return {
      title: t.content.stage[node.stage]?.badge_label ?? node.stage,
      sub: `${countLabel} · ${fmtMin(node.lightSec)} / ${fmtMin(node.heavySec)}`,
    }
  }
  if (node.kind === 'draw') {
    const bucket = t.content[VALUE_BUCKET[node.label]] as Record<string, { badge_label: string }>
    const resolvedLabel = bucket[node.value]?.badge_label
    return { title: t.ui[DRAW_LABEL_KEY[node.label]] ?? node.label, sub: resolvedLabel }
  }
  return { title: '' }
}

export default function WeaponStructurePreview({ weapon }: Props) {
  const t = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const nodes = useMemo(() => describeWeaponPattern(weapon), [weapon])
  const { layers, edges } = useMemo(() => buildSpiralGraph(nodes), [nodes])

  const centers = useMemo(() => {
    const idLayers = layers.map(layer => layer.map(item => item.id))
    return spiralLayout(idLayers, {
      cx: 0, cy: 0, r0: SPIRAL_R0, dr: SPIRAL_DR, dtheta: SPIRAL_DTHETA, laneGap: LANE_GAP,
    })
  }, [layers])

  // Flat item list for hit-testing
  const flatItems = useMemo(() => layers.flat(), [layers])

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const half = Math.max(NODE_SIZE, DRAW_SIZE) / 2
    for (const c of centers.values()) {
      minX = Math.min(minX, c.x - half)
      minY = Math.min(minY, c.y - half)
      maxX = Math.max(maxX, c.x + half)
      maxY = Math.max(maxY, c.y + half)
    }
    if (!Number.isFinite(minX)) return null
    return {
      minX: minX - PAD, minY: minY - PAD,
      width:  maxX - minX + PAD * 2,
      height: maxY - minY + PAD * 2,
    }
  }, [centers])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !bounds) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = bounds.width  * dpr
    canvas.height = bounds.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, bounds.width, bounds.height)

    const ox = -bounds.minX   // canvas origin offset
    const oy = -bounds.minY

    // Edges
    for (const e of edges) {
      const a = centers.get(e.from)
      const b = centers.get(e.to)
      if (!a || !b) continue
      drawEdge(ctx, a.x + ox, a.y + oy, b.x + ox, b.y + oy, false)
    }

    // Nodes
    for (const item of flatItems) {
      const c: SpiralPos | undefined = centers.get(item.id)
      if (!c) continue
      const cx = c.x + ox
      const cy = c.y + oy

      if (item.node.kind === 'phase') {
        drawTile(ctx, cx - NODE_SIZE / 2, cy - NODE_SIZE / 2, item.node.stage as AtomicStage, 'normal', NODE_SIZE)
      } else if (item.node.kind === 'draw') {
        // Gold square for unresolved random-draw steps
        const half = DRAW_SIZE / 2
        ctx.beginPath()
        ctx.roundRect(cx - half, cy - half, DRAW_SIZE, DRAW_SIZE, 3)
        ctx.fillStyle   = 'rgba(200,165,50,0.85)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(200,165,50,0.5)'
        ctx.lineWidth   = 1
        ctx.stroke()
      }
    }
  }, [bounds, centers, edges, flatItems])

  const [hover, setHover] = useState<{ node: PatternNode; x: number; y: number } | null>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!bounds || !canvasRef.current) return
    const rect  = canvasRef.current.getBoundingClientRect()
    const sx    = bounds.width  / rect.width
    const sy    = bounds.height / rect.height
    const mx    = (e.clientX - rect.left)  * sx + bounds.minX
    const my    = (e.clientY - rect.top)   * sy + bounds.minY

    let nearest: PatternNode | null = null
    let bestDist = 12  // pixel threshold for hit
    for (const item of flatItems) {
      const c = centers.get(item.id)
      if (!c) continue
      const d = Math.hypot(mx - c.x, my - c.y)
      if (d < bestDist) { bestDist = d; nearest = item.node }
    }
    if (nearest) setHover({ node: nearest, x: e.clientX + 14, y: e.clientY - 10 })
    else setHover(null)
  }

  if (!bounds) return null

  return (
    <div className={s.wrap}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: bounds.width, height: bounds.height, maxWidth: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover && (() => {
        const { title, sub } = tooltipText(hover.node, t)
        return (
          <div className={s.tooltip} style={{ left: hover.x, top: hover.y }}>
            <div className={s.tooltipTitle}>{title}</div>
            {sub && <div className={s.tooltipSub}>{sub}</div>}
          </div>
        )
      })()}
    </div>
  )
}
