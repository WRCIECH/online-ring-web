import { useEffect, useState } from 'react'
import { useGameStore, selectRunRemainingSeconds } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import HomeLogo from '../HomeLogo'
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

export default function RunHeader({ hp, maxHp, canAddContent = true }: Props) {
  const store = useGameStore()
  const [remaining, setRemaining] = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0]))
    }, 1000)
    return () => clearInterval(id)
  }, [store])

  const isUrgent  = remaining < 7200
  const fillPct   = maxHp > 0 ? Math.min(100, hp / maxHp * 100) : 0
  const locName   = store.run_location_name
    ? (LOC_MAP[store.run_location_name]?.displayName ?? store.run_location_name)
    : `Run #${store.run_count + 1}`

  return (
    <header className={s.header}>
      {/* Left: logo + HP */}
      <div className={s.leftGroup}>
        <HomeLogo />
        <div className={s.hpSection}>
          <span className={s.hpLabel}>HP</span>
          <div className={s.hpBarTrack}>
            <div className={s.hpBarFill} style={{ width: `${fillPct}%` }} />
          </div>
          <span className={s.hpText}>{Math.floor(hp)} / {maxHp}</span>
        </div>
      </div>

      {/* Center: location + timer */}
      <div className={s.runInfo}>
        <span className={s.runTitle}>{locName}</span>
        <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>{fmtTime(remaining)}</span>
      </div>

      {/* Right: action buttons */}
      <ActionBar canLevel={false} canAddContent={canAddContent} />
    </header>
  )
}
