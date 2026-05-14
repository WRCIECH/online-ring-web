import { useEffect, useRef } from 'react'
import type { LogEntry } from '../../engine/combat'
import s from './CombatLog.module.css'

interface Props { entries: LogEntry[] }

export default function CombatLog({ entries }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries.length])
  return (
    <div className={s.log} ref={ref}>
      {entries.map(e => (
        <div key={e.id} className={s.entry} style={{ color: e.color ?? 'var(--color-text)' }}>
          {e.text}
        </div>
      ))}
    </div>
  )
}
