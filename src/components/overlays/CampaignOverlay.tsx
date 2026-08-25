import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LEVEL_MULT, weaponUpgradeCost, calcWeaponScaledDamage, calcWeaponSellPrice } from '../../data/weapons'
import { STAGE_TIME, calcWorkflowTileCounts } from '../../data/generators/workflowGenerator'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import type { WeaponCampaign, WeaponInstance, StatKey, ContentProductType, MicroProduct, MediumPiece } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

// ── Edge label display names and tooltips ───────────────────────────────────

const LABEL_DISPLAY: Record<string, string> = {
  // ContentTransformation — relation types
  Succinct:      'Succinct',
  Verbose:       'Verbose',
  ZoomIn:        'Zoom In',
  ZoomOut:       'Zoom Out',
  Similar:       'Similar',
  Opposite:      'Opposite',
  // ContentTransformation — style types
  Shock:         'Shock',
  Narration:     'Narration',
  Segmentation:  'Segmentation',
  Passion:       'Passion',
  Estetic:       'Esthetic',
  Cliffhanger:   'Cliffhanger',
  Viral:         'Viral',
  Controversy:   'Controversy',
  Comfort:       'Comfort',
  Drama:         'Drama',
  Humor:         'Humor',
  Parasocial:    'Parasocial',
  Wow:           'Wow',
  Hope:          'Hope',
  Fear:          'Fear',
  Desire:        'Desire',
}


// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t = useT()

  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(
    store.weapon_instances[0]?.instance_id ?? null
  )
  const [activeTab, setActiveTab] = useState<'micro' | 'medium' | 'heavy'>('medium')
  // Weapon actions
  const [confirmSellId,    setConfirmSellId]    = useState<string | null>(null)
  const [confirmUpgradeId, setConfirmUpgradeId] = useState<string | null>(null)
  const [hoveredUpgrade,   setHoveredUpgrade]   = useState(false)

  // Auto-generate campaign when selecting a weapon that has none
  useEffect(() => {
    if (selectedWeaponId && !store.weapon_campaigns[selectedWeaponId]) {
      const w = store.weapon_instances.find(wi => wi.instance_id === selectedWeaponId)
      const defaultName = w ? `Kampania #1 · ${localizeWeaponName(w, t)}` : undefined
      store.assignCampaignToWeapon(selectedWeaponId, defaultName)
    }
  }, [selectedWeaponId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset transient UI when switching weapons
  useEffect(() => {
    setConfirmSellId(null)
    setConfirmUpgradeId(null)
    setActiveTab('medium')
  }, [selectedWeaponId])

  const selectedWeapon = selectedWeaponId
    ? store.weapon_instances.find(w => w.instance_id === selectedWeaponId)
    : undefined
  const campaign: WeaponCampaign | undefined = selectedWeaponId
    ? store.weapon_campaigns[selectedWeaponId]
    : undefined

  // Weapon action helpers
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
    if (isConfirmUpgrade) {
      store.upgradeWeapon(wid)
      setConfirmUpgradeId(null)
    } else {
      setConfirmUpgradeId(wid)
    }
  }

  function handleSell() {
    if (!selectedWeapon) return
    if (isConfirmSell) {
      const remaining = store.weapon_instances.filter(w => w.instance_id !== wid)
      store.sellWeapon(wid)
      setConfirmSellId(null)
      setSelectedWeaponId(remaining[0]?.instance_id ?? null)
    } else {
      setConfirmSellId(wid)
    }
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
                        const { research, produce } = calcWorkflowTileCounts(selectedWeapon.weapon_class, selectedWeapon.rarity)
                        const lightSecs = Math.round(STAGE_TIME.Research.light * classDef.time_mod)
                        const lightMin  = Math.floor(lightSecs / 60)
                        const lightSec  = lightSecs % 60
                        const lightFmt  = lightMin > 0
                          ? (lightSec > 0 ? `${lightMin}m ${lightSec}s` : `${lightMin}m`)
                          : `${lightSec}s`
                        const c    = store.weapon_campaigns[selectedWeapon.instance_id]
                        const nCnt = c ? c.nodes.length : 0
                        return (
                          <>
                            <span className={s.statChip}>+{((LEVEL_MULT[selectedWeapon.rarity] ?? 0.03) * 100).toFixed(0)}% / lv</span>
                            <span className={s.statChip}>×{classDef.base_damage_mult} base</span>
                            {nCnt > 0 ? (
                              <>
                                <span className={s.statChipResearch} data-tooltip={`Total research tiles across all ${nCnt} nodes (${research} default per node)`}>R total: {research * nCnt}</span>
                                <span className={s.statChipProduce}  data-tooltip={`Total produce tiles across all ${nCnt} nodes (${produce} default per node)`}>P total: {produce * nCnt}</span>
                              </>
                            ) : (
                              <>
                                <span className={s.statChipResearch} data-tooltip="Research tiles per content node">R×{research}</span>
                                <span className={s.statChipProduce}  data-tooltip="Produce tiles per content node">P×{produce}</span>
                              </>
                            )}
                            <span className={s.statChip}>{lightFmt} / tile</span>
                          </>
                        )
                      })()}
                    </div>
                    <div className={s.weaponInfoActions}>
                      {/* Upgrade */}
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
                      {/* Sell */}
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
                ) : campaign.micro ? (
                  <div className={s.modeTabs}>
                    <div className={s.tabBar}>
                      <button className={[s.modeTab, activeTab==='micro'?s.modeTabActive:''].join(' ')} onClick={()=>setActiveTab('micro')}>Micro</button>
                      <button className={[s.modeTab, activeTab==='medium'?s.modeTabActive:''].join(' ')} onClick={()=>setActiveTab('medium')}>Medium</button>
                      <button className={[s.modeTab, activeTab==='heavy'?s.modeTabActive:''].join(' ')} onClick={()=>setActiveTab('heavy')}>Heavy</button>
                    </div>
                    {activeTab === 'micro' && (
                      <div className={s.modePanel}>
                        <div className={s.microGrid}>
                          {campaign.micro.products.map((p: MicroProduct, i: number) => (
                            <div key={p.id} className={[s.microCard, i===campaign.micro!.current_index?s.microCardCurrent:'', p.done_count>0?s.microCardDone:''].filter(Boolean).join(' ')}>
                              <div className={s.microCardType}>{(t.content.product as Record<string,{badge_label:string}>)[p.content_type]?.badge_label ?? p.content_type}</div>
                              {p.style && <div className={s.microCardStyle}>{LABEL_DISPLAY[p.style] ?? p.style}</div>}
                              <div className={s.microCardCount}>×{p.done_count}</div>
                              {i === campaign.micro!.current_index && <div className={s.microCardNext}>→ Next</div>}
                            </div>
                          ))}
                        </div>
                        {campaign.micro.completed && <div className={s.modeComplete}>✓ Circle complete</div>}
                      </div>
                    )}
                    {activeTab === 'medium' && campaign.medium && (
                      <div className={s.modePanel}>
                        <div className={s.mediumList}>
                          {campaign.medium.pieces.map((p: MediumPiece, i: number) => {
                            const prevPiece = i > 0 ? campaign.medium!.pieces[i-1] : null
                            const l1Unlocked = i === 0 || (prevPiece?.level1_done ?? false)
                            const l2Unlocked = p.level1_done
                            return (
                              <div key={p.id} className={[s.mediumPiece, !l1Unlocked?s.mediumPieceLocked:''].filter(Boolean).join(' ')}>
                                <div className={s.mediumPieceHeader}>
                                  <span className={s.mediumPieceNum}>{i+1}</span>
                                  <span className={s.mediumPieceName}>{p.name}</span>
                                  {p.link_type && i < campaign.medium!.pieces.length - 1 && (
                                    <span className={s.linkChip}>{p.link_type}</span>
                                  )}
                                </div>
                                <div className={s.mediumPieceLevels}>
                                  <span className={[s.levelBadge, p.level1_done?s.levelDone:'', !l1Unlocked?s.levelLocked:''].filter(Boolean).join(' ')}>
                                    L1: {(t.content.product as Record<string,{badge_label:string}>)[p.level1_type]?.badge_label ?? p.level1_type}
                                    {p.level1_done ? ' ✓' : ''}
                                  </span>
                                  <span className={[s.levelBadge, p.level2_done?s.levelDone:'', !l2Unlocked?s.levelLocked:''].filter(Boolean).join(' ')}>
                                    L2: {(t.content.product as Record<string,{badge_label:string}>)[p.level2_type]?.badge_label ?? p.level2_type}
                                    {p.level2_done ? ' ✓' : !l2Unlocked ? ' 🔒' : ''}
                                  </span>
                                </div>
                                {p.constraint && (
                                  <div className={s.constraintChip}>{p.constraint.category}: {String(p.constraint.value).replace(/_/g, ' ')}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {campaign.medium.completed && <div className={s.modeComplete}>✓ Medium complete</div>}
                      </div>
                    )}
                    {activeTab === 'heavy' && campaign.heavy && (
                      <div className={s.modePanel}>
                        <div className={s.heavyCard}>
                          <div className={s.heavyProductType}>
                            {(t.content.product as Record<string,{badge_label:string}>)[campaign.heavy.product_type]?.badge_label ?? campaign.heavy.product_type}
                          </div>
                          <div className={s.heavyProgress}>
                            <span className={s.heavyProgressLabel}>Research</span>
                            <span className={s.heavyProgressTrack}>
                              <span className={s.heavyProgressFill} style={{width:`${Math.min(100,campaign.heavy.research_count>0?(campaign.heavy.research_done/campaign.heavy.research_count)*100:0)}%`}} />
                            </span>
                            <span>{campaign.heavy.research_done}/{campaign.heavy.research_count}</span>
                          </div>
                          <div className={s.heavyProgress}>
                            <span className={s.heavyProgressLabel}>Produce</span>
                            <span className={s.heavyProgressTrack}>
                              <span className={s.heavyProgressFill} style={{width:`${Math.min(100,campaign.heavy.produce_count>0?(campaign.heavy.produce_done/campaign.heavy.produce_count)*100:0)}%`}} />
                            </span>
                            <span>{campaign.heavy.produce_done}/{campaign.heavy.produce_count}</span>
                          </div>
                        </div>
                        {campaign.heavy.completed && <div className={s.modeComplete}>✓ Heavy complete</div>}
                      </div>
                    )}
                  </div>
                ) : null}
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
