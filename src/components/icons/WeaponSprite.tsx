import type { WeaponClass, WeaponRarity, PoiseWeight } from '../../types/game'
import s from './WeaponSprite.module.css'

interface Props {
  weaponClass: WeaponClass
  rarity: WeaponRarity
  poiseWeight: PoiseWeight
  size?: number  // height in px; width = size * 0.5
}

const BLADE: Record<WeaponRarity, string> = {
  common: '#888', magic: '#6699dd', rare: '#ddbb44', epic: '#bb66ee', legendary: '#ff9944',
}
const SECONDARY: Record<WeaponRarity, string> = {
  common: '#555', magic: '#4466aa', rare: '#997733', epic: '#8833bb', legendary: '#cc6622',
}
const GLOW: Record<WeaponRarity, string | null> = {
  common: null, magic: '#4488cc', rare: '#ccaa22', epic: '#9944cc', legendary: '#ee8822',
}
const SCALE: Record<PoiseWeight, number> = {
  light: 0.88, medium: 1.0, heavy: 1.1, colossal: 1.2,
}

// All shapes in a 32×64 viewBox, centred at x=16
function Blade({ weaponClass, blade, secondary }: { weaponClass: WeaponClass; blade: string; secondary: string }) {
  switch (weaponClass) {
    case 'daggers':
      return (
        <>
          <polygon points="16,2 14,36 16,42 18,36" fill={blade}/>
          <rect x={10} y={34} width={12} height={3} rx={1} fill={secondary}/>
          <rect x={14.5} y={37} width={3} height={12} rx={1.5} fill={secondary}/>
        </>
      )
    case 'straight_swords':
      return (
        <>
          <polygon points="16,2 13.5,30 16,38 18.5,30" fill={blade}/>
          <rect x={6} y={28} width={20} height={3} rx={1} fill={secondary}/>
          <rect x={14.5} y={31} width={3} height={14} rx={1.5} fill={secondary}/>
        </>
      )
    case 'greatswords':
      return (
        <>
          <polygon points="16,1 12.5,28 16,36 19.5,28" fill={blade}/>
          <rect x={2} y={26} width={28} height={4} rx={1.5} fill={secondary}/>
          <rect x={14.5} y={30} width={3} height={18} rx={1.5} fill={secondary}/>
        </>
      )
    case 'katanas':
      return (
        <>
          <path d="M14,2 Q19,28 16,38 Q13,38 14,2" fill={blade}/>
          <rect x={11} y={36} width={10} height={2} rx={3} fill={secondary}/>
          <rect x={14.5} y={38} width={3} height={12} rx={1.5} fill={secondary}/>
        </>
      )
    case 'hammers':
      return (
        <>
          <rect x={4} y={4} width={24} height={18} rx={3} fill={blade}/>
          <rect x={14.5} y={22} width={3} height={36} rx={1.5} fill={secondary}/>
        </>
      )
    case 'spears':
      return (
        <>
          <polygon points="16,1 14,20 16,25 18,20" fill={blade}/>
          <rect x={15} y={22} width={2} height={38} rx={1} fill={secondary}/>
        </>
      )
    case 'axes':
      return (
        <>
          <rect x={14.5} y={4} width={3} height={54} rx={1.5} fill={secondary}/>
          <path d="M16,8 L6,28 L16,34 Z" fill={blade}/>
        </>
      )
    case 'bows':
      return (
        <>
          <line x1={16} y1={3} x2={16} y2={61} stroke={secondary} strokeWidth={1} opacity={0.6}/>
          <path d="M16,3 Q4,32 16,61" fill="none" stroke={blade} strokeWidth={3.5} strokeLinecap="round"/>
        </>
      )
    case 'fists':
      return (
        <>
          <rect x={4} y={14} width={24} height={14} rx={3} fill={blade}/>
          <rect x={6} y={28} width={20} height={22} rx={3} fill={blade}/>
          <rect x={2} y={19} width={6} height={10} rx={3} fill={secondary}/>
          {([7, 12, 17, 22] as number[]).map(x => (
            <circle key={x} cx={x} cy={14} r={2} fill={secondary}/>
          ))}
        </>
      )
  }
}

export default function WeaponSprite({ weaponClass, rarity, poiseWeight, size = 52 }: Props) {
  const blade     = BLADE[rarity]
  const secondary = SECONDARY[rarity]
  const glow      = GLOW[rarity]
  const scale     = SCALE[poiseWeight]
  const width     = Math.round(size * 0.5)

  const glowStyle = glow ? { filter: `drop-shadow(0 0 ${rarity === 'legendary' ? 5 : 3}px ${glow})` } : undefined

  return (
    <svg
      viewBox="0 0 32 64"
      width={width}
      height={size}
      aria-hidden="true"
      style={{ flexShrink: 0, ...glowStyle }}
      className={rarity === 'legendary' ? s.legendaryPulse : undefined}
    >
      <g transform={`translate(16,32) scale(${scale}) translate(-16,-32)`}>
        <Blade weaponClass={weaponClass} blade={blade} secondary={secondary}/>
      </g>
    </svg>
  )
}
