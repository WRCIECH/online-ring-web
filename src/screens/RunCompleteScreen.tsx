import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MOVES } from '../data/movesets'
import type { GeneratedMoveset } from '../types/game'
import { useT } from '../i18n'
import s from './RunCompleteScreen.module.css'

export default function RunCompleteScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()

  // Movesets earned this run (newly unlocked since run started)
  const runStartSet  = new Set(store.run_start_owned_movesets)
  const newMovesetIds = store.owned_movesets.filter(id => !runStartSet.has(id))
  const newMovesets   = newMovesetIds
    .map(id => MOVES[id])
    .filter((m): m is GeneratedMoveset => !!m && 'rarity' in m)

  return (
    <div className={s.root}>
      <h1 className={s.title}>{t.ui.run_complete_title}</h1>
      <p className={s.subtitle}>{store.run_location_name ? (t.locations[store.run_location_name] ?? store.run_location_name) : `Run #${store.run_count}`} — {t.ui.location_cleared}</p>

      <div className={s.runeBalance}>
        <span className={s.runeIcon}>✦</span>
        <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
        <span className={s.runeLabel}>{t.ui.runes}</span>
      </div>

      {newMovesets.length > 0 && (
        <div className={s.card}>
          <div className={s.sectionTitle}>{t.ui.movesets_earned}</div>
          <div className={s.movesetList}>
            {newMovesets.map(m => (
              <div key={m.id} className={s.movesetRow}>
                <span className={s.movesetName}>{m.name}</span>
                <span className={s.movesetMeta}>{m.rarity} · {m.steps.length} {m.steps.length !== 1 ? t.ui.step_plural : t.ui.step_singular}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className={s.hint}>{t.ui.run_complete_hint}</p>

      <button className={s.btnContinue} onClick={() => navigate('/locations')}>
        {t.ui.btn_continue_arrow}
      </button>
    </div>
  )
}
