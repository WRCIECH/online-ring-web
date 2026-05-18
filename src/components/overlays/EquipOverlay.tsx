import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { GameStore } from '../../store/gameStore'
import { WEAPONS } from '../../data/weapons'
import { MOVES } from '../../data/movesets'
import type { WeaponInstance, WeaponRarity } from '../../types/game'
import { WEAPON_KILL_THRESHOLDS } from '../../data/generators/weaponGenerator'
import MovesetIcon from '../icons/MovesetIcon'
import WeaponSprite from '../icons/WeaponSprite'
import s from './EquipOverlay.module.css'

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#aaaaaa', magic: '#4488cc', rare: '#ccaa22',
  epic: '#9944cc', legendary: '#ee8822',
}

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

  const wi      = weapon as WeaponInstance
  const level   = store.weapon_level[weaponId] ?? 0
  const xp      = store.weapon_xp[weaponId] ?? 0
  const isMax   = level >= 10
  const nextThresh = isMax ? WEAPON_KILL_THRESHOLDS[9] : (WEAPON_KILL_THRESHOLDS[level] ?? 1)
  const prevThresh = level === 0 ? 0 : (WEAPON_KILL_THRESHOLDS[level - 1] ?? 0)
  const xpPct   = isMax ? 1 : Math.max(0, (xp - prevThresh) / Math.max(1, nextThresh - prevThresh))

  const extraSlots  = store.weapon_extra_movesets[weaponId] ?? []
  const skillSlots  = wi.skill_slots ?? weapon.moveset_slots
  const totalExtra  = skillSlots

  function removeSlot(idx: number) {
    const updated = [...extraSlots]
    updated[idx] = ''
    store.setWeaponExtraMovesets(weaponId, updated)
  }

  return (
    <div className={s.weaponCard}>
      <div className={s.weaponHeader}>
        {wi.weapon_class && (
          <WeaponSprite
            weaponClass={wi.weapon_class}
            rarity={wi.rarity}
            poiseWeight={wi.poise_weight}
            size={40}
          />
        )}
        <span className={s.weaponName}>{weapon.name}</span>
        {wi.rarity && (
          <span className={s.rarityBadge} style={{ color: RARITY_COLOURS[wi.rarity] }}>
            {wi.rarity.toUpperCase()}
          </span>
        )}
        <span className={s.weaponLevel}>+{level}{isMax ? ' MAX' : ''}</span>
        {!isMax && (
          <div className={s.xpBar}>
            <div className={s.xpTrack}><div className={s.xpFill} style={{ width: `${xpPct * 100}%` }} /></div>
            <span className={s.xpLabel}>{xp - prevThresh} / {nextThresh - prevThresh} kills</span>
          </div>
        )}
      </div>
      {wi.affixes && wi.affixes.length > 0 && (
        <div className={s.affixRow}>
          {wi.affixes.map(a => <span key={a.id} className={s.affix}>{a.label}</span>)}
        </div>
      )}

      <div className={s.slots}>
        {/* Constant movesets */}
        {weapon.constant_movesets.map(mid => {
          const m = MOVES[mid]
          return (
            <div key={mid} className={`${s.slot} ${s.slotConstant}`}>
              <MovesetIcon movesetId={mid} size={22} className={s.slotIcon} />
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
                <MovesetIcon movesetId={assignedId} size={22} className={`${s.slotIcon} ${s.slotIconFilled}`} />
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
                  <div className={s.pickerRow}>
                    <MovesetIcon movesetId={id} size={20} className={s.pickerIcon} />
                    <div>
                      <div className={s.pickerName}>{m.name}</div>
                      <div className={s.pickerStep}>{m.steps[0]?.name} · {m.stamina_cost} STA</div>
                    </div>
                  </div>
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
