import { useEffect, useState } from 'react'
import type { Moveset, Step } from '../../types/game'
import MovesetIcon from '../icons/MovesetIcon'
import s from './RadialMenu.module.css'

export interface RadialItem {
  moveset: Moveset
  step: Step
  stepIdx: number
  totalSteps: number
  dmg: number
  canUse: boolean
  tx: number
  ty: number
}

interface Props {
  x: number
  y: number
  items: RadialItem[]
  onSelect: (step: Step, moveset: Moveset) => void
  onClose: () => void
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), s = secs % 60
  return m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m}m`) : `${s}s`
}

export default function RadialMenu({ x, y, items, onSelect, onClose }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredItem = hoveredId ? items.find(it => it.moveset.id === hoveredId) ?? null : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />

      {items.map((item, i) => (
        <button
          key={item.moveset.id}
          className={`${s.item} ${!item.canUse ? s.itemDisabled : ''}`}
          disabled={!item.canUse}
          style={{
            top:  y,
            left: x,
            '--tx': `${item.tx}px`,
            '--ty': `${item.ty}px`,
            animationDelay: `${i * 22}ms`,
          } as React.CSSProperties}
          onMouseEnter={() => setHoveredId(item.moveset.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={e => {
            e.stopPropagation()
            onSelect(item.step, item.moveset)
            onClose()
          }}
        >
          <MovesetIcon movesetId={item.moveset.id} size={22} />
        </button>
      ))}

      {hoveredItem && (
        <div
          className={s.tooltip}
          style={{ top: y + hoveredItem.ty - 36, left: x + hoveredItem.tx }}
          aria-hidden="true"
        >
          <div className={s.tooltipName}>
            {hoveredItem.totalSteps > 1 && (
              <span className={s.tooltipStep}>[{hoveredItem.stepIdx + 1}/{hoveredItem.totalSteps}] </span>
            )}
            {hoveredItem.moveset.name}
          </div>
          <div className={s.tooltipTask}>{hoveredItem.step.name}</div>
          <div className={s.tooltipMeta}>
            <span>{fmtTime(hoveredItem.step.time)}</span>
            <span className={s.tooltipDmg}>{hoveredItem.dmg} dmg</span>
            <span className={s.tooltipSta}>{hoveredItem.moveset.stamina_cost} STA</span>
          </div>
        </div>
      )}
    </>
  )
}
