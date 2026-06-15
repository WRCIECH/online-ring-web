import { useGameStore } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import type { ContentPhase } from '../../types/game'
import { useT } from '../../i18n'
import s from './AnalyticsOverlay.module.css'

const PHASES: ContentPhase[] = ['Research', 'Outline', 'Produce', 'Glue', 'Refine', 'Publish', 'Published']

function fmtTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '—'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props { onClose: () => void }

export default function AnalyticsOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()

  const allItems       = store.content_items
  const published      = allItems.filter(c => c.phase === 'Published')
  const inProgress     = allItems.filter(c => c.phase !== 'Published')

  const phaseCounts = PHASES.reduce<Record<ContentPhase, number>>((acc, p) => {
    acc[p] = allItems.filter(c => c.phase === p).length
    return acc
  }, {} as Record<ContentPhase, number>)

  const totalLocations = LOCATION_DEFINITIONS.length
  const clearedCount   = store.completed_locations.length
  const clearedPct     = totalLocations > 0 ? (clearedCount / totalLocations) * 100 : 0

  const recentPublished = [...published]
    .sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0))
    .slice(0, 10)

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>{t.ui.analytics_title}</span>
          <button className={s.btnClose} onClick={onClose}>✕</button>
        </div>

        {/* ── Content pipeline ── */}
        <section className={s.section}>
          <div className={s.sectionHeader}>{t.ui.analytics_content_hdr}</div>

          <div className={s.row}>
            <span className={s.label}>{t.ui.analytics_published}</span>
            <span className={s.value}>{published.length}</span>
          </div>
          <div className={s.row}>
            <span className={s.label}>{t.ui.analytics_in_progress}</span>
            <span className={s.value}>{inProgress.length}</span>
          </div>

          {/* Phase breakdown bar */}
          <div className={s.phaseBar}>
            {PHASES.filter(p => phaseCounts[p] > 0).map(p => (
              <div key={p} className={s.phaseChip}>
                <span className={s.phaseLabel}>{p}</span>
                <span className={s.phaseCount}>{phaseCounts[p]}</span>
              </div>
            ))}
          </div>

          {/* Recent published list */}
          {recentPublished.length > 0 && (
            <div className={s.publishedList}>
              {recentPublished.map(item => (
                <div key={item.id} className={s.publishedItem}>
                  <span className={s.publishedName}>{item.name || '(unnamed)'}</span>
                  {item.published_at && (
                    <span className={s.publishedDate}>{fmtDate(item.published_at)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Time invested ── */}
        <section className={s.section}>
          <div className={s.sectionHeader}>{t.ui.analytics_time_hdr}</div>
          <div className={s.bigStat}>{fmtTime(store.total_task_time_s ?? 0)}</div>
        </section>

        {/* ── Expedition progress ── */}
        <section className={s.section}>
          <div className={s.sectionHeader}>{t.ui.analytics_runs_hdr}</div>
          <div className={s.row}>
            <span className={s.label}>{t.ui.analytics_runs}</span>
            <span className={s.value}>{store.run_count}</span>
          </div>
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
