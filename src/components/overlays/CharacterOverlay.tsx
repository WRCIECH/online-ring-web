import { useState, useCallback } from 'react'
import { useGameStore, calcMaxHp, selectRemainingModifications } from '../../store/gameStore'
import { WEAPONS, statLevelCost, LEVEL_MULT } from '../../data/weapons'
import { MODIFICATION_STATS } from '../../data/statModifications'
import type { StatKey, WeaponInstance, Stats, WeaponRarity } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
import WeaponSprite from '../icons/WeaponSprite'
import s from './CharacterOverlay.module.css'

interface Props { onClose: () => void; canLevel?: boolean }

const ALL_STATS: StatKey[] = ['VIG','END','TEXT','VIDEO','AUDIO','GRAPHIC','VELOCITY','DEPTH','PARASOCIAL','FRICTION','INSIGHT']

const RARITY_COLOURS: Record<WeaponRarity, string> = {
  common: '#9c9c9c', Intellectual: '#5b9bd5', rare: '#b15bd5', epic: '#d5945b', legendary: '#d5c25b',
}

interface Tip { title: string; body: string; x: number; y: number }

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

  // ── Player resource preview ──────────────────────────────────────────────
  const curMaxHp  = calcMaxHp(store.stats.VIG)
  const prevMaxHp = calcMaxHp(pendingStats.VIG)
  const hpUp      = prevMaxHp > curMaxHp
  const vigPending = (pending.VIG ?? 0) > 0

  const curSlots  = store.stats.END
  const prevSlots = pendingStats.END
  const slotsUp   = prevSlots > curSlots
  const endPending = (pending.END ?? 0) > 0

  // ── Weapon preview ───────────────────────────────────────────────────────
  const weaponIds  = store.owned_weapons
  const safeIdx    = Math.min(previewWeaponIdx, Math.max(0, weaponIds.length - 1))
  const pwId       = weaponIds[safeIdx] ?? null
  const pw         = pwId ? (WEAPONS[pwId] as WeaponInstance | undefined) : undefined
  const pwLevel    = pwId ? (store.weapon_level[pwId] ?? 0) : 0

  // ── Modification pools ───────────────────────────────────────────────────
  const remainingMods = selectRemainingModifications(store)

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

          {/* RIGHT: two sections ────────────────────────────────────── */}
          <div className={s.rightCol}>

            {/* ── Upper: player resources ───────────────────────────── */}
            <div className={s.resourceSection}>
              <div className={s.sectionTitle}>{t.ui.lv_player_resources}</div>

              <div className={s.resourceRow}>
                <span className={s.resourceLabel}>{t.ui.lv_attr_hp}</span>
                <span className={s.resourceValue}>
                  {vigPending ? (
                    <>
                      <span className={s.valBase}>{curMaxHp}</span>
                      <span className={s.valArrow}> → </span>
                      <span className={[s.valPending, hpUp ? s.valUp : ''].join(' ')}>{prevMaxHp}{hpUp ? ' ↑' : ''}</span>
                    </>
                  ) : curMaxHp}
                </span>
              </div>

              <div className={s.resourceRow}>
                <span className={s.resourceLabel}>{t.ui.lv_attr_slots}</span>
                <span className={s.resourceValue}>
                  {endPending ? (
                    <>
                      <span className={s.valBase}>{curSlots}</span>
                      <span className={s.valArrow}> → </span>
                      <span className={[s.valPending, slotsUp ? s.valUp : ''].join(' ')}>{prevSlots}{slotsUp ? ' ↑' : ''}</span>
                    </>
                  ) : curSlots}
                </span>
              </div>
            </div>

            <hr className={s.sep} />

            {/* ── Lower: weapon preview ─────────────────────────────── */}
            {weaponIds.length > 0 && (
              <div className={s.weaponTabs}>
                {weaponIds.map((wid, i) => {
                  const w = WEAPONS[wid] as WeaponInstance | undefined
                  if (!w) return null
                  const level = store.weapon_level[wid] ?? 0
                  return (
                    <button
                      key={wid}
                      className={[s.weaponTab, i === safeIdx ? s.weaponTabActive : ''].join(' ')}
                      onClick={() => setPreviewWeaponIdx(i)}
                    >
                      <WeaponSprite
                        weaponClass={w.weapon_class}
                        rarity={w.rarity ?? 'common'}
                        poiseWeight={w.poise_weight ?? 8}
                        size={36}
                      />
                      <span className={s.weaponTabTip}>
                        <span className={s.weaponTabTipName}>{localizeWeaponName(w, t)}</span>
                        <span className={s.weaponTabTipSub}>
                          {t.weapons[w.weapon_class]?.name ?? w.weapon_class.replace(/_/g, ' ')}
                          {' · '}{w.rarity}{' · '}Lv {level}
                        </span>
                      </span>
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
              </div>
            ) : (
              <div className={s.noScalingNote}>{t.ui.equip_no_weapons}</div>
            )}

            <hr className={s.sep} />

            {/* ── Modification pools ────────────────────────────────── */}
            <div className={s.sectionTitle}>{t.ui.stat_mod_pools_section}</div>
            <div className={s.modPoolGrid}>
              {MODIFICATION_STATS.map(stat => {
                const total = store.stats[stat] ?? 0
                const remaining = remainingMods[stat] ?? 0
                const pending_n = pending[stat] ?? 0
                return (
                  <div key={stat} className={s.modPoolRow}>
                    <span className={s.modPoolStat}>{STAT_LABELS[stat]}</span>
                    <span className={s.modPoolVal}>
                      {pending_n > 0 ? (
                        <>
                          <span className={s.valBase}>{remaining}</span>
                          <span className={s.valArrow}> → </span>
                          <span className={s.valPending}>{remaining + pending_n}</span>
                          <span className={s.modPoolTotal}>/{total + pending_n}</span>
                        </>
                      ) : (
                        <>
                          {remaining}
                          <span className={s.modPoolTotal}>/{total}</span>
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
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
