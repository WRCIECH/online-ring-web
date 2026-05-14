import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { WEAPONS } from '../data/weapons'
import { MOVES } from '../data/movesets'
import s from './WeaponSelectScreen.module.css'

const MAX_WEAPONS = 2

export default function WeaponSelectScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const [selected, setSelected] = useState<string[]>(['unarmed'])

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_WEAPONS) return prev
      return [...prev, id]
    })
  }

  function handleBegin() {
    if (selected.length === 0) return
    store.startRun(selected)
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
          const weapon  = WEAPONS[wid]
          if (!weapon) return null
          const level   = store.weapon_level[wid] ?? 1
          const xp      = store.weapon_xp[wid] ?? 0
          const thresh  = weapon.xp_thresholds[level - 1] ?? '—'
          const isSelected = selected.includes(wid)
          const isDisabled = !isSelected && selected.length >= MAX_WEAPONS

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
              <div className={s.weaponName}>{weapon.name}</div>
              <div className={s.weaponDesc}>{weapon.description}</div>
              <div className={s.weaponMeta}>
                <span className={s.level}>Lv {level}</span>
                <span>XP {xp} / {thresh}</span>
                {Object.entries(weapon.scaling).map(([stat, grade]) => (
                  <span key={stat} className={s.scaling}>{stat} {grade}</span>
                ))}
              </div>
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
