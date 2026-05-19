import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { WEAPONS, LEVEL_MULT } from '../data/weapons'
import { MOVES } from '../data/movesets'
import type { WeaponInstance, WeaponRarity } from '../types/game'
import { WEAPON_KILL_THRESHOLDS } from '../data/generators/weaponGenerator'
import WeaponSprite from '../components/icons/WeaponSprite'
import s from './WeaponSelectScreen.module.css'

const MAX_WEAPONS = 2

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#aaaaaa', magic: '#4488cc', rare: '#ccaa22',
  epic: '#9944cc', legendary: '#ee8822',
}

export default function WeaponSelectScreen() {
  const navigate   = useNavigate()
  const routerLoc  = useLocation()
  const store      = useGameStore()
  const routerState  = routerLoc.state as { locationName?: string; numSublocations?: number; runDuration?: number } | null
  const locationName    = routerState?.locationName    ?? ''
  const numSublocations = routerState?.numSublocations ?? 20
  const runDuration     = routerState?.runDuration     ?? 158400  // default: medium 44h
  // Default to first owned weapon
  const [selected, setSelected] = useState<string[]>(
    () => store.owned_weapons.slice(0, 1)
  )

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_WEAPONS) return prev
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
      <div className={s.header}>
        <h1>Select Weapons</h1>
        <p>Choose up to {MAX_WEAPONS} weapons for this run</p>
      </div>

      <div className={s.weaponList}>
        {store.owned_weapons.map(wid => {
          const weapon = WEAPONS[wid] as WeaponInstance | undefined
          if (!weapon) return null
          const level  = store.weapon_level[wid] ?? 0
          const xp     = store.weapon_xp[wid] ?? 0
          const isMax  = level >= 10
          const nextThresh = isMax ? WEAPON_KILL_THRESHOLDS[9] : (WEAPON_KILL_THRESHOLDS[level] ?? 1)
          const prevThresh = level === 0 ? 0 : (WEAPON_KILL_THRESHOLDS[level - 1] ?? 0)
          const xpPct  = isMax ? 1 : Math.max(0, (xp - prevThresh) / Math.max(1, nextThresh - prevThresh))

          const cooldown   = store.weapon_cooldown[wid] ?? 0
          const onCooldown = cooldown > 0
          const isSelected = selected.includes(wid)
          const isDisabled = onCooldown || (!isSelected && selected.length >= MAX_WEAPONS)
          const rarity = (weapon as WeaponInstance).rarity
          const affixes = (weapon as WeaponInstance).affixes ?? []

          const allMovesetIds = [
            ...weapon.constant_movesets,
            ...(store.weapon_extra_movesets[wid] ?? []).filter(Boolean),
          ]

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
                    poiseWeight={(weapon as WeaponInstance).poise_weight}
                    size={52}
                  />
                )}
                <span className={s.weaponName}>{weapon.name}</span>
                {rarity && (
                  <span className={s.rarityBadge} style={{ color: RARITY_COLOURS[rarity] }}>
                    {rarity.toUpperCase()}
                  </span>
                )}
                {onCooldown && (
                  <span className={s.cooldownBadge}>🔥 Cool-down: {cooldown} run{cooldown !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className={s.weaponDesc}>{weapon.description}</div>

              {affixes.length > 0 && (
                <div className={s.affixList}>
                  {affixes.map(a => <span key={a.id} className={s.affix}>{a.label}</span>)}
                </div>
              )}

              <div className={s.weaponMeta}>
                <span className={s.level}>+{level}{isMax ? ' (MAX)' : ''}</span>
                {!isMax && <span className={s.xpHint}>{xp - prevThresh} / {nextThresh - prevThresh} kills</span>}
                {rarity && (
                  <span className={s.scaling}>
                    +{((LEVEL_MULT[rarity] ?? 0.03) * 100).toFixed(0)}% dmg/lvl
                  </span>
                )}
              </div>

              {!isMax && (
                <div className={s.xpTrack}>
                  <div className={s.xpFill} style={{ width: `${xpPct * 100}%` }} />
                </div>
              )}

              <div className={s.movesetList}>
                {allMovesetIds.map(mid => {
                  const m = MOVES[mid]
                  return m ? <span key={mid} className={s.movesetTag}>{m.name}</span> : null
                })}
              </div>
            </button>
          )
        })}
      </div>

      <div className={s.footer}>
        <p className={s.selectionHint}>
          {selected.length === 0
            ? 'Select at least one weapon'
            : `${selected.length} / ${MAX_WEAPONS} selected`}
        </p>
        <button
          className={s.btnBegin}
          disabled={selected.length === 0}
          onClick={handleBegin}
        >
          Begin Run
        </button>
      </div>
    </div>
  )
}
