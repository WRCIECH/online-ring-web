import { useMemo, memo } from 'react'
import { Delaunay } from 'd3-delaunay'
import { LOCATION_DEFINITIONS, SIZE_COLOUR } from '../data/locations'
import type { LocationSize } from '../data/locations'
import { LOCATION_SEEDS } from '../data/locationSeeds'
import s from './LocationMap.module.css'

const MAP_W = 1100
const MAP_H = 720

export type RegionState = 'locked' | 'available' | 'completed'

interface Props {
  completedSet: Set<string>
  unlockedSet:  Set<string>
  hoveredId:    string | null
  selectedId:   string | null
  onHover:      (id: string | null) => void
  onSelect:     (id: string) => void
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

function cellFill(state: RegionState, size: LocationSize, hov: boolean, sel: boolean): string {
  if (state === 'locked') return hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'
  if (state === 'completed') {
    if (sel) return 'rgba(46,204,136,0.55)'
    if (hov) return 'rgba(46,204,136,0.38)'
    return 'rgba(46,204,136,0.20)'
  }
  const [r,g,b] = hexToRgb(SIZE_COLOUR[size])
  if (sel) return `rgba(${r},${g},${b},0.80)`
  if (hov) return `rgba(${r},${g},${b},0.58)`
  return `rgba(${r},${g},${b},0.26)`
}

function cellStroke(state: RegionState, size: LocationSize, hov: boolean, sel: boolean): string {
  if (state === 'locked') return hov ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'
  if (state === 'completed') {
    return (sel || hov) ? 'rgba(46,204,136,0.88)' : 'rgba(46,204,136,0.32)'
  }
  const [r,g,b] = hexToRgb(SIZE_COLOUR[size])
  if (sel) return `rgba(${r},${g},${b},1.0)`
  if (hov) return `rgba(${r},${g},${b},0.90)`
  return `rgba(${r},${g},${b},0.28)`
}


const JITTER = 42

function stableJitter(id: string, axis: 0 | 1): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0
  h ^= axis * 0x5f3759df
  return ((h >>> 0) / 0xffffffff - 0.5) * JITTER
}

const LocationMap = memo(function LocationMapInner({ completedSet, unlockedSet, hoveredId, selectedId, onHover, onSelect }: Props) {
  const cells = useMemo(() => {
    const locs = LOCATION_DEFINITIONS
    const pts: [number, number][] = locs.map(l => {
      const base = LOCATION_SEEDS[l.id]
      return [
        base.x + stableJitter(l.id, 0),
        base.y + stableJitter(l.id, 1),
      ]
    })
    const delaunay = Delaunay.from(pts)
    const voronoi  = delaunay.voronoi([0, 0, MAP_W, MAP_H])
    return locs.map((loc, i) => ({
      id:   loc.id,
      path: voronoi.renderCell(i),
      size: loc.size,
    }))
  }, [])

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className={s.svg}
      style={{ cursor: 'pointer' }}
      preserveAspectRatio="xMidYMid meet"
      onMouseLeave={() => onHover(null)}
    >
      <defs>
        {/* Organic boundary displacement */}
        <filter id="map-organic" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="linearRGB">
          <feTurbulence type="turbulence" baseFrequency="0.016 0.016" numOctaves="3" seed="17" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        {/* Glow for selected / bright hover */}
        <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Visual layer: displaced for organic map feel ── */}
      <g filter="url(#map-organic)" style={{ pointerEvents: 'none' }}>
        {cells.map(cell => {
          const state = completedSet.has(cell.id) ? 'completed' : unlockedSet.has(cell.id) ? 'available' : 'locked'
          const hov = hoveredId  === cell.id
          const sel = selectedId === cell.id
          const sw  = sel ? 2 : hov ? 1.5 : 0.5
          return (
            <path
              key={cell.id}
              d={cell.path}
              fill={cellFill(state, cell.size, hov, sel)}
              stroke={cellStroke(state, cell.size, hov, sel)}
              strokeWidth={sw}
              filter={sel ? 'url(#map-glow)' : undefined}
              className={s.region}
            />
          )
        })}
      </g>

      {/* ── Interaction layer: transparent paths at original positions ── */}
      <g>
        {cells.map(cell => {
          const state = completedSet.has(cell.id) ? 'completed' : unlockedSet.has(cell.id) ? 'available' : 'locked'
          return (
            <path
              key={cell.id}
              d={cell.path}
              fill="transparent"
              stroke="none"
              style={{ cursor: state !== 'locked' ? 'pointer' : 'default' }}
              onMouseEnter={() => onHover(cell.id)}
              onClick={() => onSelect(cell.id)}
            />
          )
        })}
      </g>
    </svg>
  )
})

export default LocationMap
