import { useState, useRef, useEffect } from 'react'
import type { WeaponInstance } from '../../types/game'
import { WEAPONS } from '../../data/weapons'
import WeaponSprite from '../icons/WeaponSprite'
import { useT } from '../../i18n'
import s from './CombatBottomBar.module.css'

export interface ContentNode { id: string; name: string }

interface Props {
  equippedWeaponIds:  string[]
  activeWeaponId?:    string
  activeContentId?:   string
  weaponLevels:       Record<string, number>
  weaponNodes?:       Record<string, ContentNode[]>
  playerEstus:        number
  canAct:             boolean
  onSelectContent?:   (weaponId: string, contentId: string) => void
  onSwitchWeapon?:    (weaponId: string, weaponLevel: number) => void
  onEstus?:           () => void
  onAbandon?:         () => void
}

export default function CombatBottomBar({
  equippedWeaponIds, activeWeaponId, activeContentId, weaponLevels, weaponNodes,
  playerEstus, canAct, onSelectContent, onSwitchWeapon, onEstus, onAbandon,
}: Props) {
  const t = useT()
  const barRef = useRef<HTMLDivElement>(null)
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null)
  const [showEstusTip, setShowEstusTip] = useState(false)

  // Close dropdown when clicking outside the bar
  useEffect(() => {
    if (!openMenuFor) return
    function handler(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenuFor(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuFor])

  function handleWeaponClick(wid: string, level: number) {
    if (!canAct) return
    if (onSelectContent) {
      // Toggle the content picker menu
      setOpenMenuFor(prev => prev === wid ? null : wid)
    } else if (onSwitchWeapon && wid !== activeWeaponId) {
      onSwitchWeapon(wid, level)
    }
  }

  function handleNodeClick(weaponId: string, nodeId: string) {
    setOpenMenuFor(null)
    onSelectContent?.(weaponId, nodeId)
  }

  return (
    <div className={s.bar} ref={barRef}>
      {/* Weapon slots */}
      {equippedWeaponIds.map(wid => {
        const weapon   = WEAPONS[wid] as WeaponInstance | undefined
        const level    = weaponLevels[wid] ?? 0
        const isActive = wid === activeWeaponId
        const nodes    = weaponNodes?.[wid] ?? []
        const menuOpen = openMenuFor === wid

        return (
          <div key={wid} className={s.weaponWrap}>
            <button
              className={[s.slot, s.weaponSlot, isActive ? s.weaponActive : ''].filter(Boolean).join(' ')}
              disabled={!canAct || (!onSelectContent && !onSwitchWeapon)}
              onClick={() => handleWeaponClick(wid, level)}
              aria-expanded={menuOpen}
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
            </button>

            {/* Content picker menu */}
            {menuOpen && (
              <div className={s.contentMenu}>
                <div className={s.menuHeader}>
                  <span className={s.menuWeaponName}>{weapon?.name ?? wid}</span>
                  <span className={s.menuWeaponSub}>
                    {t.weapons[weapon?.weapon_class ?? '']?.name ?? (weapon?.weapon_class ?? '').replace(/_/g, ' ')}
                    {weapon?.rarity ? ` · ${weapon.rarity}` : ''}{` · Lv ${level}`}
                  </span>
                </div>

                {nodes.length === 0 ? (
                  <div className={s.menuEmpty}>
                    {t.ui.prefight_no_nodes ?? 'No available content nodes.'}
                  </div>
                ) : (
                  <div className={s.menuNodes}>
                    {nodes.map(node => {
                      const isCurrent = node.id === activeContentId
                      return (
                        <button
                          key={node.id}
                          className={[s.menuNode, isCurrent ? s.menuNodeActive : ''].filter(Boolean).join(' ')}
                          onClick={() => handleNodeClick(wid, node.id)}
                        >
                          <span className={s.menuNodeDot}>{isCurrent ? '●' : '○'}</span>
                          <span className={s.menuNodeName}>{node.name || 'Untitled'}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
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
          Escape Fight
        </button>
      )}
    </div>
  )
}
