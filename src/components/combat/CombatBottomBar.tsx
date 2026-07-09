import { useState } from 'react'
import type { WeaponInstance } from '../../types/game'
import { WEAPONS } from '../../data/weapons'
import WeaponSprite from '../icons/WeaponSprite'
import { useT } from '../../i18n'
import s from './CombatBottomBar.module.css'

interface Props {
  equippedWeaponIds: string[]
  activeWeaponId?:   string
  weaponLevels:      Record<string, number>
  weaponNodes?:      Record<string, string[]>
  playerEstus:       number
  canAct:            boolean
  onSwitchWeapon?:   (weaponId: string, weaponLevel: number) => void
  onEstus?:          () => void
  onAbandon?:        () => void
}

export default function CombatBottomBar({
  equippedWeaponIds, activeWeaponId, weaponLevels, weaponNodes, playerEstus, canAct, onSwitchWeapon, onEstus, onAbandon,
}: Props) {
  const t = useT()
  const [tipFor, setTipFor] = useState<string | null>(null)
  const [showEstusTip, setShowEstusTip] = useState(false)

  return (
    <div className={s.bar}>
      {/* Weapon slots — click the inactive one to switch mid-fight */}
      {equippedWeaponIds.map(wid => {
        const weapon  = WEAPONS[wid] as WeaponInstance | undefined
        const level   = weaponLevels[wid] ?? 0
        const isActive = wid === activeWeaponId

        return (
          <button
            key={wid}
            className={[s.slot, s.weaponSlot, isActive ? s.weaponActive : ''].join(' ')}
            disabled={!canAct || !onSwitchWeapon}
            onClick={() => !isActive && onSwitchWeapon?.(wid, level)}
            onMouseEnter={() => setTipFor(wid)}
            onMouseLeave={() => setTipFor(null)}
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

            {weapon && tipFor === wid && (
              <div className={s.tooltip}>
                <div className={s.tipName}>{weapon.name}</div>
                <div className={s.tipSub}>
                  {t.weapons[weapon.weapon_class]?.name ?? weapon.weapon_class.replace(/_/g, ' ')}
                  {weapon.rarity ? ` · ${weapon.rarity}` : ''} · Lv {level}
                </div>
                {weaponNodes?.[wid]?.length ? (
                  <div className={s.tipNodes}>
                    {weaponNodes[wid].map((name, i) => (
                      <span key={i} className={s.tipNode}>{name}</span>
                    ))}
                  </div>
                ) : null}
                {!isActive && canAct && onSwitchWeapon && <div className={s.tipHint}>Click to switch weapon</div>}
              </div>
            )}
          </button>
        )
      })}

      <div className={s.divider} />

      {/* Estus flask */}
      <button
        className={[s.slot, s.estusSlot, playerEstus <= 0 ? s.slotDepleted : ''].join(' ')}
        disabled={!canAct || !onEstus || playerEstus <= 0}
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

      {onAbandon && (
        <button className={s.abandonBtn} onClick={onAbandon}>
          Abandon workflow
        </button>
      )}
    </div>
  )
}
