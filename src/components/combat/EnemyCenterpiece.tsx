import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { SublocationType, MobAffinities } from '../../types/game'
import EnemyDisplay from './EnemyDisplay'
import { useT } from '../../i18n'
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
  affinities?: MobAffinities
}

const TIER_LABEL: Record<keyof MobAffinities, string> = {
  love:    'Love ×2.0',
  like:    'Like ×1.5',
  dislike: 'Dislike ×0.7',
  hate:    'Hate ×0.5',
}
const TIER_COLOR: Record<keyof MobAffinities, string> = {
  love:    '#44cc88',
  like:    '#88cc66',
  dislike: '#cc9944',
  hate:    '#cc4444',
}

export default function EnemyCenterpiece(props: Props) {
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const t = useT()
  const hpPct = Math.max(0, props.maxHp > 0 ? (props.hp / props.maxHp) * 100 : 0)

  function labelFor(key: string): string {
    return (t.content.product        as Record<string, { badge_label: string }>)[key]?.badge_label
      ?? (t.content.transformation   as Record<string, { badge_label: string }>)[key]?.badge_label
      ?? key
  }

  function formatConditions(cond: NonNullable<MobAffinities[keyof MobAffinities]>): string {
    return [
      ...(cond.products       ?? []),
      ...(cond.transformations ?? []),
      ...(cond.emotions       ?? []),
      ...(cond.stages         ?? []),
    ].map(labelFor).join(', ')
  }

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent) => setHoverPos({ x: e.clientX + 16, y: e.clientY - 8 }),
    onMouseMove:  (e: React.MouseEvent) => setHoverPos({ x: e.clientX + 16, y: e.clientY - 8 }),
    onMouseLeave: () => setHoverPos(null),
  }

  return (
    <div className={s.wrap} style={{ left: props.x, top: props.y }}>
      <div className={s.info} {...hoverHandlers}>
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
      <div className={s.sprite} {...hoverHandlers}>
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
          {props.affinities && (
            <div className={s.affinities}>
              {(Object.entries(props.affinities) as [keyof MobAffinities, NonNullable<MobAffinities[keyof MobAffinities]>][])
                .filter(([, cond]) => !!cond)
                .map(([tier, cond]) => (
                  <div key={tier} className={s.affinityRow}>
                    <span className={s.affinityTier} style={{ color: TIER_COLOR[tier] }}>
                      {TIER_LABEL[tier]}
                    </span>
                    <span className={s.affinityCond}>{formatConditions(cond)}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
