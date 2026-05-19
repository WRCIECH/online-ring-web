import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { LOCATION_DEFINITIONS, getUnlockedLocationIds, SIZE_LABEL, SIZE_COLOUR } from '../data/locations'
import s from './LocationSelectScreen.module.css'

const SIZE_TIME: Record<string, string> = {
  'small': '34h', 'small-medium': '39h', 'medium': '44h', 'large': '49h', 'very large': '54h',
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function LocationSelectScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()

  const completedSet = new Set(store.completed_locations)
  const unlockedSet  = getUnlockedLocationIds(store.completed_locations)

  function handleSelect(locId: string, numSublocations: number, runDuration: number) {
    navigate('/weapons', { state: { locationName: locId, numSublocations, runDuration } })
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Choose Your Dungeon</h1>
        <p className={s.subtitle}>
          {store.completed_locations.length === 0
            ? 'Begin your journey — only the first steps are open to you'
            : `${store.completed_locations.length} / ${LOCATION_DEFINITIONS.length} locations cleared`}
        </p>
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
              {/* Left colour bar */}
              <div className={s.colourBar} style={{ background: colour }}/>

              {/* Main content */}
              <div className={s.content}>
                <div className={s.row}>
                  <span className={s.name}>{loc.id}</span>
                  <span className={s.sizeBadge} style={{ color: colour, borderColor: `${colour}55` }}>
                    {SIZE_LABEL[loc.size]}
                  </span>
                </div>
                <div className={s.boss}>{loc.boss}</div>
                <div className={s.meta}>
                  <span>{loc.numSublocations} nodes</span>
                  <span>·</span>
                  <span>{SIZE_TIME[loc.size]}</span>
                  {isCompleted && <span className={s.doneTag}>✓ Done</span>}
                  {isLocked && (
                    <span className={s.lockTag}>
                      <LockIcon/>
                      {loc.requires[0] ?? 'locked'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
