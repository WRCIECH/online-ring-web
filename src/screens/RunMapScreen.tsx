import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, selectRunRemainingSeconds } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import type { LocationData } from '../types/game'
import { FLOW_GAP_HOT_MINS, FLOW_GAP_WARM_MINS, FLOW_MULT_HOT, FLOW_MULT_WARM } from '../data/constants'
import RunHeader        from '../components/layout/RunHeader'
import CampaignOverlay from '../components/overlays/CampaignOverlay'
import CombatBottomBar  from '../components/combat/CombatBottomBar'
import { useT } from '../i18n'
import s from './RunMapScreen.module.css'

// ── Map geometry ──────────────────────────────────────────────────────────
const CX = 600, CY = 390
const R0 = 45, DR = 16, DTHETA = 1.082
const NODE_R = 14

interface NodePos { x: number; y: number; idx: number }

function buildNodes(count: number): NodePos[] {
  return Array.from({ length: count }, (_, i) => {
    const r = R0 + i * DR
    const theta = i * DTHETA
    return { x: CX + r * Math.cos(theta), y: CY + r * Math.sin(theta), idx: i }
  })
}

function getNodeAt(x: number, y: number, nodes: NodePos[]): number {
  for (const n of nodes) {
    const dx = x - n.x, dy = y - n.y
    if (Math.sqrt(dx*dx + dy*dy) < NODE_R + 4) return n.idx
  }
  return -1
}

// ── Background: stars + nebulas (seeded once) ────────────────────────────
const STARS = Array.from({ length: 200 }, () => ({
  x: Math.random() * 1200,
  y: Math.random() * 800,
  r: 0.3 + Math.random() * 0.9,
  a: 0.25 + Math.random() * 0.55,
  glow: Math.random() < 0.07,
}))

const NEBULAS: Array<{ cx: number; cy: number; r: number; col: [number,number,number]; a: number }> = [
  { cx: 180,  cy: 160, r: 380, col: [90,  20, 140], a: 0.38 },
  { cx: 980,  cy: 350, r: 320, col: [20,  50, 160], a: 0.32 },
  { cx: 600,  cy: 660, r: 260, col: [150, 30,  90], a: 0.28 },
  { cx: 1050, cy: 130, r: 180, col: [20, 120, 180], a: 0.22 },
]

// Replace alpha in rgba(..., alpha) string
function withAlpha(rgba: string, a: number) {
  return rgba.replace(/[\d.]+\)$/, `${a.toFixed(2)})`)
}

function fmtCountdown(secs: number): string {
  const m = Math.floor(secs / 60)
  const sc = secs % 60
  return `${m}:${sc.toString().padStart(2, '0')}`
}

interface FlowBannerState {
  tier: 'HOT' | 'WARM'
  mult: number
  secsRemaining: number
  totalSecs: number
}

function getFlowBannerState(lastFightEndedAt: number | undefined): FlowBannerState | null {
  if (!lastFightEndedAt) return null
  const gapMins = (Date.now() - lastFightEndedAt) / 60000
  if (gapMins < FLOW_GAP_HOT_MINS) {
    const secsRemaining = Math.ceil((FLOW_GAP_HOT_MINS - gapMins) * 60)
    return { tier: 'HOT', mult: FLOW_MULT_HOT, secsRemaining, totalSecs: FLOW_GAP_HOT_MINS * 60 }
  }
  if (gapMins < FLOW_GAP_WARM_MINS) {
    const secsRemaining = Math.ceil((FLOW_GAP_WARM_MINS - gapMins) * 60)
    return { tier: 'WARM', mult: FLOW_MULT_WARM, secsRemaining, totalSecs: (FLOW_GAP_WARM_MINS - FLOW_GAP_HOT_MINS) * 60 }
  }
  return null
}

