import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isNodeAvailable } from '../../data/generators/campaignGenerator'
import type { LocationData, CampaignNode, WeaponInstance } from '../../types/game'
import { WEAPONS } from '../../data/weapons'
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

  type ContentItem = { id: string; name: string; level?: 1 | 2; parentName?: string; hasWorkflow?: boolean; isCurrent?: boolean; streak?: number }

  function getAvailableContent(weaponId: string): ContentItem[] {
    const c = store.weapon_campaigns[weaponId]
    if (!c) return []
    // Old-format: node tree
    if (c.nodes.length > 0) {
      return c.nodes
        .filter((n: CampaignNode) => !n.completed && n.name.trim() !== '' && isNodeAvailable(c.nodes, c.edges, n))
        .map((n: CampaignNode) => {
          const parentEdge = c.edges.find(e => e.to_id === n.id)
          const parentNode = parentEdge ? c.nodes.find(p => p.id === parentEdge.from_id) : null
          return {
            id: n.id,
            name: n.name,
            parentName: parentNode?.name,
            hasWorkflow: !!store.workflow_progress[n.id],
            isCurrent: n.id === store.active_content_id,
            streak: store.content_streak[n.id] ?? 0,
          }
        })
    }
    // New-format: medium pieces
    if (c.medium) {
      const result: ContentItem[] = []
      c.medium.pieces.forEach((p, i) => {
        if (p.level2_done) return
        const prevDone = i === 0 || c.medium!.pieces[i - 1].level1_done
        if (!prevDone) return
        result.push({
          id: p.id,
          name: p.name || `Part ${i + 1}`,
          level: (!p.level1_done ? 1 : 2) as 1 | 2,
        })
      })
      return result
    }
    return []
  }

  // Weapons that have an activated campaign with at least one available content item
  const eligibleWeapons = store.weapon_instances.filter(w => {
    const c = store.weapon_campaigns[w.instance_id]
    if (!c || !c.activated) return false
    return getAvailableContent(w.instance_id).length > 0
  })

  // Default weapon: prefer the one containing active_content_id, else first eligible
  const defaultWeaponId = (() => {
    if (store.active_content_id) {
      const w = eligibleWeapons.find(w => getAvailableContent(w.instance_id).some(c => c.id === store.active_content_id))
      if (w) return w.instance_id
    }
    return eligibleWeapons[0]?.instance_id ?? ''
  })()

  const [pickerWeaponId, setPickerWeaponId] = useState(defaultWeaponId)
  const [pickerContentId, setPickerContentId] = useState<string | null>(store.active_content_id)

  // When weapon changes, keep content selection if it still belongs to the new weapon, else reset
  useEffect(() => {
    const items = getAvailableContent(pickerWeaponId)
    if (!items.find(c => c.id === pickerContentId)) {
      setPickerContentId(items[0]?.id ?? null)
    }
  }, [pickerWeaponId]) // eslint-disable-line react-hooks/exhaustive-deps

  const availableContent = getAvailableContent(pickerWeaponId)
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
                const wi = WEAPONS[w.instance_id] as WeaponInstance | undefined
                const perks = wi?.perks ?? []
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
                      {perks.length > 0 && (
                        <div className={s.perkRow}>
                          {perks.map((p, i) => (
                            <span key={i} className={s.perkBadge}>
                              {p.target} +{Math.round(p.bonus * 100)}%
                            </span>
                          ))}
                        </div>
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
            ) : availableContent.length === 0 ? (
              <div className={s.emptyMsg}>{t.ui.prefight_no_nodes ?? 'No available content nodes for this weapon.'}</div>
            ) : (
              availableContent.map(item => {
                const isSelected  = item.id === pickerContentId
                const nodeWorkflow = item.hasWorkflow ? store.workflow_progress[item.id] : undefined
                return (
                  <button
                    key={item.id}
                    className={[s.nodeCard, isSelected ? s.nodeCardSelected : ''].filter(Boolean).join(' ')}
                    onClick={() => setPickerContentId(item.id)}
                  >
                    <div className={s.nodeCardMain}>
                      <span className={s.nodeName}>{item.name}</span>
                      {item.parentName && (
                        <span className={s.nodeParent}>↑ {item.parentName}</span>
                      )}
                    </div>
                    <div className={s.nodeBadges}>
                      {item.level && (
                        <span className={s.badgeLevel}>L{item.level}</span>
                      )}
                      {nodeWorkflow && (
                        <span className={s.badgeResume}>
                          ▶ {t.ui.prefight_badge_resume ?? 'Resume'} {nodeWorkflow.tiles.filter(t => t.is_completed).length}/{nodeWorkflow.tiles.length}
                        </span>
                      )}
                      {item.isCurrent && !item.hasWorkflow && (
                        <span className={s.badgeContinue}>
                          ▶ {t.ui.prefight_badge_continue ?? 'Continue'}
                        </span>
                      )}
                      {(item.streak ?? 0) > 0 && (
                        <span className={s.badgeStreak}>
                          {t.ui.prefight_badge_streak ?? 'Streak'} +{Math.min(10, item.streak!)}%
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
