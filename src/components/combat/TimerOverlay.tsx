import { useEffect, useState } from 'react'
import type { CombatState, CombatAction } from '../../engine/combat'
import { STA_DEFENSE_GAIN } from '../../engine/combat'
import { WEAPONS, calcStepDamage } from '../../data/weapons'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import type { WeaponInstance, DamageType, AtomicStage, AtomicOrigin, StatusType, ContentItem, GeneratedMoveset } from '../../types/game'
import type { ContentProductType } from '../../data/contentProducts'
import { useT, resolveBadge, localizeWeaponName, localizeStepName } from '../../i18n'
import { useGameStore } from '../../store/gameStore'
import WeaponSprite from '../icons/WeaponSprite'
import s from './TimerOverlay.module.css'

interface Props {
  state: CombatState
  dispatch: React.Dispatch<CombatAction>
  // Content pipeline
  activeContentItems:   ContentItem[]
  selectedContentId:    string | null
  onSelectContent:      (id: string | null) => void
  onTaskAccomplished:   (
    contentId:  string | null,
    taskStage:  AtomicStage | null,
    stamps:     { product?: ContentProductType; origin?: AtomicOrigin; status?: StatusType; style?: DamageType } | null,
  ) => void
  // Publish-as-parry
  onParryAccomplished?: () => void
  parryPublishItem?:    ContentItem | null
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), sc = Math.floor(secs % 60)
  return m > 0 ? `${m}:${String(sc).padStart(2,'0')}` : String(sc)
}

const DMG_TYPE_COLOURS: Partial<Record<DamageType, string>> = {
  standard: '#aaaaaa', strike: '#cc9944', slash: '#cc4444', pierce: '#44aacc',
  lightning: '#eedd44', fire: '#ee6622', magic: '#8855ee', holy: '#eecc55',
  occult: '#aa44aa', grafting: '#55aa55', poison: '#66aa44',
}

