import { useState, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { LOCATION_DEFINITIONS, getUnlockedLocationIds, SIZE_LABEL, SIZE_COLOUR } from '../data/locations'
import type { LocationDef } from '../data/locations'
import { LOCATION_THEMES } from '../data/locationThemes'
import LocationMap from '../components/LocationMap'
import HomeLogo from '../components/HomeLogo'
import ActionBar from '../components/layout/ActionBar'
import { useT } from '../i18n'
import s from './LocationSelectScreen.module.css'

function fmtDuration(seconds: number): string {
  return `${Math.round(seconds / 3600)}h`
}

const LOC_MAP = Object.fromEntries(LOCATION_DEFINITIONS.map(l => [l.id, l]))

export default function LocationSelectScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const t          = useT()
  const [hoveredId,  setHoveredId]  = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const tooltipRef  = useRef<HTMLDivElement>(null)

  const completedSet = useMemo(() => new Set(store.completed_locations), [store.completed_locations])
  const unlockedSet  = useMemo(() => getUnlockedLocationIds(store.completed_locations), [store.completed_locations])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id)
  }, [])

  function handleBeginRun(loc: LocationDef) {
    store.startRun(loc)
    navigate('/map')
  }

  // Info panel: selected takes priority over hovered
  const activeId  = selectedId ?? hoveredId
  const activeLoc = activeId ? LOC_MAP[activeId] : null
  const activeState = activeLoc
    ? completedSet.has(activeLoc.id) ? 'completed'
      : unlockedSet.has(activeLoc.id) ? 'available'
      : 'locked'
    : null
  const missingPrereqs = activeLoc?.requires.filter(r => !completedSet.has(r)) ?? []

  return (
    <div className={s.root}>
      {/* ── Full-screen map ── */}
      <div className={s.mapWrap} onMouseMove={e => {
          mousePosRef.current = { x: e.clientX, y: e.clientY }
          if (tooltipRef.current) {
            tooltipRef.current.style.left = `${e.clientX + 14}px`
            tooltipRef.current.style.top  = `${e.clientY - 10}px`
          }
        }}>
        <LocationMap
          completedSet={completedSet}
          unlockedSet={unlockedSet}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Top overlay bar ── */}
      <div className={s.topBar}>
        <HomeLogo />
        <span className={s.worldTitle}>{t.ui.world_map_title}</span>
        <div className={s.topRight}>
          <span className={s.progress}>
            {store.completed_locations.length} / {LOCATION_DEFINITIONS.length} {t.ui.locations_visited}
          </span>
          <ActionBar />
        </div>
      </div>

      {/* ── Info panel (bottom-right) ── */}
      {activeLoc && (
        <div className={[s.infoPanel, selectedId ? s.infoPanelSelected : ''].join(' ')}>
          <div className={s.infoName}>{activeLoc.displayName}</div>

          {/* Theme badge + boss */}
          <div className={s.infoThemeRow}>
            <span
              className={s.themeBadge}
              style={{
                color:       LOCATION_THEMES[activeLoc.theme].color,
                borderColor: `${LOCATION_THEMES[activeLoc.theme].color}55`,
              }}
            >
              {LOCATION_THEMES[activeLoc.theme].displayLabel}
            </span>
            <span className={s.infoBoss}>{activeLoc.bossName}</span>
          </div>

          <div className={s.infoMeta}>
            <span className={s.sizeBadge} style={{ color: SIZE_COLOUR[activeLoc.size], borderColor: `${SIZE_COLOUR[activeLoc.size]}55` }}>
              {SIZE_LABEL[activeLoc.size]}
            </span>
            <span>{activeLoc.numSublocations} {t.ui.loc_locations}</span>
            <span className={s.metaDot}>·</span>
            <span>{fmtDuration(activeLoc.runDuration)}</span>
            {activeLoc.difficulty > 0 && (
              <>
                <span className={s.metaDot}>·</span>
                <span className={s.diffBadge}>Depth {activeLoc.difficulty}</span>
              </>
            )}
          </div>

          {activeState === 'locked' && missingPrereqs.length > 0 && (
            <div className={s.prereqs}>
              <div className={s.prereqsLabel}>Requires:</div>
              {missingPrereqs.map(r => (
                <div key={r} className={s.prereqItem}>· {LOC_MAP[r]?.displayName ?? r}</div>
              ))}
            </div>
          )}

          {activeState === 'completed' && (
            <div className={s.completedTag}>✓ Completed</div>
          )}

          {activeState !== 'locked' && (
            selectedId
              ? (
                <button className={s.btnBegin} onClick={() => handleBeginRun(activeLoc)}>
                  {t.ui.btn_begin_run}
                </button>
              ) : (
                <div className={s.clickHint}>{t.ui.click_to_select ?? 'Click to select'}</div>
              )
          )}
        </div>
      )}
      {hoveredId && activeLoc && (
        <div
          ref={tooltipRef}
          className={s.nameTooltip}
          style={{ left: mousePosRef.current.x + 14, top: mousePosRef.current.y - 10 }}
        >
          {activeLoc.displayName}
        </div>
      )}
    </div>
  )
}
