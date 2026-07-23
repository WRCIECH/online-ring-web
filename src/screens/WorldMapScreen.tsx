import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delaunay } from 'd3-delaunay'
import { useGameStore } from '../store/gameStore'
import { REGION_DEFINITIONS } from '../data/regions'
import { LOCATION_DEFINITIONS } from '../data/locations'
import HomeLogo from '../components/HomeLogo'
import ActionBar from '../components/layout/ActionBar'
import { useT } from '../i18n'
import s from './WorldMapScreen.module.css'

const MAP_W = 1100
const MAP_H = 720

// Fixed seed positions — one per region, spread across the world map canvas
const WORLD_SEEDS: [number, number][] = [
  [200, 360],  // region_0: Feed of Awakening
  [440, 175],  // region_1: Lakes of Engagement
  [760, 195],  // region_2: Viral Plateau
  [960, 380],  // region_3: Valley of Monetization
  [810, 565],  // region_4: Ashwastes of Burnout
  [490, 620],  // region_5: The Comment Section
  [190, 580],  // region_6: Shadow Capital
]

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

type CellState = 'locked' | 'available' | 'completed'

function cellFill(state: CellState, color: string, hov: boolean, sel: boolean): string {
  if (state === 'locked') return hov ? 'rgba(80,70,100,0.20)' : 'rgba(60,55,75,0.12)'
  const [r,g,b] = hexToRgb(color)
  if (sel) return `rgba(${r},${g},${b},0.72)`
  if (hov) return `rgba(${r},${g},${b},0.48)`
  return `rgba(${r},${g},${b},0.28)`
}

function cellStroke(state: CellState, color: string, hov: boolean, sel: boolean): string {
  if (state === 'locked') return hov ? 'rgba(150,130,180,0.22)' : 'rgba(100,90,120,0.10)'
  const [r,g,b] = hexToRgb(color)
  if (sel) return `rgba(${r},${g},${b},1.0)`
  if (hov) return `rgba(${r},${g},${b},0.85)`
  return `rgba(${r},${g},${b},0.35)`
}

