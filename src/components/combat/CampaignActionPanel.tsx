import { useState, useEffect, useRef } from 'react'
import { calcTileDamage } from '../../engine/combat'
import { SACRIFICE_MULT, MEDIUM_CHUNK_SECS, CAMPAIGN_STEP_SECS, SUPERHIT_DMG } from '../../data/constants'
import type { WeaponCampaign, WeaponInstance, WorkflowTile } from '../../types/game'
import { useT, localizeWeaponName } from '../../i18n'
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
  weaponId: string
  mode: ModeKind
  damage: number
  totalSecs: number
  startedAt: number
  contentName: string
  itemId?: string   // chunkId / partId; absent for research (no elements)
}
type ModeStartCtx = { weaponId: string; mode: ModeKind; name: string; damage: number; secs: number; itemId?: string }
// After a work session, nothing is assumed finished — a Medium chunk / Heavy
// part may take several passes, and Research has no discrete items at all, so
// "finished" is always an explicit player decision, never inferred from one timer.
type FinishCtx = { weaponId: string; mode: ModeKind; itemId?: string; name: string }

export interface WeaponEntry {
  weaponId: string
  weapon: WeaponInstance | undefined
  weaponLevel: number
  campaign: WeaponCampaign
}

interface Props {
  weapons: WeaponEntry[]
  superhitCharges: number
  playerHp: number
  canAct: boolean
  onMediumChunk:         (weaponId: string, damage: number, chunkId: string) => void
  onMediumChunkComplete: (weaponId: string, chunkId: string) => void
  onHeavyPart:           (weaponId: string, damage: number, partId: string) => void
  onHeavyPartComplete:   (weaponId: string, partId: string) => void
  onResearchStep:        (weaponId: string, damage: number) => void
  onResearchComplete:    (weaponId: string) => void
  onSuperhit:            (damage: number) => void
  onSacrifice:           (selfDmg: number) => void
}

function fmtSecs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s)
}

