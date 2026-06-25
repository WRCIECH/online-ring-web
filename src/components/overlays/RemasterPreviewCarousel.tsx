import { useMemo, useState } from 'react'
import type { WeaponInstance } from '../../types/game'
import { describeRemasterStates, VALUE_BUCKET, type RemasterSlotView } from '../../data/weaponStructure'
import { useT } from '../../i18n'
import s from './RemasterPreviewCarousel.module.css'

interface Props {
  weapon: WeaponInstance
}

interface HoverInfo {
  x: number
  y: number
  label: string
  detail: string
  example?: string
}

export default function RemasterPreviewCarousel({ weapon }: Props) {
  const t = useT()
  const states = useMemo(() => describeRemasterStates(weapon), [weapon])
  const [page, setPage] = useState(0)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  if (states.length <= 1) return null

  const pageLabel = page === 0 ? t.ui.remaster_preview_current : `${t.ui.remaster_preview_step} ${page+1}`

  function showHover(slot: RemasterSlotView) {
    return (e: React.MouseEvent) => {
      if (slot.value === null) { setHover(null); return }
      const bucket = t.content[VALUE_BUCKET[slot.kind]] as Record<string, { label: string; detail: string; example: string }>
      const entry = bucket[slot.value]
      if (!entry) { setHover(null); return }
      setHover({ x: e.clientX + 14, y: e.clientY - 10, label: entry.label, detail: entry.detail, example: entry.example })
    }
  }

  function renderSlot(slot: RemasterSlotView, key: string) {
    const bucket = t.content[VALUE_BUCKET[slot.kind]] as Record<string, { badge_label: string }>
    const resolvedLabel = slot.value !== null ? bucket[slot.value]?.badge_label : undefined
    return (
      <div
        key={key}
        className={[s.chip, slot.changed ? s.chipChanged : '', slot.value === null ? s.chipNone : ''].join(' ')}
        onMouseEnter={showHover(slot)}
        onMouseMove={showHover(slot)}
        onMouseLeave={() => setHover(null)}
      >
        {resolvedLabel ?? t.ui.remaster_preview_none}
      </div>
    )
  }

  return (
    <div className={s.carousel}>
      <div className={s.header}>
        <span className={s.title}>{t.ui.remaster_preview_title} — {pageLabel}</span>
        <button className={s.navBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
        <span className={s.counter}>{page + 1} / {states.length}</span>
        <button className={s.navBtn} disabled={page === states.length - 1} onClick={() => setPage(p => p + 1)}>›</button>
      </div>

      <div className={s.chipRow}>
        {states[page].map((slot, i) => renderSlot(slot, `${slot.kind}-${slot.occurrenceIndex}-${i}`))}
      </div>

      <div className={s.dots}>
        {states.map((_, i) => (
          <button
            key={i}
            className={[s.dot, i === page ? s.dotActive : ''].join(' ')}
            onClick={() => setPage(i)}
            aria-label={`${i + 1} / ${states.length}`}
          />
        ))}
      </div>

      {hover && (
        <div className={s.tooltip} style={{ left: hover.x, top: hover.y }}>
          <div className={s.tooltipTitle}>{hover.label}</div>
          <div className={s.tooltipDetail}>{hover.detail}</div>
          {hover.example && <div className={s.tooltipExample}>{hover.example}</div>}
        </div>
      )}
    </div>
  )
}
