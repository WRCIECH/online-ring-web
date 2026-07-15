import { useMemo, useState, useEffect, useRef } from 'react'
import type { WeaponInstance, ContentProductType, AtomicOrigin, StyleType } from '../../types/game'
import { describeWeaponPattern, DRAW_LABEL_KEY, VALUE_BUCKET, type PatternNode, type DrawNode } from '../../data/weaponStructure'
import { spiralLayout, type SpiralPos } from '../../engine/spiralLayout'
import { drawEdge, drawTile } from '../../engine/workflowRenderer'
import { useT, type TranslationBundle } from '../../i18n'
import s from './WeaponStructurePreview.module.css'

interface Props { weapon: WeaponInstance }

interface FlatItem { id: string; node: PatternNode }
interface Edge { from: string; to: string }

const NODE_SIZE     = 18
const LANE_GAP      = 34
const SPIRAL_R0     = 20
const SPIRAL_DR     = 26
const SPIRAL_DTHETA = 1.15
const PAD           = 14

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

// ── Draw node icons ───────────────────────────────────────────────────────────

const FORMAT_BG: Partial<Record<ContentProductType, string>> = {
  Plaintext:          '#1e2f58',
  StructuredText:     '#1e2f58',
  IllustratedText:    '#1e2f58',
  SingleGraphic:      '#153d35',
  Carousel:           '#153d35',
  Infographic:        '#153d35',
  RawAudio:           '#300f52',
  ProducedAudio:      '#300f52',
  ARollVideo:         '#4a1208',
  SlideshowVideo:     '#4a1208',
  Screencast:         '#4a1208',
  CinematicVideo:     '#4a1208',
  MotionGraphics:     '#4a1208',
  LiveStream:         '#3d2e00',
  MultimediaPage:     '#3d2e00',
  BranchingNarrative: '#3d2e00',
  AssetPack:          '#3d2e00',
  CurationFeed:       '#3d2e00',
  CommunitySpace:     '#3d2e00',
  InteractiveApp:     '#3d2e00',
  _blank:             '#202020',
}

const ICON_C = 'rgba(220,210,255,0.88)'

