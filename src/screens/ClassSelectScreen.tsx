import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { CLASS_DEFINITIONS } from '../data/classes'
import type { StatKey } from '../types/game'
import s from './ClassSelectScreen.module.css'

const STAT_KEYS: StatKey[] = ['VIG','END','MND','STR','DEX','INT','FAI','ARC']
const STAT_COLOUR: Partial<Record<StatKey, string>> = {
  VIG: '#cc3333', END: '#33aacc', MND: '#9944cc',
  STR: '#cc7722', DEX: '#22cc88', INT: '#4488cc', FAI: '#ccaa22', ARC: '#aa44cc',
}

const WEAPON_CLASS_LABEL: Record<string, string> = {
  straight_swords: 'Straight Sword',
  daggers: 'Dagger',
  greatswords: 'Greatsword',
  spears: 'Spear',
  katanas: 'Katana',
  torches: 'Torch',
}

export default function ClassSelectScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const [chosen, setChosen] = useState<string | null>(null)

  function handleConfirm() {
    if (!chosen) return
    store.initClass(chosen)
    navigate('/locations')
  }

  const chosenDef = CLASS_DEFINITIONS.find(c => c.id === chosen)

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Choose Your Class</h1>
        <p className={s.subtitle}>Your class defines your starting stats and weapon</p>
      </div>

      <div className={s.grid}>
        {CLASS_DEFINITIONS.map(cls => {
          const isChosen = chosen === cls.id
          const highStat = STAT_KEYS.reduce((best, k) =>
            cls.startingStats[k] > cls.startingStats[best] ? k : best, 'VIG' as StatKey)
          const accent = STAT_COLOUR[highStat] ?? '#ccaa22'

          return (
            <button
              key={cls.id}
              className={[s.card, isChosen ? s.cardChosen : ''].join(' ')}
              style={{ '--accent': accent } as React.CSSProperties}
              onClick={() => setChosen(cls.id)}
            >
              <div className={s.accentBar} style={{ background: accent }} />
              <div className={s.cardBody}>
                <div className={s.className}>{cls.name}</div>
                <div className={s.classDesc}>{cls.description}</div>
                <div className={s.weaponBadge}>{WEAPON_CLASS_LABEL[cls.weaponClass] ?? cls.weaponClass}</div>
                <div className={s.statsRow}>
                  {STAT_KEYS.map(k => (
                    <div key={k} className={[s.statCell, cls.startingStats[k] >= 14 ? s.statHigh : cls.startingStats[k] >= 11 ? s.statMid : ''].join(' ')}>
                      <span className={s.statKey}>{k}</span>
                      <span className={s.statVal}>{cls.startingStats[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className={s.footer}>
        <button
          className={s.btnConfirm}
          disabled={!chosen}
          onClick={handleConfirm}
        >
          {chosenDef ? `Begin as ${chosenDef.name}` : 'Select a Class'}
        </button>
      </div>
    </div>
  )
}
