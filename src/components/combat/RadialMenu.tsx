import { useEffect, useState } from 'react'
import type { Step, Moveset } from '../../types/game'
import MovesetIcon from '../icons/MovesetIcon'
import s from './RadialMenu.module.css'

export interface RadialItem {
  id: string
  movesetId?: string
  customIcon?: React.ReactNode
  label: string
  sublabel?: string
  metaParts?: Array<{ text: string; color?: string }>
  canUse: boolean
  disabledReason?: string
  tx: number
  ty: number
  onSelect: () => void
}

// kept for backward-compat with callers that pass step/moveset info
export type { Step, Moveset }

interface Props {
  x: number
  y: number
  items: RadialItem[]
  onClose: () => void
}

export default function RadialMenu({ x, y, items, onClose }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredItem = hoveredId ? items.find(it => it.id === hoveredId) ?? null : null

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
          key={item.id}
          className={`${s.item} ${!item.canUse ? s.itemDisabled : ''}`}
          style={{
            top:  y,
            left: x,
            '--tx': `${item.tx}px`,
            '--ty': `${item.ty}px`,
            animationDelay: `${i * 22}ms`,
          } as React.CSSProperties}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={e => { e.stopPropagation(); if (item.canUse) { item.onSelect(); onClose() } }}
        >
          {item.movesetId
            ? <MovesetIcon movesetId={item.movesetId} size={22} />
            : item.customIcon}
        </button>
      ))}

      {hoveredItem && (
        <div
          className={s.tooltip}
          style={{ top: y + hoveredItem.ty - 36, left: x + hoveredItem.tx }}
          aria-hidden="true"
        >
          <div className={s.tooltipName}>{hoveredItem.label}</div>
          {hoveredItem.sublabel && (
            <div className={s.tooltipTask}>{hoveredItem.sublabel}</div>
          )}
          {hoveredItem.metaParts && hoveredItem.metaParts.length > 0 && (
            <div className={s.tooltipMeta}>
              {hoveredItem.metaParts.map((p, i) => (
                <span key={i} style={p.color ? { color: p.color } : undefined}>{p.text}</span>
              ))}
            </div>
          )}
          {!hoveredItem.canUse && hoveredItem.disabledReason && (
            <div className={s.tooltipDisabled}>{hoveredItem.disabledReason}</div>
          )}
        </div>
      )}
    </>
  )
}
