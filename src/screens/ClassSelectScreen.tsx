import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { CLASS_DEFINITIONS } from '../data/classes'
import type { StatKey } from '../types/game'
import { useT } from '../i18n'
import s from './ClassSelectScreen.module.css'

const CORE_STATS:    StatKey[] = ['VIG', 'END']
const CONTENT_STATS: StatKey[] = ['TEXT','VIDEO','AUDIO','GRAPHIC','VELOCITY','DEPTH','PARASOCIAL','FRICTION','INSIGHT']
const ALL_STAT_KEYS: StatKey[] = [...CORE_STATS, ...CONTENT_STATS]
const STAT_COLOUR: Partial<Record<StatKey, string>> = {
  VIG: '#cc3333', END: '#33aacc',
  TEXT: '#4488cc', VIDEO: '#dd7722', AUDIO: '#cc4455',
  GRAPHIC: '#22cc88', VELOCITY: '#88cc22', DEPTH: '#2244cc',
  PARASOCIAL: '#cc44aa', FRICTION: '#cc5522', INSIGHT: '#aa44cc',
}

export default function ClassSelectScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()
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
        <h1 className={s.title}>{t.ui.choose_class_title}</h1>
        <p className={s.subtitle}>{t.ui.choose_class_sub}</p>
      </div>

      <div className={s.grid}>
        {CLASS_DEFINITIONS.map(cls => {
          const isChosen = chosen === cls.id
          const highStat = ALL_STAT_KEYS.reduce((best, k) =>
            cls.startingStats[k] > cls.startingStats[best] ? k : best, 'VIG' as StatKey)
          const accent = STAT_COLOUR[highStat] ?? '#ccaa22'
          const clsName = t.classes[cls.id]?.name ?? cls.name
          const clsDesc = t.classes[cls.id]?.description ?? cls.description
          const wName   = t.weapons[cls.weaponClass]?.name ?? cls.weaponClass

          return (
            <button
              key={cls.id}
              className={[s.card, isChosen ? s.cardChosen : ''].join(' ')}
              style={{ '--accent': accent } as React.CSSProperties}
              onClick={() => setChosen(cls.id)}
            >
              <div className={s.accentBar} style={{ background: accent }} />
              <div className={s.cardBody}>
                <div className={s.className}>{clsName}</div>
                <div className={s.classDesc}>{clsDesc}</div>
                <div className={s.weaponBadge}>{wName}</div>
                <div className={s.statsWrap}>
                  <div className={s.statsCoreRow}>
                    {CORE_STATS.map(k => (
                      <div key={k} className={[s.statCell, cls.startingStats[k] >= 14 ? s.statHigh : cls.startingStats[k] >= 11 ? s.statMid : ''].join(' ')}>
                        <span className={s.statKey}>{k}</span>
                        <span className={s.statVal}>{cls.startingStats[k]}</span>
                      </div>
                    ))}
                  </div>
                  <div className={s.statsContentGrid}>
                    {CONTENT_STATS.map(k => (
                      <div key={k} className={[s.statCell, cls.startingStats[k] >= 14 ? s.statHigh : cls.startingStats[k] >= 11 ? s.statMid : ''].join(' ')}>
                        <span className={s.statKey}>{k}</span>
                        <span className={s.statVal}>{cls.startingStats[k]}</span>
                      </div>
                    ))}
                  </div>
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
          {chosenDef
            ? `${t.ui.btn_begin_as} ${t.classes[chosenDef.id]?.name ?? chosenDef.name}`
            : t.ui.btn_select_class}
        </button>
      </div>
    </div>
  )
}
