import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { WEAPONS, LEVEL_MULT, weaponUpgradeCost, calcWeaponScaledDamage } from '../../data/weapons'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import { WEAPON_SELL_PRICE } from '../../data/constants'
import { mergeAffixesForDisplay } from '../../data/weaponStructure'
import type { WeaponInstance, WeaponRarity } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
import WeaponSprite from '../icons/WeaponSprite'
import WeaponStructurePreview from './WeaponStructurePreview'
import s from './EquipOverlay.module.css'

interface Props {
  onClose: () => void
}

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#9c9c9c', Intellectual: '#5b9bd5', rare: '#b15bd5', epic: '#d5945b', legendary: '#d5c25b',
}

export default function EquipOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({})
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null)
  const [confirmSellId, setConfirmSellId] = useState<string | null>(null)
  const [confirmUpgradeId, setConfirmUpgradeId] = useState<string | null>(null)
  const [hoveredUpgradeId, setHoveredUpgradeId] = useState<string | null>(null)

  function handleUpgrade(wid: string) {
    if (confirmUpgradeId === wid) {
      store.upgradeWeapon(wid)
      setConfirmUpgradeId(null)
    } else {
      setConfirmUpgradeId(wid)
    }
  }

  function handleSell(wid: string) {
    if (confirmSellId === wid) {
      store.sellWeapon(wid)
      setConfirmSellId(null)
      setSelectedWeaponId(null)
    } else {
      setConfirmSellId(wid)
    }
  }

  function renderWeapon(wid: string) {
    const weapon = WEAPONS[wid] as WeaponInstance | undefined
    if (!weapon) return null
    const classDef = WEAPON_CLASSES[weapon.weapon_class]
    const level    = store.weapon_level[wid] ?? 0
    const campaign = store.weapon_campaigns[wid]
    const isExpanded  = !!expandedContent[wid]

    return (
      <div key={wid} className={s.weaponCard}>
        <div className={s.weaponHeader}>
          <WeaponSprite
            weaponClass={weapon.weapon_class}
            rarity={weapon.rarity}
            poiseWeight={weapon.poise_weight ?? 'medium'}
            size={48}
          />
          <span className={s.weaponName}>{localizeWeaponName(weapon, t)}</span>
          <span className={s.rarityBadge} style={{ color: RARITY_COLOURS[weapon.rarity] }}>
            {weapon.rarity.toUpperCase()}
          </span>
          <span className={s.level}>+{level}</span>
        </div>

        <div className={s.weaponDesc}>{t.weapons[weapon.weapon_class]?.description ?? classDef.description}</div>

        <WeaponStructurePreview weapon={weapon} />

        <div className={s.statsRow}>
          <span className={s.statChip}>+{((LEVEL_MULT[weapon.rarity] ?? 0.03) * 100).toFixed(0)}% {t.ui.stat_dmg_per_level}</span>
          <span className={s.statChip}>×{classDef.base_damage_mult} {t.ui.stat_base_damage}</span>
          {Object.entries(weapon.scaling).map(([stat, grade]) => (
            <span key={stat} className={s.scalingChip}>{stat} {grade}</span>
          ))}
        </div>

        {weapon.affixes.length > 0 && (
          <div className={s.affixList}>
            {mergeAffixesForDisplay(weapon.affixes).map(a => <span key={a.id} className={s.affix}>{a.label}</span>)}
          </div>
        )}

        {store.owned_weapons.length > 1 && (
          <button
            className={confirmSellId === wid ? s.btnSellConfirm : s.btnSell}
            onClick={() => handleSell(wid)}
          >
            {confirmSellId === wid ? t.ui.btn_sell_confirm : `${t.ui.btn_sell_weapon} (${WEAPON_SELL_PRICE} ✦)`}
          </button>
        )}

        {campaign && (
          <div className={s.contentToggleRow}>
            <span className={s.slotCount}>
              {campaign.nodes.filter(n => n.published).length}/{campaign.nodes.length} published
            </span>
            <button
              className={s.btnToggleContent}
              onClick={() => setExpandedContent(e => ({ ...e, [wid]: !e[wid] }))}
            >
              {isExpanded ? t.ui.equip_hide_content : t.ui.equip_show_content} {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        )}

        {campaign && isExpanded && (
          <div className={s.slotList}>
            {campaign.nodes.slice(0, 5).map((node) => (
              <div key={node.id} className={s.slotRow}>
                <span className={[s.slotItemName, !node.completed && !campaign.nodes.find(() => false) ? '' : ''].join(' ')}>
                  {node.name || <em>{t.ui.untitled}</em>}
                </span>
                <span className={s.nodeProgressSmall}>
                  {node.subworkflow_count}/{node.required_subworkflows}
                  {node.published ? ' ★' : node.completed ? ' ✓' : ''}
                </span>
              </div>
            ))}
            {campaign.nodes.length > 5 && (
              <div className={s.slotRow}>
                <span className={s.slotEmptyLabel}>+{campaign.nodes.length - 5} more…</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const weaponsToShow = store.owned_weapons

  const effectiveSelectedId = selectedWeaponId ?? weaponsToShow[0] ?? null

  function renderIcon(wid: string) {
    const weapon = WEAPONS[wid] as WeaponInstance | undefined
    if (!weapon) return null
    const isActive = wid === effectiveSelectedId
    return (
      <button
        key={wid}
        className={[s.iconBtn, isActive ? s.iconBtnActive : ''].join(' ')}
        onClick={() => { setSelectedWeaponId(wid); setConfirmSellId(null) }}
      >
        <WeaponSprite
          weaponClass={weapon.weapon_class}
          rarity={weapon.rarity}
          poiseWeight={weapon.poise_weight ?? 'medium'}
          size={34}
        />
        <span className={s.iconTooltip}>{localizeWeaponName(weapon, t)}</span>
      </button>
    )
  }

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        <div className={s.header}>
          <div className={s.title}>{t.ui.equipment_title}</div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>

        <hr className={s.sep} />

        {weaponsToShow.length === 0 ? (
          <div className={s.empty}>{t.ui.equip_no_weapons}</div>
        ) : (
          <>
            {/* ── Weapon upgrade section ── */}
            <div className={s.upgradeSection}>
              <div className={s.upgradeSectionTitle}>{t.ui.upgrade_weapons_title}</div>
              {weaponsToShow.map(wid => {
                const weapon = WEAPONS[wid] as WeaponInstance | undefined
                if (!weapon) return null
                const level      = store.weapon_level[wid] ?? 0
                const isMax      = level >= 10
                const cost       = weaponUpgradeCost(level)
                const canAfford  = !isMax && store.runes >= cost
                const isConfirm  = confirmUpgradeId === wid
                const dmgNow  = isMax ? null : calcWeaponScaledDamage(100, weapon, level,     store.stats)
                const dmgNext = isMax ? null : calcWeaponScaledDamage(100, weapon, level + 1, store.stats)
                const isHovered = hoveredUpgradeId === wid
                return (
                  <div
                    key={wid}
                    className={s.upgradeRow}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredUpgradeId(wid)}
                    onMouseLeave={() => setHoveredUpgradeId(null)}
                  >
                    <span className={s.upgradeName}>{localizeWeaponName(weapon, t)}</span>
                    <span className={s.upgradeRarity} style={{ color: RARITY_COLOURS[weapon.rarity] }}>
                      {weapon.rarity.toUpperCase()}
                    </span>
                    <span className={s.upgradeLevel}>
                      {isMax ? `+${level}` : `+${level} → +${level + 1}`}
                    </span>
                    {isMax ? (
                      <span className={s.upgradeMax}>{t.ui.max_tag}</span>
                    ) : (
                      <button
                        className={[s.btnUpgrade, isConfirm ? s.btnUpgradeConfirm : '', !canAfford ? s.btnUpgradeDim : ''].join(' ')}
                        disabled={!canAfford}
                        onClick={() => handleUpgrade(wid)}
                      >
                        {isConfirm ? t.ui.btn_confirm_q : `↑ ${cost.toLocaleString()} ✦`}
                      </button>
                    )}
                    {isHovered && !isMax && dmgNow !== null && dmgNext !== null && (
                      <div className={s.upgradeTip}>
                        <span className={s.upgradeTipLabel}>Damage multiplier</span>
                        <span className={s.upgradeTipVal}>
                          ×{(dmgNow / 100).toFixed(2)}
                          {' → '}
                          <span style={{ color: '#88dd99' }}>×{(dmgNext / 100).toFixed(2)}</span>
                          <span className={s.upgradeTipDelta}>
                            {' '}(+{Math.round(LEVEL_MULT[weapon.rarity] * 100)}% / level)
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <hr className={s.sep} />

            <div className={s.iconStrip}>
              {weaponsToShow.map(renderIcon)}
            </div>
            <div className={s.weaponList}>
              {effectiveSelectedId && renderWeapon(effectiveSelectedId)}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
