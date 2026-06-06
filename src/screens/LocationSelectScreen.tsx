import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { LOCATION_DEFINITIONS, getUnlockedLocationIds, SIZE_LABEL, SIZE_COLOUR } from '../data/locations'
import StatsOverlay from '../components/overlays/StatsOverlay'
import { useT } from '../i18n'
import s from './LocationSelectScreen.module.css'

const SIZE_TIME: Record<string, string> = {
  'small': '34h', 'small-medium': '39h', 'medium': '44h', 'large': '49h', 'very large': '54h',
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function LocationSelectScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const t          = useT()
  const [showStats, setShowStats] = useState(false)

  const completedSet = new Set(store.completed_locations)
  const unlockedSet  = getUnlockedLocationIds(store.completed_locations)

  function handleSelect(locId: string, numSublocations: number, runDuration: number) {
    navigate('/weapons', { state: { locationName: locId, numSublocations, runDuration } })
  }

  return (
    <div className={s.root}>
      {showStats && <StatsOverlay onClose={() => setShowStats(false)} />}
      <div className={s.header}>
        <h1 className={s.title}>{t.ui.choose_dungeon_title}</h1>
        <p className={s.subtitle}>
          {store.completed_locations.length === 0
            ? t.ui.choose_dungeon_first
            : t.ui.choose_dungeon_next}
        </p>
        <p className={s.progress}>
          {store.completed_locations.length} / {LOCATION_DEFINITIONS.length} {t.ui.locations_progress}
        </p>
        <div className={s.headerActions}>
          <span className={s.runeDisplay}>✦ {store.runes.toLocaleString()}</span>
          <button className={s.btnStats} onClick={() => setShowStats(true)}>{t.ui.btn_stats_levelup}</button>
        </div>
      </div>

      <div className={s.grid}>
        {LOCATION_DEFINITIONS.map(loc => {
          const isCompleted = completedSet.has(loc.id)
          const isUnlocked  = unlockedSet.has(loc.id)
          const isLocked    = !isUnlocked
          const colour      = SIZE_COLOUR[loc.size]

          return (
            <button
              key={loc.id}
              className={[
                s.card,
                isCompleted ? s.cardCompleted : isUnlocked ? s.cardUnlocked : s.cardLocked,
              ].join(' ')}
              style={{ '--loc-colour': colour } as React.CSSProperties}
              disabled={isLocked}
              onClick={() => handleSelect(loc.id, loc.numSublocations, loc.runDuration)}
            >
              <div className={s.topBar} style={{ background: isLocked ? 'rgba(255,255,255,0.06)' : colour }}/>
              <div className={s.body}>
                <div className={s.nameRow}>
                  {isLocked && <span className={s.lockIcon}><LockIcon/></span>}
                  <span className={s.name}>{loc.id}</span>
                  {isCompleted && <span className={s.doneTag}>✓</span>}
                </div>
                {!isLocked && (
                  <>
                    <div className={s.boss}>★ {loc.boss}</div>
                    <div className={s.meta}>
                      <span className={s.sizeBadge} style={{ color: colour, borderColor: `${colour}60` }}>
                        {SIZE_LABEL[loc.size]}
                      </span>
                      <span>{loc.numSublocations} {t.ui.loc_locations}</span>
                      <span>·</span>
                      <span>{SIZE_TIME[loc.size]}</span>
                    </div>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
