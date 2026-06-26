import { useState, useEffect } from 'react'
import { useGameStore, selectRunRemainingSeconds } from '../../store/gameStore'
import CharacterOverlay  from '../overlays/CharacterOverlay'
import ContentOverlay    from '../overlays/ContentOverlay'
import LocationsOverlay  from '../overlays/LocationsOverlay'
import AnalyticsOverlay  from '../overlays/AnalyticsOverlay'
import EquipOverlay      from '../overlays/EquipOverlay'
import { useT } from '../../i18n'
import s from './RunHeader.module.css'

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
  const t     = useT()
  const [remaining, setRemaining] = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )
  const [showStats,     setShowStats]     = useState(false)
  const [showContent,   setShowContent]   = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showEquip,     setShowEquip]     = useState(false)

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
            {store.run_location_name ? (t.locations[store.run_location_name] ?? store.run_location_name) : `Run #${store.run_count + 1}`}
          </button>
          <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>{fmtTime(remaining)}</span>
        </div>

        <div className={s.bars}>
          <div className={s.barGroup} data-tip={`${Math.floor(hp)} / ${maxHp}`}>
            <span className={s.barLabel}>HP</span>
            <Bar current={hp} playerMax={maxHp} cap={HP_CAP} color="var(--color-hp)" />
          </div>
        </div>

        {/* Actions */}
        <div className={s.actions}>
          <button className={s.btn} onClick={() => setShowStats(true)}>{t.ui.btn_stats}</button>
          <button className={s.btn} onClick={() => setShowContent(true)}>{t.ui.btn_pipeline}</button>
          <button className={s.btn} onClick={() => setShowEquip(true)}>{t.ui.btn_equipment}</button>
          <button className={s.btn} onClick={() => setShowAnalytics(true)}>{t.ui.btn_analytics}</button>
        </div>
      </header>

      {showStats     && <CharacterOverlay onClose={() => setShowStats(false)} canLevel={false} />}
      {showContent   && <ContentOverlay   onClose={() => setShowContent(false)} canAdd={canAddContent} />}
      {showLocations && <LocationsOverlay onClose={() => setShowLocations(false)} />}
      {showAnalytics && <AnalyticsOverlay onClose={() => setShowAnalytics(false)} />}
      {showEquip     && <EquipOverlay     onClose={() => setShowEquip(false)} />}
    </>
  )
}
