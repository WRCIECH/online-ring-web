import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { LOCATION_DEFINITIONS, getUnlockedLocationIds, SIZE_LABEL, SIZE_COLOUR } from '../data/locations'
import type { LocationDef } from '../data/locations'
import LocationMap from '../components/LocationMap'
import CharacterOverlay  from '../components/overlays/CharacterOverlay'
import AnalyticsOverlay from '../components/overlays/AnalyticsOverlay'
import { useT } from '../i18n'
import s from './LocationSelectScreen.module.css'

const SIZE_TIME: Record<string, string> = {
  'small': '34h', 'small-medium': '39h', 'medium': '44h', 'large': '49h', 'very large': '54h',
}

const LOC_MAP = Object.fromEntries(LOCATION_DEFINITIONS.map(l => [l.id, l]))

export default function LocationSelectScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const t          = useT()
  const [hoveredId,     setHoveredId]     = useState<string | null>(null)
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [showStats,     setShowStats]     = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const completedSet = new Set(store.completed_locations)
  const unlockedSet  = getUnlockedLocationIds(store.completed_locations)

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id)
  }

  function handleBeginRun(loc: LocationDef) {
    store.startRun(loc.id, loc.numSublocations, loc.runDuration)
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
  const canBegin = !!selectedId && activeState !== 'locked'

  return (
    <div className={s.root}>
      {showStats     && <CharacterOverlay  onClose={() => setShowStats(false)} />}
      {showAnalytics && <AnalyticsOverlay onClose={() => setShowAnalytics(false)} />}

      {/* ── Full-screen map ── */}
      <div className={s.mapWrap}>
        <LocationMap
          completedSet={completedSet}
          unlockedSet={unlockedSet}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Top overlay bar ── */}
      <div className={s.topBar}>
        <h1 className={s.title}>{t.ui.choose_dungeon_title}</h1>
        <span className={s.progress}>
          {store.completed_locations.length} / {LOCATION_DEFINITIONS.length}
        </span>
        <span className={s.runeDisplay}>✦ {store.runes.toLocaleString()}</span>
        <button className={s.btnMeta} onClick={() => setShowStats(true)}>{t.ui.btn_stats_levelup}</button>
        <button className={s.btnMeta} onClick={() => setShowAnalytics(true)}>{t.ui.btn_analytics}</button>
      </div>

      {/* ── Info panel (bottom-right) ── */}
      {activeLoc && (
        <div className={[s.infoPanel, selectedId ? s.infoPanelSelected : ''].join(' ')}>
          <div className={s.infoName}>{t.locations[activeLoc.id] ?? activeLoc.id}</div>
          <div className={s.infoBoss}>{activeLoc.boss}</div>

          <div className={s.infoMeta}>
            <span className={s.sizeBadge} style={{ color: SIZE_COLOUR[activeLoc.size], borderColor: `${SIZE_COLOUR[activeLoc.size]}55` }}>
              {SIZE_LABEL[activeLoc.size]}
            </span>
            <span>{activeLoc.numSublocations} {t.ui.loc_locations}</span>
            <span className={s.metaDot}>·</span>
            <span>{SIZE_TIME[activeLoc.size]}</span>
          </div>

          {activeState === 'locked' && missingPrereqs.length > 0 && (
            <div className={s.prereqs}>
              <div className={s.prereqsLabel}>Requires:</div>
              {missingPrereqs.map(r => (
                <div key={r} className={s.prereqItem}>· {t.locations[r] ?? r}</div>
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
    </div>
  )
}
