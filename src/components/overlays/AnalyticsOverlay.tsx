import { useGameStore } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import { useT } from '../../i18n'
import type { WeaponCampaign } from '../../types/game'
import s from './AnalyticsOverlay.module.css'

interface Props { onClose: () => void }

function fmtTime(secs: number): string {
  if (secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function AnalyticsOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()
  const tui   = t.ui as Record<string, string>

  const totalLocations = LOCATION_DEFINITIONS.length
  const clearedCount   = store.completed_locations.length
  const clearedPct     = totalLocations > 0 ? (clearedCount / totalLocations) * 100 : 0

  const activeCampaigns = Object.values(store.weapon_campaigns).filter(c => c.activated)
  const libCampaigns    = store.campaign_library

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
            const doneCount      = campaign.done_count ?? 0
            const nodes          = campaign.nodes
            const publishedNodes = nodes.filter(n => n.published)

            // Campaign-level total time across all nodes
            const campaignTotalSecs = nodes.reduce((sum, node) => {
              const t = store.node_time_spent[node.id]
              return sum + (t?.Research ?? 0) + (t?.Produce ?? 0)
            }, 0)

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
                    {campaignTotalSecs > 0 && (
                      <span className={s.campaignTime}>{fmtTime(campaignTotalSecs)}</span>
                    )}
                  </div>
                </div>

                <div className={s.nodeList}>
                  {nodes.map(node => {
                    const spent    = store.node_time_spent[node.id]
                    const research = spent?.Research ?? 0
                    const produce  = spent?.Produce  ?? 0
                    const hasTime  = research > 0 || produce > 0

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
                        {hasTime && (
                          <div className={s.stageRow}>
                            {research > 0 && (
                              <span className={s.stageChip}>
                                <span className={s.stageLabel}>{tui.stage_research ?? 'Research'}</span>
                                <span className={s.stageCount}>{fmtTime(research)}</span>
                              </span>
                            )}
                            {produce > 0 && (
                              <span className={s.stageChip}>
                                <span className={s.stageLabel}>{tui.stage_produce ?? 'Produce'}</span>
                                <span className={s.stageCount}>{fmtTime(produce)}</span>
                              </span>
                            )}
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