export default function RunMapScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const t          = useT()
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const nodes      = useRef<NodePos[]>([])
  const rafRef     = useRef<number>(0)
  const dashOffRef = useRef(0)
  const drawRef    = useRef<(off: number) => void>(() => {})

  const [hoverIdx, setHoverIdx]     = useState(-1)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [popupIdx, setPopupIdx]     = useState(-1)
  const [popupPos, setPopupPos]     = useState({ x: 0, y: 0 })
  const [eventNode, setEventNode]   = useState<LocationData | null>(null)
  const [showContent,   setShowContent]   = useState(false)
  const [, setTick] = useState(0)
  const expiredRef = useRef(false)

  const seq     = store.run_location_sequence
  const current = store.run_current_index

  const mapWeapons = store.weapon_instances.filter(w => {
    const c = store.weapon_campaigns[w.instance_id]
    return c && c.nodes.some(n => !n.completed)
  })
  const mapWeaponIds = mapWeapons.map(w => w.instance_id)
  const [activeMapWeaponId, setActiveMapWeaponId] = useState(() => mapWeapons[0]?.instance_id ?? '')

  useEffect(() => {
    if (!store.run_active) navigate('/')
  }, [store.run_active, navigate])

  useEffect(() => {
    const id = setInterval(() => {
      const rem = selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
      if (rem <= 0 && store.run_active && !expiredRef.current) {
        expiredRef.current = true
        store.endRunFailure()
        store.save()
        setTimeout(() => navigate('/'), 2500)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [store, navigate])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    nodes.current = buildNodes(seq.length)
  }, [seq.length])

  const draw = useCallback((dashOffset: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // ── Layer 1: Deep gradient base ──────────────────────────────────────
    const bgGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 700)
    bgGrad.addColorStop(0, '#16102e')
    bgGrad.addColorStop(1, '#0a0818')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 1200, 800)

    // ── Layer 2: Nebula blobs ─────────────────────────────────────────────
    NEBULAS.forEach(({ cx, cy, r, col: [rc, gc, bc], a }) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0,   `rgba(${rc},${gc},${bc},${a})`)
      g.addColorStop(0.5, `rgba(${rc},${gc},${bc},${(a * 0.4).toFixed(2)})`)
      g.addColorStop(1,   'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1200, 800)
    })

    // ── Layer 3: Stars ────────────────────────────────────────────────────
    STARS.forEach(star => {
      if (star.glow) {
        ctx.save()
        ctx.shadowBlur = 5
        ctx.shadowColor = 'rgba(150,200,255,0.7)'
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r * 1.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,225,255,${star.a})`
        ctx.fill()
        ctx.restore()
      } else {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,225,255,${star.a})`
        ctx.fill()
      }
    })

    // ── Layer 4: Corner vignettes ─────────────────────────────────────────
    const corners = [[0,0],[1200,0],[0,800],[1200,800]] as const
    corners.forEach(([cx, cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 340)
      g.addColorStop(0, 'rgba(8,5,20,0.60)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1200, 800)
    })

    const ns = nodes.current
    if (ns.length === 0) return

    // ── Connection lines ──────────────────────────────────────────────────
    for (let i = 0; i < ns.length - 1; i++) {
      const beaten = i < current
      const isNext = i === current
      const a = ns[i], b = ns[i + 1]
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const dx = b.x - a.x, dy = b.y - a.y
      const len = Math.sqrt(dx * dx + dy * dy)
      const offset = len * 0.18
      const cpx = mx + (-dy / len) * offset
      const cpy = my + (dx / len) * offset

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.quadraticCurveTo(cpx, cpy, b.x, b.y)

      if (beaten) {
        ctx.strokeStyle    = 'rgba(52,200,130,0.9)'
        ctx.lineWidth      = 2.5
        ctx.shadowColor    = 'rgba(52,200,130,0.50)'
        ctx.shadowBlur     = 6
        ctx.setLineDash([])
        ctx.lineDashOffset = 0
      } else if (isNext) {
        ctx.strokeStyle    = 'rgba(200,160,40,0.85)'
        ctx.lineWidth      = 2.2
        ctx.shadowBlur     = 0
        ctx.setLineDash([7, 5])
        ctx.lineDashOffset = -(dashOffset * 0.5)
      } else {
        ctx.strokeStyle    = 'rgba(100,90,200,0.55)'
        ctx.lineWidth      = 1.5
        ctx.shadowBlur     = 0
        ctx.setLineDash([5, 7])
        ctx.lineDashOffset = -(dashOffset * 0.25)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.lineDashOffset = 0
      ctx.shadowBlur     = 0
    }

    // ── Nodes ─────────────────────────────────────────────────────────────
    ns.forEach((n, i) => {
      const beaten  = i < current
      const active  = i === current
      const isHover = i === hoverIdx
      const stype   = seq[i]?.sublocation_type

      let fillColor: string, glowColor: string, labelColor: string
      if (beaten) {
        fillColor = '#061812'; glowColor = 'rgba(40,210,130,0.9)';  labelColor = '#5adfa0'
      } else if (active) {
        fillColor = '#1a1200'; glowColor = 'rgba(200,165,40,1.0)';  labelColor = '#d4aa30'
      } else if (stype === 'boss') {
        fillColor = '#1a0808'; glowColor = 'rgba(220,50,50,0.9)';   labelColor = '#e06060'
      } else if (stype === 'elite') {
        fillColor = '#130a20'; glowColor = 'rgba(140,60,220,0.9)';  labelColor = '#b070e8'
      } else if (stype === 'event') {
        fillColor = '#061620'; glowColor = 'rgba(30,180,220,0.9)';  labelColor = '#50c8e0'
      } else {
        fillColor = '#0f0e22'; glowColor = 'rgba(100,90,220,0.9)';  labelColor = '#a0a0ff'
      }

      const r = active ? NODE_R + 3 : NODE_R

      // Outer soft glow ring
      ctx.save()
      ctx.shadowBlur  = 22
      ctx.shadowColor = glowColor
      ctx.beginPath()
      ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2)
      ctx.strokeStyle = withAlpha(glowColor, 0.7)
      ctx.lineWidth   = 1.5
      ctx.stroke()
      ctx.restore()

      // Active animated pulse rings
      if (active) {
        const p1 = 0.16 + 0.14 * Math.sin(dashOffset * 0.05)
        const p2 = 0.28 + 0.20 * Math.sin(dashOffset * 0.05 + Math.PI / 2)
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 14, 0, Math.PI * 2)
        ctx.fillStyle = withAlpha(glowColor, p1)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2)
        ctx.fillStyle = withAlpha(glowColor, p2)
        ctx.fill()
      } else if (!beaten && stype === 'boss') {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 10, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(220,50,50,0.12)'
        ctx.fill()
      } else if (!beaten && stype === 'elite') {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(140,60,220,0.12)'
        ctx.fill()
      }

      // Hover ring
      if (isHover && !beaten && i !== current) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(74,158,255,0.16)'
        ctx.fill()
      }

      // Node body
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = fillColor
      ctx.fill()

      // Node ring
      ctx.strokeStyle = glowColor
      ctx.lineWidth   = active ? 2.5 : stype === 'boss' ? 2.0 : 1.5
      ctx.stroke()

      // Inner energy ring
      ctx.beginPath()
      ctx.arc(n.x, n.y, r * 0.55, 0, Math.PI * 2)
      ctx.strokeStyle = withAlpha(glowColor, 0.32)
      ctx.lineWidth   = 0.8
      ctx.stroke()

      // Symbol
      let symbol: string
      if (beaten) symbol = '✓'
      else if (active) symbol = String(i + 1)
      else if (stype === 'boss')  symbol = '★'
      else if (stype === 'elite') symbol = '◆'
      else if (stype === 'event') symbol = '✦'
      else symbol = '?'

      ctx.shadowBlur = 0
      ctx.fillStyle  = labelColor
      ctx.font       = `bold ${active ? 13 : 11}px system-ui`
      ctx.textAlign  = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(symbol, n.x, n.y)
    })
  }, [seq, current, hoverIdx])

  // Keep drawRef current so RAF always calls latest version
  useEffect(() => {
    drawRef.current = draw
  })

  // RAF animation loop
  useEffect(() => {
    function tick() {
      dashOffRef.current += 0.6
      drawRef.current(dashOffRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Input ────────────────────────────────────────────────────────────────
  function canvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = 1200 / rect.width
    const scaleY = 800  / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasCoords(e)
    const idx = getNodeAt(x, y, nodes.current)
    setHoverIdx(idx)
    if (idx >= 0) setTooltipPos({ x: e.clientX + 14, y: e.clientY - 10 })
  }

  function handleMouseLeave() { setHoverIdx(-1) }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasCoords(e)
    const idx = getNodeAt(x, y, nodes.current)
    if (idx < 0 || idx !== current) return
    const loc = seq[idx]
    if (loc?.sublocation_type === 'event') {
      setEventNode(loc)
      return
    }
    setPopupIdx(idx)
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = rect.width / 1200
    const nodeScreenX = nodes.current[idx].x * scaleX + rect.left
    const px = nodeScreenX + 180 > window.innerWidth ? nodeScreenX - 360 : nodeScreenX + 30
    setPopupPos({ x: px, y: Math.min(e.clientY - 40, window.innerHeight - 320) })
  }

  function handleEnterLocation() {
    if (popupIdx < 0) return
    const loc = seq[popupIdx]
    store.setPendingEncounter(loc)
    navigate('/combat')
  }

  function handleEnterTrial() {
    if (!eventNode) return
    store.setPendingEncounter({ ...eventNode, mult: eventNode.mult * 1.5 })
    setEventNode(null)
    navigate('/combat')
  }

  const hoverLoc   = hoverIdx >= 0 ? seq[hoverIdx] : null
  const hoverEnemy = hoverLoc ? ENEMIES[hoverLoc.enemy_id] : null
  const popupLoc   = popupIdx >= 0 ? seq[popupIdx] : null
  const popupEnemy = popupLoc ? ENEMIES[popupLoc.enemy_id] : null

  return (
    <div className={s.root}>
      <RunHeader
        hp={store.current_hp} maxHp={store.maxHp()}
      />

      {/* Spiral map canvas */}
      <canvas
        ref={canvasRef}
        className={s.canvas}
        width={1200}
        height={800}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ cursor: hoverIdx === current ? 'pointer' : 'default' }}
      />


      {/* Flow bonus countdown banner */}
      {(() => {
        const flow = getFlowBannerState(store.last_fight_ended_at)
        if (!flow) return null
        const pct = Math.min(100, (flow.secsRemaining / flow.totalSecs) * 100)
        const isHot = flow.tier === 'HOT'
        return (
          <div className={`${s.flowBanner} ${isHot ? s.flowBannerHot : s.flowBannerWarm}`}>
            <span className={`${s.flowBannerLabel} ${isHot ? s.flowBannerLabelHot : s.flowBannerLabelWarm}`}>
              ⚡ FLOW ×{flow.mult.toFixed(1)}
            </span>
            <div className={s.flowBannerBar}>
              <div
                className={isHot ? s.flowBannerFillHot : s.flowBannerFillWarm}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={s.flowBannerCountdown}>{fmtCountdown(flow.secsRemaining)}</span>
          </div>
        )
      })()}

      {/* Hover tooltip */}
      {hoverIdx >= 0 && hoverIdx !== current && hoverLoc && hoverEnemy && (
        <div className={s.tooltip} style={{ left: tooltipPos.x, top: tooltipPos.y }}>
          <div className={s.tooltipName}>{t.subloc_names[hoverLoc.name] ?? hoverLoc.name}</div>
          <div className={s.tooltipEnemy}>
            {hoverIdx < current
              ? (hoverLoc.boss_name ?? (t.enemies[hoverLoc.enemy_id]?.name ?? hoverEnemy.name))
              : hoverLoc.sublocation_type === 'event' ? t.ui.event_trial_gate
                : hoverLoc.sublocation_type === 'elite' ? t.ui.enemy_elite_label
                : hoverLoc.sublocation_type === 'boss'  ? t.ui.enemy_boss_label
                : '???'}
          </div>
          {hoverIdx <= current && (
            <div className={s.tooltipMult}>×{hoverLoc.mult.toFixed(2)} {t.ui.difficulty_label}</div>
          )}
        </div>
      )}

      {/* Location popup (mob / elite / boss) */}
      {popupIdx >= 0 && popupLoc && popupEnemy && (
        <>
          <div className={s.popupOverlay} onClick={() => setPopupIdx(-1)} />
          <div className={s.popup} style={{ left: popupPos.x, top: popupPos.y }}>
            <div className={s.popupName}>{t.subloc_names[popupLoc.name] ?? popupLoc.name}</div>
            <div className={s.popupEnemy}>
              {popupLoc.sublocation_type === 'elite' && <span className={s.eliteBadge}>{t.ui.badge_elite}</span>}
              {popupLoc.sublocation_type === 'boss'  && <span className={s.bossBadge}>{t.ui.badge_boss}</span>}
              {popupLoc.sublocation_type === 'boss'
                ? (popupLoc.boss_name ?? t.enemies[popupLoc.enemy_id]?.name ?? popupEnemy.name)
                : (t.enemies[popupLoc.enemy_id]?.name ?? popupEnemy.name)}
            </div>
            <div className={s.popupMult}>×{popupLoc.mult.toFixed(2)} {t.ui.difficulty_label}</div>
            <div className={s.popupDesc}>{t.enemies[popupLoc.enemy_id]?.description ?? popupEnemy.description}</div>
            <div className={s.popupFooter}>
              <button className={s.btnEnter} onClick={handleEnterLocation}>
                {t.ui.enter_location}
              </button>
              <button onClick={() => setPopupIdx(-1)}>{t.ui.btn_close}</button>
            </div>
          </div>
        </>
      )}

      {/* Event popup (trial) */}
      {eventNode && (
        <div className={s.eventOverlay} onClick={e => { if (e.target === e.currentTarget) setEventNode(null) }}>
          <div className={s.eventPanel}>
            <div className={`${s.eventTitle} ${s.trialTitle}`}>{t.ui.trial_title}</div>
            <div className={s.eventDesc}>{t.ui.trial_desc}</div>
            <div className={s.eventActions}>
              <button className={s.btnTrial} onClick={handleEnterTrial}>
                {t.ui.accept_trial}
              </button>
              <button onClick={() => setEventNode(null)}>{t.ui.btn_refuse}</button>
            </div>
          </div>
        </div>
      )}

      {showContent && <CampaignOverlay onClose={() => setShowContent(false)} />}

      <div style={{ marginTop: 'auto' }}>
        <CombatBottomBar
          equippedWeaponIds={mapWeaponIds}
          activeWeaponId={activeMapWeaponId}
          weaponLevels={store.weapon_level}
          playerEstus={store.run_estus_count}
          canAct={true}
          onSwitchWeapon={(id) => setActiveMapWeaponId(id)}
          onEstus={() => store.drinkEstus()}
        />
      </div>

      {/* Run expired banner */}
      {selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0]) <= 0 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 30, flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: '2rem', letterSpacing: '0.2em', color: '#e85555' }}>{t.ui.run_expired}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>{t.ui.run_expired_desc}</div>
        </div>
      )}
    </div>
  )
}