export default function WorldMapScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const t          = useT()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const tooltipRef  = useRef<HTMLDivElement>(null)

  const completedRegions = useMemo(() => new Set(store.completed_regions), [store.completed_regions])

  // Build Voronoi cells from the 7 fixed seeds
  const cells = useMemo(() => {
    const delaunay = Delaunay.from(WORLD_SEEDS)
    const voronoi  = delaunay.voronoi([0, 0, MAP_W, MAP_H])
    return REGION_DEFINITIONS.map((region, i) => ({
      region,
      path: voronoi.renderCell(i),
      state: (completedRegions.has(region.id) ? 'completed'
        : region.requires.every(rid => completedRegions.has(rid)) ? 'available'
        : 'locked') as CellState,
    }))
  }, [completedRegions])

  // Centroid-like label positions (use seed offsets for labels)
  const labelPositions = WORLD_SEEDS.map(([x, y]) => ({ x, y }))

  const handleSelect = useCallback((idx: number) => {
    const cell = cells[idx]
    if (cell.state === 'locked') return
    setSelectedIdx(prev => prev === idx ? null : idx)
  }, [cells])

  function handleEnterRegion(idx: number) {
    const cell = cells[idx]
    if (cell.state === 'locked') return
    store.setCurrentRegion(cell.region.id)
    navigate('/locations')
  }

  const activeIdx = selectedIdx ?? hoveredIdx
  const activeCell = activeIdx !== null ? cells[activeIdx] : null
  const completedLocCount = activeCell
    ? LOCATION_DEFINITIONS.filter(l => l.region_id === activeCell.region.id && store.completed_locations.includes(l.id)).length
    : 0
  const totalLocCount = activeCell
    ? LOCATION_DEFINITIONS.filter(l => l.region_id === activeCell.region.id).length
    : 0

  return (
    <div className={s.root} onMouseMove={e => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 14}px`
        tooltipRef.current.style.top  = `${e.clientY - 10}px`
      }
    }}>
      {/* ── Full-screen Voronoi world map ── */}
      <div className={s.mapWrap}>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className={s.svg}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => { setHoveredIdx(null) }}
        >
          <defs>
            <filter id="world-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="world-noise" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="linearRGB">
              <feTurbulence type="turbulence" baseFrequency="0.012 0.012" numOctaves="3" seed="42" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
          </defs>

          {/* Base cells */}
          <g filter="url(#world-noise)">
            {cells.map(cell => (
              <path
                key={cell.region.id}
                d={cell.path}
                fill={cellFill(cell.state, cell.region.color, false, false)}
                stroke={cellStroke(cell.state, cell.region.color, false, false)}
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Hover/selected highlight */}
          <g>
            {cells.map((cell, i) => {
              const hov = hoveredIdx === i
              const sel = selectedIdx === i
              if (!hov && !sel) return null
              return (
                <path
                  key={cell.region.id}
                  d={cell.path}
                  fill={cellFill(cell.state, cell.region.color, hov, sel)}
                  stroke={cellStroke(cell.state, cell.region.color, hov, sel)}
                  strokeWidth={sel ? 2.5 : 1.5}
                  filter={sel ? 'url(#world-glow)' : undefined}
                  style={{ pointerEvents: 'none' }}
                />
              )
            })}
          </g>

          {/* Region labels */}
          {cells.map((cell, i) => {
            const lp = labelPositions[i]
            const isLocked = cell.state === 'locked'
            const isDone   = cell.state === 'completed'
            return (
              <g key={cell.region.id} style={{ pointerEvents: 'none' }}>
                {isDone && (
                  <text x={lp.x} y={lp.y - 28} textAnchor="middle"
                    fill="rgba(46,204,136,0.9)" fontSize="14" fontWeight="bold">✓</text>
                )}
                <text x={lp.x} y={lp.y - 10} textAnchor="middle"
                  fill={isLocked ? 'rgba(200,180,220,0.28)' : cell.region.color}
                  fontSize="11" fontWeight="700" letterSpacing="1.5"
                  style={{ textTransform: 'uppercase', fontFamily: 'inherit' }}>
                  {cell.region.name}
                </text>
                <text x={lp.x} y={lp.y + 6} textAnchor="middle"
                  fill={isLocked ? 'rgba(200,180,220,0.18)' : 'rgba(255,255,255,0.45)'}
                  fontSize="9" letterSpacing="0.5">
                  {isLocked ? '🔒 Locked' : `×${cell.region.difficultyMult.toFixed(1)}`}
                </text>
              </g>
            )
          })}

          {/* Interaction layer */}
          {cells.map((cell, i) => (
            <path
              key={cell.region.id}
              d={cell.path}
              fill="transparent"
              stroke="none"
              style={{ cursor: cell.state !== 'locked' ? 'pointer' : 'not-allowed' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onClick={() => handleSelect(i)}
            />
          ))}
        </svg>
      </div>

      {/* ── Top bar ── */}
      <div className={s.topBar}>
        <HomeLogo />
        <span className={s.worldTitle}>{t.ui.world_map_title}</span>
        <div className={s.topRight}>
          <span className={s.progress}>
            {store.completed_regions.length} / {REGION_DEFINITIONS.length} {t.ui.world_regions_cleared ?? 'regions cleared'}
          </span>
          <ActionBar />
        </div>
      </div>

      {/* ── Info panel ── */}
      {activeCell && (
        <div className={[s.infoPanel, selectedIdx !== null ? s.infoPanelSelected : ''].join(' ')}
          style={{ borderColor: selectedIdx !== null ? activeCell.region.color + '66' : undefined }}>
          <div className={s.infoName} style={{ color: activeCell.region.color }}>
            {activeCell.region.name}
          </div>
          <div className={s.infoLore}>{activeCell.region.lore}</div>

          <div className={s.infoMeta}>
            <span className={s.diffBadge}
              style={{ color: activeCell.region.color, borderColor: activeCell.region.color + '44' }}>
              ×{activeCell.region.difficultyMult.toFixed(1)} {t.ui.world_difficulty ?? 'difficulty'}
            </span>
            {activeCell.state !== 'locked' && (
              <span className={s.locProgress}>
                {completedLocCount} / {totalLocCount} {t.ui.loc_locations}
              </span>
            )}
          </div>

          {activeCell.state === 'locked' && (
            <div className={s.lockedMsg}>
              {t.ui.world_locked_requires ?? 'Complete the previous region first'}
            </div>
          )}

          {activeCell.state === 'completed' && (
            <div className={s.completedTag}>✓ {t.ui.world_map_completed ?? 'Completed'}</div>
          )}

          {activeCell.state !== 'locked' && selectedIdx !== null && (
            <button
              className={s.btnEnter}
              style={{ borderColor: activeCell.region.color + '88', color: activeCell.region.color }}
              onClick={() => handleEnterRegion(selectedIdx)}
            >
              {t.ui.world_map_enter ?? 'Enter Region'} →
            </button>
          )}

          {activeCell.state !== 'locked' && selectedIdx === null && (
            <div className={s.clickHint}>{t.ui.click_to_select ?? 'Click to select'}</div>
          )}
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredIdx !== null && activeCell && (
        <div
          ref={tooltipRef}
          className={s.nameTooltip}
          style={{ left: mousePosRef.current.x + 14, top: mousePosRef.current.y - 10 }}
        >
          {activeCell.region.name}
        </div>
      )}
    </div>
  )
}
