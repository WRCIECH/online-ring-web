import { useState, useEffect } from 'react'
import { useGameStore, selectRunRemainingSeconds } from '../../store/gameStore'
import EquipOverlay   from '../overlays/EquipOverlay'
import NotepadOverlay from '../overlays/NotepadOverlay'
import s from './RunHeader.module.css'

interface Props {
  hp: number;      maxHp: number
  stamina: number; maxStamina: number
  fp: number;      maxFp: number
}

function fmtTime(secs: number): string {
  if (secs <= 0) return '00:00:00'
  const h  = Math.floor(secs / 3600)
  const m  = Math.floor((secs % 3600) / 60)
  const sc = Math.floor(secs % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className={s.bar}>
      <div className={s.barFill} style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, background: color }} />
    </div>
  )
}

export default function RunHeader({ hp, maxHp, stamina, maxStamina, fp, maxFp }: Props) {
  const store = useGameStore()
  const [remaining, setRemaining] = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )
  const [showEquip,   setShowEquip]   = useState(false)
  const [showNotepad, setShowNotepad] = useState(false)

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
          <span className={s.runTitle}>Great Run #{store.run_count + 1}</span>
          <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>{fmtTime(remaining)}</span>
        </div>

        {/* Resource bars — current / player's own max */}
        <div className={s.bars}>
          <div className={s.barGroup}>
            <span className={s.barLabel}>HP</span>
            <Bar pct={hp / maxHp} color="var(--color-hp)" />
          </div>
          <div className={s.barGroup}>
            <span className={s.barLabel}>STA</span>
            <Bar pct={stamina / maxStamina} color="var(--color-stamina)" />
          </div>
          <div className={s.barGroup}>
            <span className={s.barLabel}>FP</span>
            <Bar pct={fp / maxFp} color="var(--color-fp)" />
          </div>
        </div>

        {/* Actions */}
        <div className={s.actions}>
          <button className={s.btn} onClick={() => setShowEquip(true)}>⚙ Equip</button>
          <button className={s.btn} onClick={() => setShowNotepad(true)}>✏ Notes</button>
        </div>
      </header>

      {showEquip   && <EquipOverlay   onClose={() => setShowEquip(false)} />}
      {showNotepad && <NotepadOverlay onClose={() => setShowNotepad(false)} />}
    </>
  )
}
