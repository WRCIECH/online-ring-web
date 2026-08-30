import { useState, useEffect, useRef } from 'react'
import { calcTileDamage } from '../../engine/combat'
import { SACRIFICE_MULT } from '../../data/constants'
import type { WeaponCampaign, WeaponInstance, WorkflowTile, MediumPiece } from '../../types/game'
import { WEAPON_CLASSES } from '../../data/generators/weaponClasses'
import { STAGE_TIME } from '../../data/generators/workflowGenerator'
import { useT } from '../../i18n'
import s from './CampaignActionPanel.module.css'

// Synthetic tiles use actual STAGE_TIME values so damage scales correctly with DMG_PER_MIN
const HEAVY_TILE: WorkflowTile = {
  id: '_campaign_heavy', type: 'Produce', name: '',
  time_light: STAGE_TIME.Produce.light, time_heavy: STAGE_TIME.Produce.heavy,
  is_completed: false, repeat_count: 0,
}
const LIGHT_TILE: WorkflowTile = {
  id: '_campaign_light', type: 'Research', name: '',
  time_light: STAGE_TIME.Research.light, time_heavy: STAGE_TIME.Research.heavy,
  is_completed: false, repeat_count: 0,
}

type MediumWork = { piece: MediumPiece; index: number; level: 1 | 2 }

type TimerCtx = {
  type: 'medium' | 'heavy'
  damage: number
  totalSecs: number
  startedAt: number
  contentName: string
  medPieceId?: string
  medLevel?: 1 | 2
}
type ConfirmCtx    = { type: 'micro' | 'superhit'; damage: number; productIndex: number }
type MediumFinishCtx = { pieceName: string; pieceId: string; damage: number; level: 1 | 2 }
type MediumStartCtx  = { pieceName: string; pieceId: string; damage: number; secs: number; level: 1 | 2 }
type HeavyStartCtx   = { name: string; damage: number; secs: number }

interface Props {
  campaign: WeaponCampaign
  weapon: WeaponInstance | undefined
  weaponLevel: number
  superhitCharges: number
  playerHp: number
  canAct: boolean
  flowMult?: number
  onMicro:          (damage: number, productIndex: number) => void
  onMedium:         (damage: number, pieceId: string, level: 1 | 2) => void
  onMediumComplete: (pieceId: string, level: 1 | 2) => void
  onHeavy:          (damage: number) => void
  onSuperhit:       (damage: number) => void
  onSacrifice:      (selfDmg: number) => void
}

function fmtSecs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s)
}

// Returns up to 2 available medium work items:
// - one L2 option (first piece with L1 published but L2 not yet published)
// - one L1 option (next piece ready for L1 draft, gated by previous piece's L1 published)
// L2 of piece N and L1 of piece N+1 can both be available simultaneously.
function getAvailableMediumWork(campaign: WeaponCampaign): MediumWork[] {
  if (!campaign.medium) return []
  const pieces = campaign.medium.pieces
  const result: MediumWork[] = []
  let foundL2 = false, foundL1 = false

  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i]
    const prevL1Done = i === 0 || pieces[i - 1].level1_done
    if (!foundL2 && p.level1_done && !p.level2_done) {
      result.push({ piece: p, index: i, level: 2 })
      foundL2 = true
    }
    if (!foundL1 && !p.level1_done && prevL1Done) {
      result.push({ piece: p, index: i, level: 1 })
      foundL1 = true
    }
    if (foundL1 && foundL2) break
  }
  return result
}

