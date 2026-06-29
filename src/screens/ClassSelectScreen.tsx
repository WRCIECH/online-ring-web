import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { CLASS_DEFINITIONS } from '../data/classes'
import type { StatKey } from '../types/game'
import { useT } from '../i18n'
import WeaponIcon from '../components/WeaponIcon'
import ClassSymbol from '../components/ClassSymbol'
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

function getAccent(cls: (typeof CLASS_DEFINITIONS)[0]): string {
  const highStat = ALL_STAT_KEYS.reduce((best, k) =>
    cls.startingStats[k] > cls.startingStats[best] ? k : best, 'VIG' as StatKey)
  return STAT_COLOUR[highStat] ?? '#ccaa22'
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
  const accent    = getAccent(activeCls)

  const visible = ([-1, 0, 1] as const).map(offset => ({
    cls: CLASS_DEFINITIONS[(activeIndex + offset + N) % N],
    offset,
  }))

  const weaponTip = (
    <>
      <div className={s.tipTitle}>{t.weapons[activeCls.weaponClass]?.name ?? activeCls.weaponClass}</div>
      <div className={s.tipBody}>{t.weapons[activeCls.weaponClass]?.description}</div>
    </>
  )

  function statTip(k: StatKey) {
    return (
      <>
        <div className={s.tipTitle}>{(t.ui as Record<string,string>)[`stat_${k}`] ?? k}</div>
        <div className={s.tipBody}>{(t.ui as Record<string,string>)[`stat_${k}_desc`]}</div>
      </>
    )
  }

  return (
    <div className={s.root}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className={s.header}>
        <h1 className={s.title}>{t.ui.choose_class_title}</h1>
        <p className={s.subtitle}>{t.ui.choose_class_sub}</p>
      </div>

      {/* ── Main: carousel + stats panel ─────────────────────────── */}
      <div className={s.main}>

        {/* Carousel column */}
        <div className={s.carouselSection}>
          <div className={s.carousel}>
            <button className={s.navBtn} onClick={prev} aria-label="Previous class">‹</button>

            <div className={s.track}>
              {visible.map(({ cls, offset }) => {
                const abs       = Math.abs(offset)
                const cardAccent = getAccent(cls)
                const clsName   = t.classes[cls.id]?.name ?? cls.name
                const clsDesc   = t.classes[cls.id]?.description ?? cls.description
                const cardCls   = abs === 0 ? s.cardCenter : s.cardNear

                return (
                  <div
                    key={`${offset}-${cls.id}`}
                    className={[s.card, cardCls].join(' ')}
                    style={{ '--accent': cardAccent } as React.CSSProperties}
                    onClick={abs > 0 ? () => setActiveIndex((activeIndex + offset + N) % N) : undefined}
                    role={abs > 0 ? 'button' : undefined}
                    tabIndex={abs > 0 ? 0 : undefined}
                  >
                    <div className={s.cardTop}>
                      {abs === 0 && (
                        <div className={s.cardTopWeapon}>
                          <WeaponIcon weaponClass={cls.weaponClass} className={s.cardTopWeaponImg} />
                        </div>
                      )}
                      <div className={s.cardTopName}>{clsName}</div>
                    </div>
                    <div className={s.cardArt}>
                      <div className={s.cardArtGlow} />
                      <ClassSymbol classId={cls.id} className={s.cardSymbol} />
                      {abs === 0 && (
                        <div className={s.cardDescOverlay}>{clsDesc}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <button className={s.navBtn} onClick={next} aria-label="Next class">›</button>
          </div>

          {/* Dot indicators */}
          <div className={s.dots}>
            {CLASS_DEFINITIONS.map((_, i) => (
              <button
                key={i}
                className={i === activeIndex ? s.dotActive : s.dot}
                onClick={() => setActiveIndex(i)}
                aria-label={CLASS_DEFINITIONS[i].name}
              />
            ))}
          </div>

          <button
            className={s.btnConfirm}
            onClick={handleConfirm}
            style={{ '--accent': accent } as React.CSSProperties}
          >
            {t.ui.btn_begin_as} {t.classes[activeCls.id]?.name ?? activeCls.name}
          </button>
        </div>

        {/* Stats panel */}
        <aside className={s.statsPanel} style={{ '--accent': accent } as React.CSSProperties}>
          <div className={s.spClassName}>{t.classes[activeCls.id]?.name ?? activeCls.name}</div>
          <p className={s.spDesc}>{t.classes[activeCls.id]?.description ?? activeCls.description}</p>

          <div className={s.spSection}>Starting Stats</div>
          <div className={s.spStats}>
            {ALL_STAT_KEYS.map(k => (
              <div
                key={k}
                className={s.spStatRow}
                onMouseEnter={e => showTip(e, statTip(k))}
                onMouseLeave={hideTip}
              >
                <span className={s.spStatKey}>{k}</span>
                <div className={s.spBar}>
                  <div
                    className={s.spBarFill}
                    style={{ width: `${Math.max(0, (activeCls.startingStats[k] - 8) / 8 * 100)}%` }}
                  />
                </div>
                <span className={s.spStatVal}>{activeCls.startingStats[k]}</span>
              </div>
            ))}
          </div>

          <div className={s.spSection}>Starting Equipment</div>
          <div
            className={s.spWeapon}
            onMouseEnter={e => showTip(e, weaponTip)}
            onMouseLeave={hideTip}
          >
            <div className={s.spWeaponIcon}>
              <WeaponIcon weaponClass={activeCls.weaponClass} className={s.spWeaponIconImg} />
            </div>
            <div className={s.spWeaponName}>
              {t.weapons[activeCls.weaponClass]?.name ?? activeCls.weaponClass}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className={s.bottomBar}>
        <div className={s.bottomTagline}>Every Path Creates a Story</div>
        <div className={s.bottomSub}>Choose wisely.</div>
      </div>

      {tip && (
        <div className={s.tooltip} style={{ left: tip.x, top: tip.y }}>
          {tip.node}
        </div>
      )}
    </div>
  )
}
