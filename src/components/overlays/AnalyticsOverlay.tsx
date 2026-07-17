import { useGameStore } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import { useT } from '../../i18n'
import type { WeaponCampaign, AtomicStage } from '../../types/game'
import s from './AnalyticsOverlay.module.css'

const STAGES: AtomicStage[] = ['Research', 'Plan', 'Produce', 'Refine']

interface Props { onClose: () => void }

export default function AnalyticsOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()
  const tui   = t.ui as Record<string, string>

  const totalLocations = LOCATION_DEFINITIONS.length
  const clearedCount   = store.completed_locations.length
  const clearedPct     = totalLocations > 0 ? (clearedCount / totalLocations) * 100 : 0

  // Only activated campaigns (on weapons) + library (all library entries were once activated)
  const activeCampaigns = Object.values(store.weapon_campaigns).filter(c => c.activated)
  const libCampaigns    = store.campaign_library

  // Merge: library entry wins if same id (has done_count); add any active-only ones
  const allCampaigns: WeaponCampaign[] = [
    ...libCampaigns,
    ...activeCampaigns.filter(a => !libCampaigns.find(l => l.id === a.id)),
  ].sort((a, b) => (a.campaign_name ?? '').localeCompare(b.campaign_name ?? ''))

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>{t.ui.analytics_title}</span>
          <button className={s.btnClose} onClick={onClose}>✕</button>
        </div>

        {/* ── Campaign content breakdown ── */}
        <section className={s.section}>
          <div className={s.sectionHeader}>{tui.analytics_content_hdr ?? 'Content'}</div>
          {allCampaigns.length === 0 ? (
            <div className={s.empty}>{tui.analytics_no_campaigns ?? 'No campaigns yet.'}</div>
          ) : allCampaigns.map(campaign => {
            const doneCount = campaign.done_count ?? 0
            const nodes = campaign.nodes
            const publishedNodes = nodes.filter(n => n.published)

            return (
              <div key={campaign.id} className={s.campaignBlock}>
                <div className={s.campaignHeader}>
                  <span className={s.campaignName}>
                    {campaign.campaign_name || (tui.campaign_name_placeholder ?? 'Unnamed campaign')}
                  </span>
                  <div className={s.campaignMeta}>
                    {doneCount > 0 && (
                      <span className={s.doneCountBadge}>×{doneCount}</span>
                    )}
                    <span className={s.campaignProgress}>
                      {publishedNodes.length}/{nodes.length}
                    </span>
                  </div>
                </div>

                <div className={s.nodeList}>
                  {nodes.map(node => {
                    const workflow = store.workflow_progress[node.id]
                    const stageCounts: Record<AtomicStage, number> = { Research: 0, Plan: 0, Produce: 0, Refine: 0 }
                    let totalDone = 0
                    if (workflow) {
                      for (const tile of workflow.tiles) {
                        if (tile.is_completed && !tile.is_advance) {
                          stageCounts[tile.type] = (stageCounts[tile.type] ?? 0) + 1
                          totalDone++
                        }
                      }
                    }
                    const hasStages = totalDone > 0

                    return (
                      <div key={node.id} className={s.nodeRow}>
                        <span className={[
                          s.nodeStatus,
                          node.published ? s.nodePublished : node.completed ? s.nodeCompleted : s.nodeInProgress,
                        ].join(' ')}>
                          {node.published ? '●' : node.completed ? '○' : '·'}
                        </span>
                        <span className={s.nodeName}>
                          {node.name || (tui.node_unnamed ?? '—')}
                        </span>
                        {hasStages && (
                          <div className={s.stageRow}>
                            {STAGES.filter(st => stageCounts[st] > 0).map(st => (
                              <span key={st} className={s.stageChip}>
                                <span className={s.stageLabel}>{tui[`stage_${st.toLowerCase()}`] ?? st}</span>
                                <span className={s.stageCount}>×{stageCounts[st]}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>

        {/* ── Expedition progress ── */}
        <section className={s.section}>
          <div className={s.sectionHeader}>{t.ui.analytics_runs_hdr}</div>
          <div className={s.row}>
            <span className={s.label}>{t.ui.analytics_locations}</span>
            <span className={s.value}>{clearedCount} / {totalLocations}</span>
          </div>
          <div className={s.progressBarWrap}>
            <div className={s.progressBarFill} style={{ width: `${clearedPct}%` }} />
          </div>
        </section>
      </div>
    </div>
  )
}
