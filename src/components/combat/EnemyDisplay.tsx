import React from 'react'
import s from './EnemyDisplay.module.css'

interface Props { enemyId: string; hp: number; maxHp: number }

const W = 260, H = 300

function ProcrastinationMob() {
  return (
    <g opacity={0.9}>
      {[[-30,20],[10,30],[40,-10],[-10,-20],[20,0]].map(([dx,dy],i) => (
        <g key={i} transform={`translate(${dx},${dy})`}>
          <ellipse cx={0} cy={0} rx={22} ry={26} fill="#2a1a3a" stroke="#6a3a8a" strokeWidth={1.5}/>
          <circle cx={-6} cy={-4} r={3} fill="#cc4444"/>
          <circle cx={6} cy={-4} r={3} fill="#cc4444"/>
          <path d="M-8 8 Q0 4 8 8" stroke="#8a3a3a" strokeWidth={1.5} fill="none"/>
        </g>
      ))}
    </g>
  )
}

function Hater() {
  return (
    <g>
      <ellipse cx={0} cy={-80} rx={28} ry={32} fill="#1a1a2a" stroke="#cc3333" strokeWidth={2}/>
      <circle cx={-10} cy={-85} r={5} fill="#ee2222"/>
      <circle cx={10} cy={-85} r={5} fill="#ee2222"/>
      <path d="M-12 -68 Q0 -74 12 -68" stroke="#cc3333" strokeWidth={2} fill="none"/>
      <rect x={-14} y={-48} width={28} height={60} rx={4} fill="#1a1a2a" stroke="#cc3333" strokeWidth={1.5}/>
      <line x1={0} y1={-28} x2={0} y2={12} stroke="#cc3333" strokeWidth={1.5}/>
      <line x1={-14} y1={-18} x2={-38} y2={-32} stroke="#1a1a2a" strokeWidth={8}/>
      <line x1={-14} y1={-18} x2={-38} y2={-32} stroke="#cc3333" strokeWidth={1.5}/>
      <polygon points="-38,-32 -52,-28 -44,-40" fill="#ee2222"/>
      <line x1={14} y1={-18} x2={14} y2={10} stroke="#1a1a2a" strokeWidth={8}/>
      <line x1={14} y1={-18} x2={14} y2={10} stroke="#cc3333" strokeWidth={1.5}/>
      <line x1={-14} y1={12} x2={-10} y2={50} stroke="#1a1a2a" strokeWidth={8}/>
      <line x1={-14} y1={12} x2={-10} y2={50} stroke="#cc3333" strokeWidth={1.5}/>
      <line x1={14} y1={12} x2={10} y2={50} stroke="#1a1a2a" strokeWidth={8}/>
      <line x1={14} y1={12} x2={10} y2={50} stroke="#cc3333" strokeWidth={1.5}/>
    </g>
  )
}

function BlankPageOmen() {
  return (
    <g>
      <rect x={-40} y={-110} width={80} height={110} rx={3} fill="#e8e4d8" opacity={0.08} stroke="#c8c4b0" strokeWidth={1.5}/>
      <ellipse cx={0} cy={-55} rx={36} ry={46} fill="#d8d4c8" opacity={0.15} stroke="#c8c4b0" strokeWidth={1}/>
      <ellipse cx={-14} cy={-65} rx={10} ry={13} fill="#0a090e" stroke="#888" strokeWidth={1}/>
      <ellipse cx={14} cy={-65} rx={10} ry={13} fill="#0a090e" stroke="#888" strokeWidth={1}/>
      {[-30,-20,-10,0,10,20,30].map((x,i)=>(
        <line key={i} x1={x} y1={-20+i*2} x2={x} y2={50-i} stroke="#c8c4b0" strokeWidth={0.5} opacity={0.2}/>
      ))}
      {[-3,-1,1,3].map((dy,i)=>(
        <path key={i} d={`M-50 ${dy*30} Q0 ${dy*30-20} 50 ${dy*30}`} stroke="#c8c4b0" strokeWidth={0.4} fill="none" opacity={0.12}/>
      ))}
    </g>
  )
}

