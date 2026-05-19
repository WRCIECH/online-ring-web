import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, selectRunRemainingSeconds } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import type { LocationData } from '../types/game'
import RunHeader from '../components/layout/RunHeader'
import s from './RunMapScreen.module.css'

// ── Map geometry (mirrors Godot constants) ────────────────────────────────
const CX = 600, CY = 390
const R0 = 45, DR = 16, DTHETA = 1.082
const NODE_R = 22

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

// ── Background particles (computed once) ─────────────────────────────────
const BG_PARTICLES = Array.from({ length: 140 }, () => ({
  x: Math.random() * 1200, y: Math.random() * 800,
  r: 0.2 + Math.random() * 0.9, a: 0.02 + Math.random() * 0.09,
}))

export default function RunMapScreen() {
  const navigate   = useNavigate()
  const store      = useGameStore()
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const nodes      = useRef<NodePos[]>([])
  const [hoverIdx, setHoverIdx]     = useState(-1)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [popupIdx, setPopupIdx]     = useState(-1)
  const [popupPos, setPopupPos]     = useState({ x: 0, y: 0 })
  const [eventNode, setEventNode]   = useState<LocationData | null>(null)
  const expiredRef = useRef(false)

  const seq     = store.run_location_sequence
  const current = store.run_current_index

  // Redirect if no active run
  useEffect(() => {
    if (!store.run_active) navigate('/')
  }, [store.run_active, navigate])

  // Expiry check — display timer is in RunHeader
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

  // Build nodes when sequence changes
  useEffect(() => {
    nodes.current = buildNodes(seq.length)
  }, [seq.length])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background particles — dust motes, barely visible
    BG_PARTICLES.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(120,132,170,${p.a})`
      ctx.fill()
    })

    // Corner atmosphere — very faint depth vignette
    const corners = [[0,0],[1200,0],[0,800],[1200,800]]
    corners.forEach(([cx,cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 340)
      g.addColorStop(0, 'rgba(30,14,60,0.08)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1200, 800)
    })

    const ns = nodes.current
    if (ns.length === 0) return

    // Connection lines
    for (let i = 0; i < ns.length - 1; i++) {
      const beaten = i < current
      ctx.beginPath()
      ctx.moveTo(ns[i].x, ns[i].y)
      ctx.lineTo(ns[i+1].x, ns[i+1].y)
      ctx.strokeStyle = beaten ? 'rgba(22,88,58,0.70)' : 'rgba(42,38,72,0.85)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Nodes
    ns.forEach((n, i) => {
      const beaten  = i < current
      const active  = i === current
      const isHover = i === hoverIdx

      let fillColor  = '#0d0c18'
      let ringColor  = '#22203a'
      let labelColor = '#565490'

      if (beaten) {
        fillColor = '#0c1a14'; ringColor = '#1e6e50'; labelColor = '#2a9a6e'
      } else if (active) {
        fillColor = '#1a1200'; ringColor = '#8a6810'; labelColor = '#b89020'
      }

      const r = active ? NODE_R + 3 : NODE_R

      if (active) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 10, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(120,88,12,0.22)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(140,104,16,0.18)'
        ctx.fill()
      }
      if (isHover && !beaten && i !== current) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(100,75,10,0.14)'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = fillColor
      ctx.fill()
      ctx.strokeStyle = ringColor
      ctx.lineWidth = beaten ? 1.5 : (active ? 2.5 : 1)
      ctx.stroke()

      // Label
      ctx.fillStyle = labelColor
      ctx.font = `bold ${active ? 13 : 11}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = beaten ? String(i + 1) : (active ? String(i + 1) : (i > current ? '?' : String(i + 1)))
      ctx.fillText(label, n.x, n.y)

    })
  }, [seq, current, hoverIdx])

  useEffect(() => {
    draw()
  }, [draw])

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

  function handleGraceRest() {
    const maxHp  = store.maxHp()
    const newHp  = Math.min(maxHp, store.current_hp + Math.floor(maxHp * 0.60))
    const newEst = Math.min(3, store.run_estus_count + 1)
    store.syncCombatResult(newHp, newEst)
    store.advanceRun()
    setEventNode(null)
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
        hp={store.current_hp}       maxHp={store.maxHp()}
        stamina={store.current_stamina} maxStamina={store.maxStamina()}
        fp={store.current_fp}       maxFp={store.maxFp()}
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

      {/* Hover tooltip */}
      {hoverIdx >= 0 && hoverIdx !== current && hoverLoc && hoverEnemy && (
        <div className={s.tooltip} style={{ left: tooltipPos.x, top: tooltipPos.y }}>
          <div className={s.tooltipName}>{hoverLoc.name}</div>
          <div className={s.tooltipEnemy}>
            {hoverIdx < current
              ? hoverEnemy.name
              : hoverLoc.sublocation_type === 'event'
                ? (hoverLoc.event_type === 'site_of_grace' ? '⬥ Site of Grace' : '⚔ Trial Gate')
                : hoverLoc.sublocation_type === 'elite' ? '⚔ Elite'
                : hoverLoc.sublocation_type === 'boss'  ? '★ Boss'
                : '???'}
          </div>
          {hoverIdx <= current && (
            <div className={s.tooltipMult}>×{hoverLoc.mult.toFixed(2)} difficulty</div>
          )}
        </div>
      )}

      {/* Location popup (mob / elite / boss) */}
      {popupIdx >= 0 && popupLoc && popupEnemy && (
        <>
          <div className={s.popupOverlay} onClick={() => setPopupIdx(-1)} />
          <div className={s.popup} style={{ left: popupPos.x, top: popupPos.y }}>
            <div className={s.popupName}>{popupLoc.name}</div>
            <div className={s.popupEnemy}>
              {popupLoc.sublocation_type === 'elite' && <span className={s.eliteBadge}>⚔ ELITE · </span>}
              {popupLoc.sublocation_type === 'boss'  && <span className={s.bossBadge}>★ BOSS · </span>}
              {popupEnemy.name}
            </div>
            <div className={s.popupMult}>×{popupLoc.mult.toFixed(2)} difficulty</div>
            <div className={s.popupDesc}>{popupEnemy.description}</div>
            <div className={s.popupFooter}>
              <button className={s.btnEnter} onClick={handleEnterLocation}>
                Enter Location
              </button>
              <button onClick={() => setPopupIdx(-1)}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Event popup (site_of_grace / trial) */}
      {eventNode && (
        <div className={s.eventOverlay} onClick={e => { if (e.target === e.currentTarget) setEventNode(null) }}>
          <div className={s.eventPanel}>
            {eventNode.event_type === 'site_of_grace' ? (
              <>
                <div className={`${s.eventTitle} ${s.graceTitle}`}>⬥ Site of Grace</div>
                <div className={s.eventDesc}>
                  A calm clearing emanates warmth. Rest here to recover your strength.
                </div>
                <div className={s.eventActions}>
                  <button className={s.btnGrace} onClick={handleGraceRest}>
                    Rest (+60% HP, +1 Estus)
                  </button>
                  <button onClick={() => setEventNode(null)}>Leave</button>
                </div>
              </>
            ) : (
              <>
                <div className={`${s.eventTitle} ${s.trialTitle}`}>⚔ Trial Gate</div>
                <div className={s.eventDesc}>
                  A spectral gate flickers with challenge. Defeat what lies within for a guaranteed rare drop.
                </div>
                <div className={s.eventActions}>
                  <button className={s.btnTrial} onClick={handleEnterTrial}>
                    Accept Trial
                  </button>
                  <button onClick={() => setEventNode(null)}>Refuse</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* Run expired banner */}
      {selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0]) <= 0 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 30, flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: '2rem', letterSpacing: '0.2em', color: '#e85555' }}>RUN EXPIRED</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>The 48 hours are up. Returning…</div>
        </div>
      )}
    </div>
  )
}
