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

  type ContentItem = { id: string; name: string; typeLabel?: string; level?: 1 | 2; parentName?: string; hasWorkflow?: boolean; isCurrent?: boolean; streak?: number }

  function prodLabel(type: string): string {
    return (t.content.product as Record<string, { badge_label: string }>)[type]?.badge_label ?? type
  }

  // New-format weapons (medium/heavy/research) only ever have ONE workable
  // item at a time — chunks/parts must be done in order, so there's nothing
  // to actually choose between. Returns that single item, not the whole list.
  function isNewFormat(weaponId: string): boolean {
    const c = store.weapon_campaigns[weaponId]
    return !!(c?.medium || c?.heavy || c?.research)
  }

  function getAvailableContent(weaponId: string): ContentItem[] {
    const c = store.weapon_campaigns[weaponId]
    if (!c) return []
    if (c.medium) {
      const next = c.medium.chunks.find(ch => !ch.done)
      return next ? [{ id: next.id, name: next.name, typeLabel: prodLabel(next.content_type) }] : []
    }
    if (c.heavy) {
      const next = c.heavy.parts.find(p => !p.done)
      return next ? [{ id: next.id, name: next.name, typeLabel: prodLabel(c.heavy.product_type) }] : []
    }
    if (c.research) {
      return [{ id: '_research', name: `Research (${c.research.done_steps} steps done)` }]
    }
    // Old-format: named node tree
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

  // Total remaining work items for the weapon-list badge — distinct from
  // getAvailableContent, which only ever surfaces the single next workable one.
  function getRemainingCount(weaponId: string): number {
    const c = store.weapon_campaigns[weaponId]
    if (c?.medium) return c.medium.chunks.filter(ch => !ch.done).length
    if (c?.heavy)  return c.heavy.parts.filter(p => !p.done).length
    return getAvailableContent(weaponId).length
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
                const nodeCount = getRemainingCount(w.instance_id)
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
            ) : isNewFormat(pickerWeaponId) ? (
              // Only one item can ever be worked on next (chunks/parts are done in
              // strict order) — show it as info, not as a choice.
              (() => {
                const item = availableContent[0]
                return (
                  <div className={s.nodeCardStatic}>
                    <div className={s.nodeCardMain}>
                      <span className={s.nodeName}>{item.name}</span>
                    </div>
                    {item.typeLabel && (
                      <div className={s.nodeBadges}>
                        <span className={s.badgeLevel}>{item.typeLabel}</span>
                      </div>
                    )}
                  </div>
                )
              })()
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
