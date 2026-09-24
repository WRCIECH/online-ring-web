import { useState, Children, cloneElement, isValidElement, type ReactElement, type HTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import type { SublocationType, MobAffinities } from '../../types/game'
import { AFFINITY_TIER_LABEL, AFFINITY_TIER_COLOR } from '../../engine/combat'
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

interface AffinityHoverTargetProps {
  description: string
  affinities?: MobAffinities
  children: React.ReactNode
}

// Wraps arbitrary enemy-display markup with a hover tooltip showing the
// description plus LOVE/LIKE/DISLIKE/HATE tiers — shared by the legacy
// tile-combat EnemyCenterpiece below and the new-campaign enemy card.
export function AffinityHoverTarget({ description, affinities, children }: AffinityHoverTargetProps) {
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const t = useT()

  function labelFor(key: string): string {
    return (t.content.product        as Record<string, { badge_label: string }>)[key]?.badge_label
      ?? (t.content.transformation   as Record<string, { badge_label: string }>)[key]?.badge_label
      ?? key
  }

  function formatConditions(cond: NonNullable<MobAffinities[keyof MobAffinities]>): string {
    return [
      ...(cond.products    ?? []),
      ...(cond.stages      ?? []),
      ...(cond.mediumTypes ?? []),
      ...(cond.heavyTypes  ?? []),
    ].map(labelFor).join(', ')
  }

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent) => setHoverPos({ x: e.clientX + 16, y: e.clientY - 8 }),
    onMouseMove:  (e: React.MouseEvent) => setHoverPos({ x: e.clientX + 16, y: e.clientY - 8 }),
    onMouseLeave: () => setHoverPos(null),
  }

  return (
    <>
      {Children.map(children, child =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<HTMLAttributes<HTMLElement>>, hoverHandlers)
          : child
      )}

      {hoverPos && createPortal(
        <div className={s.tooltip} style={{ left: hoverPos.x, top: hoverPos.y }}>
          <div className={s.desc}>{description}</div>
          {affinities && (
            <div className={s.affinities}>
              {(Object.entries(affinities) as [keyof MobAffinities, NonNullable<MobAffinities[keyof MobAffinities]>][])
                .filter(([, cond]) => !!cond)
                .map(([tier, cond]) => (
                  <div key={tier} className={s.affinityRow}>
                    <span className={s.affinityTier} style={{ color: AFFINITY_TIER_COLOR[tier] }}>
                      {AFFINITY_TIER_LABEL[tier]}
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
    </>
  )
}

export default function EnemyCenterpiece(props: Props) {
  const hpPct = Math.max(0, props.maxHp > 0 ? (props.hp / props.maxHp) * 100 : 0)

  return (
    <div className={s.wrap} style={{ left: props.x, top: props.y }}>
      <AffinityHoverTarget description={props.description} affinities={props.affinities}>
        <div className={s.info}>
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
      </AffinityHoverTarget>
    </div>
  )
}
