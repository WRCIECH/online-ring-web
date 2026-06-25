import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { WEAPONS, LEVEL_MULT } from '../data/weapons'
import { WEAPON_CLASSES } from '../data/generators/weaponClasses'
import type { WeaponInstance, WeaponRarity } from '../types/game'
import WeaponSprite from '../components/icons/WeaponSprite'
import CharacterOverlay from '../components/overlays/CharacterOverlay'
import { useT, localizeWeaponName } from '../i18n'
import { MAX_RUN_WEAPONS } from '../data/constants'
import s from './WeaponSelectScreen.module.css'


const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#aaaaaa', magic: '#4488cc', rare: '#ccaa22',
  epic: '#9944cc', legendary: '#ee8822',
}

export default function WeaponSelectScreen() {
  const navigate   = useNavigate()
  const routerLoc  = useLocation()
  const store      = useGameStore()
  const t          = useT()
  const routerState  = routerLoc.state as { locationName?: string; numSublocations?: number; runDuration?: number } | null
  const locationName    = routerState?.locationName    ?? ''
  const numSublocations = routerState?.numSublocations ?? 20
  const runDuration     = routerState?.runDuration     ?? 158400  // default: medium 44h
  const [selected, setSelected] = useState<string[]>(
    () => store.owned_weapons.slice(0, 1)
  )
  const [showStats, setShowStats] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_RUN_WEAPONS) return prev
      return [...prev, id]
    })
  }

  function handleBegin() {
    if (selected.length === 0) return
    store.startRun(selected, locationName, numSublocations, runDuration)
    store.save()
    navigate('/map')
  }

  return (
    <div className={s.root}>
      {showStats && <CharacterOverlay onClose={() => setShowStats(false)} />}
      <div className={s.header}>
        <h1>{t.ui.select_weapons_title}</h1>
        <p>{t.ui.select_weapons_sub} {MAX_RUN_WEAPONS} {t.ui.select_weapons_sub2}</p>
        <div className={s.headerActions}>
          <span className={s.runeDisplay}>✦ {store.runes.toLocaleString()}</span>
          <button className={s.btnStats} onClick={() => setShowStats(true)}>{t.ui.btn_stats_levelup}</button>
        </div>
      </div>

      <div className={s.weaponList}>
        {store.owned_weapons.map(wid => {
          const weapon = WEAPONS[wid] as WeaponInstance | undefined
          if (!weapon) return null
          const level  = store.weapon_level[wid] ?? 0

          const isSelected      = selected.includes(wid)
          const isDisabled      = !isSelected && selected.length >= MAX_RUN_WEAPONS
          const rarity          = (weapon as WeaponInstance).rarity
          const affixes         = (weapon as WeaponInstance).affixes ?? []
          const weaponClass     = (weapon as WeaponInstance).weapon_class
          const inherentStatuses = weaponClass
            ? [...new Set(WEAPON_CLASSES[weaponClass]?.inherent_status ?? [])]
            : []

          return (
            <button
              key={wid}
              className={[s.weaponCard, isSelected ? s.selected : '', isDisabled ? s.disabled : ''].join(' ')}
              onClick={() => !isDisabled && toggle(wid)}
              disabled={isDisabled && !isSelected}
            >
              <div className={s.weaponHeader}>
                {rarity && (weapon as WeaponInstance).weapon_class && (
                  <WeaponSprite
                    weaponClass={(weapon as WeaponInstance).weapon_class}
                    rarity={rarity}
                    poiseWeight={(weapon as WeaponInstance).poise_weight ?? 'medium'}
                    size={52}
                  />
                )}
                <span className={s.weaponName}>{localizeWeaponName(weapon as WeaponInstance, t)}</span>
                {rarity && (
                  <span className={s.rarityBadge} style={{ color: RARITY_COLOURS[rarity] }}>
                    {rarity.toUpperCase()}
                  </span>
                )}
                {inherentStatuses.map(status => (
                  <span key={status} className={s.statusBadge}>{status.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <div className={s.weaponDesc}>{weapon.description}</div>

              {affixes.length > 0 && (
                <div className={s.affixList}>
                  {affixes.map(a => <span key={a.id} className={s.affix}>{a.label}</span>)}
                </div>
              )}

              <div className={s.weaponMeta}>
                <span className={s.level}>+{level}{level >= 10 ? ' (MAX)' : ''}</span>
                {rarity && (
                  <span className={s.scaling}>
                    +{((LEVEL_MULT[rarity] ?? 0.03) * 100).toFixed(0)}% dmg/lvl
                  </span>
                )}
              </div>


            </button>
          )
        })}
      </div>

      <div className={s.footer}>
        <p className={s.selectionHint}>
          {selected.length === 0
            ? t.ui.weapon_select_at_least
            : `${selected.length} / ${MAX_RUN_WEAPONS} ${t.ui.weapon_selected}`}
        </p>
        <button
          className={s.btnBegin}
          disabled={selected.length === 0}
          onClick={handleBegin}
        >
          {t.ui.btn_begin_run}
        </button>
      </div>
    </div>
  )
}
