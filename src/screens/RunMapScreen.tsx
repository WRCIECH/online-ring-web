import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, selectRunRemainingSeconds } from '../store/gameStore'
import { ENEMIES } from '../data/enemies'
import NotepadOverlay from '../components/overlays/NotepadOverlay'
import EquipOverlay   from '../components/overlays/EquipOverlay'
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

function fmtRemaining(secs: number): string {
  if (secs <= 0) return '00:00:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const sc = Math.floor(secs % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
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
  const [showNotepad, setShowNotepad] = useState(false)
  const [showEquip, setShowEquip]     = useState(false)
  const [remaining, setRemaining]     = useState(() =>
    selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
  )
  const expiredRef = useRef(false)

  const seq     = store.run_location_sequence
  const current = store.run_current_index

  // Redirect if no active run
  useEffect(() => {
    if (!store.run_active) navigate('/')
  }, [store.run_active, navigate])

  // Timer tick + expiry check
  useEffect(() => {
    const id = setInterval(() => {
      const rem = selectRunRemainingSeconds(store as Parameters<typeof selectRunRemainingSeconds>[0])
      setRemaining(rem)
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
      const isBoss  = i === ns.length - 1
      const isHover = i === hoverIdx

      let fillColor  = '#12102a'
      let ringColor  = '#38366a'
      let labelColor = '#565490'

      if (beaten)       { fillColor = '#0c1a14'; ringColor = '#1e6e50'; labelColor = '#2a9a6e' }
      else if (active)  { fillColor = '#1a1200'; ringColor = '#8a6810'; labelColor = '#b89020' }
      else if (isBoss)  { fillColor = '#160606'; ringColor = '#5c1212'; labelColor = '#8a2828' }

      const r = active ? NODE_R + 3 : NODE_R

      // Glow for active — primary visibility cue in dark mode
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

      // Boss crown
      if (isBoss && !beaten) {
        ctx.font = '10px system-ui'
        ctx.fillStyle = '#7a2020'
        ctx.fillText('★', n.x, n.y - r - 8)
      }
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
    if (idx < 0 || idx !== current) return  // only active node is clickable
    setPopupIdx(idx)
    // Position popup to the right of the node, or left if near edge
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

  const hoverLoc   = hoverIdx >= 0 ? seq[hoverIdx] : null
  const hoverEnemy = hoverLoc ? ENEMIES[hoverLoc.enemy_id] : null
  const popupLoc   = popupIdx >= 0 ? seq[popupIdx] : null
  const popupEnemy = popupLoc ? ENEMIES[popupLoc.enemy_id] : null
  const isUrgent   = remaining < 7200  // < 2 hours

  return (
    <div className={s.root}>
      {/* Top bar */}
      <div className={s.topBar}>
        <span className={s.runTitle}>Great Run #{store.run_count + 1}</span>
        <span className={[s.timer, isUrgent ? s.urgent : ''].join(' ')}>
          {fmtRemaining(remaining)}
        </span>
        <div className={s.topButtons}>
          <button className={s.topBtn} onClick={() => setShowEquip(true)}>⚙ Equip</button>
          <button className={s.topBtn} onClick={() => setShowNotepad(true)}>✏ Notes</button>
        </div>
      </div>

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
            {hoverIdx < current ? hoverEnemy.name : '???'}
          </div>
          {hoverIdx <= current && (
            <div className={s.tooltipMult}>×{hoverLoc.mult.toFixed(2)} difficulty</div>
          )}
        </div>
      )}

      {/* Location popup */}
      {popupIdx >= 0 && popupLoc && popupEnemy && (
        <>
          <div className={s.popupOverlay} onClick={() => setPopupIdx(-1)} />
          <div className={s.popup} style={{ left: popupPos.x, top: popupPos.y }}>
            <div className={s.popupName}>{popupLoc.name}</div>
            <div className={s.popupEnemy}>{popupEnemy.name}</div>
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

      {/* Overlays */}
      {showNotepad && <NotepadOverlay onClose={() => setShowNotepad(false)} />}
      {showEquip   && <EquipOverlay   onClose={() => setShowEquip(false)} />}

      {/* Run expired banner */}
      {remaining <= 0 && (
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