function BurnoutShade() {
  return (
    <g>
      <ellipse cx={0} cy={-70} rx={22} ry={24} fill="#1a1625" stroke="#4a3a6a" strokeWidth={1.5}/>
      <circle cx={-8} cy={-74} r={3} fill="#6a4a8a" opacity={0.7}/>
      <circle cx={8} cy={-74} r={3} fill="#6a4a8a" opacity={0.7}/>
      <path d="M-10 -58 Q0 -62 10 -58" stroke="#4a3a6a" strokeWidth={1.5} fill="none"/>
      <path d="M0 -46 Q-8 -20 -15 10 Q-20 35 -10 60" stroke="#4a3a6a" strokeWidth={10} fill="none" strokeLinecap="round"/>
      <path d="M0 -46 Q-8 -20 -15 10 Q-20 35 -10 60" stroke="#1a1625" strokeWidth={7} fill="none" strokeLinecap="round"/>
      <path d="M0 -40 Q10 -25 6 -10" stroke="#4a3a6a" strokeWidth={7} fill="none" strokeLinecap="round"/>
      <path d="M0 -40 Q-10 -25 -6 -10" stroke="#4a3a6a" strokeWidth={7} fill="none" strokeLinecap="round"/>
      <ellipse cx={-10} cy={62} rx={14} ry={6} fill="#1a1625" stroke="#4a3a6a" strokeWidth={1}/>
      <ellipse cx={8} cy={64} rx={10} ry={5} fill="#1a1625" stroke="#4a3a6a" strokeWidth={1}/>
    </g>
  )
}

function ComparisonEngine() {
  return (
    <g>
      <circle cx={0} cy={-20} r={55} fill="#0f1a18" stroke="#1a6a5a" strokeWidth={2}/>
      {[0,45,90,135,180,225,270,315].map((deg,i) => {
        const r = 52, rad = deg * Math.PI / 180
        return <circle key={i} cx={r*Math.cos(rad)} cy={-20+r*Math.sin(rad)} r={6} fill="#1a6a5a" stroke="#2a9a8a" strokeWidth={1}/>
      })}
      <circle cx={0} cy={-20} r={32} fill="#0a1210" stroke="#1a6a5a" strokeWidth={1.5}/>
      {[-10,-5,0,5,10].map((x,i) => (
        <rect key={i} x={x-2} y={-30+i*4} width={4} height={12} rx={1} fill="#1a6a5a" opacity={0.6+i*0.08}/>
      ))}
      <text x={0} y={-14} textAnchor="middle" fontSize={20} fill="#2a9a8a" fontFamily="monospace">{'>'}</text>
      <circle cx={0} cy={-20} r={8} fill="#1a6a5a"/>
      <circle cx={0} cy={20} r={18} fill="#0f1a18" stroke="#1a6a5a" strokeWidth={1.5}/>
      <text x={0} y={26} textAnchor="middle" fontSize={11} fill="#2a9a8a" fontFamily="monospace">1M</text>
      <rect x={-30} y={42} width={60} height={12} rx={2} fill="#0f1a18" stroke="#1a6a5a" strokeWidth={1}/>
      <rect x={-28} y={44} width={36} height={8} rx={1} fill="#2a9a8a" opacity={0.7}/>
    </g>
  )
}

function FearPhantom() {
  return (
    <g opacity={0.85}>
      <path d="M0 -90 Q20 -70 30 -40 Q40 -10 20 20 Q10 40 20 70 Q10 80 0 70 Q-10 80 -20 70 Q-10 40 -20 20 Q-40 -10 -30 -40 Q-20 -70 0 -90Z"
        fill="#1a1030" stroke="#8844cc" strokeWidth={1.5}/>
      <circle cx={-12} cy={-55} r={7} fill="#0a0818" stroke="#cc88ff" strokeWidth={1}/>
      <circle cx={12} cy={-55} r={7} fill="#0a0818" stroke="#cc88ff" strokeWidth={1}/>
      <circle cx={-12} cy={-55} r={3} fill="#cc88ff" opacity={0.8}/>
      <circle cx={12} cy={-55} r={3} fill="#cc88ff" opacity={0.8}/>
      {[[-50,-20],[-55,10],[-45,40],[50,-20],[55,10],[45,40]].map(([x,y],i)=>(
        <ellipse key={i} cx={x} cy={y} rx={8} ry={12} fill="#1a1030" stroke="#8844cc" strokeWidth={1} opacity={0.5+i*0.05}/>
      ))}
    </g>
  )
}

