import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { hasSave, eraseSave } from '../engine/save'
import { useT } from '../i18n'
import s from './TitleScreen.module.css'

export default function TitleScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const t          = useT()
  const saveExists = hasSave()
  const [confirming, setConfirming] = useState(false)
  const [showIntro, setShowIntro]   = useState(false)

  function handleContinue() {
    store.load()
    if (store.run_active) {
      navigate('/map')
    } else {
      navigate('/locations')
    }
  }

  function handleNewGame() {
    if (saveExists) {
      setConfirming(true)
    } else {
      startFresh()
    }
  }

  function startFresh() {
    eraseSave()
    store.reset()
    setConfirming(false)
    setShowIntro(true)
  }

  return (
    <div className={s.root}>
      <h1 className={s.title}>{t.ui.title}</h1>
      <p className={s.subtitle}>{t.ui.subtitle}</p>

      {store.run_count > 0 && (
        <p className={s.runCount}>{t.ui.great_run}{store.run_count}</p>
      )}

      <div className={s.buttons}>
        {saveExists && (
          <button className={s.btnPrimary} onClick={handleContinue}>
            {t.ui.btn_continue}
          </button>
        )}
        <button className={s.btnPrimary} onClick={handleNewGame}>
          {t.ui.btn_new_game}
        </button>
      </div>

      <button
        className={s.btnLang}
        onClick={() => store.setLocale(store.locale === 'pl' ? 'en' : 'pl')}
        title={store.locale === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
      >
        {t.ui.lang_toggle}
      </button>

      {confirming && (
        <div className={s.confirmOverlay}>
          <div className={s.confirmBox}>
            <h2>{t.ui.erase_title}</h2>
            <p>{t.ui.erase_body}</p>
            <div className={s.confirmButtons}>
              <button className={s.btnDanger} onClick={startFresh}>{t.ui.btn_erase_start}</button>
              <button onClick={() => setConfirming(false)}>{t.ui.btn_cancel}</button>
            </div>
          </div>
        </div>
      )}

      {showIntro && (
        <div className={s.introOverlay}>
          <div className={s.introPanel}>
            <p>{t.ui.intro_monsters}</p>
            <p>{t.ui.intro_weapons}</p>
            <p>{t.ui.intro_content}</p>
            <p className={s.introTagline}>{t.ui.intro_tagline}</p>
            <button className={s.btnPrimary} onClick={() => navigate('/start-class')}>
              {t.ui.btn_enter}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
