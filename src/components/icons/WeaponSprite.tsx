import { memo } from 'react'
import type { WeaponClass, WeaponRarity } from '../../types/game'

type PoiseWeight = 'light' | 'medium' | 'heavy' | 'colossal'
import s from './WeaponSprite.module.css'

interface Props {
  weaponClass: WeaponClass
  rarity: WeaponRarity
  poiseWeight: PoiseWeight
  size?: number  // height in px; width = size * 0.5
}

const BLADE: Record<WeaponRarity, string> = {
  common: '#888', Intellectual: '#6699dd', rare: '#ddbb44', epic: '#bb66ee', legendary: '#ff9944',
}
const SECONDARY: Record<WeaponRarity, string> = {
  common: '#555', Intellectual: '#4466aa', rare: '#997733', epic: '#8833bb', legendary: '#cc6622',
}
const GLOW: Record<WeaponRarity, string | null> = {
  common: null, Intellectual: '#4488cc', rare: '#ccaa22', epic: '#9944cc', legendary: '#ee8822',
}
const SCALE: Record<PoiseWeight, number> = {
  light: 0.88, medium: 1.0, heavy: 1.1, colossal: 1.2,
}

// All shapes in a 32×64 viewBox, centred at x=16
export function Blade({ weaponClass, blade, secondary }: { weaponClass: WeaponClass; blade: string; secondary: string }) {
  switch (weaponClass) {

    /* ── Original 9 ────────────────────────────────────────────────────── */

    case 'daggers':
      return (<>
        <polygon points="16,2 14,36 16,42 18,36" fill={blade}/>
        <rect x={10} y={34} width={12} height={3} rx={1} fill={secondary}/>
        <rect x={14.5} y={37} width={3} height={12} rx={1.5} fill={secondary}/>
      </>)

    case 'straight_swords':
      return (<>
        <polygon points="16,2 13.5,30 16,38 18.5,30" fill={blade}/>
        <rect x={6} y={28} width={20} height={3} rx={1} fill={secondary}/>
        <rect x={14.5} y={31} width={3} height={14} rx={1.5} fill={secondary}/>
      </>)

    case 'greatswords':
      return (<>
        <polygon points="16,1 12.5,28 16,36 19.5,28" fill={blade}/>
        <rect x={2} y={26} width={28} height={4} rx={1.5} fill={secondary}/>
        <rect x={14.5} y={30} width={3} height={18} rx={1.5} fill={secondary}/>
      </>)

    case 'katanas':
      return (<>
        <path d="M14,2 Q19,28 16,38 Q13,38 14,2" fill={blade}/>
        <rect x={11} y={36} width={10} height={2} rx={3} fill={secondary}/>
        <rect x={14.5} y={38} width={3} height={12} rx={1.5} fill={secondary}/>
      </>)

    case 'hammers':
      return (<>
        <rect x={4} y={4} width={24} height={18} rx={3} fill={blade}/>
        <rect x={14.5} y={22} width={3} height={36} rx={1.5} fill={secondary}/>
      </>)

    case 'spears':
      return (<>
        <polygon points="16,1 14,20 16,25 18,20" fill={blade}/>
        <rect x={15} y={22} width={2} height={38} rx={1} fill={secondary}/>
      </>)

    case 'axes':
      return (<>
        <rect x={14.5} y={4} width={3} height={54} rx={1.5} fill={secondary}/>
        <path d="M16,8 L6,28 L16,34 Z" fill={blade}/>
      </>)

    case 'bows':
      return (<>
        <line x1={16} y1={3} x2={16} y2={61} stroke={secondary} strokeWidth={1} opacity={0.6}/>
        <path d="M16,3 Q4,32 16,61" fill="none" stroke={blade} strokeWidth={3.5} strokeLinecap="round"/>
      </>)

    case 'fists':
      return (<>
        <rect x={4} y={14} width={24} height={14} rx={3} fill={blade}/>
        <rect x={6} y={28} width={20} height={22} rx={3} fill={blade}/>
        <rect x={2} y={19} width={6} height={10} rx={3} fill={secondary}/>
        {([7, 12, 17, 22] as number[]).map(x => (
          <circle key={x} cx={x} cy={14} r={2} fill={secondary}/>
        ))}
      </>)

    /* ── New 18 ────────────────────────────────────────────────────────── */

    case 'colossal_swords':
      return (<>
        <polygon points="16,1 10,20 16,28 22,20" fill={blade}/>
        <rect x={0} y={18} width={32} height={5} rx={2} fill={secondary}/>
        <rect x={14} y={23} width={4} height={36} rx={2} fill={secondary}/>
        <circle cx={16} cy={61} r={3} fill={secondary}/>
      </>)

    case 'thrusting_swords':
      return (<>
        <polygon points="16,2 15.5,50 16,55 16.5,50" fill={blade}/>
        <rect x={12} y={48} width={8} height={3} rx={1} fill={secondary}/>
        <rect x={14.5} y={51} width={3} height={10} rx={1.5} fill={secondary}/>
      </>)

    case 'heavy_thrusting':
      return (<>
        <polygon points="16,2 14.5,44 16,50 17.5,44" fill={blade}/>
        <rect x={9} y={42} width={14} height={4} rx={1} fill={secondary}/>
        <rect x={14.5} y={46} width={3} height={14} rx={1.5} fill={secondary}/>
      </>)

    case 'curved_swords':
      return (<>
        <path d="M18,2 Q14,28 16,40 Q18,40 18,2" fill={blade}/>
        <rect x={11} y={38} width={10} height={2} rx={3} fill={secondary}/>
        <rect x={14.5} y={40} width={3} height={10} rx={1.5} fill={secondary}/>
      </>)

    case 'curved_greatswords':
      return (<>
        <path d="M18,1 Q12,24 16,38 Q20,38 18,1" fill={blade}/>
        <rect x={7} y={36} width={18} height={3} rx={2} fill={secondary}/>
        <rect x={14.5} y={39} width={3} height={18} rx={1.5} fill={secondary}/>
      </>)

    case 'twinblades':
      return (<>
        <polygon points="11,4 9.5,40 11,44 12.5,40" fill={blade}/>
        <polygon points="21,4 19.5,40 21,44 22.5,40" fill={blade}/>
        <rect x={14} y={20} width={4} height={20} rx={2} fill={secondary}/>
      </>)

    case 'great_hammers':
      return (<>
        <rect x={1} y={3} width={30} height={24} rx={4} fill={blade}/>
        <rect x={14.5} y={27} width={3} height={35} rx={1.5} fill={secondary}/>
      </>)

    case 'great_axes':
      return (<>
        <rect x={14.5} y={3} width={3} height={58} rx={1.5} fill={secondary}/>
        <path d="M16,5 L4,30 L16,42 Z" fill={blade}/>
        <path d="M16,12 L24,22 L16,26 Z" fill={secondary} opacity={0.65}/>
      </>)

    case 'flails':
      return (<>
        <rect x={14.5} y={36} width={3} height={24} rx={1.5} fill={secondary}/>
        <path d="M16,36 Q22,26 18,14" fill="none" stroke={secondary} strokeWidth={1.5} strokeDasharray="2 2"/>
        <circle cx={18} cy={10} r={8} fill={blade}/>
        <circle cx={12} cy={5} r={2} fill={secondary}/>
        <circle cx={24} cy={5} r={2} fill={secondary}/>
        <circle cx={18} cy={2} r={2} fill={secondary}/>
        <circle cx={26} cy={11} r={2} fill={secondary}/>
      </>)

    case 'colossal_weapons':
      return (<>
        <polygon points="16,1 9,18 16,26 23,18" fill={blade}/>
        <rect x={0} y={16} width={32} height={7} rx={3} fill={secondary}/>
        <rect x={14} y={23} width={4} height={38} rx={2} fill={secondary}/>
        <rect x={11} y={57} width={10} height={4} rx={2} fill={secondary}/>
      </>)

    case 'great_spears':
      return (<>
        <polygon points="16,1 14,22 16,28 18,22" fill={blade}/>
        <rect x={15} y={24} width={2} height={40} rx={1} fill={secondary}/>
        <rect x={12} y={22} width={8} height={3} rx={1} fill={secondary}/>
      </>)

    case 'halberds':
      return (<>
        <rect x={15} y={4} width={2} height={58} rx={1} fill={secondary}/>
        <polygon points="16,2 14.5,22 16,27 17.5,22" fill={blade}/>
        <path d="M15,20 L5,34 L15,38 Z" fill={blade}/>
        <polygon points="17,22 24,28 17,32" fill={secondary} opacity={0.65}/>
      </>)

    case 'reapers':
      return (<>
        <rect x={15} y={18} width={2} height={44} rx={1} fill={secondary}/>
        <path d="M16,18 Q30,10 28,28 Q22,32 16,28" fill={blade}/>
        <circle cx={16} cy={24} r={3} fill="none" stroke={secondary} strokeWidth={1.5}/>
      </>)

    case 'whips':
      return (<>
        <rect x={14.5} y={44} width={3} height={18} rx={1.5} fill={secondary}/>
        <path d="M16,44 Q24,36 12,26 Q4,16 16,8 Q24,4 20,12" fill="none" stroke={blade} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={20} cy={12} r={1.5} fill={blade}/>
      </>)

    case 'greatbows':
      return (<>
        <line x1={14} y1={3} x2={14} y2={61} stroke={secondary} strokeWidth={1} opacity={0.5}/>
        <path d="M14,3 Q2,32 14,61" fill="none" stroke={blade} strokeWidth={5} strokeLinecap="round"/>
        <rect x={11} y={27} width={6} height={10} rx={2} fill={secondary}/>
      </>)

    case 'crossbows':
      return (<>
        <rect x={13} y={22} width={6} height={40} rx={2} fill={secondary}/>
        <path d="M3,24 Q16,16 29,24" fill="none" stroke={blade} strokeWidth={4} strokeLinecap="round"/>
        <line x1={3} y1={24} x2={29} y2={24} stroke={secondary} strokeWidth={1} opacity={0.5}/>
        <rect x={11} y={38} width={10} height={4} rx={2} fill={secondary}/>
      </>)

    case 'ballistas':
      return (<>
        <rect x={6} y={22} width={20} height={14} rx={2} fill={secondary}/>
        <path d="M2,27 Q16,18 30,27" fill="none" stroke={blade} strokeWidth={5} strokeLinecap="round"/>
        <line x1={2} y1={27} x2={30} y2={27} stroke={secondary} strokeWidth={1.5} opacity={0.5}/>
        <rect x={10} y={36} width={12} height={24} rx={2} fill={secondary}/>
        <line x1={16} y1={22} x2={16} y2={12} stroke={blade} strokeWidth={1.5} opacity={0.6}/>
        <polygon points="16,8 14,14 18,14" fill={blade} opacity={0.6}/>
      </>)

    case 'torches':
      return (<>
        <rect x={14.5} y={32} width={3} height={30} rx={1.5} fill={secondary}/>
        <rect x={11} y={24} width={10} height={10} rx={2} fill={secondary}/>
        <path d="M16,24 Q21,16 19,10 Q22,5 18,4 Q16,8 14,4 Q10,5 13,10 Q11,16 16,24Z" fill={blade}/>
        <path d="M16,22 Q18,16 17,12 Q18,9 16,8 Q14,9 15,12 Q14,16 16,22Z" fill="rgba(255,200,50,0.35)"/>
      </>)
  }
}

const WeaponSprite = memo(function WeaponSprite({ weaponClass, rarity, poiseWeight, size = 52 }: Props) {
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
})

export default WeaponSprite
