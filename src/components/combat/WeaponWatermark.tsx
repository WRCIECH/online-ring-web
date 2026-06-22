import type { WeaponClass } from '../../types/game'
import { Blade } from '../icons/WeaponSprite'

interface Props {
  weaponClass: WeaponClass
  width:  number
  height: number
}

// Purely decorative — a large, faint silhouette of the equipped weapon
// sitting behind the tile graph. Blade's native art is a 32×64 viewBox;
// scale it to fit within the stage on whichever axis is tighter, so it
// never overflows a narrow or unusually wide workflow shape.
export default function WeaponWatermark({ weaponClass, width, height }: Props) {
  const scale = Math.min(width / 32, height / 64) * 0.82
  const cx = width / 2
  const cy = height / 2

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <g transform={`translate(${cx},${cy}) scale(${scale}) translate(-16,-32)`} opacity={0.07}>
        <Blade weaponClass={weaponClass} blade="#ffffff" secondary="#ffffff" />
      </g>
    </svg>
  )
}
