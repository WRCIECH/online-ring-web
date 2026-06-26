import { useState } from 'react'
import { useGameStore, calcMaxHp } from '../../store/gameStore'
import { WEAPONS, statLevelCost, weaponUpgradeCost, LEVEL_MULT } from '../../data/weapons'
import type { StatKey, WeaponInstance } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CharacterOverlay.module.css'

interface Props { onClose: () => void; canLevel?: boolean }

const ALL_STATS: StatKey[] = ['VIG','END','MND','STR','DEX','INT','FAI','ARC']

type Confirming =
  | { type: 'stat'; stat: StatKey }
  | { type: 'weapon'; id: string }

function statEffectPreview(stat: StatKey, val: number): string {
  if (stat === 'VIG') return `HP: ${calcMaxHp(val)} → ${calcMaxHp(val + 1)}`
  return ''
}

export default function CharacterOverlay({ onClose, canLevel = true }: Props) {
  const store = useGameStore()
  const t     = useT()
  const [confirming, setConfirming] = useState<Confirming | null>(null)

  const levelCost = statLevelCost(store.total_levels_spent)

  const STAT_LABELS: Record<StatKey, string> = {
    VIG: t.ui.stat_VIG, END: t.ui.stat_END, MND: t.ui.stat_MND,
    STR: t.ui.stat_STR, DEX: t.ui.stat_DEX, INT: t.ui.stat_INT,
    FAI: t.ui.stat_FAI, ARC: t.ui.stat_ARC,
  }

  function confirmStat(stat: StatKey) {
    if (confirming?.type === 'stat' && confirming.stat === stat) {
      store.spendRunesOnStat(stat)
      setConfirming(null)
    } else {
      setConfirming({ type: 'stat', stat })
    }
  }

  function confirmWeapon(id: string) {
    if (confirming?.type === 'weapon' && confirming.id === id) {
      store.upgradeWeapon(id)
      setConfirming(null)
    } else {
      setConfirming({ type: 'weapon', id })
    }
  }

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className={s.header}>
          <div className={s.runeBalance}>
            <span className={s.runeIcon}>✦</span>
            <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
            <span className={s.runeLabel}>{t.ui.runes}</span>
          </div>
          <div className={s.playerLevel}>
            <span className={s.levelNum}>{t.ui.lv_prefix}{store.total_levels_spent}</span>
          </div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>
        <hr className={s.sep} />

        <div className={s.body}>

          {/* ── Player Stats ──────────────────────────────────────────── */}
          {!canLevel && (
            <div className={s.lockedNotice}>
              {t.ui.leveling_locked_notice}
            </div>
          )}
          <div className={s.section}>
            <div className={s.sectionTitle}>{t.ui.player_stats_section} — {levelCost} {t.ui.cost_each_suffix}</div>
            {ALL_STATS.map(stat => {
              const val      = store.stats[stat]
              const canAfford = canLevel && store.runes >= levelCost
              const isConfirming = confirming?.type === 'stat' && confirming.stat === stat

              const previewLines: string[] = []
              const simple = statEffectPreview(stat, val)
              if (simple) previewLines.push(simple)

              return (
                <div key={stat} className={s.statBlock}>
                  <div className={s.statRow}>
                    <span className={s.statName}>{STAT_LABELS[stat]}</span>
                    <span className={s.statVal}>{val}</span>
                    <div className={s.preview}>
                      {previewLines.map((line, i) => (
                        <span key={i} className={s.previewLine}>{line}</span>
                      ))}
                    </div>
                    <button
                      className={[s.btnLevel, !canAfford ? s.disabled : '', isConfirming ? s.btnPending : ''].join(' ')}
                      disabled={!canAfford}
                      onClick={() => confirmStat(stat)}
                    >
                      {isConfirming ? t.ui.btn_confirm_q : `↑ ${levelCost} ✦`}
                    </button>
                  </div>
                  {isConfirming && (
                    <div className={s.confirmRow}>
                      <span className={s.confirmText}>
                        {t.ui.confirm_spend_pre} {levelCost} ✦ {t.ui.confirm_on_label} {STAT_LABELS[stat]}?
                      </span>
                      <button className={s.btnConfirm} onClick={() => confirmStat(stat)}>{t.ui.btn_yes_spend}</button>
                      <button className={s.btnCancel} onClick={() => setConfirming(null)}>{t.ui.btn_cancel}</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <hr className={s.sep} />

          {/* ── Weapons ───────────────────────────────────────────────── */}
          <div className={s.section}>
            <div className={s.sectionTitle}>{t.ui.upgrade_weapons_title}</div>
            {store.owned_weapons.map(wid => {
              const weapon = WEAPONS[wid] as WeaponInstance | undefined
              if (!weapon) return null
              const level      = store.weapon_level[wid] ?? 0
              const isMax      = level >= 10
              const cost       = weaponUpgradeCost(level)
              const canAfford  = canLevel && !isMax && store.runes >= cost
              const isConfirming = confirming?.type === 'weapon' && confirming.id === wid
              const wi         = weapon as WeaponInstance
              const rarity     = wi.rarity ?? 'common'
              const pctPerLvl  = ((LEVEL_MULT[rarity] ?? 0.03) * 100).toFixed(0)

              return (
                <div key={wid} className={s.weaponBlock}>
                  <div className={s.weaponRow}>
                    <span className={s.weaponName}>{localizeWeaponName(weapon, t)}</span>
                    <span className={s.weaponLevel}>+{level}{isMax ? ` ${t.ui.max_tag}` : ` → +${level + 1}`}</span>
                    {!isMax && <span className={s.weaponPreview}>+{pctPerLvl}%/lvl</span>}
                    {isMax ? (
                      <span className={s.maxTag}>{t.ui.max_tag}</span>
                    ) : (
                      <button
                        className={[s.btnUpgrade, !canAfford ? s.disabled : '', isConfirming ? s.btnPending : ''].join(' ')}
                        disabled={!canAfford}
                        onClick={() => confirmWeapon(wid)}
                      >
                        {isConfirming ? t.ui.btn_confirm_q : `↑ ${cost} ✦`}
                      </button>
                    )}
                  </div>
                  {isConfirming && (
                    <div className={s.confirmRow}>
                      <span className={s.confirmText}>
                        {t.ui.confirm_spend_pre} {cost} ✦ {t.ui.confirm_to_upgrade} {localizeWeaponName(weapon, t)}?
                      </span>
                      <button className={s.btnConfirm} onClick={() => confirmWeapon(wid)}>{t.ui.btn_yes_spend}</button>
                      <button className={s.btnCancel} onClick={() => setConfirming(null)}>{t.ui.btn_cancel}</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
