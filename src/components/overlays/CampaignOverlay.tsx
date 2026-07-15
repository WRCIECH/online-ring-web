import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isNodeAvailable } from '../../data/generators/campaignGenerator'
import { calcCampaignOverloadMult, isCampaignFullyDefined } from '../../engine/combat'
import { LEVEL_MULT, weaponUpgradeCost, calcWeaponScaledDamage } from '../../data/weapons'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import { WEAPON_SELL_PRICE } from '../../data/constants'
import type { CampaignNode, CampaignEdge, WeaponCampaign, WeaponInstance } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

// ── Edge label display names and tooltips ───────────────────────────────────

const LABEL_DISPLAY: Record<string, string> = {
  // ContentTransformation — relation types
  New:           'New',
  Compression:   'Compression',
  Expansion:     'Expansion',
  ZoomIn:        'Zoom In',
  ZoomOut:       'Zoom Out',
  Similar:       'Similar',
  Opposite:      'Opposite',
  // ContentTransformation — style types
  Minimalism:    'Minimalism',
  Shock:         'Shock',
  Narration:     'Narration',
  Segmentation:  'Segmentation',
  Fast:          'Fast',
  Passion:       'Passion',
  Intellectual:  'Intellectual',
  ProblemSolving: 'Problem Solving',
  Estetic:       'Esthetic',
  Interactive:   'Interactive',
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

const LABEL_TOOLTIP: Record<string, string> = {
  // ContentTransformation — relation types
  New:           'New — fresh angle on the topic, not derived from previous content.',
  Compression:   'Compression — distils and summarises the parent into a denser form.',
  Expansion:     'Expansion — takes one idea from the parent and develops it in depth.',
  ZoomIn:        'Zoom In — narrows focus to a specific detail or sub-topic of the parent.',
  ZoomOut:       'Zoom Out — widens scope to place the parent in a broader context.',
  Similar:       'Similar — parallel piece on a related topic using the same structure.',
  Opposite:      'Opposite — argues the counter-position or explores the antithesis of the parent.',
  // ContentTransformation — style types
  Minimalism:    'Minimalism — stripped-down style with only what is essential.',
  Shock:         'Shock — provocative, attention-grabbing framing designed to surprise.',
  Narration:     'Narration — story-driven, narrative format.',
  Segmentation:  'Segmentation — broken into distinct parts, lists, or sections.',
  Fast:          'Fast — quick, punchy delivery for short attention spans.',
  Passion:       'Passion — emotionally driven, enthusiastic tone.',
  Intellectual:  'Intellectual — analytical, data-driven, in-depth reasoning.',
  ProblemSolving: 'Problem Solving — structured around identifying and resolving a specific problem.',
  Estetic:       'Esthetic — prioritises visual or sensory appeal and craft.',
  Interactive:   'Interactive — invites audience participation or response.',
  Cliffhanger:   'Cliffhanger — ends with unresolved tension to keep the audience coming back.',
  Viral:         'Viral — content engineered to spread rapidly; brainrot, memes, trend-chasing.',
  Controversy:   'Controversy — polarising takes, hot-button topics, provocation that splits audiences.',
  Comfort:       'Comfort — soothing, reassuring content; relaxation and wholesome familiarity.',
  Drama:         'Drama — conflict, call-outs, cancel culture, interpersonal tension.',
  Humor:         'Humor — comedy, satire, roasts, and irony.',
  Parasocial:    'Parasocial — intimacy and bond-building with the audience.',
  Wow:           'Wow — jaw-dropping facts, stunning visuals, education-as-spectacle.',
  Hope:          'Hope — inspirational, wholesome, motivational framing.',
  Fear:          'Fear — anxiety, doomscrolling, worst-case scenarios.',
  Desire:        'Desire — FOMO, urgency, scarcity, aspiration.',
}

const FOLLOWS_TOOLTIP = 'Follows — this piece continues naturally from its parent in sequence or as a direct consequence. No specific transformation was applied.'

// ── SVG tree layout constants ────────────────────────────────────────────────

const NODE_W = 200
const NODE_H = 52
const H_GAP  = 32
const V_GAP  = 84
const PAD    = 12

// ── Layout helpers ───────────────────────────────────────────────────────────

function buildChildrenMap(edges: CampaignEdge[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const e of edges) {
    if (!map[e.from_id]) map[e.from_id] = []
    map[e.from_id].push(e.to_id)
  }
  return map
}

function getRoots(nodes: CampaignNode[], edges: CampaignEdge[]): CampaignNode[] {
  const childIds = new Set(edges.map(e => e.to_id))
  return nodes.filter(n => !childIds.has(n.id))
}

function subtreeWidth(nodeId: string, childrenMap: Record<string, string[]>): number {
  const children = childrenMap[nodeId] ?? []
  if (!children.length) return NODE_W
  const total = children.reduce((sum, c) => sum + subtreeWidth(c, childrenMap), 0)
  return Math.max(NODE_W, total + H_GAP * (children.length - 1))
}

function computePositions(
  rootIds: string[],
  childrenMap: Record<string, string[]>,
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>()

  function place(nodeId: string, cx: number, depth: number) {
    pos.set(nodeId, { x: cx - NODE_W / 2, y: depth * (NODE_H + V_GAP) })
    const children = childrenMap[nodeId] ?? []
    if (!children.length) return
    const total =
      children.reduce((sum, c) => sum + subtreeWidth(c, childrenMap), 0) +
      H_GAP * (children.length - 1)
    let left = cx - total / 2
    for (const cid of children) {
      const sw = subtreeWidth(cid, childrenMap)
      place(cid, left + sw / 2, depth + 1)
      left += sw + H_GAP
    }
  }

  let left = 0
  for (const rid of rootIds) {
    const sw = subtreeWidth(rid, childrenMap)
    place(rid, left + sw / 2, 0)
    left += sw + H_GAP
  }
  return pos
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t = useT()

  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(
    store.weapon_instances[0]?.instance_id ?? null
  )
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingNodeVal, setEditingNodeVal] = useState('')
  const [edgeTooltip, setEdgeTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  // Campaign name combobox
  const [nameOpen, setNameOpen] = useState(false)
  const [nameVal, setNameVal] = useState('')
  // Activate confirmation
  const [showActivateConfirm, setShowActivateConfirm] = useState(false)
  const [confirmFinalize, setConfirmFinalize] = useState(false)
  // Weapon actions
  const [confirmSellId,    setConfirmSellId]    = useState<string | null>(null)
  const [confirmUpgradeId, setConfirmUpgradeId] = useState<string | null>(null)
  const [hoveredUpgrade,   setHoveredUpgrade]   = useState(false)

  const nodeInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const treePaneRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (editingNodeId) nodeInputRef.current?.focus() }, [editingNodeId])
  useEffect(() => { if (nameOpen) nameInputRef.current?.focus() }, [nameOpen])

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
    setShowActivateConfirm(false)
    setConfirmFinalize(false)
    setNameOpen(false)
    setEditingNodeId(null)
    setConfirmSellId(null)
    setConfirmUpgradeId(null)
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
  const dmgCurrent = selectedWeapon ? calcWeaponScaledDamage(100, selectedWeapon, level, store.stats) : 0
  const dmgNext = (selectedWeapon && !isMax) ? calcWeaponScaledDamage(100, selectedWeapon, level + 1, store.stats) : null
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
      store.sellWeapon(wid)
      setConfirmSellId(null)
      setSelectedWeaponId(null)
    } else {
      setConfirmSellId(wid)
    }
  }

  function handleNodeNameSave(weaponId: string, nodeId: string) {
    const name = editingNodeVal.trim()
    if (name) store.renameCampaignNode(weaponId, nodeId, name)
    setEditingNodeId(null)
    setEditingNodeVal('')
  }

  function saveNameAndClose(weaponId: string, forceName?: string) {
    const name = (forceName ?? nameVal).trim()
    if (name) store.renameCampaign(weaponId, name)
    setNameOpen(false)
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

          {/* Right: campaign tree */}
          <div ref={treePaneRef} className={s.treePane}>
            {edgeTooltip && (
              <div className={s.edgeTooltip} style={{ left: edgeTooltip.x + 14, top: edgeTooltip.y - 8 }}>
                {edgeTooltip.text}
              </div>
            )}

            {!selectedWeapon ? (
              <div className={s.empty}>Select a weapon.</div>
            ) : (
              <>
                {/* ── Weapon info strip ── */}
                <div className={s.weaponInfoStrip}>
                  <div className={s.weaponInfoTop}>
                    <div className={s.weaponInfoLeft}>
                      <span className={s.weaponLevel}>+{level}</span>
                      {(() => {
                        const primaryFormat = selectedWeapon.rolled_draws?.format[0]?.[0]
                        if (!primaryFormat) return null
                        const label = t.content.product[primaryFormat]?.badge_label ?? primaryFormat
                        return <span className={s.mediumChip}>{label}</span>
                      })()}
                      <span className={s.statChip}>×{(dmgCurrent / 100).toFixed(2)} dmg</span>
                      {classDef && <>
                        <span className={s.statChip}>+{((LEVEL_MULT[selectedWeapon.rarity] ?? 0.03) * 100).toFixed(0)}% / lv</span>
                        <span className={s.statChip}>×{classDef.base_damage_mult} base</span>
                      </>}
                      {Object.entries(selectedWeapon.scaling).map(([stat, grade]) => (
                        <span key={stat} className={s.scalingChip}>{stat} {grade}</span>
                      ))}
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
                            : `${t.ui.btn_sell_weapon} (${WEAPON_SELL_PRICE} ✦)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!campaign ? (
                  <div className={s.empty}>Generating…</div>
                ) : (() => {
                  const { nodes, edges } = campaign
                  const childrenMap = buildChildrenMap(edges)
                  const roots = getRoots(nodes, edges)
                  const publishedCount  = nodes.filter(n => n.published).length
                  const namedCount     = nodes.filter(n => n.name.trim()).length
                  const targetPublished = Math.ceil(nodes.length * 0.6)
                  const needMore       = Math.max(0, targetPublished - publishedCount)
                  const weaponId = selectedWeapon.instance_id

                  const activeCampaignCount = store.owned_weapons.filter(w => {
                    const c = store.weapon_campaigns[w]
                    return c && c.activated === true && !c.completed
                  }).length
                  const overloadMult = calcCampaignOverloadMult(activeCampaignCount, store.stats.END)

                  const campaignOrdinal = campaign.ordinal ?? 1
                  const defaultCampaignName = `Kampania #${campaignOrdinal} · ${localizeWeaponName(selectedWeapon, t)}`
                  const nextCampaignName = `Kampania #${campaignOrdinal + 1} · ${localizeWeaponName(selectedWeapon, t)}`

                  const isFullyDefined = isCampaignFullyDefined(campaign)
                  const isActivated = campaign.activated === true

                  // For activation confirm preview
                  const futureCount = activeCampaignCount + 1
                  const futureOverloadMult = calcCampaignOverloadMult(futureCount, store.stats.END)
                  const futurePenaltyPct = Math.round((1 - futureOverloadMult) * 100)

                  // Library suggestions for combobox
                  const libSuggestions = store.campaign_library.filter(lc =>
                    lc.campaign_name && (!nameVal || lc.campaign_name.toLowerCase().includes(nameVal.toLowerCase()))
                  )

                  // Compute SVG layout
                  const positions = computePositions(roots.map(r => r.id), childrenMap)
                  let maxX = 0, maxY = 0
                  for (const [, p] of positions) {
                    maxX = Math.max(maxX, p.x + NODE_W)
                    maxY = Math.max(maxY, p.y + NODE_H)
                  }
                  const svgW = maxX + PAD
                  const svgH = maxY + PAD

                  return (
                    <>
                      {/* Campaign name (combobox) */}
                      <div className={s.campaignNameRow}>
                        {nameOpen ? (
                          <div className={s.comboboxWrap}>
                            <input
                              ref={nameInputRef}
                              className={s.comboboxInput}
                              value={nameVal}
                              placeholder={defaultCampaignName}
                              onChange={e => setNameVal(e.target.value)}
                              onBlur={() => saveNameAndClose(weaponId)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveNameAndClose(weaponId)
                                if (e.key === 'Escape') setNameOpen(false)
                              }}
                            />
                            {libSuggestions.length > 0 && (
                              <div className={s.comboboxDropdown}>
                                {libSuggestions.map(lc => (
                                  <button
                                    key={lc.id}
                                    className={s.comboboxOption}
                                    onMouseDown={e => {
                                      e.preventDefault()
                                      saveNameAndClose(weaponId, lc.campaign_name)
                                    }}
                                  >
                                    <span className={s.comboboxOptionName}>{lc.campaign_name}</span>
                                    <span className={s.comboboxOptionMeta}>{lc.nodes.length} nodes</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className={campaign.campaign_name ? s.campaignNameSet : s.campaignNameEmpty}
                            onClick={() => { setNameVal(campaign.campaign_name ?? ''); setNameOpen(true) }}
                          >
                            {campaign.campaign_name || defaultCampaignName}
                          </span>
                        )}
                      </div>

                      {/* Progress + activation */}
                      <div className={s.campaignProgress}>
                        <span className={s.progressLabel}>
                          {publishedCount}/{nodes.length} {(t.ui as Record<string, string>).node_published ?? 'published'}
                          {!campaign.completed && needMore > 0 && ` · ${needMore} ${(t.ui as Record<string, string>).campaign_more_to_finish ?? 'more to finish'}`}
                        </span>
                        {namedCount < nodes.length && (
                          <span className={s.namingProgress}>
                            <span className={s.namingLabel}>{(t.ui as Record<string, string>).campaign_named_of ?? 'named'}</span>
                            <span className={s.namingBar}>
                              <span className={s.namingBarFill} style={{ width: `${(namedCount / nodes.length) * 100}%` }} />
                            </span>
                            <span className={s.namingCount}>{namedCount}/{nodes.length}</span>
                          </span>
                        )}
                        {campaign.completed && (
                          <span className={s.campaignDoneBadge}>
                            {(t.ui as Record<string, string>).campaign_done ?? 'Campaign Complete'}
                            {(campaign.done_count ?? 0) > 0 && (
                              <span className={s.doneCount}>
                                {' '}×{campaign.done_count} · +{(campaign.done_count ?? 0) * 5}% {(t.ui as Record<string, string>).campaign_done_bonus ?? 'dmg bonus'}
                              </span>
                            )}
                          </span>
                        )}
                        {campaign.completed && isActivated && (
                          confirmFinalize ? (
                            <div className={s.finalizeConfirm}>
                              <button
                                className={s.btnFinalizeConfirm}
                                onClick={() => {
                                  store.finalizeCampaign(weaponId, nextCampaignName)
                                  setConfirmFinalize(false)
                                }}
                              >
                                {(t.ui as Record<string, string>).btn_finalize_confirm ?? 'Confirm?'}
                              </button>
                              <button className={s.btnActivateCancel} onClick={() => setConfirmFinalize(false)}>
                                {t.ui.btn_cancel ?? 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <button
                              className={s.btnFinalize}
                              onClick={() => setConfirmFinalize(true)}
                            >
                              {(t.ui as Record<string, string>).btn_finalize_campaign ?? 'Mark as Done'}
                            </button>
                          )
                        )}

                        {/* Activation section */}
                        {!campaign.completed && !isActivated && (
                          showActivateConfirm ? (
                            <div className={s.activateConfirm}>
                              <span className={s.activateConfirmText}>
                                Will count as #{futureCount} active campaign.
                                {futurePenaltyPct > 0
                                  ? ` Penalty: −${futurePenaltyPct}% dmg (END ${store.stats.END}).`
                                  : ` No penalty at END ${store.stats.END}.`}
                              </span>
                              <div className={s.activateActions}>
                                <button
                                  className={s.btnActivateConfirm}
                                  onClick={() => { store.activateCampaign(weaponId); setShowActivateConfirm(false) }}
                                >
                                  Activate
                                </button>
                                <button
                                  className={s.btnActivateCancel}
                                  onClick={() => setShowActivateConfirm(false)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className={[s.btnActivate, !isFullyDefined ? s.btnActivateDisabled : ''].filter(Boolean).join(' ')}
                              disabled={!isFullyDefined}
                              title={!isFullyDefined ? 'Name the campaign and all nodes first' : undefined}
                              onClick={() => setShowActivateConfirm(true)}
                            >
                              Activate Campaign
                            </button>
                          )
                        )}
                        {isActivated && !campaign.completed && overloadMult < 1.0 && (
                          <span className={s.overloadWarning}>
                            ⚠ {activeCampaignCount} active · END {store.stats.END} → −{Math.round((1 - overloadMult) * 100)}% dmg
                          </span>
                        )}
                        {isActivated && !campaign.completed && overloadMult >= 1.0 && activeCampaignCount > 1 && (
                          <span className={s.overloadOk}>
                            {activeCampaignCount} active · no penalty
                          </span>
                        )}
                      </div>

                      <svg
                        width={svgW}
                        height={svgH}
                        style={{ display: 'block', overflow: 'visible', minWidth: svgW }}
                      >
                        {/* Edges first (behind nodes) */}
                        {edges.map(edge => {
                          const fp = positions.get(edge.from_id)
                          const tp = positions.get(edge.to_id)
                          if (!fp || !tp) return null
                          const x1 = fp.x + NODE_W / 2
                          const y1 = fp.y + NODE_H
                          const x2 = tp.x + NODE_W / 2
                          const y2 = tp.y
                          const my = (y1 + y2) / 2
                          const lx = (x1 + x2) / 2
                          const ly = (y1 + y2) / 2
                          const d = `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`
                          const displayText = edge.label == null ? 'Follows' : (LABEL_DISPLAY[edge.label] ?? edge.label)
                          const tooltip     = edge.label == null ? FOLLOWS_TOOLTIP : (LABEL_TOOLTIP[edge.label] ?? edge.label)
                          const labelW = displayText.length * 6.2 + 14
                          return (
                            <g key={`${edge.from_id}-${edge.to_id}`}>
                              <path d={d} fill="none" stroke="rgba(100,80,200,0.28)" strokeWidth={1.5} />
                              <g
                                style={{ cursor: 'default' }}
                                onMouseEnter={e => {
                                  const pane = treePaneRef.current
                                  if (!pane) return
                                  const r = pane.getBoundingClientRect()
                                  setEdgeTooltip({ text: tooltip, x: e.clientX - r.left, y: e.clientY - r.top })
                                }}
                                onMouseMove={e => {
                                  const pane = treePaneRef.current
                                  if (!pane) return
                                  const r = pane.getBoundingClientRect()
                                  setEdgeTooltip(prev => prev ? { ...prev, x: e.clientX - r.left, y: e.clientY - r.top } : prev)
                                }}
                                onMouseLeave={() => setEdgeTooltip(null)}
                              >
                                <rect
                                  x={lx - labelW / 2} y={ly - 10}
                                  width={labelW} height={20} rx={4}
                                  fill="rgba(100,80,200,0.11)"
                                  stroke="rgba(100,80,200,0.24)"
                                  strokeWidth={1}
                                />
                                <text
                                  x={lx} y={ly + 4}
                                  textAnchor="middle"
                                  fontSize={10}
                                  fontFamily="system-ui,sans-serif"
                                  fill="rgba(180,160,255,0.88)"
                                >
                                  {displayText}
                                </text>
                              </g>
                            </g>
                          )
                        })}

                        {/* Nodes as foreignObject */}
                        {nodes.map(node => {
                          const pos = positions.get(node.id)
                          if (!pos) return null
                          const available = isNodeAvailable(nodes, edges, node)
                          const inactive = !available && !node.completed
                          const finished = node.completed && !node.published
                          const isEditingThis = editingNodeId === node.id
                          const canEdit = !node.completed

                          return (
                            <foreignObject key={node.id} x={pos.x} y={pos.y} width={NODE_W} height={NODE_H} style={{ overflow: 'visible' }} pointerEvents="all">
                              <div
                                className={[
                                  s.svgNodeCard,
                                  inactive       ? s.nodeLocked   : '',
                                  node.published ? s.nodePublished : '',
                                  finished       ? s.nodeFinished  : '',
                                ].filter(Boolean).join(' ')}
                              >
                                <span className={s.nodeIcon}>
                                  {node.published ? '★' : node.completed ? '✓' : inactive ? '○' : '◎'}
                                </span>

                                {isEditingThis ? (
                                  <input
                                    ref={nodeInputRef}
                                    className={s.nodeInput}
                                    value={editingNodeVal}
                                    onChange={e => setEditingNodeVal(e.target.value)}
                                    onBlur={() => handleNodeNameSave(weaponId, node.id)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleNodeNameSave(weaponId, node.id)
                                      if (e.key === 'Escape') { setEditingNodeId(null); setEditingNodeVal('') }
                                    }}
                                  />
                                ) : (
                                  <span
                                    className={[s.nodeName, canEdit ? s.nodeNameEditable : ''].join(' ')}
                                    onClick={() => {
                                      if (canEdit) {
                                        setEditingNodeId(node.id)
                                        setEditingNodeVal(node.name)
                                      }
                                    }}
                                    title={canEdit ? t.ui.click_to_rename : undefined}
                                  >
                                    {node.name
                                      ? node.name
                                      : canEdit
                                        ? <em className={s.nodeUnnamed}>{(t.ui as Record<string,string>).click_to_name ?? 'Click to name…'}</em>
                                        : <em className={s.nodeUnnamed}>{t.ui.untitled}</em>
                                    }
                                  </span>
                                )}

                                {finished && (
                                  <button
                                    className={s.btnPublish}
                                    onClick={() => store.publishCampaignNode(weaponId, node.id)}
                                    title={(t.ui as Record<string, string>).btn_publish_node ?? 'Publish'}
                                  >
                                    {(t.ui as Record<string, string>).btn_publish_node ?? 'Publish'}
                                  </button>
                                )}

                                {node.published && (
                                  <>
                                    <span className={s.publishedBadge}>
                                      {(t.ui as Record<string, string>).node_published ?? 'Published'}
                                    </span>
                                    {(node.promote_count ?? 0) > 0 && (
                                      <span className={s.promoteCount}>×{node.promote_count}</span>
                                    )}
                                    {(node.promote_count ?? 0) < 3 && (
                                      <button
                                        className={s.btnPromote}
                                        onClick={() => store.promoteNode(weaponId, node.id)}
                                        title="Promote"
                                      >
                                        ↑
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </foreignObject>
                          )
                        })}
                      </svg>

                      {campaign.completed && (
                        <div className={s.completedHint}>
                          Campaign complete — assign a new campaign to this weapon to continue growing this content tree.
                        </div>
                      )}
                    </>
                  )
                })()}
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
