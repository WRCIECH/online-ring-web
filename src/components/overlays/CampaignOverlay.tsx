import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LEVEL_MULT, weaponUpgradeCost, calcWeaponScaledDamage, calcWeaponSellPrice } from '../../data/weapons'
import { STAGE_TIME } from '../../data/generators/workflowGenerator'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import {
  MODIFICATION_STATS, STAT_TRANSFORMATIONS, STAT_CONSTRAINTS, STAT_LINK_TYPES,
  statMicroTypes, statMediumTypes, statHeavyTypes,
} from '../../data/statModifications'
import type { WeaponCampaign, WeaponInstance, MicroProduct, MediumPiece, StatKey, ContentTransformation, MicroContentType, MediumContentType, HeavyContentType, ContentShift, NodeConstraint, ConstraintCategory, PropagandaShift, MediumAudienceShift, StyleShift } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

// ── Edge label display names ─────────────────────────────────────────────────

const LABEL_DISPLAY: Record<string, string> = {
  Succinct: 'Succinct', Verbose: 'Verbose', ZoomIn: 'Zoom In', ZoomOut: 'Zoom Out',
  Similar: 'Similar', Opposite: 'Opposite', Shock: 'Shock', Narration: 'Narration',
  Segmentation: 'Segmentation', Passion: 'Passion', Estetic: 'Esthetic', Cliffhanger: 'Cliffhanger',
  Viral: 'Viral', Controversy: 'Controversy', Comfort: 'Comfort', Drama: 'Drama',
  Humor: 'Humor', Parasocial: 'Parasocial', Wow: 'Wow', Hope: 'Hope', Fear: 'Fear', Desire: 'Desire',
}

const LINK_DISPLAY: Record<ContentShift, string> = {
  Follows: 'Follows', ZoomIn: 'Zoom In', ZoomOut: 'Zoom Out', Similar: 'Similar', Opposite: 'Opposite',
}

// ── Modification picker types ─────────────────────────────────────────────────

type ModKind =
  | 'microType' | 'microStyle'
  | 'mediumFormat' | 'mediumConstraint' | 'mediumLink'
  | 'heavyType'

interface ModCtxData {
  kind: ModKind
  productId?: string
  pieceId?: string
  formatField?: 'level1_type' | 'level2_type'
  step: 'stat' | 'option'
  stat?: StatKey
}

