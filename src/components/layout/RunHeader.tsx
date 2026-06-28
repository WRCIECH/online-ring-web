import { useState, useEffect } from 'react'
import { useGameStore, selectRunRemainingSeconds } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import LocationsOverlay from '../overlays/LocationsOverlay'
import ActionBar from './ActionBar'
import s from './RunHeader.module.css'

const LOC_MAP = Object.fromEntries(LOCATION_DEFINITIONS.map(l => [l.id, l]))

interface Props {
  hp: number; maxHp: number
  canAddContent?: boolean   // false during active combat task timer
}

function fmtTime(secs: number): string {
  if (secs <= 0) return '00:00:00'
  const h  = Math.floor(secs / 3600)
  const m  = Math.floor((secs % 3600) / 60)
  const sc = Math.floor(secs % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
}

const HP_CAP  = 2000

function Bar({ current, playerMax, cap, color }: { current: number; playerMax: number; cap: number; color: string }) {
  const maxPct  = Math.min(100, playerMax / cap * 100)
  const fillPct = playerMax > 0 ? Math.min(100, current / playerMax * 100) : 0
  return (
    <div className={s.barTrack}>
      <div className={s.barMax} style={{ width: `${maxPct}%` }}>
        <div className={s.barFill} style={{ width: `${fillPct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function RunHeader({ hp, maxHp, canAddContent = true }: Props) {
  const store = useGameStore()
  const [remaining,     setRemaining]     = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )
  const [showLocations, setShowLocations] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0]))
    }, 1000)
    return () => clearInterval(id)
  }, [store])

  const isUrgent = remaining < 7200

  return (
    <>
      <header className={s.header}>
        {/* Run info */}
        <div className={s.runInfo}>
          <button className={s.runTitle} onClick={() => setShowLocations(true)}>
            {store.run_location_name ? (LOC_MAP[store.run_location_name]?.displayName ?? store.run_location_name) : `Run #${store.run_count + 1}`}
          </button>
          <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>{fmtTime(remaining)}</span>
        </div>

        <div className={s.bars}>
          <div className={s.barGroup} data-tip={`${Math.floor(hp)} / ${maxHp}`}>
            <span className={s.barLabel}>HP</span>
            <Bar current={hp} playerMax={maxHp} cap={HP_CAP} color="var(--color-hp)" />
          </div>
        </div>

        <ActionBar canLevel={false} canAddContent={canAddContent} />
      </header>

      {showLocations && <LocationsOverlay onClose={() => setShowLocations(false)} />}
    </>
  )
}
