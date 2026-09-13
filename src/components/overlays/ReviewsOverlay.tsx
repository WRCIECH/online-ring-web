import { useGameStore } from '../../store/gameStore'
import { WEAPONS } from '../../data/weapons'
import type { WeaponInstance, ReviewMode } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
import s from './ReviewsOverlay.module.css'

interface Props { onClose: () => void }

const MODE_LABEL: Record<ReviewMode, string> = {
  medium: 'Medium',
  heavy: 'Heavy',
  research: 'Research',
}

export default function ReviewsOverlay({ onClose }: Props) {
  const t = useT()
  const store = useGameStore()
  const ui = t.ui as Record<string, string>
  const reviews = [...(store.reviews ?? [])].sort((a, b) => b.created_at - a.created_at)

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.title}>{ui.btn_reviews ?? 'Reviews'}</span>
          <button className={s.btnClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.body}>
          {reviews.length === 0 ? (
            <div className={s.empty}>No reviews yet — they'll show up here after you finish a chunk, part, or research effort.</div>
          ) : (
            <div className={s.listWrap}>
              {reviews.map(r => {
                const weapon = WEAPONS[r.weaponId] as WeaponInstance | undefined
                const weaponName = weapon ? localizeWeaponName(weapon, t) : r.weaponId
                return (
                  <div key={r.id} className={s.entry}>
                    <div className={s.entryTop}>
                      <span className={s.modeChip}>{MODE_LABEL[r.mode]}</span>
                      <span className={s.entryName}>{r.itemName}</span>
                      <span className={s.weaponName}>{weaponName}</span>
                      <span className={s.timestamp}>{new Date(r.created_at).toLocaleString()}</span>
                      <button className={s.btnDelete} onClick={() => store.deleteReview(r.id)}>✕</button>
                    </div>
                    <div className={s.entryText}>{r.text}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
