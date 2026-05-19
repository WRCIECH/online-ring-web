import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, calcMaxHp, calcMaxStamina, calcMaxFp } from '../store/gameStore'
import { MOVES } from '../data/movesets'
import type { StatKey } from '../types/game'
import s from './RunCompleteScreen.module.css'

const STAT_RESOURCE: Record<StatKey, string> = { VIG: 'HP', END: 'Stamina', MIND: 'Focus' }

function currentMax(stat: StatKey, stats: Record<string, number>): number {
  if (stat === 'VIG')  return calcMaxHp(stats.VIG)
  if (stat === 'END')  return calcMaxStamina(stats.END)
  return calcMaxFp(stats.MIND)
}
function nextMax(stat: StatKey, stats: Record<string, number>): number {
  if (stat === 'VIG')  return calcMaxHp(stats.VIG + 1)
  if (stat === 'END')  return calcMaxStamina(stats.END + 1)
  return calcMaxFp(stats.MIND + 1)
}

export default function RunCompleteScreen() {
  const navigate  = useNavigate()
  const store     = useGameStore()
  const [selectedStat,  setSelectedStat]  = useState<StatKey | null>(null)
  const [confirmedStat, setConfirmedStat] = useState<StatKey | null>(null)

  const newMovesets = store.owned_movesets.filter(id => MOVES[id])

  function selectStat(stat: StatKey) {
    if (confirmedStat) return
    setSelectedStat(stat)
  }

  function confirmStat() {
    if (!selectedStat || confirmedStat) return
    store.levelUpStat(selectedStat)
    store.save()
    setConfirmedStat(selectedStat)
  }

  function handleNewRun() {
    navigate('/locations')
  }

  return (
    <div className={s.root}>
      <h1 className={s.title}>Run Complete</h1>
      <p className={s.subtitle}>Great Run #{store.run_count} — The Knight falls</p>

      <div className={s.card}>
        {/* Stat level-up */}
        <div className={s.section}>
          <div className={s.sectionTitle}>
            {confirmedStat ? 'Stat upgraded' : selectedStat ? 'Confirm your choice' : 'Choose one stat to level up'}
          </div>
          <div className={s.statBtns}>
            {(['VIG', 'END', 'MIND'] as StatKey[]).map(stat => {
              const isSelected  = selectedStat === stat
              const isConfirmed = confirmedStat === stat
              const isDimmed    = confirmedStat !== null && !isConfirmed
              const cur = currentMax(stat, store.stats)
              const nxt = nextMax(stat, store.stats)
              return (
                <button
                  key={stat}
                  className={[
                    s.statBtn,
                    isSelected && !confirmedStat ? s.selected : '',
                    isConfirmed ? s.confirmed : '',
                  ].join(' ')}
                  disabled={!!confirmedStat}
                  style={{ opacity: isDimmed ? 0.38 : 1 }}
                  onClick={() => selectStat(stat)}
                >
                  <span className={s.statResource}>{STAT_RESOURCE[stat]}</span>
                  <span className={s.statValues}>
                    {isConfirmed ? `${nxt} ✓` : `${cur} → ${nxt}`}
                  </span>
                </button>
              )
            })}
          </div>

          {selectedStat && !confirmedStat && (
            <button className={s.btnConfirm} onClick={confirmStat}>
              Upgrade {STAT_RESOURCE[selectedStat]} ({currentMax(selectedStat, store.stats)} → {nextMax(selectedStat, store.stats)})
            </button>
          )}
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
            disabled={!confirmedStat}
            onClick={handleNewRun}
          >
            Begin New Run
          </button>
          {!confirmedStat && (
            <p className={s.skipHint}>
              {selectedStat ? 'Confirm your upgrade above to continue' : 'Select a stat to continue'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
