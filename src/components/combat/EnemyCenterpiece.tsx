import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { SublocationType } from '../../types/game'
import EnemyDisplay from './EnemyDisplay'
import s from './EnemyCenterpiece.module.css'

interface Props {
  x: number
  y: number
  enemyId: string
  name: string
  description: string
  hp: number
  maxHp: number
  isBoss: boolean
  sublocationtype?: SublocationType
}

export default function EnemyCenterpiece(props: Props) {
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const hpPct = Math.max(0, props.maxHp > 0 ? (props.hp / props.maxHp) * 100 : 0)

  return (
    <div className={s.wrap} style={{ left: props.x, top: props.y }}>
      {/* pointer-events: auto only on the small info strip; sprite area passes clicks through */}
      <div
        className={s.info}
        onMouseEnter={e => setHoverPos({ x: e.clientX + 16, y: e.clientY - 8 })}
        onMouseMove={e => setHoverPos({ x: e.clientX + 16, y: e.clientY - 8 })}
        onMouseLeave={() => setHoverPos(null)}
      >
        <div className={s.nameRow}>
          <span className={s.name}>{props.name}</span>
          {props.isBoss && <span className={s.bossBadge}>Boss</span>}
        </div>
        <div className={s.hpRow}>
          <div className={`${s.hpTrack} ${props.isBoss ? s.bossHpTrack : ''}`}>
            <div className={s.hpFill} style={{ width: `${hpPct}%` }} />
          </div>
          <span className={s.hpText}>{props.hp} / {props.maxHp}</span>
        </div>
      </div>
      <div className={s.sprite}>
        <EnemyDisplay
          enemyId={props.enemyId}
          hp={props.hp}
          maxHp={props.maxHp}
          sublocationtype={props.sublocationtype}
        />
      </div>

      {hoverPos && createPortal(
        <div className={s.tooltip} style={{ left: hoverPos.x, top: hoverPos.y }}>
          <div className={s.desc}>{props.description}</div>
        </div>,
        document.body,
      )}
    </div>
  )
}
