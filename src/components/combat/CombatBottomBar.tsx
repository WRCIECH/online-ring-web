import { useState } from 'react'
import type { WeaponInstance } from '../../types/game'
import WeaponSprite from '../icons/WeaponSprite'
import { useT } from '../../i18n'
import s from './CombatBottomBar.module.css'

interface Props {
  weapon:      WeaponInstance | undefined
  weaponLevel: number
  playerEstus: number
  canAct:      boolean
  onEstus:     () => void
  onAbandon:   () => void
}

export default function CombatBottomBar({ weapon, weaponLevel, playerEstus, canAct, onEstus, onAbandon }: Props) {
  const t = useT()
  const [showWeaponTip, setShowWeaponTip] = useState(false)
  const [showEstusTip,  setShowEstusTip]  = useState(false)

  return (
    <div className={s.bar}>
      {/* Weapon slot — informational only, no mid-combat switching */}
      <div
        className={s.slot}
        onMouseEnter={() => setShowWeaponTip(true)}
        onMouseLeave={() => setShowWeaponTip(false)}
      >
        {weapon ? (
          <WeaponSprite
            weaponClass={weapon.weapon_class}
            rarity={weapon.rarity ?? 'common'}
            poiseWeight={weapon.poise_weight ?? 'medium'}
            size={44}
          />
        ) : (
          <span className={s.icon}>⚔</span>
        )}

        {weapon && showWeaponTip && (
          <div className={s.tooltip}>
            <div className={s.tipName}>{weapon.name}</div>
            <div className={s.tipSub}>
              {t.weapons[weapon.weapon_class]?.name ?? weapon.weapon_class.replace(/_/g, ' ')}
              {weapon.rarity ? ` · ${weapon.rarity}` : ''} · Lv {weaponLevel}
            </div>
          </div>
        )}
      </div>

      <div className={s.divider} />

      {/* Estus flask */}
      <button
        className={[s.slot, s.estusSlot, playerEstus <= 0 ? s.slotDepleted : ''].join(' ')}
        disabled={!canAct || playerEstus <= 0}
        onClick={onEstus}
        onMouseEnter={() => setShowEstusTip(true)}
        onMouseLeave={() => setShowEstusTip(false)}
      >
        <span className={s.icon}>🧪</span>
        <span className={s.label}>{t.ui.estus_label}</span>
        <span className={s.badge}>{playerEstus}</span>

        {showEstusTip && (
          <div className={s.tooltip}>
            <div className={s.tipName}>{t.ui.estus_flask}</div>
            <div className={s.tipSub}>{playerEstus} / 3 {t.ui.estus_remaining}</div>
            <div className={s.tipHint}>{t.ui.estus_heal}</div>
          </div>
        )}
      </button>

      <button className={s.abandonBtn} onClick={onAbandon}>
        Abandon workflow
      </button>
    </div>
  )
}
