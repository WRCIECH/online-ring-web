import { useEffect, useMemo } from 'react'
import { previewMove, type CombatState, type CombatAction } from '../../engine/combat'
import { SACRIFICE_MULT } from '../../data/constants'
import { getTileBadges, computeEffectiveTags } from '../../data/tileBadges'
import { useT } from '../../i18n'
import type { MoveType } from '../../types/game'
import s from './TimerOverlay.module.css'

interface Props {
  state:        CombatState
  dispatch:     React.Dispatch<CombatAction>
  contentName?: string
}

function fmtTime(secs: number): string {
  const m  = Math.floor(secs / 60)
  const sc = Math.floor(secs % 60)
  return m > 0 ? `${m}:${String(sc).padStart(2, '0')}` : String(sc)
}

const MOVE_LABEL: Record<MoveType, string> = {
  Light: 'Light Attack',
  Heavy: 'Heavy Attack',
}

export default function TimerOverlay({ state, dispatch, contentName }: Props) {
  const { pendingTile, pendingMove, stepTimer, stepTotal, stepStarted, timerExpired, workflow } = state
  const effectiveTags = useMemo(() => computeEffectiveTags(workflow), [workflow])
  const t = useT()

  // Browser tab countdown
  useEffect(() => {
    if (!stepStarted || timerExpired) { document.title = 'Online Ring'; return }
    const startedAt = Date.now()
    const name = pendingTile?.name ?? ''
    const tick = () => {
      const remaining = Math.max(0, stepTotal - (Date.now() - startedAt) / 1000)
      const secs = Math.ceil(remaining)
      document.title = `⏱ ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} — ${name}`
    }
    tick()
    const id = setInterval(tick, 500)
    return () => { clearInterval(id); document.title = 'Online Ring' }
  }, [stepStarted, timerExpired, stepTotal, pendingTile?.name])

  // rAF countdown
  useEffect(() => {
    if (!stepStarted || timerExpired) return
    let last  = performance.now()
    let rafId: number
    const tick = (now: number) => {
      dispatch({ type: 'TICK', delta: (now - last) / 1000 })
      last  = now
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [stepStarted, timerExpired, dispatch])

  const pct       = stepTotal > 0 ? Math.max(0, stepTimer / stepTotal) : 0
  const isPreview = !stepStarted && !timerExpired
  const isActive  =  stepStarted && !timerExpired
  const isExpired =  timerExpired

  let header      = 'Preview — Ready to begin'
  let headerColor = '#7a7570'
  if (isActive)  { header = 'In Progress';                    headerColor = '#c9a93a' }
  if (isExpired) { header = "Time's Up — Did you finish?";   headerColor = '#c9a93a' }

  return (
    <div className={s.overlay}>
      <div className={s.panel}>
        {contentName && (
          <div className={s.contentName}>{contentName}</div>
        )}
        <div className={s.header} style={{ color: headerColor }}>{header}</div>
        <hr />

        {pendingTile && (
          <div className={s.taskName}>
            <div className={s.badgeRow}>
              {getTileBadges(pendingTile, effectiveTags.get(pendingTile.id), t).map(b => (
                <span
                  key={b.key}
                  className={s.badge}
                  title={b.detail}
                  style={b.color ? { borderColor: b.color, color: b.color } : undefined}
                >
                  {b.label}
                </span>
              ))}
            </div>
            {pendingMove && (
              <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--color-text-dim)', letterSpacing: '0.05em' }}>
                {MOVE_LABEL[pendingMove]}
              </div>
            )}
          </div>
        )}

        <div className={s.timerRow}>
          <div className={s.timerVal} style={{ color: pct < 0.2 ? '#e85555' : '#c9a93a' }}>
            {fmtTime(stepTimer)}
          </div>
          {(isActive || isExpired) && (
            <div className={s.barWrap}>
              <div className={s.barFill} style={{ width: `${(1 - pct) * 100}%` }} />
            </div>
          )}
        </div>

        {isPreview && (
          <div className={s.actions}>
            <button className={s.btnPrimary} onClick={() => dispatch({ type: 'START_TIMER' })}>
              Start Task
            </button>
          </div>
        )}

        {isActive && (
          <div className={s.actions}>
            <button className={s.btnPrimary} onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: true })}>
              Done
            </button>
            {pendingTile && pendingMove && (() => {
              const timeFrac = stepTotal > 0 ? stepTimer / stepTotal : 0
              const selfDmg  = Math.round(previewMove(state, pendingTile, pendingMove).damage * timeFrac * SACRIFICE_MULT)
              return (
                <button
                  className={s.btnSacrifice}
                  title={`Finish instantly — enemy still takes full damage, but you take ~${selfDmg} HP self-damage (${Math.round(timeFrac * 100)}% time remaining × ${SACRIFICE_MULT}).`}
                  onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: true, sacrificeTimeFrac: timeFrac })}
                >
                  Sacrifice{selfDmg > 0 ? ` (−${selfDmg} HP)` : ''}
                </button>
              )
            })()}
          </div>
        )}

        {isExpired && (
          <>
            <div className={s.expiredHint}>Did you complete the task?</div>
            <div className={s.confirmRow}>
              <button className={s.btnYes} onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: true })}>Yes</button>
              <button className={s.btnNo}  onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: false })}>No</button>
            </div>
          </>
        )}

        <div className={s.backRow}>
          <button className={s.btnBack} onClick={() => dispatch({ type: 'CANCEL_TIMER' })}>
            {isActive || isExpired ? 'Give Up (−HP)' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
