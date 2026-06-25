import { useMemo, useState } from 'react'
import type { WeaponInstance } from '../../types/game'
import { describeRemasterStates, VALUE_BUCKET, type RemasterSlotView } from '../../data/weaponStructure'
import { useT, type TranslationBundle } from '../../i18n'
import s from './RemasterPreviewCarousel.module.css'

interface Props {
  weapon: WeaponInstance
}

function renderSlot(slot: RemasterSlotView, key: string, t: TranslationBundle) {
  const bucket = t.content[VALUE_BUCKET[slot.kind]] as Record<string, { badge_label: string }>
  const resolvedLabel = slot.value !== null ? bucket[slot.value]?.badge_label : undefined
  return (
    <div
      key={key}
      className={[s.chip, slot.changed ? s.chipChanged : '', slot.value === null ? s.chipNone : ''].join(' ')}
    >
      {resolvedLabel ?? t.ui.remaster_preview_none}
    </div>
  )
}

export default function RemasterPreviewCarousel({ weapon }: Props) {
  const t = useT()
  const states = useMemo(() => describeRemasterStates(weapon), [weapon])
  const [page, setPage] = useState(0)

  if (states.length <= 1) return null

  const pageLabel = page === 0 ? t.ui.remaster_preview_current : `${t.ui.remaster_preview_step} ${page+1}`
  const formatBucket = t.content[VALUE_BUCKET.format] as Record<string, { badge_label: string }>
  const formatLabel = weapon.rolled_draws ? formatBucket[weapon.rolled_draws.format]?.badge_label : undefined

  return (
    <div className={s.carousel}>
      <div className={s.header}>
        <span className={s.title}>{t.ui.remaster_preview_title} — {pageLabel}</span>
        <button className={s.navBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
        <span className={s.counter}>{page + 1} / {states.length}</span>
        <button className={s.navBtn} disabled={page === states.length - 1} onClick={() => setPage(p => p + 1)}>›</button>
      </div>

      {formatLabel && <div className={s.formatRow}>{formatLabel}</div>}

      <div className={s.chipRow}>
        {states[page].map((slot, i) => renderSlot(slot, `${slot.kind}-${slot.occurrenceIndex}-${i}`, t))}
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
    </div>
  )
}
