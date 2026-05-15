import type { CombatAction } from '../../engine/combat'
import { WEAPONS } from '../../data/weapons'
import s from './QuickBar.module.css'

// ── Weapon SVG icons ─────────────────────────────────────────────────────────

const WEAPON_ICONS: Record<string, React.ReactElement> = {
  unarmed: (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V9a2 2 0 00-4 0V8a2 2 0 00-4 0V6a2 2 0 00-4 0v5l-1.5-1.5a2 2 0 00-2.83 2.83L6 17a6 6 0 0012 0v-4a2 2 0 00-2-2h-2z"/>
    </svg>
  ),
  dagger: (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  ),
  greatsword: (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      <line x1="8" y1="7" x2="16" y2="7"/>
      <line x1="8" y1="11" x2="13" y2="11"/>
    </svg>
  ),
}

const FALLBACK_WEAPON = (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="7" x2="12" y2="17"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  </svg>
)

const EMPTY_SLOT = (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="4 3"/>
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  equippedWeapons: string[]
  activeWeaponIdx: number
  playerEstus: number
  phase: string
  dispatch: React.Dispatch<CombatAction>
}

export default function QuickBar({ equippedWeapons, activeWeaponIdx, playerEstus, phase, dispatch }: Props) {
  const canAct    = phase === 'PLAYER_ATTACK' || phase === 'ENEMY_ATTACK'
  const canSwitch = phase === 'PLAYER_ATTACK'

  return (
    <div className={s.bar}>
      {/* Weapon slots — always show 2 */}
      {[0, 1].map(idx => {
        const wid    = equippedWeapons[idx]
        const weapon = wid ? WEAPONS[wid] : null
        const isActive  = idx === activeWeaponIdx
        const isClickable = !!weapon && canSwitch && !isActive

        return (
          <button
            key={idx}
            className={[s.slot, isActive ? s.slotActive : '', !weapon ? s.slotMissing : ''].join(' ')}
            disabled={!isClickable}
            onClick={() => dispatch({ type: 'SET_WEAPON', idx })}
            title={weapon ? `${weapon.name}${isActive ? ' (active)' : ' — click to switch'}` : 'Empty weapon slot'}
          >
            <span className={s.icon}>
              {weapon ? (WEAPON_ICONS[wid] ?? FALLBACK_WEAPON) : EMPTY_SLOT}
            </span>
            <span className={s.label}>{weapon?.name ?? '—'}</span>
            {isActive && <span className={s.activePip} />}
          </button>
        )
      })}

      <div className={s.divider} />

      {/* Estus flask */}
      <button
        className={[s.slot, s.estusSlot, playerEstus <= 0 ? s.slotDepleted : ''].join(' ')}
        disabled={!canAct || playerEstus <= 0}
        onClick={() => dispatch({ type: 'USE_ESTUS' })}
        title={`Estus Flask — heals 40% HP (${playerEstus} remaining)`}
      >
        <span className={s.icon} style={{ fontSize: '1.5rem', lineHeight: 1 }}>🧪</span>
        <span className={s.label}>Estus</span>
        <span className={s.badge}>{playerEstus}</span>
      </button>
    </div>
  )
}
