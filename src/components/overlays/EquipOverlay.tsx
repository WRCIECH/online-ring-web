import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { GameStore } from '../../store/gameStore'
import { WEAPONS, weaponUpgradeCost, GRADE_MULT, calcStepDamage } from '../../data/weapons'
import { MOVES } from '../../data/movesets'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import { getClassMod } from '../../engine/combat'
import { CONTENT_ORIGIN_LABELS, DMG_TYPE_CONTENT, STATUS_CONTENT } from '../../data/contentDescriptions'
import type { WeaponInstance, WeaponRarity, GeneratedMoveset, StatKey, Grade, DamageType } from '../../types/game'
import MovesetIcon from '../icons/MovesetIcon'
import WeaponSprite from '../icons/WeaponSprite'
import s from './EquipOverlay.module.css'

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#aaaaaa', magic: '#4488cc', rare: '#ccaa22',
  epic: '#9944cc', legendary: '#ee8822',
}

const DMG_TYPE_COLOURS: Record<DamageType, string> = {
  standard: '#aaaaaa', strike: '#cc9944', slash: '#cc4444', pierce: '#44aacc',
  lightning: '#eedd44', fire: '#ee6622', magic: '#8855ee', holy: '#eecc55',
  occult: '#aa44aa', grafting: '#55aa55', poison: '#66aa44',
}

const DMG_TYPE_ICONS: Record<DamageType, string> = {
  standard: '●', strike: '⊕', slash: '⚔', pierce: '◈',
  lightning: '⚡', fire: '🔥', magic: '✦', holy: '☀',
  occult: '◎', grafting: '⌬', poison: '☠',
}

