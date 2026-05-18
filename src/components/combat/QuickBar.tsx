import { useState } from 'react'
import type { CombatAction } from '../../engine/combat'
import type { WeaponInstance } from '../../types/game'
import { WEAPONS } from '../../data/weapons'
import WeaponSprite from '../icons/WeaponSprite'
import s from './QuickBar.module.css'

const EMPTY_SLOT = (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="4 3"/>
  </svg>
)

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

  const [weaponTip, setWeaponTip] = useState<{ idx: number; rect: DOMRect } | null>(null)

  function handleWeaponEnter(e: React.MouseEvent<HTMLButtonElement>, idx: number) {
    setWeaponTip({ idx, rect: (e.currentTarget as HTMLButtonElement).getBoundingClientRect() })
  }

  const tipWeapon = weaponTip !== null ? WEAPONS[equippedWeapons[weaponTip.idx]] as WeaponInstance | null : null

  return (
    <div className={s.bar}>
      {/* Weapon slots */}
      {[0, 1].map(idx => {
        const wid     = equippedWeapons[idx]
        const weapon  = wid ? WEAPONS[wid] as WeaponInstance | null : null
        const isActive    = idx === activeWeaponIdx
        const isClickable = !!weapon && canSwitch && !isActive

        return (
          <button
            key={idx}
            className={[s.slot, isActive ? s.slotActive : '', !weapon ? s.slotMissing : ''].join(' ')}
            disabled={!isClickable}
            onClick={() => dispatch({ type: 'SET_WEAPON', idx })}
            onMouseEnter={e => handleWeaponEnter(e, idx)}
            onMouseLeave={() => setWeaponTip(null)}
          >
            {weapon ? (
              <WeaponSprite
                weaponClass={weapon.weapon_class ?? 'straight_swords'}
                rarity={weapon.rarity ?? 'common'}
                poiseWeight={weapon.poise_weight ?? 'medium'}
                size={44}
              />
            ) : EMPTY_SLOT}
            {isActive && <span className={s.activePip} />}
          </button>
        )
      })}

      {/* Weapon tooltip */}
      {weaponTip && tipWeapon && (
        <div
          className={s.weaponTooltip}
          style={{
            left: weaponTip.rect.left + weaponTip.rect.width / 2,
            top:  weaponTip.rect.top - 8,
          }}
        >
          <div className={s.tipName}>{tipWeapon.name}</div>
          <div className={s.tipSub}>
            {tipWeapon.weapon_class?.replace(/_/g, ' ')}
            {tipWeapon.rarity ? ` · ${tipWeapon.rarity}` : ''}
          </div>
          <div className={s.tipHint}>
            {weaponTip.idx === activeWeaponIdx ? 'Active weapon' : 'Click to switch'}
          </div>
        </div>
      )}

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
