import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isNodeAvailable } from '../../data/generators/campaignGenerator'
import type { CampaignNode, CampaignEdge, WeaponCampaign, WeaponInstance } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

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

function getEdgeTo(edges: CampaignEdge[], nodeId: string): CampaignEdge | undefined {
  return edges.find(e => e.to_id === nodeId)
}

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

  function renderNodeLabel(label: CampaignEdge['label'], t: ReturnType<typeof useT>) {
    if (!label) return <span className={s.edgeNull}>{(t.ui as Record<string, string>).edge_label_chronological ?? '→'}</span>
    return <span className={s.edgeBadge}>{label}</span>
  }

  function renderTree(
    nodeIds: string[],
    nodesMap: Record<string, CampaignNode>,
    childrenMap: Record<string, string[]>,
    edges: CampaignEdge[],
    allNodes: CampaignNode[],
    weaponId: string,
    depth: number,
  ): React.ReactNode {
    return nodeIds.map(nodeId => {
      const node = nodesMap[nodeId]
      if (!node) return null
      const available = isNodeAvailable(allNodes, edges, node)
      const inactive = !available && !node.completed
      const finished = node.completed && !node.published
      const isEditingThis = editingNodeId === node.id
      const children = childrenMap[node.id] ?? []
      const incomingEdge = depth > 0 ? getEdgeTo(edges, node.id) : undefined

      return (
        <div key={node.id}>
          {incomingEdge !== undefined && (
            <div className={s.edgeRow} style={{ paddingLeft: `${16 + depth * 22}px` }}>
              {renderNodeLabel(incomingEdge.label, t)}
            </div>
          )}
          <div
            className={[
              s.nodeRow,
              inactive   ? s.nodeLocked   : '',
              node.published ? s.nodePublished : '',
              finished   ? s.nodeFinished  : '',
            ].filter(Boolean).join(' ')}
            style={{ paddingLeft: `${16 + depth * 22}px` }}
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
                className={[s.nodeName, !node.completed && !inactive ? s.nodeNameEditable : ''].join(' ')}
                onClick={() => {
                  if (!node.completed && !inactive) {
                    setEditingNodeId(node.id)
                    setEditingNodeVal(node.name)
                  }
                }}
                title={!node.completed && !inactive ? t.ui.click_to_rename : undefined}
              >
                {node.name || <em className={s.nodeUnnamed}>{t.ui.untitled}</em>}
              </span>
            )}

            <span className={[s.nodeProgress, node.completed ? s.nodeProgressDone : ''].filter(Boolean).join(' ')}>
              {node.subworkflow_count ?? 0}/{node.required_subworkflows ?? 2}
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
          {children.length > 0 && renderTree(children, nodesMap, childrenMap, edges, allNodes, weaponId, depth + 1)}
        </div>
      )
    })
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
              const nodesMap = Object.fromEntries(nodes.map(n => [n.id, n]))
              const childrenMap = buildChildrenMap(edges)
              const roots = getRoots(nodes, edges)
              const publishedCount = nodes.filter(n => n.published).length
              const pct = nodes.length > 0 ? Math.round(publishedCount / nodes.length * 100) : 0

              return (
                <>
                  <div className={s.campaignProgress}>
                    <span className={s.progressLabel}>
                      {publishedCount}/{nodes.length} {(t.ui as Record<string, string>).node_published ?? 'published'} ({pct}%)
                    </span>
                    {campaign.completed && (
                      <span className={s.campaignDoneBadge}>
                        {(t.ui as Record<string, string>).campaign_done ?? 'Campaign Complete'}
                      </span>
                    )}
                  </div>

                  <div className={s.nodeTree}>
                    {renderTree(
                      roots.map(r => r.id),
                      nodesMap,
                      childrenMap,
                      edges,
                      nodes,
                      selectedWeapon.instance_id,
                      0,
                    )}
                  </div>

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
