import { useEffect, useRef, useState } from 'react'
import s from './MoveRadialMenu.module.css'

export interface RadialMoveItem {
  id: string
  label: string
  sublabel?: string
  metaParts: Array<{ text: string; color?: string; tooltip?: string }>
  colorVar: string
  tx: number
  ty: number
  onSelect: () => void
}

interface Props {
  x: number
  y: number
  items: RadialMoveItem[]
  onClose: () => void
}

export default function MoveRadialMenu({ x, y, items, onClose }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeDesc, setActiveDesc] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hoveredItem = hoveredId ? items.find(it => it.id === hoveredId) ?? null : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function showTooltip(id: string) {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setHoveredId(id)
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => {
      setHoveredId(null)
      setActiveDesc(null)
    }, 80)
  }

  function cancelHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  function handleMetaEnter(tooltip: string | undefined) {
    if (!tooltip) return
    if (descTimer.current) clearTimeout(descTimer.current)
    descTimer.current = setTimeout(() => setActiveDesc(tooltip), 100)
  }

  function handleMetaLeave() {
    if (descTimer.current) clearTimeout(descTimer.current)
    setActiveDesc(null)
  }

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />

      {items.map((item, i) => (
        <button
          key={item.id}
          className={s.item}
          style={{
            top:    y,
            left:   x,
            color:  item.colorVar,
            '--tx': `${item.tx}px`,
            '--ty': `${item.ty}px`,
            animationDelay: `${i * 22}ms`,
          } as React.CSSProperties}
          onMouseEnter={() => showTooltip(item.id)}
          onMouseLeave={scheduleHide}
          onClick={e => { e.stopPropagation(); item.onSelect(); onClose() }}
        >
          {item.label[0]}
        </button>
      ))}

      {hoveredItem && (
        <div
          className={s.tooltip}
          style={{ top: y + hoveredItem.ty - 36, left: x + hoveredItem.tx }}
          aria-hidden="true"
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <div className={s.tooltipName}>
            {hoveredItem.label}
            {hoveredItem.sublabel && <span className={s.tooltipSub}> · {hoveredItem.sublabel}</span>}
          </div>
          <div className={s.tooltipMeta}>
            {hoveredItem.metaParts.map((p, i) => (
              <span
                key={i}
                style={p.color ? { color: p.color } : undefined}
                className={[s.metaBadge, p.tooltip ? s.metaHoverable : ''].filter(Boolean).join(' ')}
                onMouseEnter={() => handleMetaEnter(p.tooltip)}
                onMouseLeave={handleMetaLeave}
              >
                {p.text}
              </span>
            ))}
          </div>
          {activeDesc && (
            <div className={s.metaDesc}>{activeDesc}</div>
          )}
        </div>
      )}
    </>
  )
}
