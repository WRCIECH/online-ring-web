import { useState, useEffect } from 'react'
import { useGameStore, selectRunRemainingSeconds } from '../../store/gameStore'
import EquipOverlay    from '../overlays/EquipOverlay'
import NotepadOverlay  from '../overlays/NotepadOverlay'
import StatsOverlay    from '../overlays/StatsOverlay'
import ContentOverlay  from '../overlays/ContentOverlay'
import { useT } from '../../i18n'
import s from './RunHeader.module.css'

interface Props {
  hp: number;      maxHp: number
  stamina: number; maxStamina: number
  fp: number;      maxFp: number
  canAddContent?: boolean   // false during active combat task timer
}

function fmtTime(secs: number): string {
  if (secs <= 0) return '00:00:00'
  const h  = Math.floor(secs / 3600)
  const m  = Math.floor((secs % 3600) / 60)
  const sc = Math.floor(secs % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
}

const HP_CAP  = 3000
const STA_CAP = 500
const FP_CAP  = 500

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

export default function RunHeader({ hp, maxHp, stamina, maxStamina, fp, maxFp, canAddContent = true }: Props) {
  const store = useGameStore()
  const t     = useT()
  const [remaining, setRemaining] = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )
  const [showEquip,    setShowEquip]    = useState(false)
  const [showNotepad,  setShowNotepad]  = useState(false)
  const [showStats,    setShowStats]    = useState(false)
  const [showContent,  setShowContent]  = useState(false)

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
          <span className={s.runTitle}>
            {store.run_location_name || `Run #${store.run_count + 1}`}
          </span>
          <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>{fmtTime(remaining)}</span>
        </div>

        <div className={s.bars}>
          <div className={s.barGroup} data-tip={`Health · ${Math.floor(hp)} / ${maxHp} — reaches zero = defeated`}>
            <span className={s.barLabel}>HP</span>
            <Bar current={hp} playerMax={maxHp} cap={HP_CAP} color="var(--color-hp)" />
          </div>
          <div className={s.barGroup} data-tip={`Stamina · ${Math.floor(stamina)} / ${maxStamina} — spent on every writing task`}>
            <span className={s.barLabel}>STA</span>
            <Bar current={stamina} playerMax={maxStamina} cap={STA_CAP} color="var(--color-stamina)" />
          </div>
          <div className={s.barGroup} data-tip={`Focus Points · ${Math.floor(fp)} / ${maxFp} — consumed by skill-type moves`}>
            <span className={s.barLabel}>FP</span>
            <Bar current={fp} playerMax={maxFp} cap={FP_CAP} color="var(--color-fp)" />
          </div>
        </div>

        {/* Actions */}
        <div className={s.actions}>
          <button className={s.btn} onClick={() => setShowEquip(true)}>{t.ui.btn_equip}</button>
          <button className={s.btn} onClick={() => setShowStats(true)}>{t.ui.btn_stats}</button>
          <button className={s.btn} onClick={() => setShowContent(true)}>{t.ui.btn_pipeline}</button>
          <button className={s.btn} onClick={() => setShowNotepad(true)}>{t.ui.btn_notes}</button>
        </div>
      </header>

      {showEquip   && <EquipOverlay   onClose={() => setShowEquip(false)} />}
      {showStats   && <StatsOverlay   onClose={() => setShowStats(false)} canLevel={false} />}
      {showContent && <ContentOverlay onClose={() => setShowContent(false)} canAdd={canAddContent} />}
      {showNotepad && <NotepadOverlay onClose={() => setShowNotepad(false)} />}
    </>
  )
}
