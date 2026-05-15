import { useEffect, useRef } from 'react'
import type { CombatState, CombatAction } from '../../engine/combat'
import { loadNote, saveNote } from '../../engine/save'
import s from './TimerOverlay.module.css'

interface Props { state: CombatState; dispatch: React.Dispatch<CombatAction> }

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), sc = Math.floor(secs % 60)
  return m > 0 ? `${m}:${String(sc).padStart(2,'0')}` : String(sc)
}

export default function TimerOverlay({ state, dispatch }: Props) {
  const { stepTimer, stepTotal, stepStarted, timerExpired,
          timerIsDefense, pendingStep, defenseParryStep } = state
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  // rAF-based countdown
  useEffect(() => {
    if (!stepStarted || timerExpired) return
    let last = performance.now()
    let rafId: number
    const tick = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      dispatch({ type: 'TICK', delta })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [stepStarted, timerExpired, dispatch])

  // Focus textarea when timer starts
  useEffect(() => {
    if (stepStarted && !timerExpired) textRef.current?.focus()
  }, [stepStarted, timerExpired])

  // Debounced note save
  function handleNoteChange(val: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveNote('Draft', val), 1500)
  }

  const pct = stepTotal > 0 ? Math.max(0, stepTimer / stepTotal) : 0
  const isPreview    = !stepStarted && !timerExpired
  const isActive     = stepStarted && !timerExpired
  const isExpired    = timerExpired

  let header = 'TASK PREVIEW'
  let headerColor = '#7a7570'
  if (isActive && !timerIsDefense) { header = 'TASK IN PROGRESS';       headerColor = '#c9a93a' }
  if (isActive && timerIsDefense)  { header = 'DEFEND — COMPLETE IN TIME'; headerColor = '#cc4422' }
  if (timerIsDefense && defenseParryStep === 1) header = 'PARRY — STEP 2 / 2'
  if (isExpired) { header = "TIME'S UP!"; headerColor = '#c9a93a' }

  const taskName = pendingStep?.name ?? ''
  const backLabel = timerIsDefense
    ? 'Give up  (take full damage)'
    : isActive ? 'Back  (costs stamina)' : 'Back'

  return (
    <div className={s.overlay}>
      <div className={s.panel}>
        <div className={s.header} style={{ color: headerColor }}>{header}</div>
        <hr />
        <div className={s.taskName}>{taskName}</div>

        <textarea
          ref={textRef}
          className={s.notes}
          defaultValue={loadNote('Draft')}
          onChange={e => handleNoteChange(e.target.value)}
          disabled={!isActive}
          placeholder={isActive ? 'Write your response here…' : 'Start the task to begin writing…'}
        />

        <div className={s.timerRow}>
          <div className={s.timerVal} style={{ color: pct < 0.2 ? '#e85555' : '#c9a93a' }}>
            {fmtTime(stepTimer)}
          </div>
          {(isActive || isExpired) && (
            <div className={s.barWrap}>
              <div className={s.barFill} style={{ width: `${(1 - pct) * 100}%` }}/>
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
            <button className={s.btnPrimary}
              onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: true })}>
              Done!
            </button>
          </div>
        )}

        {isExpired && (
          <>
            <div className={s.expiredHint}>Did you complete the task?</div>
            <div className={s.confirmRow}>
              <button className={s.btnYes}
                onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: true })}>
                Yes, I did it!
              </button>
              <button className={s.btnNo}
                onClick={() => dispatch({ type: 'TIMER_RESULT', accomplished: false })}>
                No, I failed
              </button>
            </div>
          </>
        )}

        {!isExpired && (
          <div className={s.backRow}>
            <button className={s.btnBack} onClick={() => dispatch({ type: 'CANCEL_TIMER' })}>
              {backLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
