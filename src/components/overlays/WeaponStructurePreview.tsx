import { useMemo, useState } from 'react'
import type { WeaponInstance } from '../../types/game'
import { describeWeaponPattern, DRAW_LABEL_KEY, VALUE_BUCKET, type PatternNode } from '../../data/weaponStructure'
import { STAGE_COLOR } from '../../data/tileBadges'
import { spiralLayout, type SpiralPos } from '../../engine/spiralLayout'
import { useT, type TranslationBundle } from '../../i18n'
import s from './WeaponStructurePreview.module.css'

interface Props {
  weapon: WeaponInstance
}

interface FlatItem { id: string; node: PatternNode }
interface Edge { from: string; to: string }

const MARKER_R_PHASE = 8
const MARKER_R_DRAW   = 5
const LANE_GAP        = 34
const SPIRAL_R0       = 20
const SPIRAL_DR       = 26
const SPIRAL_DTHETA   = 1.15
const PAD             = 14

function fmtMin(secs: number): string {
  return `${Math.round(secs / 60)}m`
}

// Flattens the (possibly branching) pattern tree into spiral "layers" — one
// step per top-level node, except a branch which consumes as many steps as
// its longest path and spreads each path across a lane within those steps.
// Edges fan out from the previous step to every lane a branch opens, and
// fan back in from every lane's last item to whatever node follows.
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
  const nodes = useMemo(() => describeWeaponPattern(weapon), [weapon])
  const { layers, edges } = useMemo(() => buildSpiralGraph(nodes), [nodes])

  const centers = useMemo(() => {
    const idLayers = layers.map(layer => layer.map(item => item.id))
    return spiralLayout(idLayers, {
      cx: 0, cy: 0, r0: SPIRAL_R0, dr: SPIRAL_DR, dtheta: SPIRAL_DTHETA, laneGap: LANE_GAP,
    })
  }, [layers])

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const c of centers.values()) {
      minX = Math.min(minX, c.x - MARKER_R_PHASE)
      minY = Math.min(minY, c.y - MARKER_R_PHASE)
      maxX = Math.max(maxX, c.x + MARKER_R_PHASE)
      maxY = Math.max(maxY, c.y + MARKER_R_PHASE)
    }
    if (!Number.isFinite(minX)) return null
    return {
      minX: minX - PAD, minY: minY - PAD,
      width: maxX - minX + PAD * 2, height: maxY - minY + PAD * 2,
    }
  }, [centers])

  const [hover, setHover] = useState<{ node: PatternNode; x: number; y: number } | null>(null)

  function showHover(node: PatternNode) {
    return (e: React.MouseEvent) => setHover({ node, x: e.clientX + 14, y: e.clientY - 10 })
  }

  if (!bounds) return null

  return (
    <div className={s.wrap}>
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        className={s.svg}
        style={{ aspectRatio: `${bounds.width} / ${bounds.height}` }}
      >
        {edges.map((e, i) => {
          const a = centers.get(e.from)
          const b = centers.get(e.to)
          if (!a || !b) return null
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={s.edge} />
        })}
        {layers.flatMap(layer => layer.map(item => {
          const c: SpiralPos | undefined = centers.get(item.id)
          if (!c) return null
          const node = item.node
          if (node.kind === 'phase') {
            return (
              <circle
                key={item.id} cx={c.x} cy={c.y} r={MARKER_R_PHASE}
                className={s.markerPhase} style={{ fill: STAGE_COLOR[node.stage] ?? '#666' }}
                onMouseEnter={showHover(node)} onMouseMove={showHover(node)} onMouseLeave={() => setHover(null)}
              />
            )
          }
          if (node.kind === 'draw') {
            return (
              <circle
                key={item.id} cx={c.x} cy={c.y} r={MARKER_R_DRAW}
                className={s.markerDraw}
                onMouseEnter={showHover(node)} onMouseMove={showHover(node)} onMouseLeave={() => setHover(null)}
              />
            )
          }
          return null
        }))}
      </svg>
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