function PerfectionismKnight() {
  return (
    <g>
      {/* helmet */}
      <path d="M-26 -110 Q-28 -140 0 -145 Q28 -140 26 -110 L20 -88 L-20 -88Z"
        fill="#1a1820" stroke="#8888aa" strokeWidth={2}/>
      <rect x={-8} y={-130} width={16} height={35} fill="#0a090e"/>
      <circle cx={-14} cy={-118} r={5} fill="#4444aa" opacity={0.8}/>
      <circle cx={14} cy={-118} r={5} fill="#4444aa" opacity={0.8}/>
      {/* gorget */}
      <path d="M-20 -88 L-24 -72 L24 -72 L20 -88Z" fill="#14121a" stroke="#8888aa" strokeWidth={1.5}/>
      {/* shoulders */}
      <ellipse cx={-34} cy={-68} rx={18} ry={12} fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
      <ellipse cx={34} cy={-68} rx={18} ry={12} fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
      {/* breastplate */}
      <path d="M-24 -72 L-28 -10 Q0 0 28 -10 L24 -72Z" fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
      <path d="M0 -72 L0 -10" stroke="#8888aa" strokeWidth={1} opacity={0.5}/>
      {/* arms */}
      <path d="M-28 -68 L-36 -20 L-30 10" stroke="#1a1820" strokeWidth={14} strokeLinecap="round"/>
      <path d="M-28 -68 L-36 -20 L-30 10" stroke="#8888aa" strokeWidth={1.5} fill="none"/>
      <path d="M28 -68 L36 -20 Q40 0 38 20" stroke="#1a1820" strokeWidth={14} strokeLinecap="round"/>
      <path d="M28 -68 L36 -20 Q40 0 38 20" stroke="#8888aa" strokeWidth={1.5} fill="none"/>
      {/* sword */}
      <line x1={42} y1={20} x2={42} y2={80} stroke="#ccccee" strokeWidth={3}/>
      <line x1={30} y1={22} x2={54} y2={22} stroke="#ccccee" strokeWidth={2.5}/>
      <rect x={38} y={80} width={8} height={14} rx={2} fill="#8888aa"/>
      {/* legs */}
      <rect x={-20} y={-10} width={16} height={55} rx={4} fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
      <rect x={4} y={-10} width={16} height={55} rx={4} fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
    </g>
  )
}

const ART: Record<string, () => React.ReactElement> = {
  procrastination_mob:    ProcrastinationMob,
  hater:                  Hater,
  blank_page_omen:        BlankPageOmen,
  burnout_shade:          BurnoutShade,
  comparison_engine:      ComparisonEngine,
  fear_phantom:           FearPhantom,
  perfectionism_knight:   PerfectionismKnight,
}

export default function EnemyDisplay({ enemyId, hp, maxHp }: Props) {
  const Art = ART[enemyId] ?? BurnoutShade
  const hpPct = Math.max(0, hp / maxHp)
  const isDead = hp <= 0

  const gradId = `mobGlow-${enemyId}`

  return (
    <div className={`${s.root} ${isDead ? s.corpse : ''}`}>
      <svg viewBox={`${-W/2} ${-H*0.7} ${W} ${H}`} className={s.svg}
           style={{ opacity: isDead ? 0.3 : 0.85 + hpPct * 0.15 }}>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="45%" r="50%">
            <stop offset="0%"   stopColor="#2e2255" stopOpacity="0.95"/>
            <stop offset="60%"  stopColor="#1c1840" stopOpacity="0.70"/>
            <stop offset="100%" stopColor="#1c1840" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {/* mob background halo */}
        <ellipse cx={0} cy={-20} rx={108} ry={148} fill={`url(#${gradId})`}/>
        {/* ground shadow */}
        <ellipse cx={0} cy={H*0.25} rx={80} ry={16} fill="rgba(80,50,140,0.18)"/>
        <Art />
      </svg>
    </div>
  )
}
