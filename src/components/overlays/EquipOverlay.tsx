import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { GameStore } from '../../store/gameStore'
import { WEAPONS } from '../../data/weapons'
import { MOVES } from '../../data/movesets'
import s from './EquipOverlay.module.css'

type Store = GameStore

interface Props { onClose: () => void }

export default function EquipOverlay({ onClose }: Props) {
  const store = useGameStore()
  const [pickerFor, setPickerFor] = useState<{ weaponId: string; slotIdx: number } | null>(null)

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>⚙ Equipment</span>
          <button onClick={onClose}>Close</button>
        </div>
        <hr />
        <div className={s.body}>
          {store.equipped_run_weapons.map(wid => (
            <WeaponCard
              key={wid}
              weaponId={wid}
              store={store}
              onPickSlot={(idx) => setPickerFor({ weaponId: wid, slotIdx: idx })}
            />
          ))}
        </div>
      </div>

      {pickerFor && (
        <MovesetPicker
          weaponId={pickerFor.weaponId}
          slotIdx={pickerFor.slotIdx}
          store={store}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}

// ── Weapon card ──────────────────────────────────────────────────────────────

function WeaponCard({ weaponId, store, onPickSlot }: {
  weaponId: string
  store: Store
  onPickSlot: (idx: number) => void
}) {
  const weapon  = WEAPONS[weaponId]
  if (!weapon) return null

  const level   = store.weapon_level[weaponId] ?? 1
  const xp      = store.weapon_xp[weaponId] ?? 0
  const thresh  = weapon.xp_thresholds[level - 1] ?? weapon.xp_thresholds[weapon.xp_thresholds.length - 1]
  const xpPct   = Math.min(1, xp / (thresh ?? 1))
  const isMax   = level >= weapon.xp_thresholds.length + 1

  const extraSlots  = store.weapon_extra_movesets[weaponId] ?? []
  const totalExtra  = weapon.moveset_slots + (level - 1)

  function removeSlot(idx: number) {
    const updated = [...extraSlots]
    updated[idx] = ''
    store.setWeaponExtraMovesets(weaponId, updated)
  }

  return (
    <div className={s.weaponCard}>
      <div className={s.weaponHeader}>
        <span className={s.weaponName}>{weapon.name}</span>
        <span className={s.weaponLevel}>Lv {level}{isMax ? ' (MAX)' : ''}</span>
        {!isMax && (
          <div className={s.xpBar}>
            <div className={s.xpTrack}><div className={s.xpFill} style={{ width: `${xpPct * 100}%` }} /></div>
            <span className={s.xpLabel}>{xp} / {thresh} XP</span>
          </div>
        )}
      </div>

      <div className={s.slots}>
        {/* Constant movesets */}
        {weapon.constant_movesets.map(mid => {
          const m = MOVES[mid]
          return (
            <div key={mid} className={`${s.slot} ${s.slotConstant}`}>
              <div className={`${s.slotDot} ${s.dotConstant}`} />
              <div className={s.slotInfo}>
                <div className={s.slotName}>{m?.name ?? mid}</div>
                <div className={s.slotDesc}>{m?.steps[0]?.name}</div>
              </div>
              <span className={s.slotTag}>constant</span>
            </div>
          )
        })}

        {/* Extra slots */}
        {Array.from({ length: totalExtra }, (_, i) => {
          const assignedId = extraSlots[i] ?? ''
          const m = assignedId ? MOVES[assignedId] : null
          if (m) {
            return (
              <div key={i} className={`${s.slot} ${s.slotFilled}`}>
                <div className={`${s.slotDot} ${s.dotFilled}`} />
                <div className={s.slotInfo}>
                  <div className={s.slotName}>{m.name}</div>
                  <div className={s.slotDesc}>{m.steps[0]?.name}</div>
                </div>
                <button className={s.removeBtn} onClick={() => removeSlot(i)}>Remove</button>
              </div>
            )
          }
          return (
            <div key={i} className={`${s.slot} ${s.slotEmpty}`} onClick={() => onPickSlot(i)}>
              <div className={`${s.slotDot} ${s.dotEmpty}`} />
              <span className={s.addLabel}>+ Assign moveset</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Moveset picker ───────────────────────────────────────────────────────────

function MovesetPicker({ weaponId, slotIdx, store, onClose }: {
  weaponId: string
  slotIdx: number
  store: Store
  onClose: () => void
}) {
  const extraSlots   = store.weapon_extra_movesets[weaponId] ?? []
  const alreadyUsed  = new Set([
    ...(WEAPONS[weaponId]?.constant_movesets ?? []),
    ...extraSlots.filter(Boolean),
  ])

  const available = store.owned_movesets.filter((id: string) => {
    const m = MOVES[id]
    if (!m) return false
    if (alreadyUsed.has(id)) return false
    if (m.types.includes('defense')) return false
    return true
  })

  function pick(id: string) {
    const updated = [...extraSlots]
    while (updated.length <= slotIdx) updated.push('')
    updated[slotIdx] = id
    store.setWeaponExtraMovesets(weaponId, updated)
    onClose()
  }

  return (
    <div className={s.pickerOverlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.picker}>
        <div className={s.pickerTitle}>Select a moveset to assign</div>
        <hr />
        <div className={s.pickerList}>
          {available.length === 0 ? (
            <div className={s.noMovesets}>
              No unassigned movesets available.<br/>Defeat enemies to earn new ones.
            </div>
          ) : (
            available.map(id => {
              const m = MOVES[id]
              return (
                <button key={id} className={s.pickerItem} onClick={() => pick(id)}>
                  <span className={s.pickerName}>{m.name}</span>
                  <span className={s.pickerStep}>{m.steps[0]?.name} · {m.stamina_cost} STA</span>
                </button>
              )
            })
          )}
        </div>
        <hr />
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
