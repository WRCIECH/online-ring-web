import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { LOCATION_DEFINITIONS } from '../data/locations'
import { useT } from '../i18n'
import s from './RunCompleteScreen.module.css'

const LOC_MAP = Object.fromEntries(LOCATION_DEFINITIONS.map(l => [l.id, l]))

export default function RunCompleteScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()
  const locDisplayName = store.run_location_name
    ? (LOC_MAP[store.run_location_name]?.displayName ?? store.run_location_name)
    : `Run #${store.run_count}`

  return (
    <div className={s.root}>
      <h1 className={s.title}>{t.ui.run_complete_title}</h1>
      <p className={s.subtitle}>{locDisplayName} — {t.ui.location_cleared}</p>

      <div className={s.runeBalance}>
        <span className={s.runeIcon}>✦</span>
        <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
        <span className={s.runeLabel}>{t.ui.runes}</span>
      </div>

      <p className={s.hint}>{t.ui.run_complete_hint}</p>

      <button className={s.btnContinue} onClick={() => navigate('/locations')}>
        {t.ui.btn_continue_arrow}
      </button>
    </div>
  )
}
