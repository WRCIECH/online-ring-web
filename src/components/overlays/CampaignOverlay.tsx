import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isNodeAvailable } from '../../data/generators/campaignGenerator'
import type { CampaignNode } from '../../types/game'
import { WEAPONS } from '../../data/weapons'
import type { WeaponInstance } from '../../types/game'
import ArmorSprite from '../icons/ArmorSprite'
import { useT } from '../../i18n'
import s from './CampaignOverlay.module.css'

interface Props {
  onClose: () => void
}

export default function CampaignOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t = useT()
  const campaign = store.active_campaign

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingNodeVal, setEditingNodeVal] = useState('')
  const [editingCampaignName, setEditingCampaignName] = useState(false)
  const [campaignNameVal, setCampaignNameVal] = useState(campaign?.name ?? '')
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [pastExpanded, setPastExpanded] = useState(false)

  const nodeInputRef = useRef<HTMLInputElement>(null)
  const campaignInputRef = useRef<HTMLInputElement>(null)
  const newCampaignInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingNodeId) nodeInputRef.current?.focus() }, [editingNodeId])
  useEffect(() => { if (editingCampaignName) campaignInputRef.current?.focus() }, [editingCampaignName])
  useEffect(() => { if (showNewCampaign) newCampaignInputRef.current?.focus() }, [showNewCampaign])

  if (!campaign) {
    return (
      <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className={s.panel}>
          <div className={s.header}>
            <div className={s.title}>{t.ui.campaigns_title}</div>
            <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
          </div>
          <div className={s.empty}>No active campaign.</div>
        </div>
      </div>
    )
  }

  const nodes = campaign.nodes
  const completedCount = nodes.filter(n => n.completed).length

  function handleNodeNameStart(node: CampaignNode) {
    setEditingNodeId(node.id)
    setEditingNodeVal(node.name)
  }

  function handleNodeNameSave(id: string) {
    const name = editingNodeVal.trim()
    if (name) store.renameCampaignNode(id, name)
    setEditingNodeId(null)
    setEditingNodeVal('')
  }

  function handleCampaignNameSave() {
    const name = campaignNameVal.trim()
    if (name) store.renameCampaign(name)
    setEditingCampaignName(false)
  }

  function handleStartNewCampaign() {
    const name = newCampaignName.trim()
    store.startNewCampaign(name || t.ui.untitled)
    setShowNewCampaign(false)
    setNewCampaignName('')
  }

  function getChildren(parentId: string | null): CampaignNode[] {
    return nodes.filter(n => n.parent_id === parentId)
  }

  function renderNode(node: CampaignNode, depth: number): React.ReactNode {
    const available = isNodeAvailable(nodes, node)
    const locked = !available && !node.completed
    const isEditingThis = editingNodeId === node.id
    const attachedWeapon = node.attached_weapon_id
      ? WEAPONS[node.attached_weapon_id] as WeaponInstance | undefined
      : undefined
    const children = getChildren(node.id)

    return (
      <div key={node.id}>
        <div
          className={[
            s.nodeRow,
            node.completed ? s.nodeCompleted : '',
            locked ? s.nodeLocked : '',
          ].filter(Boolean).join(' ')}
          style={{ paddingLeft: `${16 + depth * 22}px` }}
        >
          <span className={s.nodeIcon}>
            {node.completed ? '✓' : locked ? '🔒' : '○'}
          </span>

          {isEditingThis ? (
            <input
              ref={nodeInputRef}
              className={s.nodeInput}
              value={editingNodeVal}
              onChange={e => setEditingNodeVal(e.target.value)}
              onBlur={() => handleNodeNameSave(node.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleNodeNameSave(node.id)
                if (e.key === 'Escape') { setEditingNodeId(null); setEditingNodeVal('') }
              }}
            />
          ) : (
            <span
              className={[s.nodeName, !locked && !node.completed ? s.nodeNameEditable : ''].join(' ')}
              onClick={() => !locked && !node.completed && handleNodeNameStart(node)}
              title={!locked && !node.completed ? t.ui.click_to_rename : undefined}
            >
              {node.name || <em className={s.nodeUnnamed}>{t.ui.untitled}</em>}
            </span>
          )}

          {attachedWeapon && !node.completed && (
            <span className={s.weaponChip}>{attachedWeapon.name}</span>
          )}

          {node.is_remastering && (
            <span className={s.remasterChip}>↻ remaster</span>
          )}
        </div>
        {children.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  const roots = getChildren(null)

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>

        <div className={s.header}>
          <div className={s.title}>{t.ui.campaigns_title}</div>
          <button className={s.btnClose} onClick={onClose}>{t.ui.btn_close}</button>
        </div>

        <div className={s.campaignHeader}>
          <ArmorSprite classId={store.player_class} size={48} />
          <div className={s.campaignInfo}>
            {editingCampaignName ? (
              <input
                ref={campaignInputRef}
                className={s.campaignInput}
                value={campaignNameVal}
                onChange={e => setCampaignNameVal(e.target.value)}
                onBlur={handleCampaignNameSave}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCampaignNameSave()
                  if (e.key === 'Escape') setEditingCampaignName(false)
                }}
                placeholder={t.ui.campaign_name_placeholder}
              />
            ) : (
              <span
                className={s.campaignName}
                onClick={() => { setEditingCampaignName(true); setCampaignNameVal(campaign.name) }}
                title={t.ui.click_to_rename}
              >
                {campaign.name || <em className={s.nodeUnnamed}>{t.ui.campaign_name_placeholder}</em>}
              </span>
            )}
            <span className={s.campaignProgress}>{completedCount} / {nodes.length}</span>
          </div>
        </div>

        <hr className={s.sep} />

        <div className={s.nodeTree}>
          {roots.map(root => renderNode(root, 0))}
        </div>

        {campaign.completed && (
          <>
            <hr className={s.sep} />
            {showNewCampaign ? (
              <div className={s.newCampaignRow}>
                <input
                  ref={newCampaignInputRef}
                  className={s.campaignInput}
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  placeholder={t.ui.campaign_name_placeholder}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleStartNewCampaign()
                    if (e.key === 'Escape') { setShowNewCampaign(false); setNewCampaignName('') }
                  }}
                />
                <button className={s.btnStartNew} onClick={handleStartNewCampaign}>
                  {t.ui.campaign_start_new}
                </button>
                <button className={s.btnCancelDel} onClick={() => setShowNewCampaign(false)}>✕</button>
              </div>
            ) : (
              <button className={s.btnStartNewCampaign} onClick={() => setShowNewCampaign(true)}>
                + {t.ui.campaign_start_new}
              </button>
            )}
          </>
        )}

        {store.past_campaigns.length > 0 && (
          <>
            <hr className={s.sep} />
            <button className={s.pastToggle} onClick={() => setPastExpanded(e => !e)}>
              {pastExpanded ? '▼' : '▶'} {t.ui.campaign_past} ({store.past_campaigns.length})
            </button>
            {pastExpanded && (
              <div className={s.pastList}>
                {store.past_campaigns.map(c => {
                  const done = c.nodes.filter(n => n.completed).length
                  return (
                    <div key={c.id} className={s.pastItem}>
                      <ArmorSprite classId={c.class_id} size={24} className={s.pastArmor} />
                      <span className={s.pastName}>
                        {c.name || <em className={s.nodeUnnamed}>{t.ui.untitled}</em>}
                      </span>
                      <span className={s.pastProgress}>{done}/{c.nodes.length}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
