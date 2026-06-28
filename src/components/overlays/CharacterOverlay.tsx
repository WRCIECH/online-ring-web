import { useState, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { WEAPONS, statLevelCost, GRADE_MULT, LEVEL_MULT } from '../../data/weapons'
import type { StatKey, WeaponInstance, Grade, Stats, WeaponRarity } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CharacterOverlay.module.css'

interface Props { onClose: () => void; canLevel?: boolean }

const ALL_STATS: StatKey[] = ['VIG','END','TEXT','VIDEO','AUDIO','GRAPHIC','VELOCITY','DEPTH','PARASOCIAL','FRICTION','INSIGHT']

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#9c9c9c', Intellectual: '#5b9bd5', rare: '#b15bd5', epic: '#d5945b', legendary: '#d5c25b',
}

interface Tip { title: string; body: string; x: number; y: number }

function statScalingBonus(weapon: WeaponInstance, stats: Stats): number {
  let bonus = 0
  for (const [stat, grade] of Object.entries(weapon.scaling) as [StatKey, Grade][]) {
    bonus += Math.max(0, (stats[stat] ?? 8) - 8) * (GRADE_MULT[grade] ?? 0)
  }
  return bonus
}

export default function CharacterOverlay({ onClose, canLevel = true }: Props) {
  const store = useGameStore()
  const t     = useT()
  const [pending,          setPending]          = useState<Partial<Record<StatKey, number>>>({})
  const [previewWeaponIdx, setPreviewWeaponIdx] = useState(0)
  const [tip,              setTip]              = useState<Tip | null>(null)

  const STAT_LABELS: Record<StatKey, string> = {
    VIG: t.ui.stat_VIG, END: t.ui.stat_END,
    TEXT: t.ui.stat_TEXT, VIDEO: t.ui.stat_VIDEO, AUDIO: t.ui.stat_AUDIO,
    GRAPHIC: t.ui.stat_GRAPHIC, VELOCITY: t.ui.stat_VELOCITY, DEPTH: t.ui.stat_DEPTH,
    PARASOCIAL: t.ui.stat_PARASOCIAL, FRICTION: t.ui.stat_FRICTION, INSIGHT: t.ui.stat_INSIGHT,
  }

  // ── Pending math ────────────────────────────────────────────────────────
  const pendingTotal = Object.values(pending).reduce((s, n) => s + (n ?? 0), 0)
  const totalCost    = Array.from({ length: pendingTotal }, (_, i) =>
    statLevelCost(store.total_levels_spent + i)
  ).reduce((s, n) => s + n, 0)
  const nextLevelCost = statLevelCost(store.total_levels_spent + pendingTotal)
  const canAffordNext = canLevel && store.runes >= totalCost + nextLevelCost

  const pendingStats: Stats = (Object.entries(pending) as [StatKey, number][]).reduce(
    (acc, [stat, n]) => ({ ...acc, [stat]: acc[stat] + (n ?? 0) }),
    { ...store.stats }
  )

  // ── Weapon preview ───────────────────────────────────────────────────────
  const weaponIds  = store.owned_weapons
  const safeIdx    = Math.min(previewWeaponIdx, Math.max(0, weaponIds.length - 1))
  const pwId       = weaponIds[safeIdx] ?? null
  const pw         = pwId ? (WEAPONS[pwId] as WeaponInstance | undefined) : undefined
  const pwLevel    = pwId ? (store.weapon_level[pwId] ?? 0) : 0
  const curBonus   = pw ? statScalingBonus(pw, store.stats) : 0
  const prevBonus  = pw ? statScalingBonus(pw, pendingStats) : 0
  const bonusUp    = prevBonus > curBonus

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handlePlus(stat: StatKey) {
    if (!canAffordNext) return
    setPending(prev => ({ ...prev, [stat]: (prev[stat] ?? 0) + 1 }))
  }

  function handleMinus(stat: StatKey) {
    setPending(prev => {
      const n = prev[stat] ?? 0
      if (n <= 0) return prev
      const next = { ...prev, [stat]: n - 1 }
      if (next[stat] === 0) delete next[stat]
      return next
    })
  }

  function handleConfirm() {
    for (const [stat, count] of Object.entries(pending) as [StatKey, number][]) {
      for (let i = 0; i < count; i++) store.spendRunesOnStat(stat)
    }
    setPending({})
  }

  const showTip = useCallback((e: React.MouseEvent, stat: StatKey, label: string) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ title: label, body: t.ui[`stat_${stat}_desc`] ?? '', x: r.left, y: r.top })
  }, [t])
  const hideTip = useCallback(() => setTip(null), [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        {/* ── Header ──────────────────────────────────────────────────── */}
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

        {/* ── Two-column body ─────────────────────────────────────────── */}
        <div className={s.body}>

          {/* LEFT: stats ────────────────────────────────────────────── */}
          <div className={s.leftCol}>
            {!canLevel && <div className={s.lockedNotice}>{t.ui.leveling_locked_notice}</div>}

            <div className={s.sectionTitle}>
              {t.ui.player_stats_section}
              <span className={s.nextCost}> — {nextLevelCost.toLocaleString()} ✦ {t.ui.cost_each_suffix}</span>
            </div>

            {ALL_STATS.map(stat => {
              const val = store.stats[stat]
              const p   = pending[stat] ?? 0
              return (
                <div key={stat} className={s.statRow}>
                  <span
                    className={s.statName}
                    onMouseEnter={e => showTip(e, stat, STAT_LABELS[stat])}
                    onMouseLeave={hideTip}
                  >{STAT_LABELS[stat]}</span>

                  <span className={s.statVal}>
                    {p > 0 ? (
                      <>
                        <span className={s.valBase}>{val}</span>
                        <span className={s.valArrow}> → </span>
                        <span className={s.valPending}>{val + p}</span>
                      </>
                    ) : val}
                  </span>

                  <button
                    className={s.btnPM}
                    disabled={p === 0}
                    onClick={() => handleMinus(stat)}
                  >−</button>
                  <button
                    className={s.btnPM}
                    disabled={!canAffordNext}
                    onClick={() => handlePlus(stat)}
                  >+</button>
                </div>
              )
            })}

            <div className={s.pendingSummary}>
              {pendingTotal > 0 ? (
                <>
                  <span className={s.pendingCount}>{t.ui.lv_pending}: +{pendingTotal}</span>
                  <span className={s.pendingCost}>{t.ui.lv_total_cost}: {totalCost.toLocaleString()} ✦</span>
                </>
              ) : (
                <span className={s.pendingHint}>{nextLevelCost.toLocaleString()} ✦ / {t.ui.cost_each_suffix}</span>
              )}
            </div>

            <div className={s.actionRow}>
              <button
                className={[s.btnCancel, pendingTotal === 0 ? s.btnDim : ''].join(' ')}
                disabled={pendingTotal === 0}
                onClick={() => setPending({})}
              >{t.ui.btn_cancel}</button>
              <button
                className={[s.btnLevelUp, pendingTotal === 0 ? s.btnDim : ''].join(' ')}
                disabled={pendingTotal === 0}
                onClick={handleConfirm}
              >{t.ui.btn_level_up} (+{pendingTotal})</button>
            </div>
          </div>

          {/* RIGHT: weapon preview ──────────────────────────────────── */}
          <div className={s.rightCol}>
            {weaponIds.length > 1 && (
              <div className={s.weaponTabs}>
                {weaponIds.map((wid, i) => {
                  const w = WEAPONS[wid] as WeaponInstance | undefined
                  if (!w) return null
                  return (
                    <button
                      key={wid}
                      className={[s.weaponTab, i === safeIdx ? s.weaponTabActive : ''].join(' ')}
                      onClick={() => setPreviewWeaponIdx(i)}
                    >
                      {localizeWeaponName(w, t).slice(0, 18)}
                    </button>
                  )
                })}
              </div>
            )}

            {pw ? (
              <div className={s.weaponPreviewCard}>
                <div className={s.weaponPreviewName}>
                  {localizeWeaponName(pw, t)}
                </div>
                <div className={s.weaponPreviewMeta}>
                  <span style={{ color: RARITY_COLOURS[pw.rarity] }}>{pw.rarity.toUpperCase()}</span>
                  <span className={s.weaponPreviewLevel}>+{pwLevel}</span>
                  <span className={s.weaponPreviewLvlPct}>
                    +{((LEVEL_MULT[pw.rarity] ?? 0.03) * 100).toFixed(0)}%/lvl
                  </span>
                </div>

                {Object.keys(pw.scaling).length > 0 ? (
                  <>
                    <div className={s.scalingGrades}>
                      {(Object.entries(pw.scaling) as [string, Grade][]).map(([stat, grade]) => (
                        <span key={stat} className={s.scalingChip}>{stat} {grade}</span>
                      ))}
                    </div>

                    <div className={s.previewTable}>
                      <div className={s.previewHeaderRow}>
                        <span/>
                        <span>{t.ui.lv_col_current}</span>
                        <span>{t.ui.lv_col_preview}</span>
                      </div>
                      <div className={s.previewDataRow}>
                        <span className={s.previewLabel}>{t.ui.lv_scaling_bonus}</span>
                        <span className={s.previewCurrent}>+{(curBonus * 100).toFixed(1)}%</span>
                        <span className={[s.previewAfter, bonusUp ? s.previewUp : ''].join(' ')}>
                          +{(prevBonus * 100).toFixed(1)}%{bonusUp ? ' ↑' : ''}
                        </span>
                      </div>
                    </div>

                    <div className={s.previewNote}>
                      Bonus applies per point above stat 8
                    </div>
                  </>
                ) : (
                  <div className={s.noScalingNote}>{t.ui.lv_no_scaling}</div>
                )}
              </div>
            ) : (
              <div className={s.noScalingNote}>{t.ui.equip_no_weapons}</div>
            )}
          </div>
        </div>
      </div>

      {tip && (
        <div className={s.tooltip} style={{ left: tip.x, top: tip.y }}>
          <div className={s.tipTitle}>{tip.title}</div>
          <div className={s.tipBody}>{tip.body}</div>
        </div>
      )}
    </div>
  )
}
