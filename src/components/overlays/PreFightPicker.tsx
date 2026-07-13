import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isNodeAvailable } from '../../data/generators/campaignGenerator'
import type { LocationData, CampaignNode } from '../../types/game'
import WeaponIcon from '../WeaponIcon'
import { useT, localizeWeaponName } from '../../i18n'
import s from './PreFightPicker.module.css'

interface Props {
  loc: LocationData
  onConfirm: (weaponId: string, contentId: string) => void
  onCancel: () => void
}

export default function PreFightPicker({ loc, onConfirm, onCancel }: Props) {
  const store = useGameStore()
  const t = useT()

  // Weapons that have at least one available, named, incomplete node
  const eligibleWeapons = store.weapon_instances.filter(w => {
    const c = store.weapon_campaigns[w.instance_id]
    if (!c) return false
    return c.nodes.some(n => !n.completed && n.name.trim() !== '' && isNodeAvailable(c.nodes, c.edges, n))
  })

  // Default weapon: prefer the one containing active_content_id, else first eligible
  const defaultWeaponId = (() => {
    if (store.active_content_id) {
      const w = eligibleWeapons.find(w => {
        const c = store.weapon_campaigns[w.instance_id]
        return c?.nodes.some(n => n.id === store.active_content_id)
      })
      if (w) return w.instance_id
    }
    return eligibleWeapons[0]?.instance_id ?? ''
  })()

  const [pickerWeaponId, setPickerWeaponId] = useState(defaultWeaponId)
  const [pickerContentId, setPickerContentId] = useState<string | null>(store.active_content_id)

  function getAvailableNodes(weaponId: string): CampaignNode[] {
    const c = store.weapon_campaigns[weaponId]
    if (!c) return []
    return c.nodes.filter(n => !n.completed && n.name.trim() !== '' && isNodeAvailable(c.nodes, c.edges, n))
  }

  // When weapon changes, keep content selection if node belongs to new weapon, else pick first available
  useEffect(() => {
    const nodes = getAvailableNodes(pickerWeaponId)
    if (!nodes.find(n => n.id === pickerContentId)) {
      setPickerContentId(nodes[0]?.id ?? null)
    }
  }, [pickerWeaponId]) // eslint-disable-line react-hooks/exhaustive-deps

  const availableNodes = getAvailableNodes(pickerWeaponId)
  const campaign = store.weapon_campaigns[pickerWeaponId]


  const locTypeLabel = loc.sublocation_type === 'boss'  ? (t.ui.badge_boss ?? 'Boss')
                     : loc.sublocation_type === 'elite' ? (t.ui.badge_elite ?? 'Elite')
                     : loc.sublocation_type === 'event' ? (t.ui.event_trial_gate ?? 'Trial')
                     : (t.ui.enemy_mob_label ?? 'Mob')

  const canConfirm = !!pickerWeaponId && !!pickerContentId

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className={s.panel}>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <span className={s.title}>{t.ui.prefight_title ?? 'Prepare for Battle'}</span>
            <span className={s.locBadge}>{locTypeLabel}: {loc.name}</span>
          </div>
          <button className={s.btnClose} onClick={onCancel}>{t.ui.btn_close}</button>
        </div>

        {/* Body */}
        <div className={s.body}>

          {/* Left: weapon list */}
          <div className={s.weaponList}>
            <div className={s.sectionLabel}>{t.ui.prefight_weapon_label ?? 'Weapon'}</div>
            {eligibleWeapons.length === 0 ? (
              <div className={s.emptyMsg}>
                {t.ui.prefight_no_weapons ?? 'No weapons with active campaign content. Open the Campaign panel and name your content nodes.'}
              </div>
            ) : (
              eligibleWeapons.map(w => {
                const wc = store.weapon_campaigns[w.instance_id]
                const nodeCount = getAvailableNodes(w.instance_id).length
                const isSelected = w.instance_id === pickerWeaponId
                return (
                  <button
                    key={w.instance_id}
                    className={[s.weaponCard, isSelected ? s.weaponCardSelected : ''].filter(Boolean).join(' ')}
                    onClick={() => setPickerWeaponId(w.instance_id)}
                  >
                    <WeaponIcon weaponClass={w.weapon_class} className={s.weaponIcon} />
                    <div className={s.weaponCardBody}>
                      <span className={s.weaponName}>{localizeWeaponName(w, t)}</span>
                      {wc?.campaign_name && (
                        <span className={s.weaponCampaign}>{wc.campaign_name}</span>
                      )}
                    </div>
                    <span className={s.nodeCount}>{nodeCount}</span>
                  </button>
                )
              })
            )}
          </div>

          {/* Right: content node list */}
          <div className={s.contentList}>
            <div className={s.sectionLabel}>{t.ui.prefight_content_label ?? 'Content piece'}</div>
            {!pickerWeaponId ? (
              <div className={s.emptyMsg}>{t.ui.prefight_select_weapon_first ?? 'Select a weapon first.'}</div>
            ) : availableNodes.length === 0 ? (
              <div className={s.emptyMsg}>{t.ui.prefight_no_nodes ?? 'No available content nodes for this weapon.'}</div>
            ) : (
              availableNodes.map(node => {
                const isSelected = node.id === pickerContentId
                const isCurrent   = node.id === store.active_content_id
                const nodeWorkflow = store.workflow_progress[node.id]
                const hasWorkflow  = !!nodeWorkflow

                // Determine parent name via campaign edges
                const parentEdge = campaign?.edges.find(e => e.to_id === node.id)
                const parentNode = parentEdge ? campaign?.nodes.find(n => n.id === parentEdge.from_id) : null

                return (
                  <button
                    key={node.id}
                    className={[s.nodeCard, isSelected ? s.nodeCardSelected : ''].filter(Boolean).join(' ')}
                    onClick={() => setPickerContentId(node.id)}
                  >
                    <div className={s.nodeCardMain}>
                      <span className={s.nodeName}>{node.name}</span>
                      {parentNode?.name && (
                        <span className={s.nodeParent}>↑ {parentNode.name}</span>
                      )}
                    </div>
                    <div className={s.nodeBadges}>
                      {hasWorkflow && (
                        <span className={s.badgeResume}>
                          ▶ {t.ui.prefight_badge_resume ?? 'Resume'} {nodeWorkflow.tiles.filter(t => t.is_completed).length}/{nodeWorkflow.tiles.length}
                        </span>
                      )}
                      {isCurrent && !hasWorkflow && (
                        <span className={s.badgeContinue}>
                          ▶ {t.ui.prefight_badge_continue ?? 'Continue'}
                        </span>
                      )}
                      {node.is_remastering && (
                        <span className={s.badgeRemaster}>
                          ↻ {t.ui.prefight_badge_remaster ?? 'Remaster ×1.2'}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={s.footer}>
          <button
            className={s.btnEnter}
            disabled={!canConfirm}
            onClick={() => canConfirm && onConfirm(pickerWeaponId, pickerContentId!)}
          >
            {t.ui.prefight_enter ?? 'Enter Fight'}
          </button>
        </div>

      </div>
    </div>
  )
}
