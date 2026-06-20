import { useGameStore } from '../../store/gameStore'
import { LOCATION_DEFINITIONS } from '../../data/locations'
import { useT } from '../../i18n'
import s from './AnalyticsOverlay.module.css'

function fmtTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '—'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

interface Props { onClose: () => void }

export default function AnalyticsOverlay({ onClose }: Props) {
  const store = useGameStore()
  const t     = useT()

  const totalLocations = LOCATION_DEFINITIONS.length
  const clearedCount   = store.completed_locations.length
  const clearedPct     = totalLocations > 0 ? (clearedCount / totalLocations) * 100 : 0

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
            <span className={s.label}>{t.ui.analytics_in_progress}</span>
            <span className={s.value}>{store.content_items.filter(c => !c.completed).length}</span>
          </div>
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
