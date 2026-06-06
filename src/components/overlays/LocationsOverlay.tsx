import { useGameStore } from '../../store/gameStore'
import { LOCATION_DEFINITIONS, getUnlockedLocationIds, SIZE_LABEL, SIZE_COLOUR } from '../../data/locations'
import { useT } from '../../i18n'
import s from './LocationsOverlay.module.css'

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

interface Props { onClose: () => void }

export default function LocationsOverlay({ onClose }: Props) {
  const store        = useGameStore()
  const t            = useT()
  const completedSet = new Set(store.completed_locations)
  const unlockedSet  = getUnlockedLocationIds(store.completed_locations)

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>{t.ui.locations_progress_title ?? t.ui.choose_dungeon_title}</span>
          <span className={s.progress}>{store.completed_locations.length} / {LOCATION_DEFINITIONS.length}</span>
          <button className={s.btnClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.grid}>
          {LOCATION_DEFINITIONS.map(loc => {
            const isCompleted = completedSet.has(loc.id)
            const isUnlocked  = unlockedSet.has(loc.id)
            const isLocked    = !isUnlocked
            const colour      = SIZE_COLOUR[loc.size]
            const isCurrent   = store.run_location_name === loc.id

            return (
              <div
                key={loc.id}
                className={[
                  s.card,
                  isCompleted ? s.cardCompleted : isUnlocked ? s.cardUnlocked : s.cardLocked,
                  isCurrent   ? s.cardCurrent   : '',
                ].join(' ')}
                style={{ '--loc-colour': colour } as React.CSSProperties}
              >
                <div className={s.topBar} style={{ background: isLocked ? 'rgba(255,255,255,0.06)' : colour }}/>
                <div className={s.body}>
                  <div className={s.nameRow}>
                    {isLocked && <span className={s.lockIcon}><LockIcon/></span>}
                    <span className={s.name}>{t.locations[loc.id] ?? loc.id}</span>
                    {isCompleted && <span className={s.doneTag}>✓</span>}
                    {isCurrent  && <span className={s.currentTag}>◉</span>}
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
