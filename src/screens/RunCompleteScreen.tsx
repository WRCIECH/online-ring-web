import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MOVES } from '../data/movesets'
import type { StatKey } from '../types/game'
import s from './RunCompleteScreen.module.css'

const STAT_LABELS: Record<StatKey, string> = {
  VIG: 'Vigor',
  END: 'Endurance',
  MIND: 'Mind',
}

const STAT_DESC: Record<StatKey, string> = {
  VIG: 'Max HP',
  END: 'Max Stamina',
  MIND: 'Max FP',
}

export default function RunCompleteScreen() {
  const navigate  = useNavigate()
  const store     = useGameStore()
  const [chosenStat, setChosenStat] = useState<StatKey | null>(null)

  const newMovesets = store.owned_movesets.filter(id => MOVES[id])

  function pickStat(stat: StatKey) {
    if (chosenStat) return
    store.levelUpStat(stat)
    store.save()
    setChosenStat(stat)
  }

  function handleNewRun() {
    navigate('/weapons')
  }

  return (
    <div className={s.root}>
      <h1 className={s.title}>Run Complete</h1>
      <p className={s.subtitle}>Great Run #{store.run_count} — The Knight falls</p>

      <div className={s.card}>
        {/* Stat level-up */}
        <div className={s.section}>
          <div className={s.sectionTitle}>
            {chosenStat ? 'Stat increased' : 'Choose one stat to level up'}
          </div>
          <div className={s.statBtns}>
            {(['VIG', 'END', 'MIND'] as StatKey[]).map(stat => {
              const current = store.stats[stat]
              const isChosen = chosenStat === stat
              const isDimmed = chosenStat !== null && !isChosen
              return (
                <button
                  key={stat}
                  className={[s.statBtn, isChosen ? s.chosen : ''].join(' ')}
                  disabled={!!chosenStat}
                  style={{ opacity: isDimmed ? 0.4 : 1 }}
                  onClick={() => pickStat(stat)}
                >
                  <span className={s.statKey}>{stat}</span>
                  <span className={s.statVal}>{STAT_LABELS[stat]}</span>
                  <span className={s.statVal}>{STAT_DESC[stat]}</span>
                  {isChosen ? (
                    <span className={s.statArrow}>▲ {current} → {current + 1}</span>
                  ) : (
                    <span className={s.statVal}>currently {current}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Movesets unlocked this run */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Movesets earned this run</div>
          <div className={s.unlocks}>
            {newMovesets.length === 0 ? (
              <span className={s.none}>None this run</span>
            ) : (
              newMovesets.map(id => {
                const m = MOVES[id]
                return (
                  <div key={id} className={s.unlockItem}>
                    <span className={s.unlockDot}>◆</span>
                    <span className={s.unlockName}>{m.name}</span>
                    <span className={s.unlockDesc}>{m.steps[0]?.name}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className={s.footer}>
          <button
            className={s.btnBegin}
            disabled={!chosenStat}
            onClick={handleNewRun}
          >
            Begin New Run
          </button>
          {!chosenStat && (
            <p className={s.skipHint}>Select a stat to continue</p>
          )}
        </div>
      </div>
    </div>
  )
}
