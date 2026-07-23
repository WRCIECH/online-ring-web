import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { LOCATION_DEFINITIONS } from '../data/locations'
import { useT } from '../i18n'
import HomeLogo from '../components/HomeLogo'
import s from './RunCompleteScreen.module.css'

const LOC_MAP = Object.fromEntries(LOCATION_DEFINITIONS.map(l => [l.id, l]))

export default function RunCompleteScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()
  const locDisplayName = store.run_location_name
    ? (LOC_MAP[store.run_location_name]?.displayName ?? store.run_location_name)
    : `Run #${store.run_count}`

  if (store.game_won) {
    return (
      <div className={s.root}>
        <div className={s.homeLogoWrap}><HomeLogo /></div>
        <h1 className={s.title} style={{ color: '#6c3483', textShadow: '0 0 32px #6c348388' }}>
          {t.ui.game_won_title ?? 'The Algorithm Falls Silent'}
        </h1>
        <p className={s.subtitle}>{locDisplayName}</p>
        <div className={s.runeBalance}>
          <span className={s.runeIcon}>✦</span>
          <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
          <span className={s.runeLabel}>{t.ui.runes}</span>
        </div>
        <p className={s.hint} style={{ maxWidth: 440, textAlign: 'center', opacity: 0.8, fontSize: '0.85rem', color: 'rgba(180,160,220,0.8)' }}>
          {t.ui.game_won_body ?? 'You have survived shadowbans, hate floods, and burnout. The feed is yours.'}
        </p>
        <button className={s.btnContinue} onClick={() => navigate('/')}>
          {t.ui.game_won_return ?? 'Return to Title'}
        </button>
      </div>
    )
  }

  return (
    <div className={s.root}>
      <div className={s.homeLogoWrap}><HomeLogo /></div>
      <h1 className={s.title}>{t.ui.run_complete_title}</h1>
      <p className={s.subtitle}>{locDisplayName} — {t.ui.location_cleared}</p>

      <div className={s.runeBalance}>
        <span className={s.runeIcon}>✦</span>
        <span className={s.runeCount}>{store.runes.toLocaleString()}</span>
        <span className={s.runeLabel}>{t.ui.runes}</span>
      </div>

      <p className={s.hint}>{t.ui.run_complete_hint}</p>

      <button className={s.btnContinue} onClick={() => navigate('/world')}>
        {t.ui.btn_continue_arrow}
      </button>
    </div>
  )
}