function speedLabel(timeMod: number): string {
  if (timeMod <= 0.75) return 'Very Fast'
  if (timeMod <= 0.9)  return 'Fast'
  if (timeMod <= 1.1)  return 'Normal'
  if (timeMod <= 1.25) return 'Slow'
  return 'Very Slow'
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

function fmtStepTime(secs: number): string {
  const m = Math.floor(secs / 60), r = secs % 60
  return m > 0 ? (r > 0 ? `${m}m ${r}s` : `${m}m`) : `${secs}s`
}

function WeaponCard({ weaponId, store, onPickSlot }: {
  weaponId: string
  store: Store
  onPickSlot: (idx: number) => void
}) {
  const weapon  = WEAPONS[weaponId]
  if (!weapon) return null

  const wi      = weapon as WeaponInstance
  const level   = store.weapon_level[weaponId] ?? 0
  const isMax   = level >= 10
  const upgradeCost = weaponUpgradeCost(level)

  const extraSlots  = store.weapon_extra_movesets[weaponId] ?? []
  const skillSlots  = wi.skill_slots ?? weapon.moveset_slots
  const totalExtra  = skillSlots

  const [msTooltip, setMsTooltip] = useState<{ id: string; x: number; y: number } | null>(null)

  function handleMsEnter(e: React.MouseEvent<HTMLDivElement>, movesetId: string) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    setMsTooltip({ id: movesetId, x: rect.right + 10, y: rect.top })
  }

  function removeSlot(idx: number) {
    const updated = [...extraSlots]
    updated[idx] = ''
    store.setWeaponExtraMovesets(weaponId, updated)
  }

  const tipMoveset = msTooltip ? MOVES[msTooltip.id] : null
  const tipGm = tipMoveset && 'variant_type' in tipMoveset ? tipMoveset as GeneratedMoveset : null

  // Weapon class extra info
  const classDef  = wi.weapon_class ? WEAPON_CLASSES[wi.weapon_class] : null
  const classMod  = wi.weapon_class ? getClassMod(wi.weapon_class, 0) : null
  const dmgType   = classDef?.base_damage_types[0]

  // Mechanic line
  let mechLine: string | null = null
  if (classMod) {
    if (classMod.dualStrike)        mechLine = '⚔ Dual strike: +40% off-hand hit on every step'
    else if (classMod.selfDmg > 0)  mechLine = `✗ Reckless: deals ${classMod.selfDmg} HP self-damage per hit`
    else if (classMod.staGain > 0)  mechLine = `◉ Relentless: restores ${classMod.staGain} STA per hit, 0 stamina cost`
    else if (classMod.staCoeff < 1 && classMod.staCoeff > 0) mechLine = '〜 Flow: stamina −30% from step 2 onward'
    else if (classMod.gapOverride !== null) mechLine = '⟶ Ranged: always full poise mult, ignores idle gap'
    else if (classMod.poiseMult >= 2.0) mechLine = `⊕ Stance break: ${classMod.poiseMult}× poise damage`
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
        {dmgType && (
          <span className={s.dmgTypeBadge} style={{ color: DMG_TYPE_COLOURS[dmgType], borderColor: DMG_TYPE_COLOURS[dmgType] + '55' }}>
            {DMG_TYPE_ICONS[dmgType]} {dmgType}
          </span>
        )}
        {classMod?.tag && (
          <span className={s.classMechanic}>{classMod.tag}</span>
        )}
        {wi.weapon_class && WEAPON_CLASSES[wi.weapon_class]?.inherent_status && (
          <span className={s.statusBadge}>
            {WEAPON_CLASSES[wi.weapon_class]!.inherent_status!.replace(/_/g, ' ')}
          </span>
        )}
        <span className={s.weaponLevel}>+{level}{isMax ? ' MAX' : ''}</span>
        {!isMax && <span className={s.upgradeCost}>↑ {upgradeCost} ✦ to upgrade</span>}
      </div>

      {/* Traits row: heat · speed · poise */}
      {classDef && (
        <div className={s.traitsRow}>
          <span className={s.traitItem}>
            🔥 {classDef.heat_threshold >= 9999 ? '∞' : classDef.heat_threshold} uses
          </span>
          <span className={s.traitItem}>⏱ {speedLabel(classDef.time_mod)}</span>
          <span className={s.traitItem}>💥 {classDef.poise_value} poise/hit</span>
        </div>
      )}

      {/* Mechanic line */}
      {mechLine && <div className={s.mechLine}>{mechLine}</div>}

      {/* Scaling grades */}
      {wi.scaling && Object.keys(wi.scaling).length > 0 && (
        <div className={s.scalingRow}>
          {(Object.entries(wi.scaling) as [StatKey, Grade][]).map(([stat, grade]) => {
            const pts = Math.max(0, (store.stats[stat] ?? 8) - 8)
            const bonus = Math.round(pts * (GRADE_MULT[grade] ?? 0) * 100)
            return (
              <span key={stat} className={s.scalingTag}>
                {stat} {grade} {bonus > 0 ? `+${bonus}%` : ''}
              </span>
            )
          })}
        </div>
      )}
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
            <div
              key={mid}
              className={`${s.slot} ${s.slotConstant}`}
              onMouseEnter={e => m && handleMsEnter(e, mid)}
              onMouseLeave={() => setMsTooltip(null)}
            >
              <MovesetIcon movesetId={mid} size={22} className={s.slotIcon} />
              <div className={s.slotInfo}>
                <div className={s.slotName}>{m?.name ?? mid}</div>
                <div className={s.slotDesc}>{m?.steps[0]?.name}</div>
              </div>
              {m?.steps[0] && (
                <span className={s.stepDmg}>
                  {calcStepDamage(m.steps[0], weapon, level, store.stats)} dmg
                </span>
              )}
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
              <div
                key={i}
                className={`${s.slot} ${s.slotFilled}`}
                onMouseEnter={e => handleMsEnter(e, assignedId)}
                onMouseLeave={() => setMsTooltip(null)}
              >
                <MovesetIcon movesetId={assignedId} size={22} className={`${s.slotIcon} ${s.slotIconFilled}`} />
                <div className={s.slotInfo}>
                  <div className={s.slotName}>{m.name}</div>
                  <div className={s.slotDesc}>{m.steps[0]?.name}</div>
                </div>
                {m.steps[0] && (
                  <span className={s.stepDmg}>
                    {calcStepDamage(m.steps[0], weapon, level, store.stats)} dmg
                  </span>
                )}
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

      {/* Moveset hover tooltip */}
      {msTooltip && tipMoveset && (
        <div className={s.msTooltip} style={{ left: msTooltip.x, top: msTooltip.y }}>
          <div className={s.msTipName}>{tipMoveset.name}</div>
          {tipGm && (
            <div className={s.msTipMeta}>
              <span>{tipGm.variant_type}</span>
              <span style={{ color: RARITY_COLOURS[tipGm.rarity] }}>{tipGm.rarity}</span>
            </div>
          )}
          <div className={s.msTipSteps}>
            {tipMoveset.steps.map((step, i) => (
              <div key={i} className={s.msTipStep}>
                <span className={s.msTipNum}>{i + 1}.</span>
                <span className={s.msTipStepName}>{step.name}</span>
                <span className={s.msTipTime}>{fmtStepTime(step.time)}</span>
                {step.base_damage > 0 && (
                  <span className={s.msTipDmg}>
                    {calcStepDamage(step, weapon, level, store.stats)} dmg
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className={s.msTipCost}>
            <span style={{ color: 'var(--color-stamina)' }}>{tipMoveset.stamina_cost} STA</span>
            {tipMoveset.fp_cost ? <span style={{ color: 'var(--color-fp)' }}>{tipMoveset.fp_cost} FP</span> : null}
          </div>
          {tipGm?.content_origin && (
            <div className={s.msTipOrigin}>
              {CONTENT_ORIGIN_LABELS[tipGm.content_origin]}
            </div>
          )}
          {tipGm?.primary_damage_type && (
            <div className={s.msTipDmgType}>
              {DMG_TYPE_CONTENT[tipGm.primary_damage_type]}
            </div>
          )}
          {tipGm?.status_buildup && (
            <div className={s.msTipStatusDesc}>
              {STATUS_CONTENT[tipGm.status_buildup]}
            </div>
          )}
          {tipGm?.infusion && Object.keys(tipGm.infusion).length > 0 && (
            <div className={s.msTipInfusion}>
              <span className={s.msTipInfusionLabel}>Infusion:</span>
              {Object.entries(tipGm.infusion).map(([stat, grade]) => (
                <span key={stat} className={s.msTipInfusionStat}>{stat} {grade}</span>
              ))}
            </div>
          )}
          {tipGm?.status_buildup && (
            <div className={s.msTipStatus}>
              Builds: <span>{tipGm.status_buildup.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      )}
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
