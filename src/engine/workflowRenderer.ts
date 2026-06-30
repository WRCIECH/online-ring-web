import type { AtomicStage } from '../types/game'
import { STAGE_COLOR } from '../data/tileBadges'

// ── Tile geometry ─────────────────────────────────────────────────────────────
export const TILE    = 28
export const TILE_RX = 8

export const TILE_LABEL: Record<AtomicStage, string> = {
  Research: 'Research',
  Plan:     'Plan',
  Produce:  'Produce',
  Refine:   'Refine',
  Publish:  'Publish',
  Promote:  'Promote',
}

export type TileState = 'normal' | 'done' | 'locked' | 'selected' | 'reachable'

// ── Edge ─────────────────────────────────────────────────────────────────────
// x1/y1 and x2/y2 are the CENTER coordinates of the source and target nodes.

export function drawEdge(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  isActive = false,
): void {
  const dx   = x2 - x1, dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1
  const nx   = -dy / dist, ny = dx / dist   // left-hand perpendicular
  const bow  = Math.min(32, dist * 0.24)
  const qx   = (x1 + x2) / 2 - nx * bow
  const qy   = (y1 + y2) / 2 - ny * bow

  ctx.beginPath()
  ctx.strokeStyle = isActive ? 'rgba(200,170,60,0.88)' : 'rgba(80,90,200,0.55)'
  ctx.lineWidth   = isActive ? 2.5 : 1.5
  ctx.setLineDash(isActive ? [] : [5, 7])
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(qx, qy, x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
}

// ── Tile ─────────────────────────────────────────────────────────────────────
// x/y are the TOP-LEFT corner of the tile square.
// size defaults to TILE; pass a smaller value for compact previews.
// repeatCount > 0 draws an "×N" badge in the top-right corner.

export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  stage: AtomicStage,
  state: TileState = 'normal',
  size  = TILE,
  repeatCount = 0,
): void {
  const scale    = size / TILE
  const rx       = Math.round(TILE_RX * scale)
  const done     = state === 'done'
  const locked   = state === 'locked'
  const selected = state === 'selected'
  const reach    = state === 'reachable'

  // Background
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, rx)
  ctx.fillStyle = done ? '#171624' : locked ? '#0f0e1c' : STAGE_COLOR[stage] ?? '#333355'
  ctx.fill()

  // Border
  let bc = 'rgba(60,55,130,0.55)', bw = 1
  if (selected)      { bc = '#4a9eff';                bw = 2.5 }
  else if (reach)    { bc = 'rgba(110,175,255,0.9)';  bw = 2   }
  else if (done)     { bc = 'rgba(48,92,52,0.75)';    bw = 1.5 }

  ctx.beginPath()
  ctx.roundRect(x, y, size, size, rx)
  ctx.strokeStyle = bc
  ctx.lineWidth   = bw
  ctx.stroke()

  // Glow (selected / reachable)
  if (selected || reach) {
    ctx.save()
    ctx.shadowColor = selected ? 'rgba(74,158,255,0.6)' : 'rgba(100,170,255,0.4)'
    ctx.shadowBlur  = selected ? 16 : 12
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, rx)
    ctx.strokeStyle = selected ? 'rgba(74,158,255,0.35)' : 'rgba(100,170,255,0.25)'
    ctx.lineWidth   = 1
    ctx.stroke()
    ctx.restore()
  }

  // Center content
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  const cx = x + size / 2
  const cy = y + size / 2

  if (done) {
    ctx.fillStyle = '#3d8845'
    ctx.font      = `bold ${Math.round(13 * scale)}px sans-serif`
    ctx.fillText('✓', cx, cy)
  } else if (locked) {
    // Padlock: shackle arc + body rect
    ctx.strokeStyle = 'rgba(105,98,170,0.88)'
    ctx.lineWidth   = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy - 4 * scale, 4 * scale, Math.PI, 0, false)
    ctx.stroke()
    ctx.beginPath()
    ctx.roundRect(cx - 5 * scale, cy - scale, 10 * scale, 7 * scale, 2)
    ctx.fillStyle   = 'rgba(62,58,128,0.82)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(105,98,170,0.82)'
    ctx.lineWidth   = 1
    ctx.stroke()
  } else {
    ctx.fillStyle = '#c8c0d8'
    ctx.font      = `bold ${Math.round(11 * scale)}px sans-serif`
    ctx.fillText((TILE_LABEL[stage] ?? '?')[0], cx, cy)
  }

  // Repeat badge top-right
  if (repeatCount > 0) {
    ctx.fillStyle    = '#666'
    ctx.font         = `${Math.round(9 * scale)}px monospace`
    ctx.textAlign    = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(`×${repeatCount}`, x + size - 3, y + 3)
  }
}