const PROPAGANDA_VALUES: PropagandaShift[] = ['enhance', 'weaken', 'focus', 'action']
const AUDIENCE_VALUES: MediumAudienceShift[] = ['audience_x', 'lower_self', 'average_self', 'higher_self', 'base_trend_event', 'need_identity_belief']
const STYLE_VALUES: StyleShift[] = ['narration', 'segmentation', 'socratic', 'enemy_hero', 'slogan_symbol', 'analogy', 'verbose', 'succinct', 'technicalize', 'simplify', 'evidence', 'data_driven', 'first_principles']
const CONSTRAINT_VALUES: Record<ConstraintCategory, string[]> = {
  propaganda: PROPAGANDA_VALUES,
  audience:   AUDIENCE_VALUES,
  style:      STYLE_VALUES,
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t = useT()

  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(
    store.weapon_instances[0]?.instance_id ?? null
  )
  const [activeTab, setActiveTab] = useState<'micro' | 'medium' | 'heavy'>('medium')
  const [confirmSellId,    setConfirmSellId]    = useState<string | null>(null)
  const [confirmUpgradeId, setConfirmUpgradeId] = useState<string | null>(null)
  const [hoveredUpgrade,   setHoveredUpgrade]   = useState(false)
  const [modCtx,           setModCtx]           = useState<ModCtxData | null>(null)

  useEffect(() => {
    if (selectedWeaponId && !store.weapon_campaigns[selectedWeaponId]) {
      const w = store.weapon_instances.find(wi => wi.instance_id === selectedWeaponId)
      const defaultName = w ? `Kampania #1 · ${localizeWeaponName(w, t)}` : undefined
      store.assignCampaignToWeapon(selectedWeaponId, defaultName)
    }
  }, [selectedWeaponId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setConfirmSellId(null)
    setConfirmUpgradeId(null)
    setActiveTab('medium')
    setModCtx(null)
  }, [selectedWeaponId])

  const selectedWeapon = selectedWeaponId
    ? store.weapon_instances.find(w => w.instance_id === selectedWeaponId)
    : undefined
  const campaign: WeaponCampaign | undefined = selectedWeaponId
    ? store.weapon_campaigns[selectedWeaponId]
    : undefined

  const wid = selectedWeapon?.instance_id ?? ''
  const level = store.weapon_level[wid] ?? 0
  const isMax = level >= 10
  const cost = weaponUpgradeCost(level)
  const canAfford = !isMax && store.runes >= cost
  const dmgCurrent = selectedWeapon ? calcWeaponScaledDamage(100, selectedWeapon, level) : 0
  const dmgNext = (selectedWeapon && !isMax) ? calcWeaponScaledDamage(100, selectedWeapon, level + 1) : null
  const classDef = selectedWeapon ? WEAPON_CLASSES[selectedWeapon.weapon_class] : null
  const isConfirmUpgrade = confirmUpgradeId === wid
  const isConfirmSell = confirmSellId === wid

  function handleUpgrade() {
    if (!selectedWeapon) return
    if (isConfirmUpgrade) { store.upgradeWeapon(wid); setConfirmUpgradeId(null) }
    else setConfirmUpgradeId(wid)
  }

  function handleSell() {
    if (!selectedWeapon) return
    if (isConfirmSell) {
      const remaining = store.weapon_instances.filter(w => w.instance_id !== wid)
      store.sellWeapon(wid)
      setConfirmSellId(null)
      setSelectedWeaponId(remaining[0]?.instance_id ?? null)
    } else setConfirmSellId(wid)
  }

  // ── Mod picker helpers ─────────────────────────────────────────────────────

  function getBudget(stat: StatKey) {
    return (store.stats[stat] ?? 0) - (store.stat_modifications_used[stat] ?? 0)
  }

  function hasOptionsForStat(kind: ModKind, stat: StatKey): boolean {
    switch (kind) {
      case 'microType':        return statMicroTypes(stat).length > 0
      case 'microStyle':       return (STAT_TRANSFORMATIONS[stat]?.length ?? 0) > 0
      case 'mediumFormat':     return statMediumTypes(stat).length > 0
      case 'mediumConstraint': return (STAT_CONSTRAINTS[stat]?.length ?? 0) > 0
      case 'mediumLink':       return (STAT_LINK_TYPES[stat]?.length ?? 0) > 0
      case 'heavyType':        return statHeavyTypes(stat).length > 0
    }
  }

  function getOptions(ctx: ModCtxData): { key: string; label: string }[] {
    if (!ctx.stat) return []
    const stat = ctx.stat
    const prodLabel = (type: string) =>
      (t.content.product as Record<string, { badge_label: string }>)[type]?.badge_label ?? type

    switch (ctx.kind) {
      case 'microType':
        return statMicroTypes(stat).map(ty => ({ key: ty, label: prodLabel(ty) }))

      case 'microStyle':
        return [
          { key: '__none__', label: 'None' },
          ...(STAT_TRANSFORMATIONS[stat] ?? []).map(ty => ({ key: ty, label: LABEL_DISPLAY[ty] ?? ty })),
        ]

      case 'mediumFormat':
        return statMediumTypes(stat).map(ty => ({ key: ty, label: prodLabel(ty) }))

      case 'mediumConstraint': {
        const cats = STAT_CONSTRAINTS[stat] ?? []
        const opts: { key: string; label: string }[] = [{ key: '__none__', label: 'Clear' }]
        for (const cat of cats) {
          for (const val of CONSTRAINT_VALUES[cat]) {
            const entry = (t.content.constraint[cat] as Record<string, { label: string }>)[val]
            opts.push({ key: `${cat}:${val}`, label: entry?.label ?? val })
          }
        }
        return opts
      }

      case 'mediumLink':
        return (STAT_LINK_TYPES[stat] ?? []).map(ty => ({ key: ty, label: LINK_DISPLAY[ty] ?? ty }))

      case 'heavyType':
        return statHeavyTypes(stat).map(ty => ({ key: ty, label: prodLabel(ty) }))
    }
  }

  function applyMod(ctx: ModCtxData, optionKey: string) {
    if (!ctx.stat) return
    const stat = ctx.stat
    let ok = false
    switch (ctx.kind) {
      case 'microType':
        ok = store.modifyMicroProductType(wid, ctx.productId!, optionKey as MicroContentType, stat)
        break
      case 'microStyle':
        ok = store.modifyMicroProductStyle(wid, ctx.productId!, optionKey === '__none__' ? null : optionKey as ContentTransformation, stat)
        break
      case 'mediumFormat':
        ok = store.modifyMediumFormat(wid, ctx.formatField!, optionKey as MediumContentType, stat)
        break
      case 'mediumConstraint':
        if (optionKey === '__none__') {
          ok = store.modifyMediumPieceConstraint(wid, ctx.pieceId!, null, stat)
        } else {
          const [cat, val] = optionKey.split(':')
          const constraint: NodeConstraint = { category: cat as ConstraintCategory, value: val as PropagandaShift }
          ok = store.modifyMediumPieceConstraint(wid, ctx.pieceId!, constraint, stat)
        }
        break
      case 'mediumLink':
        ok = store.modifyMediumLinkType(wid, ctx.pieceId!, optionKey as ContentShift, stat)
        break
      case 'heavyType':
        ok = store.modifyHeavyProductType(wid, optionKey as HeavyContentType, stat)
        break
    }
    if (ok) setModCtx(null)
  }

  function openMod(partial: Omit<ModCtxData, 'step'>) {
    setModCtx({ ...partial, step: 'stat' })
  }

  // ── Mod picker render ──────────────────────────────────────────────────────

  function renderModPicker() {
    if (!modCtx) return null
    return (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 19 }}
          onClick={() => setModCtx(null)}
        />
        <div className={s.modPicker} style={{ position: 'fixed', top: '50%', left: '55%', transform: 'translateY(-50%)', zIndex: 20 }}>
          {modCtx.step === 'stat' ? (
            <>
              <div className={s.modPickerTitle}>Pick stat to spend</div>
              <div className={s.modPickerOptions}>
                {MODIFICATION_STATS.map(stat => {
                  const budget = getBudget(stat)
                  const hasOpts = hasOptionsForStat(modCtx.kind, stat)
                  return (
                    <button
                      key={stat}
                      className={s.modPickerOption}
                      disabled={budget <= 0 || !hasOpts}
                      onClick={() => setModCtx({ ...modCtx, stat, step: 'option' })}
                    >
                      {stat} <span className={s.modPickerRemaining}>({budget})</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className={s.modPickerTitle}>
                {modCtx.stat} <span className={s.modPickerRemaining}>({getBudget(modCtx.stat!)} left)</span>
              </div>
              {(() => {
                const opts = getOptions(modCtx)
                if (opts.length === 0) return <div className={s.modPickerEmpty}>No options available.</div>
                return (
                  <div className={s.modPickerOptions}>
                    {opts.map(o => (
                      <button
                        key={o.key}
                        className={o.key === '__none__' ? s.modPickerReset : s.modPickerOption}
                        onClick={() => applyMod(modCtx, o.key)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )
              })()}
              <button
                className={s.modPickerReset}
                style={{ marginTop: 8 }}
                onClick={() => setModCtx({ ...modCtx, step: 'stat', stat: undefined })}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </>
    )
  }

  const weapons = store.weapon_instances

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        <div className={s.header}>
          <div className={s.title}>{t.ui.campaigns_title}</div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>

        <div className={s.body}>
          {/* Left: weapon list */}
          <div className={s.weaponList}>
            {weapons.map(w => (
              <WeaponCard
                key={w.instance_id}
                weapon={w}
                t={t}
                hasCampaign={store.weapon_campaigns[w.instance_id]?.activated === true}
                selected={w.instance_id === selectedWeaponId}
                onClick={() => setSelectedWeaponId(w.instance_id)}
              />
            ))}
            {weapons.length === 0 && (
              <div className={s.empty}>No weapons owned.</div>
            )}
          </div>

          {/* Right: campaign panel */}
          <div className={s.treePane}>
            {!selectedWeapon ? (
              <div className={s.empty}>Select a weapon.</div>
            ) : (
              <>
                {/* ── Weapon info strip ── */}
                <div className={s.weaponInfoStrip}>
                  <div className={s.weaponInfoTop}>
                    <div className={s.weaponInfoLeft}>
                      <span className={s.weaponLevel}>+{level}</span>
                      <span className={s.statChip}>×{(dmgCurrent / 100).toFixed(2)} dmg</span>
                      {classDef && (() => {
                        const lightSecs = Math.round(STAGE_TIME.Research.light * classDef.time_mod)
                        const lightMin  = Math.floor(lightSecs / 60)
                        const lightSec  = lightSecs % 60
                        const lightFmt  = lightMin > 0
                          ? (lightSec > 0 ? `${lightMin}m ${lightSec}s` : `${lightMin}m`)
                          : `${lightSec}s`
                        return (
                          <>
                            <span className={s.statChip}>+{((LEVEL_MULT[selectedWeapon.rarity] ?? 0.03) * 100).toFixed(0)}% / lv</span>
                            <span className={s.statChip}>×{classDef.base_damage_mult} base</span>
                            <span className={s.statChip}>{lightFmt} / tile</span>
                          </>
                        )
                      })()}
                    </div>
                    <div className={s.weaponInfoActions}>
                      <div
                        className={s.upgradeWrap}
                        onMouseEnter={() => setHoveredUpgrade(true)}
                        onMouseLeave={() => setHoveredUpgrade(false)}
                      >
                        {isMax ? (
                          <span className={s.upgradeMax}>{t.ui.max_tag}</span>
                        ) : (
                          <button
                            className={[
                              s.btnUpgrade,
                              isConfirmUpgrade ? s.btnUpgradeConfirm : '',
                              !canAfford ? s.btnUpgradeDim : '',
                            ].filter(Boolean).join(' ')}
                            disabled={!canAfford}
                            onClick={handleUpgrade}
                          >
                            {isConfirmUpgrade ? t.ui.btn_confirm_q : `↑ ${cost.toLocaleString()} ✦`}
                          </button>
                        )}
                        {hoveredUpgrade && !isMax && dmgNext !== null && (
                          <div className={s.upgradeTip}>
                            <span className={s.upgradeTipLabel}>Damage multiplier</span>
                            <span className={s.upgradeTipVal}>
                              ×{(dmgCurrent / 100).toFixed(2)}
                              {' → '}
                              <span style={{ color: '#88dd99' }}>×{(dmgNext / 100).toFixed(2)}</span>
                              <span className={s.upgradeTipDelta}>
                                {' '}(+{Math.round((LEVEL_MULT[selectedWeapon.rarity] ?? 0.03) * 100)}% / level)
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      {store.weapon_instances.length > 1 && (
                        <button
                          className={isConfirmSell ? s.btnSellConfirm : s.btnSell}
                          onClick={handleSell}
                        >
                          {isConfirmSell
                            ? t.ui.btn_sell_confirm
                            : `${t.ui.btn_sell_weapon} (${selectedWeapon ? calcWeaponSellPrice(selectedWeapon) : 75} ✦)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!campaign ? (
                  <div className={s.empty}>Generating…</div>
                ) : campaign.micro ? (() => {
                  const isActivated = campaign.activated === true
                  const canActivate = !!(campaign.campaign_name?.trim()) && !!(campaign.heavy?.name?.trim())
                  const prodLabel = (type: string) =>
                    (t.content.product as Record<string, { badge_label: string }>)[type]?.badge_label ?? type
                  const l1Label = campaign.medium ? prodLabel(campaign.medium.pieces[0]?.level1_type ?? '') : ''
                  const l2Label = campaign.medium ? prodLabel(campaign.medium.pieces[0]?.level2_type ?? '') : ''
                  return (
                    <>
                      <div className={s.campaignNameRow}>
                        {isActivated ? (
                          <span className={s.campaignNameDisplay}>{campaign.campaign_name}</span>
                        ) : (
                          <input
                            className={s.campaignNameInput}
                            value={campaign.campaign_name ?? ''}
                            placeholder="Campaign name…"
                            onChange={e => store.renameCampaign(wid, e.target.value)}
                          />
                        )}
                        {isActivated ? (
                          <span className={s.activeBadge}>Active</span>
                        ) : (
                          <button
                            className={s.activateBtn}
                            disabled={!canActivate}
                            onClick={() => store.activateCampaign(wid)}
                          >
                            Activate
                          </button>
                        )}
                      </div>

                      <div className={s.tabBar}>
                        <button className={[s.modeTab, activeTab==='micro'?s.modeTabActive:''].join(' ')} onClick={()=>setActiveTab('micro')}>Micro</button>
                        <button className={[s.modeTab, activeTab==='medium'?s.modeTabActive:''].join(' ')} onClick={()=>setActiveTab('medium')}>Medium</button>
                        <button className={[s.modeTab, activeTab==='heavy'?s.modeTabActive:''].join(' ')} onClick={()=>setActiveTab('heavy')}>Heavy</button>
                      </div>

                      {/* ── Micro tab ── */}
                      {activeTab === 'micro' && (() => {
                        const products = campaign.micro.products
                        const n = products.length
                        const RADIUS = 120
                        const SIZE = 320
                        return (
                          <div className={s.modePanel}>
                            <div className={s.microCircle} style={{ width: SIZE, height: SIZE }}>
                              <svg className={s.microCircleSvg} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                                <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 6" />
                              </svg>
                              <div className={s.microCircleCenter}>
                                <span className={s.microCircleCount}>{products.filter((p: MicroProduct) => p.done_count > 0).length}/{n}</span>
                                <span className={s.microCircleLabel}>published</span>
                              </div>
                              {products.map((p: MicroProduct, i: number) => {
                                const angle = (2 * Math.PI / n) * i - Math.PI / 2
                                const x = SIZE / 2 + Math.cos(angle) * RADIUS
                                const y = SIZE / 2 + Math.sin(angle) * RADIUS
                                return (
                                  <div
                                    key={p.id}
                                    className={[s.microCard, i===campaign.micro!.current_index?s.microCardCurrent:'', p.done_count>0?s.microCardDone:''].filter(Boolean).join(' ')}
                                    style={{ left: x, top: y }}
                                  >
                                    <div className={s.microCardType}>{prodLabel(p.content_type)}</div>
                                    {p.style && (
                                      <div
                                        className={s.microCardStyle}
                                        data-tooltip={t.content.transformation[p.style]?.detail}
                                      >
                                        {LABEL_DISPLAY[p.style] ?? p.style}
                                      </div>
                                    )}
                                    <div className={s.microCardCount}>×{p.done_count}</div>
                                    {!isActivated && (
                                      <div className={s.microCardEditRow}>
                                        <button className={s.modEditBtn} title="Change type" onClick={e => { e.stopPropagation(); openMod({ kind: 'microType', productId: p.id }) }}>T✎</button>
                                        {p.type_modified && <button className={s.modResetBtn} title="Reset type" onClick={e => { e.stopPropagation(); store.resetMicroProductType(wid, p.id) }}>↺</button>}
                                        <button className={s.modEditBtn} title="Change style" onClick={e => { e.stopPropagation(); openMod({ kind: 'microStyle', productId: p.id }) }}>S✎</button>
                                        {p.style_modified && <button className={s.modResetBtn} title="Reset style" onClick={e => { e.stopPropagation(); store.resetMicroProductStyle(wid, p.id) }}>↺</button>}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {campaign.micro.completed && <div className={s.modeComplete}>✓ Circle complete</div>}
                          </div>
                        )
                      })()}

                      {/* ── Medium tab ── */}
                      {activeTab === 'medium' && campaign.medium && (
                        <div className={s.modePanel}>
                          <div className={s.mediumFormat}>
                            <span className={s.mediumFormatLabel}>Format:</span>
                            <span className={s.levelBadge}>L1 {l1Label}</span>
                            {!isActivated && <>
                              <button className={s.modEditBtn} title="Change L1 type" onClick={() => openMod({ kind: 'mediumFormat', formatField: 'level1_type' })}>✎</button>
                              {campaign.medium!.level1_modified && <button className={s.modResetBtn} title="Reset L1 to original" onClick={() => store.resetMediumFormat(wid, 'level1_type')}>↺</button>}
                            </>}
                            <span className={s.mediumFormatArrow}>→</span>
                            <span className={s.levelBadge}>L2 {l2Label}</span>
                            {!isActivated && <>
                              <button className={s.modEditBtn} title="Change L2 type" onClick={() => openMod({ kind: 'mediumFormat', formatField: 'level2_type' })}>✎</button>
                              {campaign.medium!.level2_modified && <button className={s.modResetBtn} title="Reset L2 to original" onClick={() => store.resetMediumFormat(wid, 'level2_type')}>↺</button>}
                            </>}
                          </div>
                          <div className={s.mediumList}>
                            {campaign.medium.pieces.map((p: MediumPiece, i: number) => {
                              const prevPiece = i > 0 ? campaign.medium!.pieces[i-1] : null
                              const l1Unlocked = i === 0 || (prevPiece?.level1_done ?? false)
                              const currentLevel = p.level2_done ? 'done' : p.level1_done ? 'L2' : 'L1'
                              const pieces = campaign.medium!.pieces
                              const constraintEntry = p.constraint
                                ? (t.content.constraint[p.constraint.category] as Record<string, { label: string; description: string }>)[p.constraint.value as string]
                                : null
                              return (
                                <div key={p.id}>
                                  <div className={[s.mediumPiece, !l1Unlocked?s.mediumPieceLocked:''].filter(Boolean).join(' ')}>
                                    <div className={s.mediumPieceLeft}>
                                      <span className={s.mediumPieceNum}>{i+1}</span>
                                      {isActivated ? (
                                        <span className={s.mediumPieceName}>{p.name}</span>
                                      ) : (
                                        <input
                                          className={s.pieceNameInput}
                                          value={p.name}
                                          onChange={e => store.renameMediumPiece(wid, p.id, e.target.value)}
                                        />
                                      )}
                                    </div>
                                    <div className={s.mediumPieceRight}>
                                      <div className={s.mediumPieceLevels}>
                                        {currentLevel === 'done' && (
                                          <span className={[s.levelBadge, s.levelDone].join(' ')}>✓ Published</span>
                                        )}
                                        {currentLevel === 'L1' && (
                                          <>
                                            <span className={[s.levelBadge, !l1Unlocked?s.levelLocked:''].filter(Boolean).join(' ')}>
                                              {l1Unlocked ? 'Draft' : '🔒 Draft'}
                                            </span>
                                            {l1Unlocked && p.level1_worked && (
                                              <button
                                                className={s.publishBtn}
                                                title="Mark as drafted — use if you completed the work but accidentally dismissed the confirmation"
                                                onClick={() => store.completeMediumLevel(wid, p.id, 1)}
                                              >
                                                → Mark drafted
                                              </button>
                                            )}
                                          </>
                                        )}
                                        {currentLevel === 'L2' && (
                                          <>
                                            <span className={[s.levelBadge, s.levelReady].join(' ')}>✍ Drafted</span>
                                            <button
                                              className={s.publishBtn}
                                              onClick={() => store.publishMediumPiece(wid, p.id)}
                                            >
                                              Publish ✦
                                            </button>
                                          </>
                                        )}
                                      </div>
                                      {constraintEntry && (
                                        <span className={s.constraintLabel} data-tooltip={constraintEntry.description}>
                                          {constraintEntry.label}
                                        </span>
                                      )}
                                      {!isActivated && (
                                        <div className={s.modEditRow}>
                                          <button
                                            className={s.modEditBtn}
                                            title={p.constraint ? 'Change constraint' : 'Add constraint'}
                                            onClick={() => openMod({ kind: 'mediumConstraint', pieceId: p.id })}
                                          >{p.constraint ? '⊕✎' : '+ constraint'}</button>
                                          {p.constraint_modified && (
                                            <button className={s.modResetBtn} title="Reset constraint" onClick={() => store.resetMediumPieceConstraint(wid, p.id)}>↺</button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {i < pieces.length - 1 && (
                                    <div className={s.pieceConnector}>
                                      <div className={s.connectorLine} />
                                      <span className={s.connectorLabel}>{LINK_DISPLAY[p.link_type] ?? p.link_type}</span>
                                      {!isActivated && (
                                        <button className={s.modEditBtn} title="Change link type" onClick={() => openMod({ kind: 'mediumLink', pieceId: p.id })}>✎</button>
                                      )}
                                      {!isActivated && p.link_type_modified && (
                                        <button className={s.modResetBtn} title="Reset link type" onClick={() => store.resetMediumLinkType(wid, p.id)}>↺</button>
                                      )}
                                      <div className={s.connectorLine} />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          {campaign.medium.completed && <div className={s.modeComplete}>✓ Medium complete</div>}
                        </div>
                      )}

                      {/* ── Heavy tab ── */}
                      {activeTab === 'heavy' && campaign.heavy && (
                        <div className={s.modePanel}>
                          <div className={s.heavyCard}>
                            <div className={s.heavyProductType}>
                              {prodLabel(campaign.heavy.product_type)}
                              {!isActivated && (
                                <button className={s.modEditBtn} title="Change product type" style={{ marginLeft: 6 }} onClick={() => openMod({ kind: 'heavyType' })}>✎</button>
                              )}
                              {!isActivated && campaign.heavy.product_type_modified && (
                                <button className={s.modResetBtn} title="Reset to original" style={{ marginLeft: 4 }} onClick={() => store.resetHeavyProductType(wid)}>↺</button>
                              )}
                            </div>
                            {isActivated ? (
                              campaign.heavy.name && <div className={s.heavyName}>{campaign.heavy.name}</div>
                            ) : (
                              <input
                                className={s.heavyNameInput}
                                value={campaign.heavy.name ?? ''}
                                placeholder="Name this content…"
                                onChange={e => store.renameHeavyProduct(wid, e.target.value)}
                              />
                            )}
                            {(() => {
                              const total = campaign.heavy.research_count + campaign.heavy.produce_count
                              const done  = campaign.heavy.research_done  + campaign.heavy.produce_done
                              const pct   = total > 0 ? (done / total) * 100 : 0
                              return (
                                <div className={s.heavyProgress}>
                                  <span className={s.heavyProgressLabel}>Progress</span>
                                  <span className={s.heavyProgressTrack}>
                                    <span className={s.heavyProgressFill} style={{width:`${Math.min(100, pct)}%`}} />
                                  </span>
                                  <span>{done}/{total}</span>
                                </div>
                              )
                            })()}
                          </div>
                          {campaign.heavy.completed && !campaign.heavy.published && (
                            <button className={s.publishBtn} onClick={() => store.publishHeavyContent(wid)}>
                              Publish ✦
                            </button>
                          )}
                          {campaign.heavy.published && <div className={s.modeComplete}>✓ Published</div>}
                        </div>
                      )}

                      {renderModPicker()}
                    </>
                  )
                })() : null}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function WeaponCard({
  weapon, t, hasCampaign, selected, onClick,
}: {
  weapon: WeaponInstance
  t: ReturnType<typeof useT>
  hasCampaign: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={[s.weaponCard, selected ? s.weaponCardSelected : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <WeaponIcon weaponClass={weapon.weapon_class} className={s.weaponCardIcon} />
      <span className={s.weaponCardName}>{localizeWeaponName(weapon, t)}</span>
      {hasCampaign ? (
        <span className={s.weaponHasCampaign}>✦</span>
      ) : (
        <span className={s.weaponNoCampaign}>+</span>
      )}
    </button>
  )
}
