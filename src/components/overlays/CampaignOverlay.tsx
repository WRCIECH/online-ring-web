import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LEVEL_MULT, weaponUpgradeCost, calcWeaponScaledDamage, calcWeaponSellPrice } from '../../data/weapons'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import { MAX_ACTIVE_CAMPAIGNS, MEDIUM_CHUNK_SECS, CAMPAIGN_STEP_SECS } from '../../data/constants'
import { MODIFICATION_STATS, statMediumTypes, statHeavyTypes } from '../../data/statModifications'
import type { WeaponCampaign, WeaponInstance, StatKey, MediumContentType, HeavyContentType } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

// ── Modification picker types ─────────────────────────────────────────────────

type ModKind = 'mediumChunkType' | 'heavyType'

interface ModCtxData {
  kind: ModKind
  chunkId?: string
  step: 'stat' | 'option'
  stat?: StatKey
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t = useT()

  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(
    store.weapon_instances[0]?.instance_id ?? null
  )
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

  const activeCampaignCount = Object.values(store.weapon_campaigns).filter(c => c.activated).length

  function prodLabel(type: string): string {
    return (t.content.product as Record<string, { badge_label: string }>)[type]?.badge_label ?? type
  }

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
    return kind === 'mediumChunkType' ? statMediumTypes(stat).length > 0 : statHeavyTypes(stat).length > 0
  }

  function getOptions(ctx: ModCtxData): { key: string; label: string }[] {
    if (!ctx.stat) return []
    const stat = ctx.stat
    return ctx.kind === 'mediumChunkType'
      ? statMediumTypes(stat).map(ty => ({ key: ty, label: prodLabel(ty) }))
      : statHeavyTypes(stat).map(ty => ({ key: ty, label: prodLabel(ty) }))
  }

  function applyMod(ctx: ModCtxData, optionKey: string) {
    if (!ctx.stat) return
    const stat = ctx.stat
    const ok = ctx.kind === 'mediumChunkType'
      ? store.modifyMediumChunkType(wid, ctx.chunkId!, optionKey as MediumContentType, stat)
      : store.modifyHeavyProductType(wid, optionKey as HeavyContentType, stat)
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
                        className={s.modPickerOption}
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
                        const secs = classDef.action_type === 'medium' ? MEDIUM_CHUNK_SECS : CAMPAIGN_STEP_SECS
                        const unit = classDef.action_type === 'medium' ? 'chunk' : classDef.action_type === 'heavy' ? 'part' : 'step'
                        const mins = Math.round(secs / 60)
                        return (
                          <>
                            <span className={s.statChip}>+{((LEVEL_MULT[selectedWeapon.rarity] ?? 0.03) * 100).toFixed(0)}% / lv</span>
                            <span className={s.statChip}>×{classDef.base_damage_mult} base</span>
                            <span className={s.statChip}>{mins}m / {unit}</span>
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
                ) : (campaign.medium || campaign.heavy || campaign.research) ? (() => {
                  const isActivated = campaign.activated === true
                  const atCap = activeCampaignCount >= MAX_ACTIVE_CAMPAIGNS
                  const allNamed = campaign.medium ? campaign.medium.chunks.every(c => c.named)
                    : campaign.heavy ? campaign.heavy.parts.every(p => p.named)
                    : true
                  const namedCount = campaign.medium ? campaign.medium.chunks.filter(c => c.named).length
                    : campaign.heavy ? campaign.heavy.parts.filter(p => p.named).length
                    : 0
                  const totalCount = campaign.medium?.chunks.length ?? campaign.heavy?.parts.length ?? 0
                  const canActivate = !!(campaign.campaign_name?.trim()) && allNamed && !atCap
                  const activateHint = atCap
                    ? `Max ${MAX_ACTIVE_CAMPAIGNS} active campaigns`
                    : !campaign.campaign_name?.trim()
                      ? 'Name the campaign'
                      : !allNamed
                        ? `${namedCount}/${totalCount} named`
                        : null

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
                          <div className={s.upgradeWrap}>
                            <button
                              className={s.activateBtn}
                              disabled={!canActivate}
                              onClick={() => store.activateCampaign(wid)}
                            >
                              Activate
                            </button>
                            {activateHint && <span className={s.mediumFormatLabel} style={{ marginLeft: 8 }}>{activateHint}</span>}
                          </div>
                        )}
                      </div>

                      {/* ── Medium panel ── */}
                      {campaign.medium && (
                        <div className={s.modePanel}>
                          <div className={s.mediumList}>
                            {(() => {
                              const chunks = campaign.medium!.chunks
                              const firstUndone = chunks.findIndex(ch => !ch.done)
                              return chunks.map((c, i) => {
                                const isLocked  = !c.done && firstUndone !== -1 && i !== firstUndone
                                const isCurrent = !c.done && i === firstUndone
                                return (
                                  <div key={c.id} className={[s.mediumPiece, isLocked ? s.mediumPieceLocked : ''].filter(Boolean).join(' ')}>
                                    <div className={s.mediumPieceLeft}>
                                      <span className={s.mediumPieceNum}>{isLocked ? '🔒' : i + 1}</span>
                                      {isActivated ? (
                                        <span className={s.mediumPieceName}>{c.name}</span>
                                      ) : (
                                        <input
                                          className={s.pieceNameInput}
                                          value={c.name}
                                          onChange={e => store.renameMediumChunk(wid, c.id, e.target.value)}
                                        />
                                      )}
                                    </div>
                                    <div className={s.mediumPieceRight}>
                                      <div className={s.mediumPieceLevels}>
                                        <span className={s.levelBadge}>{prodLabel(c.content_type)}</span>
                                        {c.done && <span className={[s.levelBadge, s.levelDone].join(' ')}>✓ Done</span>}
                                        {isCurrent && <span className={[s.levelBadge, s.levelReady].join(' ')}>▶ Up next</span>}
                                      </div>
                                      {!isActivated && (
                                        <div className={s.modEditRow}>
                                          <button className={s.modEditBtn} title="Change type" onClick={() => openMod({ kind: 'mediumChunkType', chunkId: c.id })}>✎</button>
                                          {c.type_modified && (
                                            <button className={s.modResetBtn} title="Reset type" onClick={() => store.resetMediumChunkType(wid, c.id)}>↺</button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                          {campaign.medium.completed && <div className={s.modeComplete}>✓ Medium complete</div>}
                        </div>
                      )}

                      {/* ── Heavy panel ── */}
                      {campaign.heavy && (
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
                            {(() => {
                              const total = campaign.heavy.parts.length
                              const done  = campaign.heavy.parts.filter(p => p.done).length
                              const pct   = total > 0 ? (done / total) * 100 : 0
                              return (
                                <div className={s.heavyProgress}>
                                  <span className={s.heavyProgressLabel}>Progress</span>
                                  <span className={s.heavyProgressTrack}>
                                    <span className={s.heavyProgressFill} style={{ width: `${Math.min(100, pct)}%` }} />
                                  </span>
                                  <span>{done}/{total}</span>
                                </div>
                              )
                            })()}
                          </div>
                          <div className={s.mediumList}>
                            {(() => {
                              const parts = campaign.heavy!.parts
                              const firstUndone = parts.findIndex(p => !p.done)
                              return parts.map((p, i) => {
                                const isLocked  = !p.done && firstUndone !== -1 && i !== firstUndone
                                const isCurrent = !p.done && i === firstUndone
                                return (
                                  <div key={p.id} className={[s.mediumPiece, isLocked ? s.mediumPieceLocked : ''].filter(Boolean).join(' ')}>
                                    <div className={s.mediumPieceLeft}>
                                      <span className={s.mediumPieceNum}>{isLocked ? '🔒' : i + 1}</span>
                                      {isActivated ? (
                                        <span className={s.mediumPieceName}>{p.name}</span>
                                      ) : (
                                        <input
                                          className={s.pieceNameInput}
                                          value={p.name}
                                          onChange={e => store.renameHeavyPart(wid, p.id, e.target.value)}
                                        />
                                      )}
                                    </div>
                                    <div className={s.mediumPieceRight}>
                                      {p.done && <span className={[s.levelBadge, s.levelDone].join(' ')}>✓ Done</span>}
                                      {isCurrent && <span className={[s.levelBadge, s.levelReady].join(' ')}>▶ Up next</span>}
                                    </div>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                          {campaign.heavy.completed && <div className={s.modeComplete}>✓ Heavy complete</div>}
                        </div>
                      )}

                      {/* ── Research panel ── */}
                      {campaign.research && (() => {
                        const { done_steps, cycle_steps } = campaign.research
                        const cyclesDone = Math.floor(done_steps / cycle_steps)
                        const cycleProgress = done_steps % cycle_steps
                        return (
                          <div className={s.modePanel}>
                            <div className={s.heavyCard}>
                              <div className={s.heavyProductType}>Research — no limit, work forever</div>
                              <div className={s.heavyProgress}>
                                <span className={s.heavyProgressLabel}>Next ✦ in</span>
                                <span className={s.heavyProgressTrack}>
                                  <span
                                    className={s.heavyProgressFill}
                                    style={{ width: `${Math.min(100, (cycleProgress / cycle_steps) * 100)}%` }}
                                  />
                                </span>
                                <span>{cycleProgress}/{cycle_steps}</span>
                              </div>
                            </div>
                            <div className={s.modeComplete}>✦ {cyclesDone} superhit cycle{cyclesDone !== 1 ? 's' : ''} earned so far</div>
                          </div>
                        )
                      })()}

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
