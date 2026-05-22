import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MOVES } from '../data/movesets'
import type { GeneratedMoveset } from '../types/game'
import s from './RunCompleteScreen.module.css'

export default function RunCompleteScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()

  // Movesets earned this run (newly unlocked since run started)
  const runStartSet  = new Set(store.run_start_owned_movesets)
  const newMovesetIds = store.owned_movesets.filter(id => !runStartSet.has(id))
  const newMovesets   = newMovesetIds
    .map(id => MOVES[id])
    .filter((m): m is GeneratedMoveset => !!m && 'rarity' in m)

  return (
    <div className={s.root}>
      <h1 className={s.title}>Run Complete</h1>
      <p className={s.subtitle}>{store.run_location_name || `Run #${store.run_count}`} — Location cleared!</p>

      <div className={s.runeBalance}>
        <span className={s.runeIcon}>✦</span>
        <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
        <span className={s.runeLabel}>runes</span>
      </div>

      {newMovesets.length > 0 && (
        <div className={s.card}>
          <div className={s.sectionTitle}>Movesets Earned</div>
          <div className={s.movesetList}>
            {newMovesets.map(m => (
              <div key={m.id} className={s.movesetRow}>
                <span className={s.movesetName}>{m.name}</span>
                <span className={s.movesetMeta}>{m.rarity} · {m.steps.length} step{m.steps.length !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className={s.hint}>Stats &amp; Level Up are available at the start of your next run.</p>

      <button className={s.btnContinue} onClick={() => navigate('/locations')}>
        Continue →
      </button>
    </div>
  )
}
