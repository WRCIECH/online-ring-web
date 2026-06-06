import { useState } from 'react'
import type { CombatAction } from '../../engine/combat'
import type { WeaponInstance } from '../../types/game'
import { WEAPONS } from '../../data/weapons'
import WeaponSprite from '../icons/WeaponSprite'
import { useT } from '../../i18n'
import s from './QuickBar.module.css'

const EMPTY_SLOT = (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="4 3"/>
  </svg>
)

interface Props {
  equippedWeapons:      string[]
  activeWeaponIdx:      number
  playerEstus:          number
  phase:                string
  dispatch:             React.Dispatch<CombatAction>
  weaponHeatAccumulated: Record<string, number>
}

export default function QuickBar({ equippedWeapons, activeWeaponIdx, playerEstus, phase, dispatch, weaponHeatAccumulated }: Props) {
  const t         = useT()
  const canAct    = phase === 'PLAYER_ATTACK' || phase === 'ENEMY_ATTACK'
  const canSwitch = phase === 'PLAYER_ATTACK'

  const [weaponTip, setWeaponTip] = useState<{ idx: number; rect: DOMRect } | null>(null)
  const [estusTip, setEstusTip]  = useState<DOMRect | null>(null)

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

        // Heat display
        const uses      = wid ? (weaponHeatAccumulated[wid] ?? 0) : 0
        const threshold = weapon?.heat_threshold ?? Infinity
        const heatPct   = threshold === Infinity || !weapon ? 0 : Math.min(1, uses / threshold)
        const overUses  = weapon ? Math.max(0, uses - threshold) : 0
        const penaltyPct = Math.min(75, Math.round(overUses * 2.5))
        const isOver    = overUses > 0
        const heatColor = heatPct < 0.6 ? '#44aa55' : heatPct < 0.9 ? '#cc8833' : '#cc3333'

        return (
          <button
            key={idx}
            className={[s.slot, isActive ? s.slotActive : '', !weapon ? s.slotMissing : ''].join(' ')}
            onClick={() => { if (isClickable) dispatch({ type: 'SET_WEAPON', idx }) }}
            onMouseEnter={e => weapon ? handleWeaponEnter(e, idx) : undefined}
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
            {weapon && heatPct > 0 && (
              <span
                className={s.heatBar}
                style={{ width: `${heatPct * 100}%`, background: heatColor }}
              />
            )}
            {weapon && isOver && (
              <span className={s.heatPenalty}>−{penaltyPct}%🔥</span>
            )}
          </button>
        )
      })}

      {/* Weapon tooltip */}
      {weaponTip && tipWeapon && (
        <div
          className={s.weaponTooltip}
          style={{ left: weaponTip.rect.left, top: weaponTip.rect.top - 8 }}
        >
          <div className={s.tipName}>{tipWeapon.name}</div>
          <div className={s.tipSub}>
            {tipWeapon.weapon_class ? (t.weapons[tipWeapon.weapon_class]?.name ?? tipWeapon.weapon_class.replace(/_/g, ' ')) : ''}
            {tipWeapon.rarity ? ` · ${tipWeapon.rarity}` : ''}
          </div>
          {(() => {
            const wid2     = equippedWeapons[weaponTip.idx]
            const uses2    = wid2 ? (weaponHeatAccumulated[wid2] ?? 0) : 0
            const thresh2  = tipWeapon.heat_threshold ?? Infinity
            const over2    = Math.max(0, uses2 - thresh2)
            const penalty2 = Math.min(75, Math.round(over2 * 2.5))
            return (
              <>
                <div className={s.tipHeat}>
                  {t.ui.heat_label} {uses2} / {thresh2 === Infinity ? '∞' : thresh2} {t.ui.heat_uses_suffix}
                  {over2 > 0 ? ` · −${penalty2}% ${t.ui.dmg_suffix}` : ''}
                </div>
                <div className={s.tipHeatDesc}>
                  {t.ui.heat_desc}
                </div>
              </>
            )
          })()}
          <div className={s.tipHint}>
            {weaponTip.idx === activeWeaponIdx ? t.ui.active_weapon : t.ui.click_to_switch}
          </div>
        </div>
      )}

      {/* Estus tooltip */}
      {estusTip && (
        <div
          className={s.weaponTooltip}
          style={{ left: estusTip.left, top: estusTip.top - 8 }}
        >
          <div className={s.tipName}>{t.ui.estus_flask}</div>
          <div className={s.tipSub}>{playerEstus} / 3 {t.ui.estus_remaining}</div>
          <div className={s.tipHint}>{t.ui.estus_heal}</div>
        </div>
      )}

      <div className={s.divider} />

      {/* Estus flask */}
      <button
        className={[s.slot, s.estusSlot, playerEstus <= 0 ? s.slotDepleted : ''].join(' ')}
        onClick={() => { if (canAct && playerEstus > 0) dispatch({ type: 'USE_ESTUS' }) }}
        onMouseEnter={e => setEstusTip((e.currentTarget as HTMLButtonElement).getBoundingClientRect())}
        onMouseLeave={() => setEstusTip(null)}
      >
        <span className={s.icon} style={{ fontSize: '1.5rem', lineHeight: 1 }}>🧪</span>
        <span className={s.label}>{t.ui.estus_label}</span>
        <span className={s.badge}>{playerEstus}</span>
      </button>
    </div>
  )
}
