import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { hasSave, eraseSave } from '../engine/save'
import s from './TitleScreen.module.css'

export default function TitleScreen() {
  const navigate  = useNavigate()
  const store     = useGameStore()
  const saveExists = hasSave()
  const [confirming, setConfirming] = useState(false)

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
    navigate('/start-weapon')
  }

  return (
    <div className={s.root}>
      <h1 className={s.title}>Online Ring</h1>
      <p className={s.subtitle}>A Content Creator RPG</p>

      {store.run_count > 0 && (
        <p className={s.runCount}>Great Run #{store.run_count}</p>
      )}

      <div className={s.intro}>
        <p>Every piece of content you haven't made is an enemy waiting in a dungeon.</p>
        <p>Pick your weapon — your creative form. Choose your dungeon — your 48-hour sprint. Fight through procrastination, perfectionism, and burnout to reach the final boss: publishing.</p>
        <p className={s.introTagline}>Your output is your victory.</p>
      </div>

      <hr className={s.sep} />

      <div className={s.buttons}>
        {saveExists && (
          <button className={s.btnPrimary} onClick={handleContinue}>
            Continue
          </button>
        )}
        <button className={s.btnPrimary} onClick={handleNewGame}>
          New Game
        </button>
      </div>

      {confirming && (
        <div className={s.confirmOverlay}>
          <div className={s.confirmBox}>
            <h2>Erase Save?</h2>
            <p>Your current run and all progress will be permanently erased.</p>
            <div className={s.confirmButtons}>
              <button className={s.btnDanger} onClick={startFresh}>Erase &amp; Start</button>
              <button onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