export default function TimerOverlay({
  state, dispatch,
  activeContentItems, selectedContentId, onSelectContent, onTaskAccomplished,
  onParryAccomplished, parryPublishItem,
}: Props) {
  const t      = useT()
  const locale = useGameStore(s => s.locale)
  const { stepTimer, stepTotal, stepStarted, timerExpired,
          timerIsDefense, pendingStep, pendingDefenseAction, pendingMoveset,
          pendingWeaponId, playerStats, weaponLevels,
          currentMove } = state

  // ── Custom dropdown state ────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hoveredId,    setHoveredId]    = useState<string | null>(null)

  // Update browser tab title with live countdown — uses setInterval + wall-clock
  // so the title keeps ticking even when the tab is in the background (rAF pauses there)
  useEffect(() => {
    if (!stepStarted || timerExpired) {
      document.title = 'Online Ring'
      return
    }
    const startedAt = Date.now()
    const name = pendingStep?.name ?? ''
    const tick = () => {
      const remaining = Math.max(0, stepTotal - (Date.now() - startedAt) / 1000)
      const secs = Math.ceil(remaining)
      const m  = Math.floor(secs / 60)
      const sc = String(secs % 60).padStart(2, '0')
      document.title = `⏱ ${m}:${sc} — ${name}`
    }
    tick()
    const id = setInterval(tick, 500)
    return () => { clearInterval(id); document.title = 'Online Ring' }
  }, [stepStarted, timerExpired, stepTotal, pendingStep?.name])

  // rAF-based countdown
  useEffect(() => {
    if (!stepStarted || timerExpired) return
    let last = performance.now()
    let rafId: number
    const tick = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      dispatch({ type: 'TICK', delta })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [stepStarted, timerExpired, dispatch])

  const pct = stepTotal > 0 ? Math.max(0, stepTimer / stepTotal) : 0
  const isPreview = !stepStarted && !timerExpired
  const isActive  = stepStarted && !timerExpired
  const isExpired = timerExpired

  // Close dropdown when task becomes active or expires
  useEffect(() => {
    if (isActive || isExpired) { setDropdownOpen(false); setHoveredId(null) }
  }, [isActive, isExpired])

  let header = t.ui.header_preview
  let headerColor = '#7a7570'
  if (isActive && !timerIsDefense) { header = t.ui.header_in_progress; headerColor = '#c9a93a' }
  if (isActive && timerIsDefense)  { header = t.ui.header_defend; headerColor = '#cc4422' }
  if (isActive && timerIsDefense && pendingDefenseAction === 'parry') { header = t.ui.header_parry; headerColor = '#cc4422' }
  if (isExpired) { header = t.ui.header_times_up; headerColor = '#c9a93a' }

  const taskName  = pendingStep ? localizeStepName(pendingStep, t) : ''
  const backLabel = timerIsDefense
    ? t.ui.give_up
    : isActive ? t.ui.back_with_cost : t.ui.back

  // ── Context info strip ───────────────────────────────────────────────────
  const weapon   = pendingWeaponId ? WEAPONS[pendingWeaponId] : null
  const wi       = weapon as WeaponInstance | undefined
  const wLevel   = weaponLevels[pendingWeaponId] ?? 0
  const computedDmg  = (!timerIsDefense && pendingStep && weapon)
    ? calcStepDamage(pendingStep, weapon, wLevel, playerStats)
    : null
  const dmgType = pendingStep?.damage_type
  const dmgTypeColor = dmgType ? (DMG_TYPE_COLOURS[dmgType] ?? '#aaaaaa') : null

  // ── Multi-dimension mismatch ──────────────────────────────────────────────
  const selectedItem = activeContentItems.find(c => c.id === selectedContentId) ?? null
  const gm           = pendingMoveset as GeneratedMoveset | null

  const taskStage    = pendingStep?.stage        ?? null
  const taskProduct  = gm?.dominant_product       ?? null
  const taskOrigin   = gm?.content_origin        ?? null
  const taskStatus   = gm?.status_buildup        ?? null
  const taskStyle    = pendingStep?.damage_type  ?? null

  // When dropdown is open, hover preview takes priority over confirmed selection
  const displayId   = dropdownOpen && hoveredId !== null ? hoveredId : selectedContentId
  const displayItem = activeContentItems.find(c => c.id === displayId) ?? null

  const stageMismatch   = !!displayItem && !!taskStage && displayItem.phase !== taskStage
  const productMismatch = !!displayItem?.stamped_product && !!taskProduct && displayItem.stamped_product !== taskProduct
  const originMismatch = !!displayItem?.stamped_origin && !!taskOrigin && displayItem.stamped_origin !== taskOrigin
  const statusMismatch = !!displayItem?.stamped_status && !!taskStatus && displayItem.stamped_status !== taskStatus
  const styleMismatch  = !!displayItem?.stamped_style  && !!taskStyle  && displayItem.stamped_style  !== taskStyle

  let mismatchMult = 1
  if (stageMismatch)   mismatchMult *= 0.90
  if (productMismatch) mismatchMult *= 0.85
  if (originMismatch)  mismatchMult *= 0.85
  if (statusMismatch) mismatchMult *= 0.85
  if (styleMismatch)  mismatchMult *= 0.85
  mismatchMult = Math.max(0.35, mismatchMult)

  const showImpact  = !timerIsDefense && !!displayItem
  const anyMismatch = stageMismatch || productMismatch || originMismatch || statusMismatch || styleMismatch
  const penaltyPct  = Math.round((1 - mismatchMult) * 100)

  // ── Per-item mismatch score (for dropdown ordering + inline hint) ─────────
  function itemMult(item: ContentItem): number {
    let m = 1
    if (taskStage  && item.phase !== taskStage)                                              m *= 0.90
    if (taskProduct && item.stamped_product && item.stamped_product !== taskProduct)         m *= 0.85
    if (taskOrigin && item.stamped_origin && item.stamped_origin !== taskOrigin)             m *= 0.85
    if (taskStatus && item.stamped_status && item.stamped_status !== taskStatus)             m *= 0.85
    if (taskStyle  && item.stamped_style  && item.stamped_style  !== taskStyle)              m *= 0.85
    return Math.max(0.35, m)
  }
  const sortedItems = [...activeContentItems].sort((a, b) => itemMult(b) - itemMult(a))

  // ── Weapon tooltip data ───────────────────────────────────────────────────
  const classDef = wi?.weapon_class ? WEAPON_CLASSES[wi.weapon_class] : null
  const affixDmgMult = wi?.affixes.reduce((m, a) => m * (a.damage_mult ?? 1), 1) ?? 1
  const effectiveDmgMult = ((wi?.base_damage_mult ?? 1) * affixDmgMult)
  const scalingEntries = wi ? (Object.entries(wi.scaling) as [string, string][]) : []

  return (
    <div className={s.overlay}>
      <div className={s.panel}>
        <div className={s.header} style={{ color: headerColor }}>{header}</div>
        <hr />

        {/* ── Context strip ────────────────────────────────────────────── */}
        <div className={s.contextStrip}>
          {!timerIsDefense && pendingMoveset && (
            <>
              {wi && (
                <span className={s.ctxWeapon}>
                  <WeaponSprite
                    weaponClass={wi.weapon_class}
                    rarity={wi.rarity}
                    poiseWeight={wi.poise_weight}
                    size={44}
                  />
                  {localizeWeaponName(wi, t)}
                  {/* ── Hover tooltip ── */}
                  <span className={s.weaponTip}>
                    <div className={s.weaponTipRow}>
                      <span className={s.weaponTipLabel}>{t.ui.damage_mult}</span>
                      <span className={s.weaponTipVal}>×{effectiveDmgMult.toFixed(2)}</span>
                    </div>
                    {classDef && (
                      <div className={s.weaponTipRow}>
                        <span className={s.weaponTipLabel}>{t.ui.task_time}</span>
                        <span className={s.weaponTipVal}>×{classDef.time_mod.toFixed(2)}</span>
                      </div>
                    )}
                    {classDef && (
                      <div className={s.weaponTipRow}>
                        <span className={s.weaponTipLabel}>{t.ui.stamina_cost_label}</span>
                        <span className={s.weaponTipVal}>×{classDef.stamina_mod.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={s.weaponTipRow}>
                      <span className={s.weaponTipLabel}>{t.ui.heat_limit}</span>
                      <span className={s.weaponTipVal}>{wi.heat_threshold}</span>
                    </div>
                    {scalingEntries.length > 0 && (
                      <>
                        <hr className={s.weaponTipSep} />
                        <div className={s.weaponTipScaling}>
                          {scalingEntries.map(([stat, grade]) => `${stat} ${grade}`).join(' · ')}
                        </div>
                      </>
                    )}
                    {wi.affixes.length > 0 && (
                      <>
                        <hr className={s.weaponTipSep} />
                        {wi.affixes.map((a, i) => {
                          const parts: string[] = []
                          if (a.damage_mult  && a.damage_mult  !== 1) parts.push(`${a.damage_mult  > 1 ? '+' : ''}${Math.round((a.damage_mult  - 1) * 100)}% ${t.ui.dmg_suffix}`)
                          if (a.stamina_mult && a.stamina_mult !== 1) parts.push(`${a.stamina_mult > 1 ? '+' : ''}${Math.round((a.stamina_mult - 1) * 100)}% sta`)
                          if (a.fp_mult     && a.fp_mult      !== 1) parts.push(`${a.fp_mult      > 1 ? '+' : ''}${Math.round((a.fp_mult      - 1) * 100)}% FP`)
                          return (
                            <div key={i} className={s.weaponTipAffix}>
                              {a.label}{parts.length ? ` — ${parts.join(', ')}` : ''}
                            </div>
                          )
                        })}
                      </>
                    )}
                  </span>
                </span>
              )}
              <span className={s.ctxMoveset}>{pendingMoveset.name}</span>
              {computedDmg !== null && (
                <span className={s.ctxDmg}>
                  {dmgTypeColor && (
                    <span style={{ color: dmgTypeColor }}>●</span>
                  )}{' '}
                  {computedDmg} {t.ui.dmg_suffix}
                </span>
              )}
              {pendingMoveset.stamina_cost > 0 && (
                <span className={s.ctxSta}>−{pendingMoveset.stamina_cost} STA</span>
              )}
              {(pendingMoveset.fp_cost ?? 0) > 0 && (
                <span className={s.ctxFp}>−{pendingMoveset.fp_cost} FP</span>
              )}
            </>
          )}
          {timerIsDefense && pendingDefenseAction === 'roll' && (
            <>
              <span className={s.ctxOutcome}>{t.ui.defense_success_sym} +{STA_DEFENSE_GAIN} STA, 0 {t.ui.dmg_taken_label}</span>
              <span className={s.ctxOutcomeFail}>{t.ui.defense_fail_sym} {currentMove?.damage ?? '?'} {t.ui.dmg_taken_label}</span>
            </>
          )}
          {timerIsDefense && pendingDefenseAction === 'parry' && (
            <>
              {parryPublishItem && (
                <span className={s.ctxParryArticle}>
                  {t.ui.publishing_prefix} <em>{parryPublishItem.name || t.ui.unnamed_item}</em>
                </span>
              )}
              <span className={s.ctxOutcome}>{t.ui.defense_success_sym} {currentMove?.damage ?? '?'} {t.ui.counter_dmg_label}</span>
              <span className={s.ctxOutcomeFail}>{t.ui.defense_fail_sym} {currentMove?.damage ?? '?'} {t.ui.dmg_taken_label}</span>
            </>
          )}
        </div>

        {pendingStep?.badges && pendingStep.badges.length > 0 ? (
          <div className={s.badges}>
            {pendingStep.badges.map((badge, i) => {
              const resolved = resolveBadge(badge, locale)
              return (
                <span
                  key={i}
                  className={s.badge}
                  style={badge.color ? { borderColor: badge.color, color: badge.color } : undefined}
                >
                  {resolved.label}
                  <span className={s.badgeTip}>{resolved.detail}</span>
                </span>
              )
            })}
          </div>
        ) : (
          <div className={s.taskName}>{taskName}</div>
        )}

        {/* ── Article selector ─────────────────────────────────────────── */}
        {!timerIsDefense && (
          <>
            {/* Trigger button */}
            <div className={s.articleRow}>
              <span className={s.articleLabel}>{t.ui.working_on}</span>
              <button
                type="button"
                className={[
                  s.articleTrigger,
                  (isActive || isExpired) ? s.articleTriggerDisabled : '',
                ].join(' ')}
                onClick={() => { if (!isActive && !isExpired) setDropdownOpen(o => !o) }}
              >
                {selectedItem ? (
                  <>
                    <span className={s.articlePhaseChip}>{selectedItem.phase}</span>
                    <span className={s.articleTriggerName}>{selectedItem.name || t.ui.unnamed_item}</span>
                  </>
                ) : (
                  <span className={s.articlePlaceholder}>{t.ui.none_option}</span>
                )}
                <span className={s.articleCaret}>{dropdownOpen ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Floating list */}
            {dropdownOpen && !isActive && !isExpired && (
              <>
                <div
                  className={s.articleBackdrop}
                  onClick={() => { setDropdownOpen(false); setHoveredId(null) }}
                />
                <div className={s.articleList}>
                  {/* None option */}
                  <div
                    className={[
                      s.articleOption,
                      !selectedContentId ? s.articleOptionSelected : '',
                    ].join(' ')}
                    onMouseEnter={() => setHoveredId(null)}
                    onClick={() => { onSelectContent(null); setDropdownOpen(false); setHoveredId(null) }}
                  >
                    <span className={s.articleOptionName}>{t.ui.none_option}</span>
                  </div>
                  {sortedItems.map(item => {
                    const mult    = itemMult(item)
                    const penalty = Math.round((1 - mult) * 100)
                    const hintColor = penalty === 0 ? '#55cc77' : penalty >= 50 ? '#cc5533' : '#cc9933'
                    return (
                      <div
                        key={item.id}
                        className={[
                          s.articleOption,
                          item.id === selectedContentId ? s.articleOptionSelected : '',
                          item.id === hoveredId         ? s.articleOptionHovered  : '',
                        ].join(' ')}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => { onSelectContent(item.id); setDropdownOpen(false); setHoveredId(null) }}
                      >
                        <span className={s.articlePhaseChip}>{item.phase}</span>
                        <span className={s.articleOptionName}>{item.name || t.ui.unnamed_item}</span>
                        <span className={s.articleOptionHint} style={{ color: hintColor }}>
                          {penalty === 0 ? '✓' : `−${penalty}%`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ── Task impact on displayed article ─────────────────────── */}
            {showImpact && (
              <div className={s.impactRow}>
                {taskStage && (
                  <span
                    className={stageMismatch ? s.impactMismatch : s.impactMatch}
                    title={stageMismatch
                      ? `Article is at ${displayItem!.phase} phase; this task advances ${taskStage} work`
                      : `Task stage matches article phase`}
                  >
                    {stageMismatch
                      ? `${displayItem!.phase} ≠ ${taskStage}`
                      : taskStage}
                  </span>
                )}
                {taskProduct && (
                  <span
                    className={
                      productMismatch              ? s.impactMismatch :
                      !displayItem!.stamped_product ? s.impactNew :
                      s.impactMatch
                    }
                    title={
                      productMismatch
                        ? `Article locked to ${displayItem!.stamped_product}; task uses ${taskProduct} (−15% dmg)`
                        : !displayItem!.stamped_product
                        ? `Will stamp article with ${taskProduct} product type`
                        : `Product type matches`
                    }
                  >
                    {productMismatch
                      ? `${displayItem!.stamped_product} ≠ ${taskProduct}`
                      : taskProduct}
                    {!productMismatch && !displayItem!.stamped_product && ' ✦'}
                  </span>
                )}
                {taskOrigin && (
                  <span
                    className={
                      originMismatch             ? s.impactMismatch :
                      !displayItem!.stamped_origin ? s.impactNew :
                      s.impactMatch
                    }
                    title={
                      originMismatch
                        ? `Article locked to ${displayItem!.stamped_origin}; task uses ${taskOrigin} (−15% dmg)`
                        : !displayItem!.stamped_origin
                        ? `Will stamp article with ${taskOrigin} origin`
                        : `Origin matches`
                    }
                  >
                    {originMismatch
                      ? `${displayItem!.stamped_origin} ≠ ${taskOrigin}`
                      : taskOrigin.replace(/_/g, ' ')}
                    {!originMismatch && !displayItem!.stamped_origin && ' ✦'}
                  </span>
                )}
                {taskStatus && (
                  <span
                    className={
                      statusMismatch             ? s.impactMismatch :
                      !displayItem!.stamped_status ? s.impactNew :
                      s.impactMatch
                    }
                    title={
                      statusMismatch
                        ? `Article locked to ${displayItem!.stamped_status}; task builds ${taskStatus} (−15% dmg)`
                        : !displayItem!.stamped_status
                        ? `Will stamp article with ${taskStatus.replace(/_/g, ' ')} tone`
                        : `Tone matches`
                    }
                  >
                    {statusMismatch
                      ? `${displayItem!.stamped_status?.replace(/_/g, ' ')} ≠ ${taskStatus.replace(/_/g, ' ')}`
                      : taskStatus.replace(/_/g, ' ')}
                    {!statusMismatch && !displayItem!.stamped_status && ' ✦'}
                  </span>
                )}
                {taskStyle && (
                  <span
                    className={
                      styleMismatch            ? s.impactMismatch :
                      !displayItem!.stamped_style ? s.impactNew :
                      s.impactMatch
                    }
                    title={
                      styleMismatch
                        ? `Article locked to ${t.content.dmg_type[displayItem!.stamped_style!]?.badge_label ?? displayItem!.stamped_style}; task uses ${t.content.dmg_type[taskStyle]?.badge_label ?? taskStyle} (−15% dmg)`
                        : !displayItem!.stamped_style
                        ? `Will stamp article with ${t.content.dmg_type[taskStyle]?.badge_label ?? taskStyle} style`
                        : `Style matches`
                    }
                  >
                    {styleMismatch
                      ? `${t.content.dmg_type[displayItem!.stamped_style!]?.badge_label ?? displayItem!.stamped_style} ≠ ${t.content.dmg_type[taskStyle]?.badge_label ?? taskStyle}`
                      : (t.content.dmg_type[taskStyle]?.badge_label ?? taskStyle)}
                    {!styleMismatch && !displayItem!.stamped_style && ' ✦'}
                  </span>
                )}
                {anyMismatch && (
                  <span className={s.impactPenalty} title={t.ui.penalty_title}>
                    −{penaltyPct}% {t.ui.dmg_suffix}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        <div className={s.timerRow}>
          <div className={s.timerVal} style={{ color: pct < 0.2 ? '#e85555' : '#c9a93a' }}>
            {fmtTime(stepTimer)}
          </div>
          {(isActive || isExpired) && (
            <div className={s.barWrap}>
              <div className={s.barFill} style={{ width: `${(1 - pct) * 100}%` }}/>
            </div>
          )}
        </div>

        {isPreview && (
          <div className={s.actions}>
            <button
              className={s.btnPrimary}
              disabled={!timerIsDefense && !selectedContentId}
              title={!timerIsDefense && !selectedContentId ? t.ui.select_article_first : undefined}
              onClick={() => dispatch({ type: 'START_TIMER' })}
            >
              {t.ui.btn_start_task}
            </button>
          </div>
        )}

        {isActive && (
          <div className={s.actions}>
            <button className={s.btnPrimary} onClick={() => {
              if (!timerIsDefense) onTaskAccomplished(
                selectedContentId, taskStage,
                selectedContentId ? { product: taskProduct ?? undefined, origin: taskOrigin ?? undefined, status: taskStatus ?? undefined, style: taskStyle ?? undefined } : null,
              )
              if (timerIsDefense && pendingDefenseAction === 'parry') onParryAccomplished?.()
              dispatch({ type: 'TIMER_RESULT', accomplished: true, statusApplied: true, mismatchMult })
            }}>
              {t.ui.btn_done}
            </button>
            {!timerIsDefense && (
              <button className={s.btnSacrifice} onClick={() => {
                const timeFrac = stepTotal > 0 ? stepTimer / stepTotal : 0
                onTaskAccomplished(
                  selectedContentId, taskStage,
                  selectedContentId ? { product: taskProduct ?? undefined, origin: taskOrigin ?? undefined, status: taskStatus ?? undefined, style: taskStyle ?? undefined } : null,
                )
                dispatch({ type: 'TIMER_RESULT', accomplished: true, statusApplied: true, mismatchMult, sacrificeTimeFrac: timeFrac })
              }}>
                {t.ui.btn_sacrifice}
              </button>
            )}
          </div>
        )}

        {isExpired && (
          <>
            <div className={s.expiredHint}>{t.ui.did_complete}</div>
            <div className={s.confirmRow}>
              <button className={s.btnYes} onClick={() => {
                if (!timerIsDefense) onTaskAccomplished(
                  selectedContentId, taskStage,
                  selectedContentId ? { product: taskProduct ?? undefined, origin: taskOrigin ?? undefined, status: taskStatus ?? undefined, style: taskStyle ?? undefined } : null,
                )
                if (timerIsDefense && pendingDefenseAction === 'parry') onParryAccomplished?.()
                dispatch({ type: 'TIMER_RESULT', accomplished: true, statusApplied: true, mismatchMult })
              }}>
                {t.ui.btn_yes}
              </button>
              <button className={s.btnNo} onClick={() => {
                dispatch({ type: 'TIMER_RESULT', accomplished: false })
              }}>
                {t.ui.btn_no}
              </button>
            </div>
          </>
        )}

        {!isExpired && (
          <div className={s.backRow}>
            <button className={s.btnBack} onClick={() => dispatch({ type: 'CANCEL_TIMER' })}>
              {backLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
