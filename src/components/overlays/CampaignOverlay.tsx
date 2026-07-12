import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isNodeAvailable } from '../../data/generators/campaignGenerator'
import type { CampaignNode, CampaignEdge, WeaponCampaign, WeaponInstance } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import { ContentRegistry } from '../../data/contentProducts'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

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
  const nodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingNodeId) nodeInputRef.current?.focus() }, [editingNodeId])

  const selectedWeapon = selectedWeaponId
    ? store.weapon_instances.find(w => w.instance_id === selectedWeaponId)
    : undefined
  const campaign: WeaponCampaign | undefined = selectedWeaponId
    ? store.weapon_campaigns[selectedWeaponId]
    : undefined

  function handleNodeNameSave(weaponId: string, nodeId: string) {
    const name = editingNodeVal.trim()
    if (name) store.renameCampaignNode(weaponId, nodeId, name)
    setEditingNodeId(null)
    setEditingNodeVal('')
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
                hasCampaign={!!store.weapon_campaigns[w.instance_id]}
                selected={w.instance_id === selectedWeaponId}
                onClick={() => setSelectedWeaponId(w.instance_id)}
              />
            ))}
            {weapons.length === 0 && (
              <div className={s.empty}>No weapons owned.</div>
            )}
          </div>

          {/* Right: campaign tree */}
          <div className={s.treePane}>
            {!selectedWeapon ? (
              <div className={s.empty}>Select a weapon.</div>
            ) : !campaign ? (
              <div className={s.generateWrap}>
                <div className={s.generateMsg}>
                  No campaign attached to this weapon yet.
                </div>
                <button
                  className={s.btnGenerate}
                  onClick={() => store.assignCampaignToWeapon(selectedWeapon.instance_id)}
                >
                  + {(t.ui as Record<string, string>).btn_generate_campaign ?? 'Generate Campaign'}
                </button>
              </div>
            ) : (() => {
              const { nodes, edges } = campaign
              const childrenMap = buildChildrenMap(edges)
              const roots = getRoots(nodes, edges)
              const publishedCount = nodes.filter(n => n.published).length
              const pct = nodes.length > 0 ? Math.round(publishedCount / nodes.length * 100) : 0
              const unnamedCount = nodes.filter(n => !n.completed && !n.name.trim()).length
              const weaponId = selectedWeapon.instance_id

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
                  <div className={s.campaignProgress}>
                    <span className={s.progressLabel}>
                      {publishedCount}/{nodes.length} {(t.ui as Record<string, string>).node_published ?? 'published'} ({pct}%)
                    </span>
                    {unnamedCount > 0 && (
                      <span className={s.unnamedWarning}>
                        {unnamedCount} unnamed — click to name
                      </span>
                    )}
                    {campaign.completed && (
                      <span className={s.campaignDoneBadge}>
                        {(t.ui as Record<string, string>).campaign_done ?? 'Campaign Complete'}
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
                      const labelText = edge.label ?? null
                      const labelW = labelText ? labelText.length * 6.2 + 14 : 0
                      return (
                        <g key={`${edge.from_id}-${edge.to_id}`}>
                          <path d={d} fill="none" stroke="rgba(100,80,200,0.28)" strokeWidth={1.5} />
                          {labelText && (
                            <>
                              <rect
                                x={lx - labelW / 2} y={ly - 10}
                                width={labelW} height={20} rx={4}
                                fill="rgba(100,80,200,0.11)" stroke="rgba(100,80,200,0.24)" strokeWidth={1}
                              />
                              <text
                                x={lx} y={ly + 4}
                                textAnchor="middle"
                                fontSize={10}
                                fontFamily="system-ui,sans-serif"
                                fill="rgba(180,160,255,0.88)"
                              >
                                {labelText}
                              </text>
                            </>
                          )}
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
                      const product = ContentRegistry.Products[node.content_type ?? '_blank']
                      const complexity = product?.complexity ?? 1

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

                            <span className={[s.nodeProgress, node.completed ? s.nodeProgressDone : ''].filter(Boolean).join(' ')}>
                              {node.subworkflow_count ?? 0}/{node.required_subworkflows ?? 2}
                            </span>

                            <span className={s.complexityBadge} title={product?.displayName ?? ''}>
                              {'●'.repeat(complexity) + '○'.repeat(5 - complexity)}
                            </span>

                            {finished && (
                              <button
                                className={s.btnPublish}
                                onClick={() => store.publishCampaignNode(weaponId, node.id)}
                                title={(t.ui as Record<string, string>).btn_publish_node ?? 'Publish'}
                              >
                                {(t.ui as Record<string, string>).btn_publish_node ?? 'Publish'}
                              </button>
                            )}

                            {node.is_remastering && !node.completed && (
                              <span className={s.remasterChip}>↻ remaster</span>
                            )}

                            {node.published && (
                              <span className={s.publishedBadge}>
                                {(t.ui as Record<string, string>).node_published ?? 'Published'}
                              </span>
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
