import { useState, useEffect, useRef } from 'react'
import { calcTileDamage } from '../../engine/combat'
import { SACRIFICE_MULT, MEDIUM_CHUNK_SECS, CAMPAIGN_STEP_SECS } from '../../data/constants'
import type { WeaponCampaign, WeaponInstance, WorkflowTile } from '../../types/game'
import { useT } from '../../i18n'
import s from './CampaignActionPanel.module.css'

// Synthetic tiles for the three fixed, unscaled (not weapon-class time_mod-scaled) durations.
const MEDIUM_TILE: WorkflowTile = {
  id: '_campaign_medium', type: 'Research', name: '',
  time_light: MEDIUM_CHUNK_SECS, time_heavy: MEDIUM_CHUNK_SECS,
  is_completed: false, repeat_count: 0,
}
const STEP_TILE: WorkflowTile = {
  id: '_campaign_step', type: 'Produce', name: '',
  time_light: CAMPAIGN_STEP_SECS, time_heavy: CAMPAIGN_STEP_SECS,
  is_completed: false, repeat_count: 0,
}

type ModeKind = 'medium' | 'heavy' | 'research'

type TimerCtx = {
  mode: ModeKind
  damage: number
  totalSecs: number
  startedAt: number
  contentName: string
  itemId?: string   // chunkId / partId; absent for research (no elements)
}
type ModeStartCtx = { mode: ModeKind; name: string; damage: number; secs: number; itemId?: string }

interface Props {
  campaign: WeaponCampaign
  weapon: WeaponInstance | undefined
  weaponLevel: number
  superhitCharges: number
  playerHp: number
  canAct: boolean
  onMediumChunk:  (damage: number, chunkId: string) => void
  onHeavyPart:    (damage: number, partId: string) => void
  onResearchStep: (damage: number) => void
  onSuperhit:     (damage: number) => void
  onSacrifice:    (selfDmg: number) => void
}

function fmtSecs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s)
}

