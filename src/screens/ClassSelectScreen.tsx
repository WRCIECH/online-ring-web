import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { CLASS_DEFINITIONS } from '../data/classes'
import type { StatKey } from '../types/game'
import { useT } from '../i18n'
import WeaponIcon from '../components/WeaponIcon'
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

interface Tip { node: React.ReactNode; x: number; y: number }

const N = CLASS_DEFINITIONS.length

export default function ClassSelectScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const t        = useT()
  const [activeIndex, setActiveIndex] = useState(0)
  const [tip, setTip] = useState<Tip | null>(null)

  const showTip = useCallback((e: React.MouseEvent, node: React.ReactNode) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ node, x: r.left + r.width / 2, y: r.top })
  }, [])
  const hideTip = useCallback(() => setTip(null), [])

  function prev() { setActiveIndex(i => (i - 1 + N) % N) }
  function next() { setActiveIndex(i => (i + 1) % N) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleConfirm() {
    store.initClass(CLASS_DEFINITIONS[activeIndex].id)
    navigate('/locations')
  }

  const activeCls = CLASS_DEFINITIONS[activeIndex]
  const highStat  = ALL_STAT_KEYS.reduce((best, k) =>
    activeCls.startingStats[k] > activeCls.startingStats[best] ? k : best, 'VIG' as StatKey)
  const accent = STAT_COLOUR[highStat] ?? '#ccaa22'

  const visible = ([-2, -1, 0, 1, 2] as const).map(offset => ({
    cls: CLASS_DEFINITIONS[(activeIndex + offset + N) % N],
    offset,
  }))

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>{t.ui.choose_class_title}</h1>
        <p className={s.subtitle}>{t.ui.choose_class_sub}</p>
      </div>

      <div className={s.carousel}>
        <button className={s.navBtn} onClick={prev} aria-label="Previous class">‹</button>

        <div className={s.track}>
          {visible.map(({ cls, offset }) => {
            const abs   = Math.abs(offset)
            const clsName = t.classes[cls.id]?.name ?? cls.name
            const clsDesc = t.classes[cls.id]?.description ?? cls.description
            const wEntry  = t.weapons[cls.weaponClass]

            const cardClass = abs === 0 ? s.cardCenter : abs === 1 ? s.cardNear : s.cardFar

            if (abs === 2) {
              return (
                <button
                  key={`${offset}-${cls.id}`}
                  className={[s.card, cardClass].join(' ')}
                  onClick={() => setActiveIndex((activeIndex + offset + N) % N)}
                  style={{ '--accent': STAT_COLOUR[ALL_STAT_KEYS.reduce((b, k) => cls.startingStats[k] > cls.startingStats[b] ? k : b, 'VIG' as StatKey)] ?? '#ccaa22' } as React.CSSProperties}
                >
                  <div className={s.accentBar} />
                  <div className={s.cardBody}>
                    <div className={s.className}>{clsName}</div>
                  </div>
                </button>
              )
            }

            if (abs === 1) {
              return (
                <button
                  key={`${offset}-${cls.id}`}
                  className={[s.card, cardClass].join(' ')}
                  onClick={() => setActiveIndex((activeIndex + offset + N) % N)}
                  style={{ '--accent': STAT_COLOUR[ALL_STAT_KEYS.reduce((b, k) => cls.startingStats[k] > cls.startingStats[b] ? k : b, 'VIG' as StatKey)] ?? '#ccaa22' } as React.CSSProperties}
                >
                  <div className={s.accentBar} />
                  <div className={s.cardBody}>
                    <div className={s.className}>{clsName}</div>
                    <div className={s.weaponIconWrapSide}>
                      <WeaponIcon weaponClass={cls.weaponClass} className={s.weaponIcon} />
                    </div>
                  </div>
                </button>
              )
            }

            // Centre card — full detail
            const weaponTip = (
              <>
                <div className={s.tipTitle}>{wEntry?.name ?? cls.weaponClass}</div>
                <div className={s.tipBody}>{wEntry?.description}</div>
              </>
            )
            function statTip(k: StatKey) {
              return (
                <>
                  <div className={s.tipTitle}>{t.ui[`stat_${k}`] ?? k}</div>
                  <div className={s.tipBody}>{t.ui[`stat_${k}_desc`]}</div>
                </>
              )
            }

            return (
              <div
                key={`${offset}-${cls.id}`}
                className={[s.card, cardClass].join(' ')}
                style={{ '--accent': accent } as React.CSSProperties}
              >
                <div className={s.accentBar} style={{ background: accent }} />
                <div className={s.cardBody}>
                  <div className={s.classHeader}>
                    <div className={s.className}>{clsName}</div>
                    <div
                      className={s.weaponIconWrap}
                      onMouseEnter={e => showTip(e, weaponTip)}
                      onMouseLeave={hideTip}
                    >
                      <WeaponIcon weaponClass={cls.weaponClass} className={s.weaponIcon} />
                    </div>
                  </div>
                  <div className={s.classDesc}>{clsDesc}</div>
                  <div className={s.statsWrap}>
                    <div className={s.statsCoreRow}>
                      {CORE_STATS.map(k => (
                        <div
                          key={k}
                          className={[s.statCell, cls.startingStats[k] >= 14 ? s.statHigh : cls.startingStats[k] >= 11 ? s.statMid : ''].join(' ')}
                          onMouseEnter={e => showTip(e, statTip(k))}
                          onMouseLeave={hideTip}
                        >
                          <span className={s.statKey}>{k}</span>
                          <span className={s.statVal}>{cls.startingStats[k]}</span>
                        </div>
                      ))}
                    </div>
                    <div className={s.statsContentGrid}>
                      {CONTENT_STATS.map(k => (
                        <div
                          key={k}
                          className={[s.statCell, cls.startingStats[k] >= 14 ? s.statHigh : cls.startingStats[k] >= 11 ? s.statMid : ''].join(' ')}
                          onMouseEnter={e => showTip(e, statTip(k))}
                          onMouseLeave={hideTip}
                        >
                          <span className={s.statKey}>{k}</span>
                          <span className={s.statVal}>{cls.startingStats[k]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button className={s.navBtn} onClick={next} aria-label="Next class">›</button>
      </div>

      <div className={s.counter}>
        {activeIndex + 1} / {N}
      </div>

      <div className={s.footer}>
        <button className={s.btnConfirm} onClick={handleConfirm}>
          {t.ui.btn_begin_as} {t.classes[activeCls.id]?.name ?? activeCls.name}
        </button>
      </div>

      {tip && (
        <div className={s.tooltip} style={{ left: tip.x, top: tip.y }}>
          {tip.node}
        </div>
      )}
    </div>
  )
}
