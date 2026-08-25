import type { MicroModeState, WeaponInstance } from '../../types/game'
import { calcTileDamage } from '../../engine/combat'
import type { WorkflowTile } from '../../types/game'
import { useT } from '../../i18n'
import s from './MicroBar.module.css'

const MICRO_SYNTHETIC_TILE: WorkflowTile = {
  id: 'micro_synthetic',
  type: 'Produce',
  name: 'Micro publish',
  time_light: 30,
  time_heavy: 60,
  is_completed: false,
  repeat_count: 0,
}

interface Props {
  micro: MicroModeState
  weapon: WeaponInstance | undefined
  weaponLevel: number
  onPublish: (damage: number) => void
}

export default function MicroBar({ micro, weapon, weaponLevel, onPublish }: Props) {
  const t = useT()
  const current = micro.products[micro.current_index]
  if (!current) return null

  const damage = Math.round(calcTileDamage(MICRO_SYNTHETIC_TILE, 'Heavy', weapon, weaponLevel))

  const typeBadge = (t.content.product as Record<string, { badge_label: string }>)[current.content_type]?.badge_label
    ?? current.content_type

  const styleLabel = current.style
    ? ((t.content.transformation as Record<string, { badge_label?: string; label?: string }>)[current.style]?.badge_label
       ?? current.style)
    : null

  const circleProgress = micro.products.filter(p => p.done_count > 0).length
  const circleTotal = micro.products.length

  return (
    <div className={s.microBar}>
      <div className={s.microInfo}>
        <span className={s.microLabel}>Micro</span>
        <span className={s.microType}>{typeBadge}</span>
        {styleLabel && <span className={s.microStyle}>{styleLabel}</span>}
        <span className={s.microProgress}>{circleProgress}/{circleTotal}</span>
        {micro.completed && <span className={s.microDone}>✓</span>}
      </div>
      <button className={s.publishBtn} onClick={() => onPublish(damage)}>
        Publish <span className={s.publishDmg}>−{damage} HP</span>
      </button>
    </div>
  )
}
