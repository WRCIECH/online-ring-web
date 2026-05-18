import type { WeaponRarity, MovesetVariant, GeneratedMoveset } from '../../types/game'
import { MOVES } from '../../data/movesets'

interface Props {
  movesetId: string
  size?: number
  className?: string
}

const RARITY_DOT: Record<WeaponRarity, string> = {
  common: '#888', magic: '#4488cc', rare: '#ccaa22', epic: '#9944cc', legendary: '#ee8822',
}

function variantIcon(v: MovesetVariant) {
  switch (v) {
    case 'Light': return (
      <>
        <polyline points="3,14 7,9 11,14 15,9 19,14"/>
        <line x1="11" y1="20" x2="11" y2="14"/>
      </>
    )
    case 'Heavy': return (
      <>
        <rect x="4" y="9" width="16" height="10" rx="2" strokeWidth="2"/>
        <line x1="12" y1="4" x2="12" y2="9" strokeWidth="2.5"/>
      </>
    )
    case 'Skill': return (
      <polygon points="12,2 14.5,9 21.5,9 16,13.5 18,21 12,16.5 6,21 8,13.5 2.5,9 9.5,9"/>
    )
    case 'Jump': return (
      <>
        <line x1="12" y1="20" x2="12" y2="7"/>
        <polyline points="7,12 12,7 17,12"/>
        <path d="M7,20 Q12,17 17,20" fill="none"/>
      </>
    )
  }
}

function GeneratedMovesetIcon({ movesetId, size = 18, className }: Props) {
  const raw = MOVES[movesetId]
  const moveset = raw && 'variant_type' in raw ? (raw as GeneratedMoveset) : null
  const variant: MovesetVariant = moveset?.variant_type ?? 'Skill'
  const dotColor = moveset ? RARITY_DOT[moveset.rarity] : '#888'

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {variantIcon(variant)}
      <circle cx="20" cy="4" r="2.5" fill={dotColor} stroke="none"/>
    </svg>
  )
}

const ICONS: Record<string, React.ReactElement> = {
  starter_chain: (
    <>
      <circle cx="5"  cy="12" r="3"/>
      <line x1="8"   y1="12" x2="9.5"  y2="12"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="14.5" y1="12" x2="16"  y2="12"/>
      <circle cx="19" cy="12" r="3"/>
    </>
  ),
  no_backspace: (
    <>
      <path d="M21 6H10L4 12l6 6h11a1 1 0 001-1V7a1 1 0 00-1-1z"/>
      <line x1="13" y1="9.5"  x2="18" y2="14.5"/>
      <line x1="18" y1="9.5"  x2="13" y2="14.5"/>
    </>
  ),
  immediate_strike: (
    <polyline points="13 2 8 14 13 14 11 22 16 10 11 10 13 2"/>
  ),
  single_thought: (
    <>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/>
    </>
  ),
  explain_simply: (
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
  ),
  concrete_hit: (
    <>
      <circle cx="4" cy="6"  r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
      <line x1="8" y1="6"  x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
    </>
  ),
  question_jab: (
    <>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
      <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none"/>
    </>
  ),
  momentum_combo: (
    <>
      <polyline points="5 18 12 12 5 6"/>
      <polyline points="12 18 19 12 12 6"/>
    </>
  ),
  recovery_roll: (
    <>
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </>
  ),
  raw_take: (
    <>
      <line x1="12" y1="2"  x2="12" y2="14"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>
    </>
  ),
  endurance_strike: (
    <path d="M12 2c0 4-4 5-4 9a4 4 0 008 0c0-4-4-5-4-9zM9.5 14.5c.5 1 1.5 1.5 2.5 1.5"/>
  ),
  fast_publish: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </>
  ),
  unarmed_block: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  ),
  unarmed_parry: (
    <>
      <polyline points="15 18 21 12 15 6"/>
      <path d="M3 12h18"/>
      <path d="M3 7.5A10.5 10.5 0 0013.5 18"/>
    </>
  ),
}

const FALLBACK = (
  <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
)

export default function MovesetIcon({ movesetId, size = 18, className }: Props) {
  if (movesetId.startsWith('m_')) {
    return <GeneratedMovesetIcon movesetId={movesetId} size={size} className={className}/>
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {ICONS[movesetId] ?? FALLBACK}
    </svg>
  )
}
