import { useEffect } from 'react'
import type { Moveset, Step } from '../../types/game'
import MovesetIcon from '../icons/MovesetIcon'
import s from './RadialMenu.module.css'

export interface RadialItem {
  moveset: Moveset
  step: Step
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

export default function RadialMenu({ x, y, items, onSelect, onClose }: Props) {
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
          title={`${item.moveset.name} · ${item.dmg} dmg · ${item.moveset.stamina_cost} STA`}
          onClick={e => {
            e.stopPropagation()
            onSelect(item.step, item.moveset)
            onClose()
          }}
        >
          <MovesetIcon movesetId={item.moveset.id} size={22} />
        </button>
      ))}
    </>
  )
}