export default function CampaignActionPanel({
  weapons, superhitCharges, playerHp, canAct,
  onMediumChunk, onMediumChunkComplete, onHeavyPart, onHeavyPartComplete, onResearchStep, onResearchComplete, onSuperhit, onSacrifice,
}: Props) {
  const t = useT()
  const [timer, setTimer]         = useState<TimerCtx | null>(null)
  const [confirmDmg, setConfirmDmg] = useState<number | null>(null)
  const [modeStart, setModeStart] = useState<ModeStartCtx | null>(null)
  const [finish, setFinish]       = useState<FinishCtx | null>(null)
  const [remaining, setRemaining] = useState(0)
  const doneRef = useRef(false)

  const canShit = superhitCharges > 0

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
    if (ctx.mode === 'medium' && ctx.itemId) {
      onMediumChunk(ctx.weaponId, ctx.damage, ctx.itemId)
      setFinish({ weaponId: ctx.weaponId, mode: 'medium', itemId: ctx.itemId, name: ctx.contentName })
    } else if (ctx.mode === 'heavy' && ctx.itemId) {
      onHeavyPart(ctx.weaponId, ctx.damage, ctx.itemId)
      setFinish({ weaponId: ctx.weaponId, mode: 'heavy', itemId: ctx.itemId, name: ctx.contentName })
    } else if (ctx.mode === 'research') {
      onResearchStep(ctx.weaponId, ctx.damage)
      setFinish({ weaponId: ctx.weaponId, mode: 'research', name: ctx.contentName })
    }
    if (selfDmg > 0) onSacrifice(selfDmg)
  }

  function handleFinishYes() {
    if (!finish) return
    if (finish.mode === 'medium')        onMediumChunkComplete(finish.weaponId, finish.itemId!)
    else if (finish.mode === 'heavy')    onHeavyPartComplete(finish.weaponId, finish.itemId!)
    else                                 onResearchComplete(finish.weaponId)
    setFinish(null)
  }

  function startTimer(weaponId: string, mode: ModeKind, damage: number, secs: number, contentName: string, itemId?: string) {
    setTimer({ weaponId, mode, damage, totalSecs: secs, startedAt: Date.now(), contentName, itemId })
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

  // ── Finish confirmation ──────────────────────────────────────────────────────
  // Doing one work session never auto-completes anything — Medium/Heavy items
  // may take several passes, and Research has no discrete end at all; "finished"
  // is always an explicit choice.
  if (finish) {
    const finishLabel = finish.mode === 'medium' ? 'Did you finish this chunk?'
      : finish.mode === 'heavy' ? 'Did you finish this part?'
      : 'Did you finish the whole research?'
    return (
      <div className={s.confirmView}>
        <div className={s.confirmContentName}>{finish.name}</div>
        <div className={s.confirmLabel}>{finishLabel}</div>
        <div className={s.confirmBtns}>
          <button className={s.confirmYes} onClick={handleFinishYes}>Yes — done</button>
          <button className={s.confirmNo}  onClick={() => setFinish(null)}>Not yet</button>
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
              startTimer(modeStart.weaponId, modeStart.mode, modeStart.damage, modeStart.secs, modeStart.name, modeStart.itemId)
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

  // ── Main tile grid ────────────────────────────────────────────────────────
  // One tile per activated weapon (up to MAX_ACTIVE_CAMPAIGNS) — each weapon
  // has exactly one of medium/heavy/research — plus one shared, global Superhit tile.
  return (
    <div className={s.panel}>
      {weapons.map(({ weaponId, weapon, weaponLevel, campaign }) => {
        const mediumDmg = Math.round(calcTileDamage(MEDIUM_TILE, 'Light', weapon, weaponLevel))
        const stepDmg   = Math.round(calcTileDamage(STEP_TILE, 'Heavy', weapon, weaponLevel))
        const weaponName = weapon ? localizeWeaponName(weapon, t) : ''

        if (campaign.medium) {
          const nextChunk = campaign.medium.chunks.find(c => !c.done)
          return (
            <button
              key={weaponId}
              className={[s.tile, s.tileMedium, !nextChunk || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
              disabled={!nextChunk || !canAct}
              onClick={() => nextChunk && setModeStart({
                weaponId, mode: 'medium', name: nextChunk.name, damage: mediumDmg, secs: MEDIUM_CHUNK_SECS, itemId: nextChunk.id,
              })}
            >
              <span className={s.tileWeaponName}>{weaponName}</span>
              <span className={s.tileLabel}>Medium</span>
              <span className={s.tileDmg}>⚔ {mediumDmg}</span>
              {nextChunk && (
                <>
                  <span className={s.tileTag}>{prodBadge(nextChunk.content_type)}</span>
                  <span className={s.tileNameHint}>{nextChunk.name}</span>
                </>
              )}
            </button>
          )
        }

        if (campaign.heavy) {
          const nextPart = campaign.heavy.parts.find(p => !p.done)
          return (
            <button
              key={weaponId}
              className={[s.tile, s.tileHeavy, !nextPart || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
              disabled={!nextPart || !canAct}
              onClick={() => nextPart && setModeStart({
                weaponId, mode: 'heavy', name: nextPart.name, damage: stepDmg, secs: CAMPAIGN_STEP_SECS, itemId: nextPart.id,
              })}
            >
              <span className={s.tileWeaponName}>{weaponName}</span>
              <span className={s.tileLabel}>Heavy</span>
              <span className={s.tileDmg}>⚔ {stepDmg}</span>
              <span className={s.tileTag}>{prodBadge(campaign.heavy.product_type)}</span>
              {nextPart && <span className={s.tileNameHint}>{nextPart.name}</span>}
            </button>
          )
        }

        if (campaign.research) {
          const research = campaign.research
          return (
            <button
              key={weaponId}
              className={[s.tile, s.tileHeavy, !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
              disabled={!canAct}
              onClick={() => setModeStart({
                weaponId, mode: 'research', name: 'Research', damage: stepDmg, secs: CAMPAIGN_STEP_SECS,
              })}
            >
              <span className={s.tileWeaponName}>{weaponName}</span>
              <span className={s.tileLabel}>Research</span>
              <span className={s.tileDmg}>⚔ {stepDmg}</span>
              <span className={s.tileHint}>{research.done_steps} step{research.done_steps !== 1 ? 's' : ''} done</span>
            </button>
          )
        }

        return null
      })}

      {/* Superhit — shared, global charge pool */}
      <button
        className={[s.tile, s.tileSuperhit, !canShit || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!canShit || !canAct}
        onClick={() => setConfirmDmg(SUPERHIT_DMG)}
      >
        <span className={s.tileLabel}>Superhit</span>
        <span className={s.tileDmg}>⚔ {SUPERHIT_DMG}</span>
        <span className={s.tileHint}>{superhitCharges} charge{superhitCharges !== 1 ? 's' : ''}</span>
      </button>
    </div>
  )
}