export default function CampaignActionPanel({
  campaign, weapon, weaponLevel, superhitCharges, playerHp, canAct, flowMult,
  onMicro, onMedium, onMediumComplete, onHeavy, onSuperhit, onSacrifice,
}: Props) {
  const t = useT()
  const fm = flowMult ?? 1
  const [timer, setTimer]               = useState<TimerCtx | null>(null)
  const [confirm, setConfirm]           = useState<ConfirmCtx | null>(null)
  const [mediumStart, setMediumStart]   = useState<MediumStartCtx | null>(null)
  const [mediumFinish, setMediumFinish] = useState<MediumFinishCtx | null>(null)
  const [heavyStart, setHeavyStart]     = useState<HeavyStartCtx | null>(null)
  const [remaining, setRemaining]       = useState(0)
  const doneRef = useRef(false)

  const cls = weapon ? WEAPON_CLASSES[weapon.weapon_class] : null
  const timeMod = cls?.time_mod ?? 1
  const lightSecs = Math.round(STAGE_TIME.Research.light * timeMod)
  const heavySecs = Math.round(STAGE_TIME.Produce.heavy  * timeMod)

  const heavyDmg    = Math.round(calcTileDamage(HEAVY_TILE, 'Heavy', weapon, weaponLevel) * fm)
  const lightDmg    = Math.round(calcTileDamage(LIGHT_TILE, 'Light', weapon, weaponLevel) * fm)
  const superhitDmg = Math.round(lightDmg * 5)

  const hasMicro       = !!(campaign.micro && !campaign.micro.completed)
  const mediumOptions  = getAvailableMediumWork(campaign)
  const hasMedium      = mediumOptions.length > 0
  const hasHeavy       = !!(campaign.heavy && !campaign.heavy.completed)
  const canShit        = superhitCharges > 0

  const micro = campaign.micro
  const currentMicroIndex = micro?.current_index ?? 0
  const currentProduct    = micro?.products[currentMicroIndex]

  const heavy = campaign.heavy
  const heavyTimerName  = heavy ? (heavy.name?.trim() || heavy.product_type) : 'Heavy content'
  const heavyTotalTiles = heavy ? heavy.research_count + heavy.produce_count : 0
  const heavyDoneTiles  = heavy ? heavy.research_done  + heavy.produce_done  : 0

  function prodBadge(type: string): string {
    return (t.content.product as Record<string, { badge_label: string }>)[type]?.badge_label ?? type
  }
  function constraintLabel(piece: MediumPiece): string | null {
    if (!piece.constraint) return null
    const entry = (t.content.constraint[piece.constraint.category] as Record<string, { label: string }>)[piece.constraint.value as string]
    return entry?.label ?? piece.constraint.value
  }
  function styleLabel(style: string): string {
    return (t.content.transformation as Record<string, { label?: string }>)[style]?.label ?? style
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
    if (ctx.type === 'medium' && ctx.medPieceId) {
      onMedium(ctx.damage, ctx.medPieceId, ctx.medLevel ?? 1)
      if (selfDmg > 0) onSacrifice(selfDmg)
      // Find the piece by id from the current campaign state
      const piece = campaign.medium?.pieces.find(p => p.id === ctx.medPieceId)
      if (piece) {
        const level = ctx.medLevel ?? 1
        const levelLabel = level === 1 ? 'L1' : 'L2'
        setMediumFinish({
          pieceName: piece.name || `Part ${(campaign.medium?.pieces.indexOf(piece) ?? 0) + 1}`,
          pieceId: ctx.medPieceId,
          damage: ctx.damage,
          level,
        })
        void levelLabel
      }
    } else {
      onHeavy(ctx.damage)
      if (selfDmg > 0) onSacrifice(selfDmg)
    }
  }

  function startTimer(type: TimerCtx['type'], damage: number, secs: number, contentName: string, medPieceId?: string, medLevel?: 1 | 2) {
    setTimer({ type, damage, totalSecs: secs, startedAt: Date.now(), contentName, medPieceId, medLevel })
  }

  function handleConfirmYes() {
    if (!confirm) return
    const c = confirm
    setConfirm(null)
    if (c.type === 'micro') onMicro(c.damage, c.productIndex)
    else                    onSuperhit(c.damage)
  }

  // ── Timer view ─────────────────────────────────────────────────────────────
  if (timer) {
    const pct = Math.max(0, remaining / timer.totalSecs) * 100
    const isHeavy = timer.type === 'heavy'
    const modeLabel = isHeavy ? 'Heavy work' : timer.medLevel === 2 ? 'L2 content' : 'Drafting'
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
              stroke={isHeavy ? '#e0a060' : '#60c0e0'}
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

  // ── Heavy start confirmation ───────────────────────────────────────────────
  if (heavyStart) {
    return (
      <div className={s.confirmView}>
        <div className={s.confirmContentName}>{heavyStart.name}</div>
        <div className={s.confirmLabel}>Start {fmtSecs(heavyStart.secs)} timer?</div>
        <div className={s.confirmBtns}>
          <button
            className={s.confirmYes}
            onClick={() => { startTimer('heavy', heavyStart.damage, heavyStart.secs, heavyStart.name); setHeavyStart(null) }}
          >
            Start
          </button>
          <button className={s.confirmNo} onClick={() => setHeavyStart(null)}>Cancel</button>
        </div>
      </div>
    )
  }

  // ── Medium start confirmation ──────────────────────────────────────────────
  if (mediumStart) {
    const actionLabel = mediumStart.level === 2 ? 'L2 content' : 'Draft L1'
    return (
      <div className={s.confirmView}>
        <div className={s.confirmContentName}>{mediumStart.pieceName}</div>
        <div className={s.confirmLabel}>{actionLabel} — start {fmtSecs(mediumStart.secs)} timer?</div>
        <div className={s.confirmBtns}>
          <button
            className={s.confirmYes}
            onClick={() => {
              startTimer('medium', mediumStart.damage, mediumStart.secs, mediumStart.pieceName, mediumStart.pieceId, mediumStart.level)
              setMediumStart(null)
            }}
          >
            Start
          </button>
          <button className={s.confirmNo} onClick={() => setMediumStart(null)}>Cancel</button>
        </div>
      </div>
    )
  }

  // ── Medium finish confirmation ─────────────────────────────────────────────
  if (mediumFinish) {
    const finishLabel = mediumFinish.level === 1
      ? 'Did you finish the L1 draft?'
      : 'Did you finish the L2 content?'
    const yesLabel = mediumFinish.level === 1 ? 'Yes — drafted' : 'Yes — done'
    return (
      <div className={s.confirmView}>
        <div className={s.confirmContentName}>{mediumFinish.pieceName}</div>
        <div className={s.confirmLabel}>{finishLabel}</div>
        <div className={s.confirmBtns}>
          <button
            className={s.confirmYes}
            onClick={() => { onMediumComplete(mediumFinish.pieceId, mediumFinish.level); setMediumFinish(null) }}
          >
            {yesLabel}
          </button>
          <button className={s.confirmNo} onClick={() => setMediumFinish(null)}>
            Not yet
          </button>
        </div>
      </div>
    )
  }

  // ── Micro / Superhit confirmation ──────────────────────────────────────────
  if (confirm) {
    const label = confirm.type === 'micro'
      ? '📤 Did you actually publish it?'
      : '💥 Did you land the superhit?'
    return (
      <div className={s.confirmView}>
        <div className={s.confirmLabel}>{label}</div>
        <div className={s.confirmDmg}>⚔ {confirm.damage}</div>
        <div className={s.confirmBtns}>
          <button className={s.confirmYes} onClick={handleConfirmYes}>Yes</button>
          <button className={s.confirmNo}  onClick={() => setConfirm(null)}>No</button>
        </div>
      </div>
    )
  }

  // ── Main tile panel ────────────────────────────────────────────────────────
  return (
    <div className={s.panel}>
      {/* Micro */}
      <button
        className={[s.tile, s.tileMicro, !hasMicro || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!hasMicro || !canAct}
        onClick={() => setConfirm({ type: 'micro', damage: heavyDmg, productIndex: currentMicroIndex })}
      >
        <span className={s.tileLabel}>Micro</span>
        <span className={s.tileDmg}>⚔ {heavyDmg}</span>
        {currentProduct && (
          <>
            <span className={s.tileTag}>{prodBadge(currentProduct.content_type)}</span>
            {currentProduct.style && (
              <span className={s.tileConstraint}>{styleLabel(currentProduct.style)}</span>
            )}
            <span className={s.tileHint}>{currentMicroIndex + 1}/{micro!.products.length}</span>
          </>
        )}
      </button>

      {/* Medium tiles — one per available work item (up to 2: one L1, one L2) */}
      {hasMedium
        ? mediumOptions.map(opt => {
            const pieceName = opt.piece.name || `Part ${opt.index + 1}`
            const tileLabel = opt.level === 2 ? 'Med L2' : 'Medium'
            return (
              <button
                key={`med-${opt.level}-${opt.piece.id}`}
                className={[s.tile, s.tileMedium, !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
                disabled={!canAct}
                onClick={() => setMediumStart({
                  pieceName,
                  pieceId: opt.piece.id,
                  damage: lightDmg,
                  secs: lightSecs,
                  level: opt.level,
                })}
              >
                <span className={s.tileLabel}>{tileLabel}</span>
                <span className={s.tileDmg}>⚔ {lightDmg}</span>
                <span className={s.tileNameHint}>{pieceName}</span>
                {constraintLabel(opt.piece) && (
                  <span className={s.tileConstraint}>{constraintLabel(opt.piece)}</span>
                )}
              </button>
            )
          })
        : (
          <button className={[s.tile, s.tileMedium, s.tileDim].join(' ')} disabled>
            <span className={s.tileLabel}>Medium</span>
            <span className={s.tileDmg}>⚔ {lightDmg}</span>
          </button>
        )
      }

      {/* Heavy */}
      <button
        className={[s.tile, s.tileHeavy, !hasHeavy || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!hasHeavy || !canAct}
        onClick={() => setHeavyStart({ name: heavyTimerName, damage: heavyDmg, secs: heavySecs })}
      >
        <span className={s.tileLabel}>Heavy</span>
        <span className={s.tileDmg}>⚔ {heavyDmg}</span>
        {heavy && (
          <>
            <span className={s.tileTag}>{prodBadge(heavy.product_type)}</span>
            {heavy.name?.trim() && (
              <span className={s.tileNameHint}>{heavy.name}</span>
            )}
            <span className={s.tileConstraint}>{heavyDoneTiles}/{heavyTotalTiles} tiles</span>
          </>
        )}
      </button>

      {/* Superhit */}
      <button
        className={[s.tile, s.tileSuperhit, !canShit || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!canShit || !canAct}
        onClick={() => setConfirm({ type: 'superhit', damage: superhitDmg, productIndex: 0 })}
      >
        <span className={s.tileLabel}>Superhit</span>
        <span className={s.tileDmg}>⚔ {superhitDmg}</span>
        <span className={s.tileHint}>{superhitCharges} charge{superhitCharges !== 1 ? 's' : ''}</span>
      </button>
    </div>
  )
}
