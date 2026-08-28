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

type TimerCtx = {
  type: 'medium' | 'heavy'
  damage: number
  totalSecs: number
  startedAt: number
  contentName: string
  pieceLevel?: 1 | 2  // for medium: which level was worked
}
type ConfirmCtx   = { type: 'micro' | 'superhit'; damage: number; productIndex: number }
type MediumFinishCtx = { pieceName: string; pieceId: string; damage: number; level: 1 | 2 }
type MediumStartCtx  = { pieceName: string; damage: number; secs: number; level: 1 | 2; pieceId: string }
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
  onMedium:         (damage: number, pieceId: string) => void
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

// Returns first medium piece that still needs work, with which level (L1 draft or L2 publish).
// L2 of piece N is prioritised over L1 of piece N+1.
function getCurrentMediumPiece(
  campaign: WeaponCampaign
): { piece: MediumPiece; index: number; level: 1 | 2 } | null {
  if (!campaign.medium) return null
  const pieces = campaign.medium.pieces
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i]
    const prevDone = i === 0 || pieces[i - 1].level1_done
    if (!prevDone) continue
    if (p.level1_done && !p.level2_done) return { piece: p, index: i, level: 2 }
    if (!p.level1_done)                  return { piece: p, index: i, level: 1 }
  }
  return null
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

  const hasMicro  = !!(campaign.micro  && !campaign.micro.completed)
  const currentMedium = getCurrentMediumPiece(campaign)
  const hasMedium = currentMedium !== null
  const hasHeavy  = !!(campaign.heavy  && !campaign.heavy.completed)
  const canShit   = superhitCharges > 0

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
    if (ctx.type === 'medium') {
      if (currentMedium) {
        onMedium(ctx.damage, currentMedium.piece.id)
        if (selfDmg > 0) onSacrifice(selfDmg)
        const level = ctx.pieceLevel ?? 1
        setMediumFinish({
          pieceName: currentMedium.piece.name || `Part ${currentMedium.index + 1}`,
          pieceId:   currentMedium.piece.id,
          damage:    ctx.damage,
          level,
        })
      }
    } else {
      onHeavy(ctx.damage)
      if (selfDmg > 0) onSacrifice(selfDmg)
    }
  }

  function startTimer(type: TimerCtx['type'], damage: number, secs: number, contentName: string, pieceLevel?: 1 | 2) {
    setTimer({ type, damage, totalSecs: secs, startedAt: Date.now(), contentName, pieceLevel })
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
    const modeLabel = isHeavy ? 'Heavy work' : timer.pieceLevel === 2 ? 'Publishing' : 'Writing'
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
    const levelLabel = mediumStart.level === 2 ? 'Publish' : 'Draft'
    return (
      <div className={s.confirmView}>
        <div className={s.confirmContentName}>{mediumStart.pieceName}</div>
        <div className={s.confirmLabel}>{levelLabel} — start {fmtSecs(mediumStart.secs)} timer?</div>
        <div className={s.confirmBtns}>
          <button
            className={s.confirmYes}
            onClick={() => {
              startTimer('medium', mediumStart.damage, mediumStart.secs, mediumStart.pieceName, mediumStart.level)
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
    const finishLabel = mediumFinish.level === 1 ? 'Did you finish the draft?' : 'Did you finish publishing?'
    const yesLabel    = mediumFinish.level === 1 ? 'Yes — drafted' : 'Yes — published'
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

  // ── Main 4-tile panel ─────────────────────────────────────────────────────
  const mediumPieceName = currentMedium
    ? (currentMedium.piece.name || `Part ${currentMedium.index + 1}`)
    : null
  const mediumLevel = currentMedium?.level ?? 1
  const mediumTileLabel = mediumLevel === 2 ? 'Medium L2' : 'Medium'

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

      {/* Medium */}
      <button
        className={[s.tile, s.tileMedium, !hasMedium || !canAct ? s.tileDim : ''].filter(Boolean).join(' ')}
        disabled={!hasMedium || !canAct}
        onClick={() => currentMedium && setMediumStart({
          pieceName: mediumPieceName ?? 'Medium content',
          damage: lightDmg,
          secs: lightSecs,
          level: currentMedium.level,
          pieceId: currentMedium.piece.id,
        })}
      >
        <span className={s.tileLabel}>{mediumTileLabel}</span>
        <span className={s.tileDmg}>⚔ {lightDmg}</span>
        {mediumPieceName
          ? <span className={s.tileHint} title={mediumPieceName}>{mediumPieceName.length > 14 ? mediumPieceName.slice(0, 13) + '…' : mediumPieceName}</span>
          : <span className={s.tileHint}>{fmtSecs(lightSecs)}</span>
        }
        {currentMedium?.piece && constraintLabel(currentMedium.piece) && (
          <span className={s.tileConstraint}>{constraintLabel(currentMedium.piece)}</span>
        )}
      </button>

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
              <span className={s.tileHint} title={heavy.name}>{heavy.name.length > 14 ? heavy.name.slice(0, 13) + '…' : heavy.name}</span>
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
