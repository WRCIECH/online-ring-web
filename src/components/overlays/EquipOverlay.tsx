import { useState } from 'react'
import { useGameStore, selectWeaponSlotLoad } from '../../store/gameStore'
import { WEAPONS, LEVEL_MULT } from '../../data/weapons'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import { mergeAffixesForDisplay } from '../../data/weaponStructure'
import type { WeaponInstance, WeaponRarity } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
import WeaponSprite from '../icons/WeaponSprite'
import WeaponStructurePreview from './WeaponStructurePreview'
import RemasterPreviewCarousel from './RemasterPreviewCarousel'
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

  function handleAssign(weaponInstanceId: string, contentId: string) {
    if (!contentId) return
    store.attachContentToWeapon(contentId, weaponInstanceId)
  }

  function renderWeapon(wid: string) {
    const weapon = WEAPONS[wid] as WeaponInstance | undefined
    if (!weapon) return null
    const classDef = WEAPON_CLASSES[weapon.weapon_class]
    const level    = store.weapon_level[wid] ?? 0
    const slotLoad = selectWeaponSlotLoad(store as Parameters<typeof selectWeaponSlotLoad>[0], wid)
    const attached = store.content_items.filter(c => !c.completed && c.attached_weapon_id === wid)
    const assignable = store.content_items.filter(c => !c.completed && !c.attached_weapon_id)
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

        <RemasterPreviewCarousel weapon={weapon} />

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

        <div className={s.contentToggleRow}>
          <span className={[s.slotCount, slotLoad.used > slotLoad.capacity ? s.slotOver : ''].join(' ')}>
            {slotLoad.used} / {slotLoad.capacity}
          </span>
          <button
            className={s.btnToggleContent}
            onClick={() => setExpandedContent(e => ({ ...e, [wid]: !e[wid] }))}
          >
            {isExpanded ? t.ui.equip_hide_content : t.ui.equip_show_content} {isExpanded ? '▲' : '▼'}
          </button>
        </div>

        {isExpanded && (
          <div className={s.slotList}>
            {Array.from({ length: slotLoad.capacity }).map((_, i) => {
              const item = attached[i]
              if (item) {
                return (
                  <div key={i} className={s.slotRow}>
                    <span className={s.slotItemName}>{item.name || t.ui.untitled}</span>
                    <button className={s.btnDetach} onClick={() => store.detachContentFromWeapon(item.id)}>
                      {t.ui.btn_detach}
                    </button>
                  </div>
                )
              }
              return (
                <div key={i} className={s.slotRow}>
                  <select
                    className={s.slotSelect}
                    value=""
                    onChange={e => handleAssign(wid, e.target.value)}
                  >
                    <option value="">{t.ui.equip_slot_assign}</option>
                    {assignable.map(c => (
                      <option key={c.id} value={c.id}>{c.name || t.ui.untitled}</option>
                    ))}
                  </select>
                  <span className={s.slotEmptyLabel}>{t.ui.equip_slot_empty}</span>
                </div>
              )
            })}
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
        onClick={() => setSelectedWeaponId(wid)}
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