function drawFormatIcon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  value: ContentProductType,
): void {
  const sc = size / 18
  ctx.strokeStyle = ICON_C
  ctx.fillStyle   = ICON_C
  ctx.lineWidth   = 1 * sc

  switch (value) {
    // ── Text ──────────────────────────────────────────────────────────────
    case 'Plaintext':
      for (const dy of [-3, 0, 3]) {
        ctx.beginPath(); ctx.moveTo(cx - 5*sc, cy + dy*sc); ctx.lineTo(cx + 5*sc, cy + dy*sc); ctx.stroke()
      }
      break

    case 'StructuredText':
      for (const dy of [-3, 0, 3]) {
        ctx.beginPath(); ctx.arc(cx - 4.5*sc, cy + dy*sc, 0.8*sc, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.moveTo(cx - 2.5*sc, cy + dy*sc); ctx.lineTo(cx + 5*sc, cy + dy*sc); ctx.stroke()
      }
      break

    case 'IllustratedText':
      ctx.strokeRect(cx - 4*sc, cy - 5*sc, 8*sc, 4.5*sc)
      ctx.beginPath(); ctx.moveTo(cx - 5*sc, cy + 1*sc); ctx.lineTo(cx + 5*sc, cy + 1*sc); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 5*sc, cy + 4*sc); ctx.lineTo(cx + 3*sc, cy + 4*sc); ctx.stroke()
      break

    // ── Visual ────────────────────────────────────────────────────────────
    case 'SingleGraphic':
      ctx.strokeRect(cx - 5*sc, cy - 5*sc, 10*sc, 10*sc)
      ctx.beginPath()
      ctx.moveTo(cx - 3*sc, cy + 3*sc)
      ctx.lineTo(cx, cy - 2*sc)
      ctx.lineTo(cx + 3*sc, cy + 3*sc)
      ctx.stroke()
      break

    case 'Carousel':
      ctx.strokeRect(cx - 4*sc, cy - 4*sc, 8*sc, 6*sc)
      ctx.beginPath()
      ctx.moveTo(cx - 3*sc, cy + 3*sc)
      ctx.lineTo(cx + 5*sc, cy + 3*sc)
      ctx.lineTo(cx + 5*sc, cy - 3*sc)
      ctx.stroke()
      break

    case 'Infographic':
      for (let i = 0; i < 3; i++) {
        const h = (2.5 + i * 1.8) * sc
        const bx = cx + (i - 1) * 3.5 * sc
        ctx.fillRect(bx - 1.2*sc, cy + 5*sc - h, 2.4*sc, h)
      }
      break

    // ── Audio ─────────────────────────────────────────────────────────────
    case 'RawAudio': {
      const wPts = [-5, 0, -3, -4, -1, 4, 1, -4, 3, 4, 5, 0]
      ctx.beginPath()
      ctx.moveTo(cx + wPts[0]*sc, cy + wPts[1]*sc)
      for (let i = 2; i < wPts.length; i += 2) ctx.lineTo(cx + wPts[i]*sc, cy + wPts[i+1]*sc)
      ctx.stroke()
      break
    }

    case 'ProducedAudio':
      ctx.beginPath(); ctx.arc(cx, cy, 5*sc, Math.PI, 0, false); ctx.stroke()
      ctx.fillRect(cx - 5.5*sc, cy - 2*sc, 2*sc, 4*sc)
      ctx.fillRect(cx + 3.5*sc, cy - 2*sc, 2*sc, 4*sc)
      break

    // ── Video ─────────────────────────────────────────────────────────────
    case 'ARollVideo':
      ctx.beginPath()
      ctx.moveTo(cx - 3.5*sc, cy - 5*sc)
      ctx.lineTo(cx + 5*sc,   cy)
      ctx.lineTo(cx - 3.5*sc, cy + 5*sc)
      ctx.closePath(); ctx.fill()
      break

    case 'SlideshowVideo':
      for (const dy of [-3.5, 0, 3.5]) ctx.strokeRect(cx - 4*sc, cy + dy*sc - 1.5*sc, 7*sc, 3*sc)
      ctx.beginPath()
      ctx.moveTo(cx + 4.5*sc, cy - 2*sc)
      ctx.lineTo(cx + 6*sc,   cy)
      ctx.lineTo(cx + 4.5*sc, cy + 2*sc)
      ctx.stroke()
      break

    case 'Screencast':
      ctx.strokeRect(cx - 5*sc, cy - 4.5*sc, 10*sc, 7*sc)
      ctx.beginPath()
      ctx.moveTo(cx, cy + 2.5*sc)
      ctx.lineTo(cx, cy + 4.5*sc)
      ctx.moveTo(cx - 2*sc, cy + 4.5*sc)
      ctx.lineTo(cx + 2*sc, cy + 4.5*sc)
      ctx.stroke()
      break

    case 'CinematicVideo':
      ctx.strokeRect(cx - 5*sc, cy - 4*sc, 10*sc, 8*sc)
      for (const dx of [-3, 0, 3]) {
        ctx.fillRect(cx + dx*sc - 1*sc, cy - 5.5*sc, 2*sc, 1.5*sc)
        ctx.fillRect(cx + dx*sc - 1*sc, cy + 4*sc, 2*sc, 1.5*sc)
      }
      break

    case 'MotionGraphics':
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a)*1.5*sc, cy + Math.sin(a)*1.5*sc)
        ctx.lineTo(cx + Math.cos(a)*5*sc,   cy + Math.sin(a)*5*sc)
        ctx.stroke()
      }
      for (let a = Math.PI / 4; a < Math.PI * 2; a += Math.PI / 2) {
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a)*1*sc, cy + Math.sin(a)*1*sc)
        ctx.lineTo(cx + Math.cos(a)*3*sc, cy + Math.sin(a)*3*sc)
        ctx.stroke()
      }
      break

    // ── Hybrid/Interactive ────────────────────────────────────────────────
    case 'LiveStream':
      ctx.beginPath(); ctx.moveTo(cx, cy - 5*sc); ctx.lineTo(cx, cy + 3*sc); ctx.stroke()
      for (const r of [2.5, 4.5]) {
        ctx.beginPath(); ctx.arc(cx, cy - 2*sc, r*sc, -Math.PI*0.75, -Math.PI*0.25); ctx.stroke()
        ctx.beginPath(); ctx.arc(cx, cy - 2*sc, r*sc,  Math.PI*0.25,  Math.PI*0.75); ctx.stroke()
      }
      break

    case 'MultimediaPage':
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        ctx.strokeRect(cx + (c - 1)*5*sc, cy + (r - 1)*5*sc, 3.5*sc, 3.5*sc)
      }
      break

    case 'BranchingNarrative':
      ctx.beginPath()
      ctx.moveTo(cx, cy - 5*sc)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx - 4*sc, cy + 5*sc)
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 4*sc, cy + 5*sc)
      ctx.stroke()
      break

    case 'AssetPack':
      ctx.strokeRect(cx - 4*sc, cy - 1*sc, 8*sc, 5.5*sc)
      ctx.beginPath()
      ctx.moveTo(cx, cy - 5*sc)
      ctx.lineTo(cx, cy - 0.5*sc)
      ctx.moveTo(cx - 2.5*sc, cy - 3*sc)
      ctx.lineTo(cx, cy - 0.5*sc)
      ctx.lineTo(cx + 2.5*sc, cy - 3*sc)
      ctx.stroke()
      break

    case 'CurationFeed':
      ctx.beginPath()
      ctx.moveTo(cx - 5*sc, cy - 5*sc)
      ctx.lineTo(cx + 5*sc, cy - 5*sc)
      ctx.lineTo(cx + 2*sc, cy + 0.5*sc)
      ctx.lineTo(cx + 2*sc, cy + 5*sc)
      ctx.lineTo(cx - 2*sc, cy + 5*sc)
      ctx.lineTo(cx - 2*sc, cy + 0.5*sc)
      ctx.closePath()
      ctx.stroke()
      break

    case 'CommunitySpace':
      ctx.beginPath(); ctx.arc(cx - 2.5*sc, cy, 3.5*sc, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 2.5*sc, cy, 3.5*sc, 0, Math.PI * 2); ctx.stroke()
      break

    case 'InteractiveApp':
      ctx.beginPath()
      ctx.moveTo(cx,       cy - 5.5*sc)
      ctx.lineTo(cx + 5.5*sc, cy)
      ctx.lineTo(cx,       cy + 5.5*sc)
      ctx.lineTo(cx - 5.5*sc, cy)
      ctx.closePath()
      ctx.stroke()
      break

    case '_blank':
      ctx.font = `bold ${Math.round(10*sc)}px sans-serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', cx, cy)
      break
  }
}

// ── Transformation icons (AtomicOrigin) ──────────────────────────────────────

function drawTransformationIcon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  value: AtomicOrigin,
): void {
  const sc = size / 18
  ctx.strokeStyle = 'rgba(100,210,170,0.9)'
  ctx.fillStyle   = 'rgba(100,210,170,0.9)'
  ctx.lineWidth   = 1 * sc

  switch (value) {
    case 'New':
      // 8-ray sparkle
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const short = a % (Math.PI / 2) !== 0
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a)*1.2*sc, cy + Math.sin(a)*1.2*sc)
        ctx.lineTo(cx + Math.cos(a)*(short ? 3 : 5)*sc, cy + Math.sin(a)*(short ? 3 : 5)*sc)
        ctx.stroke()
      }
      break

    case 'Compression':
      // → ← (two inward arrows)
      for (const [sx, dir] of [[-5, 1], [5, -1]] as [number, number][]) {
        ctx.beginPath()
        ctx.moveTo(cx + sx*sc, cy)
        ctx.lineTo(cx + (sx + dir*4)*sc, cy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx + (sx + dir*4)*sc, cy - 2.5*sc)
        ctx.lineTo(cx + (sx + dir*4 + dir*2.5)*sc, cy)
        ctx.lineTo(cx + (sx + dir*4)*sc, cy + 2.5*sc)
        ctx.fill()
      }
      break

    case 'Expansion':
      // ← → (two outward arrows)
      for (const [sx, dir] of [[-1, -1], [1, 1]] as [number, number][]) {
        ctx.beginPath()
        ctx.moveTo(cx + sx*sc, cy)
        ctx.lineTo(cx + (sx + dir*4)*sc, cy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx + (sx + dir*4)*sc, cy - 2.5*sc)
        ctx.lineTo(cx + (sx + dir*4 + dir*2.5)*sc, cy)
        ctx.lineTo(cx + (sx + dir*4)*sc, cy + 2.5*sc)
        ctx.fill()
      }
      break

    case 'ZoomIn': {
      // magnifying glass + tiny +
      const r = 3.2*sc
      ctx.beginPath(); ctx.arc(cx - 1*sc, cy - 1*sc, r, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 1.3*sc, cy + 1.3*sc)
      ctx.lineTo(cx + 4.5*sc, cy + 4.5*sc)
      ctx.stroke()
      ctx.lineWidth = 1.5*sc
      ctx.beginPath()
      ctx.moveTo(cx - 1*sc, cy - 2.8*sc); ctx.lineTo(cx - 1*sc, cy + 0.8*sc)
      ctx.moveTo(cx - 2.8*sc, cy - 1*sc); ctx.lineTo(cx + 0.8*sc, cy - 1*sc)
      ctx.stroke()
      break
    }

    case 'ZoomOut': {
      // magnifying glass + tiny −
      const r = 3.2*sc
      ctx.beginPath(); ctx.arc(cx - 1*sc, cy - 1*sc, r, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 1.3*sc, cy + 1.3*sc)
      ctx.lineTo(cx + 4.5*sc, cy + 4.5*sc)
      ctx.stroke()
      ctx.lineWidth = 1.5*sc
      ctx.beginPath()
      ctx.moveTo(cx - 2.8*sc, cy - 1*sc); ctx.lineTo(cx + 0.8*sc, cy - 1*sc)
      ctx.stroke()
      break
    }

    case 'Similar':
      // ≈ two tilde waves
      for (const dy of [-2, 2]) {
        ctx.beginPath()
        ctx.moveTo(cx - 4.5*sc, cy + dy*sc)
        ctx.bezierCurveTo(cx - 2*sc, cy + (dy - 2.5)*sc, cx + 2*sc, cy + (dy + 2.5)*sc, cx + 4.5*sc, cy + dy*sc)
        ctx.stroke()
      }
      break

    case 'Opposite':
      // ↑↓ two vertical arrows facing away
      for (const [sy, dir] of [[3, -1], [-3, 1]] as [number, number][]) {
        ctx.beginPath()
        ctx.moveTo(cx, cy + sy*sc)
        ctx.lineTo(cx, cy + (sy + dir*4)*sc)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - 2*sc, cy + (sy + dir*2)*sc)
        ctx.lineTo(cx, cy + (sy + dir*4)*sc)
        ctx.lineTo(cx + 2*sc, cy + (sy + dir*2)*sc)
        ctx.fill()
      }
      break
  }
}

// ── Style icons (StyleType) ───────────────────────────────────────────────────

function drawStyleIcon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  value: StyleType,
): void {
  const sc = size / 18
  ctx.strokeStyle = 'rgba(150,140,240,0.9)'
  ctx.fillStyle   = 'rgba(150,140,240,0.9)'
  ctx.lineWidth   = 1 * sc

  switch (value) {
    case 'Minimalism':
      // single thin horizontal line
      ctx.lineWidth = 1.5 * sc
      ctx.beginPath(); ctx.moveTo(cx - 5*sc, cy); ctx.lineTo(cx + 5*sc, cy); ctx.stroke()
      break

    case 'Shock':
      // bold ! exclamation
      ctx.lineWidth = 2 * sc
      ctx.beginPath(); ctx.moveTo(cx, cy - 5*sc); ctx.lineTo(cx, cy + 1*sc); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy + 4*sc, 1*sc, 0, Math.PI * 2); ctx.fill()
      break

    case 'Narration': {
      // open book: V-spine + page curves
      ctx.beginPath()
      ctx.moveTo(cx - 5*sc, cy - 3.5*sc)
      ctx.lineTo(cx, cy + 1*sc)
      ctx.lineTo(cx + 5*sc, cy - 3.5*sc)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 5*sc, cy - 3.5*sc); ctx.lineTo(cx - 5*sc, cy + 4*sc)
      ctx.moveTo(cx + 5*sc, cy - 3.5*sc); ctx.lineTo(cx + 5*sc, cy + 4*sc)
      ctx.stroke()
      break
    }

    case 'Segmentation':
      // rectangle divided into 3 sections
      ctx.strokeRect(cx - 5*sc, cy - 3.5*sc, 10*sc, 7*sc)
      ctx.beginPath()
      ctx.moveTo(cx - 1.5*sc, cy - 3.5*sc); ctx.lineTo(cx - 1.5*sc, cy + 3.5*sc)
      ctx.moveTo(cx + 1.5*sc, cy - 3.5*sc); ctx.lineTo(cx + 1.5*sc, cy + 3.5*sc)
      ctx.stroke()
      break

    case 'Fast':
      // >> skip-forward chevrons
      for (const ox of [-3, 0.5]) {
        ctx.beginPath()
        ctx.moveTo(cx + ox*sc, cy - 4*sc)
        ctx.lineTo(cx + (ox + 4)*sc, cy)
        ctx.lineTo(cx + ox*sc, cy + 4*sc)
        ctx.stroke()
      }
      break

    case 'Passion': {
      // flame: teardrop with inner curve
      ctx.beginPath()
      ctx.moveTo(cx, cy + 5*sc)
      ctx.bezierCurveTo(cx - 5*sc, cy, cx - 4*sc, cy - 5*sc, cx, cy - 4*sc)
      ctx.bezierCurveTo(cx + 4*sc, cy - 5*sc, cx + 5*sc, cy, cx, cy + 5*sc)
      ctx.stroke()
      break
    }

    case 'Intellectual': {
      // lightbulb: circle + small base lines
      ctx.beginPath(); ctx.arc(cx, cy - 1.5*sc, 4*sc, Math.PI * 0.15, Math.PI * 0.85, false); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 2.2*sc, cy + 2.5*sc); ctx.lineTo(cx - 2.2*sc, cy + 4.5*sc)
      ctx.moveTo(cx + 2.2*sc, cy + 2.5*sc); ctx.lineTo(cx + 2.2*sc, cy + 4.5*sc)
      ctx.moveTo(cx - 2.2*sc, cy + 3.5*sc); ctx.lineTo(cx + 2.2*sc, cy + 3.5*sc)
      ctx.stroke()
      break
    }

    case 'ProblemSolving': {
      // gear outline: circle + 6 small teeth
      const r = 3*sc, tooth = 1.5*sc
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const ir = r + tooth
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a - 0.2)*r, cy + Math.sin(a - 0.2)*r)
        ctx.lineTo(cx + Math.cos(a - 0.2)*ir, cy + Math.sin(a - 0.2)*ir)
        ctx.lineTo(cx + Math.cos(a + 0.2)*ir, cy + Math.sin(a + 0.2)*ir)
        ctx.lineTo(cx + Math.cos(a + 0.2)*r, cy + Math.sin(a + 0.2)*r)
        ctx.stroke()
      }
      break
    }

    case 'Estetic':
      // 6-pointed star (two overlapping triangles)
      for (const flip of [0, 1]) {
        ctx.beginPath()
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + flip * Math.PI
          const fn = i === 0 ? 'moveTo' : 'lineTo'
          ctx[fn](cx + Math.cos(a)*5*sc, cy + Math.sin(a)*5*sc)
        }
        ctx.closePath(); ctx.stroke()
      }
      break

    case 'Interactive': {
      // cursor arrow pointing top-left
      ctx.beginPath()
      ctx.moveTo(cx - 4*sc, cy - 5*sc)
      ctx.lineTo(cx - 4*sc, cy + 4*sc)
      ctx.lineTo(cx - 1*sc, cy + 1.5*sc)
      ctx.lineTo(cx + 2*sc, cy + 5*sc)
      ctx.lineTo(cx + 3.5*sc, cy + 3.5*sc)
      ctx.lineTo(cx + 0.5*sc, cy)
      ctx.lineTo(cx + 4*sc, cy - 2.5*sc)
      ctx.closePath(); ctx.stroke()
      break
    }

    case 'Cliffhanger': {
      // descending staircase + drop
      ctx.beginPath()
      ctx.moveTo(cx - 5*sc, cy - 3*sc)
      ctx.lineTo(cx - 1.5*sc, cy - 3*sc)
      ctx.lineTo(cx - 1.5*sc, cy)
      ctx.lineTo(cx + 2*sc, cy)
      ctx.lineTo(cx + 2*sc, cy + 3*sc)
      ctx.lineTo(cx + 5*sc, cy + 3*sc)
      ctx.stroke()
      // drop line
      ctx.setLineDash([1*sc, 1*sc])
      ctx.beginPath()
      ctx.moveTo(cx + 5*sc, cy + 3*sc)
      ctx.lineTo(cx + 5*sc, cy + 6*sc)
      ctx.stroke()
      ctx.setLineDash([])
      break
    }
  }
}

function drawDrawNode(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  node: DrawNode,
  changed = false,
): void {
  const half = size / 2
  const rx   = Math.round(size * 0.33)
  const sc   = size / 18

  let bg = '#2a2a3a'
  if (node.label === 'format')              bg = FORMAT_BG[node.value as ContentProductType] ?? '#2a2a3a'
  else if (node.label === 'transformation') bg = '#122a22'
  else if (node.label === 'style')          bg = '#1e1848'

  ctx.beginPath()
  ctx.roundRect(cx - half, cy - half, size, size, rx)
  ctx.fillStyle = bg
  ctx.fill()

  if (changed) {
    // golden glow behind the border
    ctx.save()
    ctx.shadowColor = 'rgba(220,170,40,0.7)'
    ctx.shadowBlur  = 6
    ctx.beginPath()
    ctx.roundRect(cx - half, cy - half, size, size, rx)
    ctx.strokeStyle = 'rgba(220,170,40,0.9)'
    ctx.lineWidth   = 1.5
    ctx.stroke()
    ctx.restore()
  } else {
    ctx.strokeStyle = 'rgba(180,170,220,0.3)'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.roundRect(cx - half, cy - half, size, size, rx)
    ctx.stroke()
  }

  ctx.save()
  ctx.lineWidth = 1 * sc

  if (node.label === 'format') {
    drawFormatIcon(ctx, cx, cy, size, node.value as ContentProductType)
  } else if (node.label === 'transformation') {
    drawTransformationIcon(ctx, cx, cy, size, node.value as AtomicOrigin)
  } else if (node.label === 'style') {
    drawStyleIcon(ctx, cx, cy, size, node.value as StyleType)
  }

  ctx.restore()
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

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

  const flatItems = useMemo(() => layers.flat(), [layers])

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const half = NODE_SIZE / 2
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

    const ox = -bounds.minX
    const oy = -bounds.minY

    for (const e of edges) {
      const a = centers.get(e.from)
      const b = centers.get(e.to)
      if (!a || !b) continue
      drawEdge(ctx, a.x + ox, a.y + oy, b.x + ox, b.y + oy, false)
    }

    for (const item of flatItems) {
      const c: SpiralPos | undefined = centers.get(item.id)
      if (!c) continue
      const cx = c.x + ox
      const cy = c.y + oy
      if (item.node.kind === 'phase') {
        drawTile(ctx, cx - NODE_SIZE / 2, cy - NODE_SIZE / 2, item.node.stage, 'normal', NODE_SIZE)
      } else if (item.node.kind === 'draw') {
        drawDrawNode(ctx, cx, cy, NODE_SIZE, item.node, false)
      }
    }
  }, [bounds, centers, edges, flatItems])

  const [hover, setHover] = useState<{ node: PatternNode; x: number; y: number } | null>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!bounds || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const sx   = bounds.width  / rect.width
    const sy   = bounds.height / rect.height
    const mx   = (e.clientX - rect.left) * sx + bounds.minX
    const my   = (e.clientY - rect.top)  * sy + bounds.minY

    let nearest: PatternNode | null = null
    let bestDist = 12
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
