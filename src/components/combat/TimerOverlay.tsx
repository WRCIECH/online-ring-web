import { useEffect, useRef } from 'react'
import type { CombatState, CombatAction } from '../../engine/combat'
import { STA_DEFENSE_GAIN } from '../../engine/combat'
import { WEAPONS, calcStepDamage } from '../../data/weapons'
import type { GeneratedMoveset, WeaponInstance, DamageType } from '../../types/game'
import { appendToLog } from '../../engine/save'
import WeaponSprite from '../icons/WeaponSprite'
import s from './TimerOverlay.module.css'

interface Props { state: CombatState; dispatch: React.Dispatch<CombatAction> }

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60), sc = Math.floor(secs % 60)
  return m > 0 ? `${m}:${String(sc).padStart(2,'0')}` : String(sc)
}

const DMG_TYPE_COLOURS: Partial<Record<DamageType, string>> = {
  standard: '#aaaaaa', strike: '#cc9944', slash: '#cc4444', pierce: '#44aacc',
  lightning: '#eedd44', fire: '#ee6622', magic: '#8855ee', holy: '#eecc55',
  occult: '#aa44aa', grafting: '#55aa55', poison: '#66aa44',
}

export default function TimerOverlay({ state, dispatch }: Props) {
  const { stepTimer, stepTotal, stepStarted, timerExpired,
          timerIsDefense, pendingStep, pendingDefenseAction, pendingMoveset,
          pendingWeaponId, chainStepIdx, playerStats, weaponLevels,
          currentMove } = state
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

  function flushNotes(accomplished: boolean) {
    const text = textRef.current?.value ?? ''
    if (accomplished && pendingStep) appendToLog(pendingStep.name, text)
  }

  const pct = stepTotal > 0 ? Math.max(0, stepTimer / stepTotal) : 0
  const isPreview = !stepStarted && !timerExpired
  const isActive  = stepStarted && !timerExpired
  const isExpired = timerExpired

  let header = 'TASK PREVIEW'
  let headerColor = '#7a7570'
  if (isActive && !timerIsDefense) { header = 'TASK IN PROGRESS'; headerColor = '#c9a93a' }
  if (isActive && timerIsDefense)  { header = 'DEFEND — COMPLETE IN TIME'; headerColor = '#cc4422' }
  if (isActive && timerIsDefense && pendingDefenseAction === 'parry') { header = 'PARRY — COMMIT TO PUBLISH'; headerColor = '#cc4422' }
  if (isExpired) { header = "TIME'S UP!"; headerColor = '#c9a93a' }

  const taskName  = pendingStep?.name ?? ''
  const backLabel = timerIsDefense
    ? 'Give up  (take full damage)'
    : isActive ? 'Back  (costs stamina)' : 'Back'

  // ── Context info strip ───────────────────────────────────────────────────
  const gm = pendingMoveset as GeneratedMoveset | null
  const weapon   = pendingWeaponId ? WEAPONS[pendingWeaponId] : null
  const wi       = weapon as WeaponInstance | undefined
  const wLevel   = weaponLevels[pendingWeaponId] ?? 0
  const totalSteps   = pendingMoveset?.steps.length ?? 1
  const stepNum      = (chainStepIdx ?? 0) + 1
  const computedDmg  = (!timerIsDefense && pendingStep && weapon)
    ? calcStepDamage(pendingStep, weapon, wLevel, playerStats)
    : null
  const dmgType = pendingStep?.damage_type
  const dmgTypeColor = dmgType ? (DMG_TYPE_COLOURS[dmgType] ?? '#aaaaaa') : null

  return (
    <div className={s.overlay}>
      <div className={s.panel}>
        <div className={s.header} style={{ color: headerColor }}>{header}</div>
        <hr />

        {/* ── Context strip ────────────────────────────────────────────── */}
        <div className={s.contextStrip}>
          {!timerIsDefense && pendingMoveset && (
            <>
              <span className={s.ctxMoveset}>{pendingMoveset.name}</span>
              {computedDmg !== null && (
                <span className={s.ctxDmg}>
                  {dmgTypeColor && (
                    <span style={{ color: dmgTypeColor }}>●</span>
                  )}{' '}
                  {computedDmg} dmg
                </span>
              )}
              {pendingMoveset.stamina_cost > 0 && (
                <span className={s.ctxSta}>−{pendingMoveset.stamina_cost} STA</span>
              )}
              {(pendingMoveset.fp_cost ?? 0) > 0 && (
                <span className={s.ctxFp}>−{pendingMoveset.fp_cost} FP</span>
              )}
              {wi && (
                <span className={s.ctxWeapon}>
                  <WeaponSprite
                    weaponClass={wi.weapon_class}
                    rarity={wi.rarity}
                    poiseWeight={wi.poise_weight}
                    size={22}
                  />
                  {wi.name}
                </span>
              )}
            </>
          )}
          {timerIsDefense && pendingDefenseAction === 'roll' && (
            <>
              <span className={s.ctxOutcome}>✓ Success → +{STA_DEFENSE_GAIN} STA, 0 dmg taken</span>
              <span className={s.ctxOutcomeFail}>✗ Fail → {currentMove?.damage ?? '?'} dmg taken</span>
            </>
          )}
          {timerIsDefense && pendingDefenseAction === 'parry' && (
            <>
              <span className={s.ctxOutcome}>✓ Success → {currentMove?.damage ?? '?'} counter-dmg, full STA</span>
              <span className={s.ctxOutcomeFail}>✗ Fail → {currentMove?.damage ?? '?'} dmg taken</span>
            </>
          )}
        </div>

        {pendingStep?.badges && pendingStep.badges.length > 0 ? (
          <div className={s.badges}>
            {pendingStep.badges.map((badge, i) => (
              <span
                key={i}
                className={s.badge}
                style={badge.color ? { borderColor: badge.color, color: badge.color } : undefined}
              >
                {badge.label}
                <span className={s.badgeTip}>{badge.detail}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className={s.taskName}>{taskName}</div>
        )}

        <textarea
          ref={textRef}
          className={s.notes}
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
            <button className={s.btnPrimary} onClick={() => {
              flushNotes(true)
              dispatch({ type: 'TIMER_RESULT', accomplished: true, statusApplied: true })
            }}>
              Done!
            </button>
          </div>
        )}

        {isExpired && (
          <>
            <div className={s.expiredHint}>Did you complete the task?</div>
            <div className={s.confirmRow}>
              <button className={s.btnYes} onClick={() => {
                flushNotes(true)
                dispatch({ type: 'TIMER_RESULT', accomplished: true, statusApplied: true })
              }}>
                Yes, I did it!
              </button>
              <button className={s.btnNo} onClick={() => {
                flushNotes(false)
                dispatch({ type: 'TIMER_RESULT', accomplished: false })
              }}>
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