export default function CampaignActionPanel({
  campaign, weapon, weaponLevel, superhitCharges, playerHp, canAct,
  onMediumChunk, onHeavyPart, onResearchStep, onSuperhit, onSacrifice,
}: Props) {
  const t = useT()
  const [timer, setTimer]         = useState<TimerCtx | null>(null)
  const [confirmDmg, setConfirmDmg] = useState<number | null>(null)
  const [modeStart, setModeStart] = useState<ModeStartCtx | null>(null)
  const [remaining, setRemaining] = useState(0)
  const doneRef = useRef(false)

  const mediumDmg   = Math.round(calcTileDamage(MEDIUM_TILE, 'Light', weapon, weaponLevel))
  const stepDmg     = Math.round(calcTileDamage(STEP_TILE, 'Heavy', weapon, weaponLevel))
  const superhitDmg = Math.round(mediumDmg * 5)
  const canShit     = superhitCharges > 0

  const medium = campaign.medium
  const nextChunk = medium?.chunks.find(c => !c.done)

  const heavy = campaign.heavy
  const nextPart = heavy?.parts.find(p => !p.done)

  const research = campaign.research

  function prodBadge(type: string): string {
    return (t.content.product as Record<string, { badge_label: string }>)[type]?.badge_label ?? type
  }

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!timer) return
    doneRef.current = false
    const id = setInterval(() => {
      const elapsed = (Date.now() - timer.startedAt) / 1000
      const left = Math.max(0, timer.totalSecs - elapsed)
      setRemaining(left)
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true
        clearInterval(id)
        handleTimerDone(timer)
      }
    }, 100)
    setRemaining(timer.totalSecs)
    return () => clearInterval(id)
  }, [timer]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimerDone(ctx: TimerCtx, selfDmg = 0) {
    setTimer(null)
    if (ctx.mode === 'medium' && ctx.itemId) onMediumChunk(ctx.damage, ctx.itemId)
    else if (ctx.mode === 'heavy' && ctx.itemId) onHeavyPart(ctx.damage, ctx.itemId)
    else if (ctx.mode === 'research') onResearchStep(ctx.damage)
    if (selfDmg > 0) onSacrifice(selfDmg)
  }

  function startTimer(mode: ModeKind, damage: number, secs: number, contentName: string, itemId?: string) {
    setTimer({ mode, damage, totalSecs: secs, startedAt: Date.now(), contentName, itemId })
  }

  function handleConfirmYes() {
    if (confirmDmg == null) return
    onSuperhit(confirmDmg)
    setConfirmDmg(null)
  }

  // ── Timer view ─────────────────────────────────────────────────────────────
  if (timer) {
    const pct = Math.max(0, remaining / timer.totalSecs) * 100
    const modeLabel = timer.mode === 'medium' ? 'Drafting' : timer.mode === 'heavy' ? 'Heavy work' : 'Researching'
    const timeFrac = timer.totalSecs > 0 ? remaining / timer.totalSecs : 0
    const selfDmg  = Math.round(timer.damage * timeFrac * SACRIFICE_MULT)
    const canSacrifice = selfDmg < playerHp
    return (
      <div className={s.timerView}>
        <div className={s.timerContentName}>{timer.contentName}</div>
        <div className={s.timerModeLabel}>{modeLabel}</div>
        <div className={s.timerRing}>
          <svg viewBox="0 0 64 64" className={s.timerSvg}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={timer.mode === 'medium' ? '#60c0e0' : '#e0a060'}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
          </svg>
          <span className={s.timerCount}>{fmtSecs(remaining)}</span>
        </div>
        <div className={s.timerDmg}>⚔ {timer.damage}</div>
        <div className={s.timerActions}>
          <button
            className={s.timerDoneBtn}
            onClick={() => { doneRef.current = true; handleTimerDone({ ...timer, totalSecs: 0 }) }}
          >
            Done
          </button>
          <button
            className={s.sacrificeBtn}
            disabled={!canSacrifice}
            title={`Finish instantly — enemy takes full damage, you take ${selfDmg} HP (${Math.round(timeFrac * 100)}% remaining × ${SACRIFICE_MULT}×)`}
            onClick={() => { doneRef.current = true; handleTimerDone({ ...timer, totalSecs: 0 }, selfDmg) }}
          >
            Sacrifice{selfDmg > 0 ? ` (−${selfDmg} HP)` : ''}
          </button>
        </div>
      </div>
    )
  }

  // ── Mode start confirmation ─────────────────────────────────────────────────
  if (modeStart) {
    return (
      <div className={s.confirmView}>
        <div className={s.confirmContentName}>{modeStart.name}</div>
        <div className={s.confirmLabel}>Start {fmtSecs(modeStart.secs)} timer?</div>
        <div className={s.confirmBtns}>
          <button
            className={s.confirmYes}
            onClick={() => {
              startTimer(modeStart.mode, modeStart.damage, modeStart.secs, modeStart.name, modeStart.itemId)
              setModeStart(null)
            }}
          >
            Start
          </button>
          <button className={s.confirmNo} onClick={() => setModeStart(null)}>Cancel</button>
        </div>
      </div>
    )
  }

  // ── Superhit confirmation ───────────────────────────────────────────────────
  if (confirmDmg != null) {
    return (
      <div className={s.confirmView}>
        <div className={s.confirmLabel}>💥 Did you land the superhit?</div>
        <div className={s.confirmDmg}>⚔ {confirmDmg}</div>
        <div className={s.confirmBtns}>
          <button className={s.confirmYes} onClick={handleConfirmYes}>Yes</button>
          <button className={s.confirmNo}  onClick={() => setConfirmDmg(null)}>No</button>
        </div>
      </div>
    )
  }

  // ── Main tile panel ────────────────────────────────────────────────────────
  // A weapon has exactly one of medium/heavy/research — render that one mode tile.
  return (
    <div className={s.panel}>
      {medium && (
        <button
          className={[s.tile, s.tileMedium, !nextChunk || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
          disabled={!nextChunk || !canAct}
          onClick={() => nextChunk && setModeStart({
            mode: 'medium', name: nextChunk.name, damage: mediumDmg, secs: MEDIUM_CHUNK_SECS, itemId: nextChunk.id,
          })}
        >
          <span className={s.tileLabel}>Medium</span>
          <span className={s.tileDmg}>⚔ {mediumDmg}</span>
          {nextChunk && (
            <>
              <span className={s.tileTag}>{prodBadge(nextChunk.content_type)}</span>
              <span className={s.tileNameHint}>{nextChunk.name}</span>
            </>
          )}
        </button>
      )}

      {heavy && (
        <button
          className={[s.tile, s.tileHeavy, !nextPart || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
          disabled={!nextPart || !canAct}
          onClick={() => nextPart && setModeStart({
            mode: 'heavy', name: nextPart.name, damage: stepDmg, secs: CAMPAIGN_STEP_SECS, itemId: nextPart.id,
          })}
        >
          <span className={s.tileLabel}>Heavy</span>
          <span className={s.tileDmg}>⚔ {stepDmg}</span>
          <span className={s.tileTag}>{prodBadge(heavy.product_type)}</span>
          {nextPart && <span className={s.tileNameHint}>{nextPart.name}</span>}
        </button>
      )}

      {research && (
        <button
          className={[s.tile, s.tileHeavy, !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
          disabled={!canAct}
          onClick={() => setModeStart({
            mode: 'research', name: 'Research', damage: stepDmg, secs: CAMPAIGN_STEP_SECS,
          })}
        >
          <span className={s.tileLabel}>Research</span>
          <span className={s.tileDmg}>⚔ {stepDmg}</span>
          <span className={s.tileHint}>{research.done_steps % research.cycle_steps}/{research.cycle_steps} to next ✦</span>
        </button>
      )}

      {/* Superhit */}
      <button
        className={[s.tile, s.tileSuperhit, !canShit || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!canShit || !canAct}
        onClick={() => setConfirmDmg(superhitDmg)}
      >
        <span className={s.tileLabel}>Superhit</span>
        <span className={s.tileDmg}>⚔ {superhitDmg}</span>
        <span className={s.tileHint}>{superhitCharges} charge{superhitCharges !== 1 ? 's' : ''}</span>
      </button>
    </div>
  )
}
