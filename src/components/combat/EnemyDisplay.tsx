import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { MOB_ANIMATIONS } from './mobAnimations'
import type { SublocationType } from '../../types/game'
import s from './EnemyDisplay.module.css'

interface Props {
  enemyId: string
  hp: number
  maxHp: number
  onClick?: React.MouseEventHandler<HTMLDivElement>
  cursor?: string
  svgForwardRef?: React.RefObject<SVGSVGElement | null>
  sublocationtype?: SublocationType
}

const W = 260, H = 300

// ── Mob art ───────────────────────────────────────────────────────────────────

function ProcrastinationMob() {
  return (
    <g data-anim="mob-root" opacity={0.9}>
      {[[-30,20],[10,30],[40,-10],[-10,-20],[20,0]].map(([dx,dy],i) => (
        <g key={i} data-anim="blob" transform={`translate(${dx},${dy})`}>
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
    <g data-anim="mob-root">
      <g data-anim="head">
        <ellipse cx={0} cy={-80} rx={28} ry={32} fill="#1a1a2a" stroke="#cc3333" strokeWidth={2}/>
        <circle cx={-10} cy={-85} r={5} fill="#ee2222"/>
        <circle cx={10} cy={-85} r={5} fill="#ee2222"/>
        <path d="M-12 -68 Q0 -74 12 -68" stroke="#cc3333" strokeWidth={2} fill="none"/>
      </g>
      <g data-anim="body">
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
    </g>
  )
}

function BlankPageOmen() {
  return (
    <g data-anim="mob-root">
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
    <g data-anim="mob-root">
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
    <g data-anim="mob-root">
      <circle cx={0} cy={-20} r={55} fill="#0f1a18" stroke="#1a6a5a" strokeWidth={2}/>
      <g data-anim="orbit">
        {[0,45,90,135,180,225,270,315].map((deg,i) => {
          const r = 52, rad = deg * Math.PI / 180
          return <circle key={i} cx={r*Math.cos(rad)} cy={-20+r*Math.sin(rad)} r={6} fill="#1a6a5a" stroke="#2a9a8a" strokeWidth={1}/>
        })}
      </g>
      <g data-anim="inner">
        <circle cx={0} cy={-20} r={32} fill="#0a1210" stroke="#1a6a5a" strokeWidth={1.5}/>
        {[-10,-5,0,5,10].map((x,i) => (
          <rect key={i} x={x-2} y={-30+i*4} width={4} height={12} rx={1} fill="#1a6a5a" opacity={0.6+i*0.08}/>
        ))}
        <text x={0} y={-14} textAnchor="middle" fontSize={20} fill="#2a9a8a" fontFamily="monospace">{'>'}</text>
      </g>
      <circle cx={0} cy={-20} r={8} fill="#1a6a5a" data-anim="core"/>
      <circle cx={0} cy={20} r={18} fill="#0f1a18" stroke="#1a6a5a" strokeWidth={1.5}/>
      <text x={0} y={26} textAnchor="middle" fontSize={11} fill="#2a9a8a" fontFamily="monospace">1M</text>
      <rect x={-30} y={42} width={60} height={12} rx={2} fill="#0f1a18" stroke="#1a6a5a" strokeWidth={1}/>
      <rect x={-28} y={44} width={36} height={8} rx={1} fill="#2a9a8a" opacity={0.7}/>
    </g>
  )
}

function FearPhantom() {
  return (
    <g data-anim="mob-root" opacity={0.85}>
      <path d="M0 -90 Q20 -70 30 -40 Q40 -10 20 20 Q10 40 20 70 Q10 80 0 70 Q-10 80 -20 70 Q-10 40 -20 20 Q-40 -10 -30 -40 Q-20 -70 0 -90Z"
        fill="#1a1030" stroke="#8844cc" strokeWidth={1.5}/>
      <circle cx={-12} cy={-55} r={7} fill="#0a0818" stroke="#cc88ff" strokeWidth={1}/>
      <circle cx={12} cy={-55} r={7} fill="#0a0818" stroke="#cc88ff" strokeWidth={1}/>
      <circle cx={-12} cy={-55} r={3} data-anim="eye-glow" fill="#cc88ff" opacity={0.8}/>
      <circle cx={12} cy={-55} r={3} data-anim="eye-glow" fill="#cc88ff" opacity={0.8}/>
      <g data-anim="tentacles">
        {[[-50,-20],[-55,10],[-45,40],[50,-20],[55,10],[45,40]].map(([x,y],i)=>(
          <ellipse key={i} cx={x} cy={y} rx={8} ry={12} fill="#1a1030" stroke="#8844cc" strokeWidth={1} opacity={0.5+i*0.05}/>
        ))}
      </g>
    </g>
  )
}

function PerfectionismKnight() {
  return (
    <g data-anim="mob-root">
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
      {/* breastplate + arms */}
      <g data-anim="chest">
        <path d="M-24 -72 L-28 -10 Q0 0 28 -10 L24 -72Z" fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
        <path d="M0 -72 L0 -10" stroke="#8888aa" strokeWidth={1} opacity={0.5}/>
        <path d="M-28 -68 L-36 -20 L-30 10" stroke="#1a1820" strokeWidth={14} strokeLinecap="round"/>
        <path d="M-28 -68 L-36 -20 L-30 10" stroke="#8888aa" strokeWidth={1.5} fill="none"/>
        <path d="M28 -68 L36 -20 Q40 0 38 20" stroke="#1a1820" strokeWidth={14} strokeLinecap="round"/>
        <path d="M28 -68 L36 -20 Q40 0 38 20" stroke="#8888aa" strokeWidth={1.5} fill="none"/>
      </g>
      {/* sword */}
      <g data-anim="sword">
        <line x1={42} y1={20} x2={42} y2={80} stroke="#ccccee" strokeWidth={3}/>
        <line x1={30} y1={22} x2={54} y2={22} stroke="#ccccee" strokeWidth={2.5}/>
        <rect x={38} y={80} width={8} height={14} rx={2} fill="#8888aa"/>
      </g>
      {/* legs */}
      <rect x={-20} y={-10} width={16} height={55} rx={4} fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
      <rect x={4} y={-10} width={16} height={55} rx={4} fill="#1a1820" stroke="#8888aa" strokeWidth={1.5}/>
    </g>
  )
}

function NotificationSwarm() {
  const bubbles: [number, number, number, string, string][] = [
    [-42, -15, 16, '#e85555', '!'],
    [ 28, -38, 14, '#5588ee', '@'],
    [ -8,  15, 18, '#e85555', '3'],
    [ 50,  -5, 13, '#ee8833', '!'],
    [-55,   5, 12, '#5588ee', '!'],
    [  5, -55, 15, '#e85555', '7'],
    [ 38,  28, 14, '#ee8833', '?'],
  ]
  return (
    <g data-anim="mob-root" opacity={0.9}>
      {bubbles.map(([x, y, r, color, label], i) => (
        <g key={i} data-anim="bubble" transform={`translate(${x},${y})`}>
          <circle r={r} fill="#12101e" stroke={color} strokeWidth={1.5}/>
          <text textAnchor="middle" dy="0.35em" fontSize={r * 0.75} fill={color} fontFamily="monospace" fontWeight="bold">{label}</text>
        </g>
      ))}
      {([[-25,-70],[45,-50],[-65,-30],[65,15],[-20,55],[15,55],[55,50]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#e85555" opacity={0.3+i*0.06} data-anim="dot"/>
      ))}
    </g>
  )
}

function ImpostorShade() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-60} rx={22} ry={24} fill="#14101e" stroke="#665588" strokeWidth={1} strokeDasharray="4 3" opacity={0.7}/>
      <path d="M0 -36 Q-12 -15 -18 20 Q-22 45 -14 65" stroke="#554477" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.6}/>
      <path d="M0 -36 Q12 -15 18 20 Q22 45 14 65"    stroke="#554477" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.6}/>
      <g data-anim="mask">
        <ellipse cx={0} cy={-62} rx={28} ry={30} fill="#1c1630" stroke="#aa88cc" strokeWidth={2}/>
        <line x1={-12} y1={-70} x2={-6} y2={-67} stroke="#aa88cc" strokeWidth={2} strokeLinecap="round"/>
        <line x1={12}  y1={-70} x2={6}  y2={-67} stroke="#aa88cc" strokeWidth={2} strokeLinecap="round"/>
        <path d="M-10 -52 Q0 -48 10 -52" stroke="#aa88cc" strokeWidth={2} fill="none"/>
        <path d="M8 -92 L2 -72 L12 -50 L6 -36" stroke="#e85555" strokeWidth={1} fill="none" opacity={0.8}/>
        <path d="M2 -72 L-4 -65"              stroke="#e85555" strokeWidth={1} fill="none" opacity={0.6}/>
      </g>
      <g data-anim="real-eyes">
        <circle cx={-10} cy={-64} r={4} fill="#0a0818" stroke="#ee4444" strokeWidth={1}/>
        <circle cx={10}  cy={-64} r={4} fill="#0a0818" stroke="#ee4444" strokeWidth={1}/>
        <circle cx={-10} cy={-64} r={1.5} fill="#ee4444"/>
        <circle cx={10}  cy={-64} r={1.5} fill="#ee4444"/>
      </g>
    </g>
  )
}

function AlgorithmSpecter() {
  return (
    <g data-anim="mob-root">
      <circle cx={0} cy={-20} r={58} fill="none" stroke="#1a7a7a" strokeWidth={1} strokeDasharray="8 4" opacity={0.5}/>
      <g data-anim="ring-outer">
        {([0,60,120,180,240,300] as number[]).map((deg,i) => {
          const rad = deg * Math.PI / 180
          return <circle key={i} cx={58*Math.cos(rad)} cy={-20+58*Math.sin(rad)} r={5} fill="#1a7a7a" stroke="#22bbbb" strokeWidth={1}/>
        })}
      </g>
      <polygon points="0,-80 40,-25 25,30 -25,30 -40,-25" fill="#0a1818" stroke="#22bbbb" strokeWidth={2}/>
      <polygon points="0,-80 40,-25 0,-50" fill="#1a4a4a" opacity={0.4}/>
      <polygon points="0,-80 -40,-25 0,-50" fill="#0d3030" opacity={0.3}/>
      <g data-anim="data-inner">
        {([-15,-8,0,8,15] as number[]).map((x,i) => (
          <rect key={i} x={x-2} y={-35+i*6} width={4} height={15+i*2} rx={1} fill="#22bbbb" opacity={0.5+i*0.08}/>
        ))}
      </g>
      <circle cx={0} cy={-20} r={10} fill="#22bbbb" opacity={0.6} data-anim="core"/>
      <circle cx={0} cy={-20} r={5}  fill="#88ffff" opacity={0.9}/>
      {([[-35,30],[-15,30],[5,30],[25,30]] as [number,number][]).map(([x,y],i) => (
        <line key={i} x1={x} y1={y} x2={x+i} y2={y+20+i*6} stroke="#22bbbb" strokeWidth={1} opacity={0.35}/>
      ))}
    </g>
  )
}

function DeadlineWraith() {
  return (
    <g data-anim="mob-root">
      <path d="M0 -110 Q25 -90 35 -50 Q45 0 40 60 Q20 80 0 75 Q-20 80 -40 60 Q-45 0 -35 -50 Q-25 -90 0 -110Z"
        fill="#100d18" stroke="#663344" strokeWidth={1.5}/>
      <ellipse cx={0} cy={-80} rx={22} ry={20} fill="#0a0812" stroke="#553344" strokeWidth={1}/>
      <ellipse cx={-9} cy={-83} rx={5} ry={2.5} fill="#cc2233" opacity={0.9} data-anim="eye"/>
      <ellipse cx={ 9} cy={-83} rx={5} ry={2.5} fill="#cc2233" opacity={0.9} data-anim="eye"/>
      <g data-anim="clock">
        <circle cx={0} cy={-30} r={24} fill="#0d0b15" stroke="#995566" strokeWidth={2}/>
        <circle cx={0} cy={-30} r={2} fill="#cc2233"/>
        {([0,30,60,90,120,150,180,210,240,270,300,330] as number[]).map((deg,i) => {
          const rad = deg * Math.PI / 180
          return <line key={i} x1={20*Math.sin(rad)} y1={-30-20*Math.cos(rad)} x2={23*Math.sin(rad)} y2={-30-23*Math.cos(rad)} stroke="#995566" strokeWidth={i%3===0?2:1}/>
        })}
        <line x1={0} y1={-30} x2={-4} y2={-49} stroke="#cc2233"  strokeWidth={2.5} strokeLinecap="round"/>
        <line x1={0} y1={-30} x2={9}  y2={-12} stroke="#995566"  strokeWidth={1.5} strokeLinecap="round"/>
      </g>
      <path d="M-35 -10 Q-55 -5 -62 10 M-62 10 Q-65 18 -58 20 M-62 10 Q-64 20 -56 24 M-62 10 Q-60 22 -52 23"
        stroke="#663344" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
      <path d="M35 -10 Q55 -5 62 10 M62 10 Q65 18 58 20 M62 10 Q64 20 56 24 M62 10 Q60 22 52 23"
        stroke="#663344" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
    </g>
  )
}

function OverloadColossus() {
  return (
    <g data-anim="mob-root">
      <rect x={-55} y={20}  width={110} height={50} rx={3} fill="#1a1510" stroke="#887755" strokeWidth={1.5}/>
      <rect x={-48} y={-30} width={96}  height={54} rx={3} fill="#1c1812" stroke="#998866" strokeWidth={1.5}/>
      <rect x={-42} y={-75} width={84}  height={48} rx={3} fill="#1a1610" stroke="#887755" strokeWidth={1.5}/>
      <g data-anim="main-screen">
        <rect x={-36} y={-118} width={72} height={46} rx={3} fill="#0e0c08" stroke="#aa9966" strokeWidth={2}/>
        {([0,1,2,3,4,5] as number[]).map(i => (
          <line key={i} x1={-28} y1={-110+i*8} x2={28} y2={-110+i*8} stroke="#887755" strokeWidth={1} opacity={0.6}/>
        ))}
        <circle cx={0} cy={-95} r={10} fill="#887755" opacity={0.3}/>
      </g>
      {([[-28,-55],[0,-55],[28,-55]] as [number,number][]).map(([x,y],i) => (
        <g key={i} data-anim="eye">
          <rect x={x-10} y={y-8} width={20} height={16} rx={2} fill="#0a0804" stroke="#cc9944" strokeWidth={1}/>
          <circle cx={x} cy={y} r={5} fill="#cc9944" opacity={0.8}/>
        </g>
      ))}
      <rect x={-80} y={-70} width={28} height={60} rx={6} fill="#1a1510" stroke="#887755" strokeWidth={1.5}/>
      <rect x={52}  y={-70} width={28} height={60} rx={6} fill="#1a1510" stroke="#887755" strokeWidth={1.5}/>
      {([[-45,70],[-20,68],[10,72],[35,68],[55,70]] as [number,number][]).map(([x,y],i) => (
        <path key={i} d={`M${x} ${y-10} Q${x+5} ${y} ${x+i*3} ${y+15}`} stroke="#887755" strokeWidth={2} fill="none" opacity={0.5} data-anim="paper"/>
      ))}
    </g>
  )
}

function DistractionWeaver() {
  const legs: [number, number, number, number, string][] = [
    [-35, -20, -112, -10, '#e85555'],
    [-35, -20, -106,  42, '#5588ee'],
    [-35, -20,  -80,  75, '#ee8833'],
    [ 35, -20,  112, -10, '#e85555'],
    [ 35, -20,  106,  42, '#5588ee'],
    [ 35, -20,   80,  75, '#ee8833'],
  ]
  return (
    <g data-anim="mob-root">
      {legs.map(([x1,y1,x2,y2,notifColor], i) => (
        <g key={i} data-anim="leg">
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a1a88" strokeWidth={3}/>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5544cc" strokeWidth={1}/>
          <circle cx={x2} cy={y2} r={5} fill={notifColor} opacity={0.85} data-anim="notif-dot"/>
        </g>
      ))}
      <path d="M-112,-10 Q-109,16 -106,42 Q-93,58 -80,75" stroke="#2a1a88" strokeWidth={1} fill="none" opacity={0.5}/>
      <path d="M112,-10 Q109,16 106,42 Q93,58 80,75"      stroke="#2a1a88" strokeWidth={1} fill="none" opacity={0.5}/>
      <path d="M-80,75 Q0,66 80,75"                        stroke="#2a1a88" strokeWidth={1} fill="none" opacity={0.4}/>
      <circle cx={0} cy={-20} r={40} fill="#0e0c18" stroke="#5544cc" strokeWidth={2}/>
      <circle cx={0} cy={-20} r={28} fill="#0a0814" stroke="#3322aa" strokeWidth={1}/>
      {([[-16,-30],[0,-34],[16,-30],[-22,-18],[22,-18]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i<3?7:6} fill="#0a0812" stroke="#7766ee" strokeWidth={1.5} data-anim="eye"/>
      ))}
      <path d="M-14 -6 Q0 -2 14 -6 L12 5 Q0 9 -12 5Z" fill="#0a0812" stroke="#5544cc" strokeWidth={1}/>
    </g>
  )
}

function VoidTyrant() {
  const stars: [number, number, number][] = [
    [-20,-120,2.5],[15,-140,2],[-35,-100,1.5],[30,-110,2],
    [-10,-80,1.5],[25,-85,2.5],[-40,-70,1.5],[40,-95,1.5],
    [0,-60,2],[-25,-55,1.5],[20,-50,1.5],[-5,-130,1.5],
    [35,-140,1],[-45,-130,1],
  ]
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-50} rx={80} ry={110} fill="#0a0810" stroke="#330055" strokeWidth={1} opacity={0.7}/>
      <path d="M-50 -130 Q0 -160 50 -130 L65 -60 Q70 0 50 50 Q20 80 0 75 Q-20 80 -50 50 Q-70 0 -65 -60Z"
        fill="#0d0a14" stroke="#6600aa" strokeWidth={2}/>
      <g data-anim="void-stars">
        {stars.map(([x,y,r],i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.25+Math.abs(Math.sin(i))*0.2}/>
        ))}
      </g>
      <g data-anim="eyes">
        <ellipse cx={-20} cy={-105} rx={16} ry={13} fill="#0a0810" stroke="#9900ff" strokeWidth={1.5}/>
        <ellipse cx={ 20} cy={-105} rx={16} ry={13} fill="#0a0810" stroke="#9900ff" strokeWidth={1.5}/>
        <ellipse cx={-20} cy={-105} rx={10} ry={8} fill="#5500cc" opacity={0.8}/>
        <ellipse cx={ 20} cy={-105} rx={10} ry={8} fill="#5500cc" opacity={0.8}/>
        <circle cx={-20} cy={-105} r={3} fill="#cc00ff"/>
        <circle cx={ 20} cy={-105} r={3} fill="#cc00ff"/>
      </g>
      <g data-anim="tendrils">
        {([-50,-25,0,25,50] as number[]).map((x,i) => (
          <path key={i} d={`M${x} -145 Q${x+10} -170 ${x+5} -195`} stroke="#6600aa" strokeWidth={2} fill="none" strokeLinecap="round"/>
        ))}
      </g>
      <path d="M-65 -30 Q-90 -20 -100 -5 Q-105 5 -100 15 Q-105 5 -108 10"
        stroke="#6600aa" strokeWidth={2} fill="none" strokeLinecap="round"/>
      <path d="M65 -30 Q90 -20 100 -5 Q105 5 100 15 Q105 5 108 10"
        stroke="#6600aa" strokeWidth={2} fill="none" strokeLinecap="round"/>
    </g>
  )
}

// ── New mobs ──────────────────────────────────────────────────────────────────

function Sluchowiec() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={-40} cy={-50} rx={18} ry={35} fill="#1a1625" stroke="#5a4a7a" strokeWidth={2}/>
      <ellipse cx={-40} cy={-50} rx={9} ry={20} fill="#100f1e" stroke="#3a2a5a" strokeWidth={1}/>
      <ellipse cx={ 40} cy={-50} rx={18} ry={35} fill="#1a1625" stroke="#5a4a7a" strokeWidth={2}/>
      <ellipse cx={ 40} cy={-50} rx={9} ry={20} fill="#100f1e" stroke="#3a2a5a" strokeWidth={1}/>
      <ellipse cx={0} cy={-52} rx={26} ry={28} fill="#1a1625" stroke="#5a4a7a" strokeWidth={2}/>
      <ellipse cx={-10} cy={-58} rx={7} ry={3} fill="#0a090e" stroke="#7a6a9a" strokeWidth={1}/>
      <ellipse cx={ 10} cy={-58} rx={7} ry={3} fill="#0a090e" stroke="#7a6a9a" strokeWidth={1}/>
      <circle cx={-10} cy={-58} r={2} fill="#aa88cc" opacity={0.7} data-anim="eye-glow"/>
      <circle cx={ 10} cy={-58} r={2} fill="#aa88cc" opacity={0.7} data-anim="eye-glow"/>
      <path d="M-8 -38 Q0 -35 8 -38" stroke="#5a4a7a" strokeWidth={1.5} fill="none"/>
      <path d="M0 -25 Q-14 -5 -16 25 Q-12 48 0 52 Q12 48 16 25 Q14 -5 0 -25Z"
        fill="#1a1625" stroke="#5a4a7a" strokeWidth={1.5}/>
      <path d="M-62 -62 Q-70 -50 -62 -38" stroke="#5a4a7a" strokeWidth={1} fill="none" opacity={0.5} strokeLinecap="round"/>
      <path d="M-70 -66 Q-80 -50 -70 -34" stroke="#5a4a7a" strokeWidth={1} fill="none" opacity={0.3} strokeLinecap="round"/>
      <path d="M62 -62 Q70 -50 62 -38" stroke="#5a4a7a" strokeWidth={1} fill="none" opacity={0.5} strokeLinecap="round"/>
      <path d="M70 -66 Q80 -50 70 -34" stroke="#5a4a7a" strokeWidth={1} fill="none" opacity={0.3} strokeLinecap="round"/>
    </g>
  )
}

function Wzrokowiec() {
  const smallEyes: [number, number][] = [[-50,-15],[50,-10],[-35,40],[40,35],[0,-70]]
  return (
    <g data-anim="mob-root">
      {smallEyes.map(([cx,cy],i) => (
        <g key={i} data-anim="eye-small">
          <circle cx={cx} cy={cy} r={12} fill="#0d1a1a" stroke="#1a9a8a" strokeWidth={1.5}/>
          <circle cx={cx} cy={cy} r={6} fill="#1a6a5a"/>
          <circle cx={cx} cy={cy} r={3} fill="#000"/>
          <circle cx={cx+2} cy={cy-2} r={1} fill="#88ffee" opacity={0.8}/>
        </g>
      ))}
      <g data-anim="main-eye">
        <circle cx={0} cy={-10} r={35} fill="#0a1818" stroke="#22bbbb" strokeWidth={2}/>
        <ellipse cx={0} cy={-10} rx={28} ry={22} fill="#1a6a5a"/>
        <circle cx={0} cy={-10} r={14} fill="#0d1a1a"/>
        <circle cx={0} cy={-10} r={8} fill="#004444"/>
        <circle cx={4} cy={-14} r={3} fill="#88ffee" opacity={0.9}/>
      </g>
      {smallEyes.map(([cx,cy],i) => (
        <line key={i} x1={cx} y1={cy} x2={cx>0?18:-18} y2={-10} stroke="#1a9a8a" strokeWidth={1} opacity={0.2}/>
      ))}
    </g>
  )
}

function Czytacz() {
  return (
    <g data-anim="mob-root">
      <g data-anim="page">
        <path d="M-38 -90 L-38 30 L20 30 L35 15 L35 -90Z" fill="#e8e0c8" opacity={0.12} stroke="#c8c0a8" strokeWidth={1}/>
        <path d="M35 15 L20 15 L20 30" fill="none" stroke="#c8c0a8" strokeWidth={1} opacity={0.5}/>
        {[-70,-57,-44,-31,-18,-5,8,21].map((y,i) => (
          <line key={i} x1={-28} y1={y+20} x2={25+i*1.5} y2={y+20} stroke="#c8c0a8" strokeWidth={0.7} opacity={0.18}/>
        ))}
      </g>
      <path d="M-5 -60 Q-10 -30 -14 10 Q-18 40 -12 65" stroke="#6a6458" strokeWidth={8} fill="none" strokeLinecap="round"/>
      <path d="M-5 -60 Q-10 -30 -14 10 Q-18 40 -12 65" stroke="#1a180e" strokeWidth={5} fill="none" strokeLinecap="round"/>
      <ellipse cx={-5} cy={-75} rx={22} ry={24} fill="#1a180e" stroke="#6a6458" strokeWidth={1.5}/>
      <ellipse cx={-14} cy={-80} rx={8} ry={9} fill="#0a0908" stroke="#555" strokeWidth={1}/>
      <ellipse cx={4} cy={-80} rx={8} ry={9} fill="#0a0908" stroke="#555" strokeWidth={1}/>
      <path d="M-15 -60 Q-5 -56 3 -60" stroke="#6a6458" strokeWidth={1} fill="none"/>
      <path d="M-14 -42 Q-30 -55 -38 -60" stroke="#6a6458" strokeWidth={5} fill="none" strokeLinecap="round"/>
      <path d="M-14 -42 Q-30 -55 -38 -60" stroke="#1a180e" strokeWidth={3} fill="none" strokeLinecap="round"/>
      <path d="M-14 -30 Q10 -25 20 -20" stroke="#6a6458" strokeWidth={5} fill="none" strokeLinecap="round"/>
      <path d="M-14 -30 Q10 -25 20 -20" stroke="#1a180e" strokeWidth={3} fill="none" strokeLinecap="round"/>
    </g>
  )
}

function Brainless() {
  return (
    <g data-anim="mob-root">
      <path d="M-26 -60 Q-30 -100 0 -105 Q30 -100 26 -60 L26 -30 L-26 -30Z"
        fill="#1a1818" stroke="#888070" strokeWidth={2}/>
      <path d="M-22 -62 Q-24 -95 0 -100 Q24 -95 22 -62 L22 -32 L-22 -32Z"
        fill="#0a0908"/>
      <circle cx={-10} cy={-50} r={6} fill="#888070" opacity={0.4}/>
      <circle cx={ 10} cy={-50} r={6} fill="#888070" opacity={0.4}/>
      <circle cx={-10} cy={-50} r={2} fill="#555" opacity={0.6}/>
      <circle cx={ 10} cy={-50} r={2} fill="#555" opacity={0.6}/>
      <path d="M-14 -28 Q0 -22 14 -28 Q14 -16 0 -14 Q-14 -16 -14 -28Z"
        fill="#1a1818" stroke="#888070" strokeWidth={1.5}/>
      <line x1={0} y1={-28} x2={0} y2={0} stroke="#888070" strokeWidth={6}/>
      <line x1={0} y1={-28} x2={0} y2={0} stroke="#0a0908" strokeWidth={3}/>
      <line x1={0} y1={-15} x2={-30} y2={5} stroke="#888070" strokeWidth={4}/>
      <line x1={0} y1={-15} x2={30} y2={5} stroke="#888070" strokeWidth={4}/>
      <line x1={0} y1={0} x2={-14} y2={50} stroke="#888070" strokeWidth={4}/>
      <line x1={0} y1={0} x2={14} y2={50} stroke="#888070" strokeWidth={4}/>
    </g>
  )
}

function Zmeczony() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-60} rx={24} ry={22} fill="#1a1820" stroke="#4a4560" strokeWidth={1.5}/>
      <ellipse cx={-10} cy={-64} rx={8} ry={6} fill="#0a090e" stroke="#5a5578" strokeWidth={1}/>
      <ellipse cx={ 10} cy={-64} rx={8} ry={6} fill="#0a090e" stroke="#5a5578" strokeWidth={1}/>
      <path d="M-18 -66 Q-10 -60 -2 -66" fill="#1a1820" stroke="#4a4560" strokeWidth={1}/>
      <path d="M2 -66 Q10 -60 18 -66"    fill="#1a1820" stroke="#4a4560" strokeWidth={1}/>
      <ellipse cx={-10} cy={-58} rx={8} ry={3} fill="#2a2535" opacity={0.5}/>
      <ellipse cx={ 10} cy={-58} rx={8} ry={3} fill="#2a2535" opacity={0.5}/>
      <path d="M-10 -47 Q0 -52 10 -47" stroke="#4a4560" strokeWidth={1.5} fill="none"/>
      <path d="M0 -40 Q-16 -10 -22 25 Q-26 55 -8 72" stroke="#4a4560" strokeWidth={12} fill="none" strokeLinecap="round"/>
      <path d="M0 -40 Q-16 -10 -22 25 Q-26 55 -8 72" stroke="#1a1820" strokeWidth={8} fill="none" strokeLinecap="round"/>
      <path d="M0 -40 Q14 -12 18 22 Q20 50 10 70" stroke="#4a4560" strokeWidth={10} fill="none" strokeLinecap="round"/>
      <path d="M0 -40 Q14 -12 18 22 Q20 50 10 70" stroke="#1a1820" strokeWidth={7} fill="none" strokeLinecap="round"/>
    </g>
  )
}

function Glupi() {
  return (
    <g data-anim="mob-root">
      <path d="M0 -80 Q40 -75 55 -40 Q68 0 55 35 Q38 65 0 68 Q-38 65 -55 35 Q-68 0 -55 -40 Q-40 -75 0 -80Z"
        fill="#1e1e16" stroke="#6a6842" strokeWidth={2}/>
      <circle cx={-8} cy={-20} r={18} fill="#0e0e0a" stroke="#888860" strokeWidth={1.5}/>
      <circle cx={-8} cy={-20} r={8} fill="#444430"/>
      <circle cx={-8} cy={-20} r={4} fill="#0a0a08"/>
      <circle cx={-4} cy={-24} r={2} fill="#aaaa88" opacity={0.5}/>
      <path d="M-20 10 Q0 20 20 10 Q18 28 0 30 Q-18 28 -20 10Z"
        fill="#0a0a08" stroke="#6a6842" strokeWidth={1}/>
      <line x1={-8} y1={14} x2={-6} y2={28} stroke="#888860" strokeWidth={1.5} opacity={0.4}/>
      <line x1={2} y1={14} x2={4} y2={28} stroke="#888860" strokeWidth={1.5} opacity={0.4}/>
      <path d="M-55 0 Q-70 -5 -75 5" stroke="#6a6842" strokeWidth={4} fill="none" strokeLinecap="round"/>
      <path d="M55 -5 Q70 -10 74 0" stroke="#6a6842" strokeWidth={4} fill="none" strokeLinecap="round"/>
    </g>
  )
}

function ArchitektScianTekstu() {
  return (
    <g data-anim="mob-root">
      <rect x={-38} y={-120} width={76} height={180} rx={2} fill="#12100e" stroke="#888070" strokeWidth={2}/>
      {Array.from({length:14},(_,i) => (
        <line key={i} x1={-30} y1={-108+i*13} x2={25+Math.sin(i)*6} y2={-108+i*13}
          stroke="#888070" strokeWidth={i%4===0?1.5:0.8} opacity={i%4===0?0.6:0.35}/>
      ))}
      <circle cx={-12} cy={-30} r={7} fill="#0a0908" stroke="#cc8844" strokeWidth={1.5}/>
      <circle cx={ 12} cy={-30} r={7} fill="#0a0908" stroke="#cc8844" strokeWidth={1.5}/>
      <circle cx={-12} cy={-30} r={3} fill="#cc8844" opacity={0.8} data-anim="eye"/>
      <circle cx={ 12} cy={-30} r={3} fill="#cc8844" opacity={0.8} data-anim="eye"/>
      <rect x={-42} y={55} width={84} height={8} rx={2} fill="#888070" opacity={0.15}/>
    </g>
  )
}

function BaronPivot() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-65} rx={22} ry={22} fill="#141020" stroke="#cc8833" strokeWidth={2} strokeDasharray="6 3"/>
      <text x={-8} y={-59} fontSize={10} fill="#cc8833" fontFamily="monospace" textAnchor="middle" opacity={0.8}>?</text>
      <text x={8} y={-59} fontSize={10} fill="#cc8833" fontFamily="monospace" textAnchor="middle" opacity={0.8}>!</text>
      <path d="M0 -44 Q-12 -20 -14 10 Q-12 30 0 40 Q12 30 14 10 Q12 -20 0 -44Z"
        fill="#141020" stroke="#cc8833" strokeWidth={1.5} strokeDasharray="8 4"/>
      <g data-anim="arrow-l">
        <line x1={-14} y1={-20} x2={-55} y2={-30} stroke="#cc8833" strokeWidth={2.5}/>
        <polygon points="-55,-30 -44,-20 -44,-40" fill="#cc8833"/>
      </g>
      <g data-anim="arrow-r">
        <line x1={14} y1={-15} x2={55} y2={-5} stroke="#cc8833" strokeWidth={2.5}/>
        <polygon points="55,-5 44,-15 44,5" fill="#cc8833"/>
      </g>
      <line x1={-8} y1={40} x2={-10} y2={75} stroke="#cc8833" strokeWidth={4} strokeDasharray="7 4" strokeLinecap="round"/>
      <line x1={8} y1={40} x2={12} y2={75} stroke="#cc8833" strokeWidth={4} strokeDasharray="7 4" strokeLinecap="round"/>
    </g>
  )
}

function Pobudzony() {
  const pts = Array.from({length:12},(_,i) => {
    const rad = (i * 30 - 90) * Math.PI / 180
    const r = i % 2 === 0 ? 60 : 38
    return `${(r*Math.cos(rad)).toFixed(1)},${(r*Math.sin(rad)-20).toFixed(1)}`
  }).join(' ')
  return (
    <g data-anim="mob-root">
      <polygon points={pts} fill="#1a1800" stroke="#ffcc22" strokeWidth={1.5}/>
      {[0,60,120,180,240,300].map((deg,i) => {
        const rad = (deg-90) * Math.PI / 180
        return <line key={i} x1={62*Math.cos(rad)} y1={62*Math.sin(rad)-20}
          x2={84*Math.cos(rad)} y2={84*Math.sin(rad)-20}
          stroke="#ffcc22" strokeWidth={1.5} opacity={0.5} data-anim="ray"/>
      })}
      <circle cx={-10} cy={-26} r={7} fill="#0a0900" stroke="#ffdd44" strokeWidth={1.5}/>
      <circle cx={ 10} cy={-26} r={7} fill="#0a0900" stroke="#ffdd44" strokeWidth={1.5}/>
      <circle cx={-8} cy={-29} r={3} fill="#ffee55" data-anim="eye"/>
      <circle cx={12} cy={-29} r={3} fill="#ffee55" data-anim="eye"/>
      <path d="M-14 -8 L-8 -12 L-2 -8 L4 -12 L10 -8 L14 -12" stroke="#ffcc22" strokeWidth={1.5} fill="none"/>
    </g>
  )
}

function Sfrustrowany() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-20} rx={42} ry={52} fill="#1a1010" stroke="#aa4433" strokeWidth={2}/>
      {[-50,-30,-10,10,30].map((y,i) => (
        <ellipse key={i} cx={0} cy={y} rx={42} ry={6} fill="none" stroke="#883322" strokeWidth={1} opacity={0.5}/>
      ))}
      <ellipse cx={-14} cy={-22} rx={9} ry={7} fill="#0a0808" stroke="#cc4433" strokeWidth={1.5}/>
      <ellipse cx={ 14} cy={-22} rx={9} ry={7} fill="#0a0808" stroke="#cc4433" strokeWidth={1.5}/>
      <ellipse cx={-14} cy={-24} rx={6} ry={4} fill="#cc4433" opacity={0.8}/>
      <ellipse cx={ 14} cy={-24} rx={6} ry={4} fill="#cc4433" opacity={0.8}/>
      <line x1={-23} y1={-33} x2={-5} y2={-28} stroke="#cc4433" strokeWidth={2}/>
      <line x1={5} y1={-28} x2={23} y2={-33} stroke="#cc4433" strokeWidth={2}/>
      <path d="M-16 -8 L-10 -12 L-4 -8 L2 -12 L8 -8 L14 -12 L18 -8" stroke="#cc4433" strokeWidth={1.5} fill="none"/>
      <path d="M8 -50 L14 -30 L6 -20 L16 0" stroke="#cc4433" strokeWidth={2} fill="none" strokeLinecap="round" data-anim="crack" opacity={0.9}/>
      <path d="M-10 -68 Q-15 -85 -8 -98" stroke="#aa8888" strokeWidth={2} fill="none" opacity={0.5} strokeLinecap="round" data-anim="steam"/>
      <path d="M10 -66 Q16 -82 12 -96"  stroke="#aa8888" strokeWidth={2} fill="none" opacity={0.4} strokeLinecap="round" data-anim="steam"/>
      <circle cx={0} cy={28} r={10} fill="#0a0808" stroke="#883322" strokeWidth={1.5}/>
      <line x1={0} y1={28} x2={6} y2={20} stroke="#cc4433" strokeWidth={2} strokeLinecap="round"/>
    </g>
  )
}

function KolekcjonerKursow() {
  const books: Array<{x:number;y:number;w:number;h:number;c:string;s:string}> = [
    {x:-35,y:-10,w:70,h:18,c:'#2a1a0a',s:'#8a6a44'},
    {x:-30,y:-30,w:60,h:18,c:'#0a1a2a',s:'#4a6a8a'},
    {x:-33,y:-50,w:66,h:18,c:'#1a0a1a',s:'#7a4a7a'},
    {x:-28,y:-70,w:56,h:18,c:'#2a1a0a',s:'#8a5a34'},
    {x:-26,y:-90,w:52,h:18,c:'#0a1a0a',s:'#4a8a4a'},
    {x:-22,y:-110,w:44,h:18,c:'#1a1a0a',s:'#7a7a34'},
  ]
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={18} rx={28} ry={16} fill="#1a1610" stroke="#6a5a44" strokeWidth={1}/>
      <line x1={-12} y1={-5} x2={-8} y2={18} stroke="#6a5a44" strokeWidth={5} strokeLinecap="round"/>
      <line x1={12} y1={-5} x2={8} y2={18}   stroke="#6a5a44" strokeWidth={5} strokeLinecap="round"/>
      {books.map((b,i) => (
        <g key={i} data-anim={`book-${i}`}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={2} fill={b.c} stroke={b.s} strokeWidth={1.5}/>
          <line x1={b.x+6} y1={b.y} x2={b.x+6} y2={b.y+b.h} stroke={b.s} strokeWidth={2} opacity={0.6}/>
          <line x1={b.x+10} y1={b.y+5}  x2={b.x+b.w-6}  y2={b.y+5}  stroke={b.s} strokeWidth={0.7} opacity={0.4}/>
          <line x1={b.x+10} y1={b.y+11} x2={b.x+b.w-10} y2={b.y+11} stroke={b.s} strokeWidth={0.7} opacity={0.4}/>
        </g>
      ))}
      <circle cx={-10} cy={5} r={5} fill="#0a0908" stroke="#cc9944" strokeWidth={1}/>
      <circle cx={ 10} cy={5} r={5} fill="#0a0908" stroke="#cc9944" strokeWidth={1}/>
      <circle cx={-9} cy={4} r={2} fill="#cc9944" opacity={0.9}/>
      <circle cx={11} cy={4} r={2} fill="#cc9944" opacity={0.9}/>
    </g>
  )
}

function FormatowyPurysta() {
  return (
    <g data-anim="mob-root">
      <rect x={-20} y={-100} width={40} height={40} rx={1} fill="#121820" stroke="#88aacc" strokeWidth={2}/>
      <line x1={-20} y1={-80} x2={20} y2={-80} stroke="#88aacc" strokeWidth={0.7} opacity={0.4}/>
      <line x1={0} y1={-100} x2={0} y2={-60} stroke="#88aacc" strokeWidth={0.7} opacity={0.4}/>
      <rect x={-15} y={-92} width={10} height={10} fill="#0a1018" stroke="#aaccee" strokeWidth={1.5}/>
      <rect x={5} y={-92} width={10} height={10} fill="#0a1018" stroke="#aaccee" strokeWidth={1.5}/>
      <rect x={-12} y={-89} width={4} height={4} fill="#aaccee" opacity={0.8}/>
      <rect x={8} y={-89} width={4} height={4} fill="#aaccee" opacity={0.8}/>
      <line x1={-12} y1={-66} x2={12} y2={-66} stroke="#88aacc" strokeWidth={1.5}/>
      <rect x={-18} y={-60} width={36} height={70} rx={0} fill="#121820" stroke="#88aacc" strokeWidth={1.5}/>
      <line x1={0} y1={-60} x2={0} y2={10} stroke="#88aacc" strokeWidth={0.7} opacity={0.3}/>
      <g data-anim="ruler-arm">
        <rect x={18} y={-55} width={12} height={55} rx={1} fill="#0e1418" stroke="#88aacc" strokeWidth={1.5}/>
        {[0,1,2,3,4].map(i => (
          <line key={i} x1={18} y1={-55+i*11} x2={i%2===0?30:26} y2={-55+i*11}
            stroke="#88aacc" strokeWidth={1} opacity={0.6}/>
        ))}
      </g>
      <line x1={-10} y1={10} x2={-10} y2={65} stroke="#88aacc" strokeWidth={8}/>
      <line x1={10} y1={10} x2={10} y2={65} stroke="#88aacc" strokeWidth={8}/>
      <line x1={-10} y1={10} x2={-10} y2={65} stroke="#121820" strokeWidth={5}/>
      <line x1={10} y1={10} x2={10} y2={65} stroke="#121820" strokeWidth={5}/>
    </g>
  )
}

function AlgorytmicznyZombie() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-75} rx={26} ry={28} fill="#0e1810" stroke="#22aa44" strokeWidth={2}/>
      <path d="M-20 -80 L-10 -80 L-10 -70 L0 -70" stroke="#22aa44" strokeWidth={1} fill="none" opacity={0.5}/>
      <path d="M20 -80 L10 -80 L10 -70 L0 -70" stroke="#22aa44" strokeWidth={1} fill="none" opacity={0.5}/>
      <path d="M-24 -65 L-14 -65 L-14 -55 L-24 -55" stroke="#22aa44" strokeWidth={1} fill="none" opacity={0.4}/>
      <circle cx={-12} cy={-80} r={7} fill="#0a1008" stroke="#44cc66" strokeWidth={1.5}/>
      <circle cx={ 12} cy={-80} r={7} fill="#0a1008" stroke="#44cc66" strokeWidth={1.5}/>
      <circle cx={-12} cy={-80} r={4} fill="#22cc44" opacity={0.9} data-anim="eye-node"/>
      <circle cx={ 12} cy={-80} r={4} fill="#22cc44" opacity={0.9} data-anim="eye-node"/>
      <path d="M-14 -56 Q0 -50 14 -56 Q12 -44 0 -42 Q-12 -44 -14 -56Z"
        fill="#0a1008" stroke="#22aa44" strokeWidth={1}/>
      <rect x={-20} y={-48} width={40} height={65} rx={3} fill="#0e1810" stroke="#22aa44" strokeWidth={1.5}/>
      <path d="M-12 -40 L-12 -20 L0 -20 L0 -10 L12 -10" stroke="#22aa44" strokeWidth={1} fill="none" opacity={0.4}/>
      <path d="M-18 -5 L-8 -5 L-8 10 L8 10" stroke="#22aa44" strokeWidth={1} fill="none" opacity={0.4}/>
      <circle cx={0} cy={-20} r={3} fill="#22cc44" opacity={0.6}/>
      <circle cx={12} cy={-10} r={3} fill="#22cc44" opacity={0.6}/>
      <circle cx={8} cy={10} r={3} fill="#22cc44" opacity={0.6}/>
      <path d="M-20 -35 Q-40 -45 -58 -35" stroke="#0e1810" strokeWidth={10} fill="none" strokeLinecap="round"/>
      <path d="M-20 -35 Q-40 -45 -58 -35" stroke="#22aa44" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
      <path d="M20 -35 Q38 -20 40 0" stroke="#0e1810" strokeWidth={10} fill="none" strokeLinecap="round"/>
      <path d="M20 -35 Q38 -20 40 0" stroke="#22aa44" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
      <line x1={-10} y1={17} x2={-14} y2={65} stroke="#0e1810" strokeWidth={10} strokeLinecap="round"/>
      <line x1={-10} y1={17} x2={-14} y2={65} stroke="#22aa44" strokeWidth={1.5} strokeLinecap="round"/>
      <line x1={10} y1={17} x2={8} y2={65} stroke="#0e1810" strokeWidth={10} strokeLinecap="round"/>
      <line x1={10} y1={17} x2={8} y2={65} stroke="#22aa44" strokeWidth={1.5} strokeLinecap="round"/>
    </g>
  )
}

function Intelektualista() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={0} cy={-90} rx={32} ry={36} fill="#1a100e" stroke="#886655" strokeWidth={2}/>
      <circle cx={12} cy={-88} r={12} fill="none" stroke="#ccaa77" strokeWidth={2}/>
      <line x1={24} y1={-80} x2={30} y2={-72} stroke="#ccaa77" strokeWidth={1.5}/>
      <circle cx={-12} cy={-92} r={6} fill="#0a0808" stroke="#886655" strokeWidth={1}/>
      <circle cx={-10} cy={-94} r={2} fill="#aa8866" opacity={0.8}/>
      <circle cx={12} cy={-88} r={5} fill="#0a0808" stroke="#ccaa77" strokeWidth={1}/>
      <circle cx={14} cy={-90} r={2} fill="#ccaa77" opacity={0.9}/>
      <path d="M0 -55 Q-6 -30 -8 10 Q-6 40 0 55 Q6 40 8 10 Q6 -30 0 -55Z"
        fill="#1a100e" stroke="#886655" strokeWidth={1.5}/>
      <g data-anim="finger">
        <path d="M8 -42 Q20 -55 28 -72" stroke="#1a100e" strokeWidth={8} fill="none" strokeLinecap="round"/>
        <path d="M8 -42 Q20 -55 28 -72" stroke="#886655" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
        <circle cx={28} cy={-72} r={4} fill="#886655" opacity={0.8}/>
      </g>
      <path d="M-8 -40 Q-20 -28 -22 -10" stroke="#1a100e" strokeWidth={8} fill="none" strokeLinecap="round"/>
      <path d="M-8 -40 Q-20 -28 -22 -10" stroke="#886655" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
      <line x1={-4} y1={55} x2={-6} y2={75} stroke="#886655" strokeWidth={5} strokeLinecap="round"/>
      <line x1={4} y1={55} x2={8} y2={75} stroke="#886655" strokeWidth={5} strokeLinecap="round"/>
    </g>
  )
}

function FabrykaWyswietlen() {
  return (
    <g data-anim="mob-root">
      <ellipse cx={-15} cy={-120} rx={10} ry={15} fill="#555" opacity={0.12} data-anim="smoke"/>
      <ellipse cx={10} cy={-132} rx={8} ry={12} fill="#555" opacity={0.08} data-anim="smoke"/>
      <g data-anim="eye">
        <circle cx={0} cy={-95} r={28} fill="#0e0e0a" stroke="#cc8833" strokeWidth={2}/>
        <ellipse cx={0} cy={-95} rx={20} ry={16} fill="#884422"/>
        <circle cx={0} cy={-95} r={10} fill="#0a0808"/>
        <circle cx={5} cy={-100} r={4} fill="#ffaa44" opacity={0.8}/>
      </g>
      <rect x={-28} y={-65} width={56} height={110} rx={3} fill="#1a1208" stroke="#887744" strokeWidth={2}/>
      {[-50,-30,-10,10,30].map((y,i) => (
        <line key={i} x1={-28} y1={y+15} x2={28} y2={y+15} stroke="#887744" strokeWidth={1.5} opacity={0.4}/>
      ))}
      <rect x={-18} y={-40} width={36} height={22} rx={2} fill="#0a0808" stroke="#cc8833" strokeWidth={1}/>
      <text x={0} y={-25} textAnchor="middle" fontSize={11} fill="#cc8833" fontFamily="monospace">1.2M</text>
      <rect x={-42} y={-55} width={14} height={35} rx={3} fill="#1a1208" stroke="#887744" strokeWidth={1.5}/>
      <rect x={28} y={-50} width={14} height={30} rx={3} fill="#1a1208" stroke="#887744" strokeWidth={1.5}/>
      <rect x={-34} y={42} width={68} height={10} rx={3} fill="#1a1208" stroke="#887744" strokeWidth={1}/>
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
  notification_swarm:     NotificationSwarm,
  impostor_shade:         ImpostorShade,
  algorithm_specter:      AlgorithmSpecter,
  deadline_wraith:        DeadlineWraith,
  overload_colossus:      OverloadColossus,
  distraction_weaver:      DistractionWeaver,
  void_tyrant:             VoidTyrant,
  sluchowiec:              Sluchowiec,
  wzrokowiec:              Wzrokowiec,
  czytacz:                 Czytacz,
  brainless:               Brainless,
  zmeczony:                Zmeczony,
  glupi:                   Glupi,
  architekt_sciany_tekstu: ArchitektScianTekstu,
  baron_pivot:             BaronPivot,
  pobudzony:               Pobudzony,
  sfrustrowany:            Sfrustrowany,
  kolekcjoner_kursow:      KolekcjonerKursow,
  formatowy_purysta:       FormatowyPurysta,
  algorytmiczny_zombie:    AlgorytmicznyZombie,
  intelektualista:         Intelektualista,
  fabryka_wyswietlen:      FabrykaWyswietlen,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EnemyDisplay({ enemyId, hp, maxHp, onClick, cursor, svgForwardRef, sublocationtype }: Props) {
  const Art    = ART[enemyId] ?? BurnoutShade
  const hpPct  = Math.max(0, hp / maxHp)
  const isDead = hp <= 0

  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (isDead || !svgRef.current) return
    const animFn = MOB_ANIMATIONS[enemyId]
    if (!animFn) return
    const ctx = gsap.context(animFn, svgRef)
    return () => ctx.revert()
  }, [enemyId, isDead])

  const gradId = `mobGlow-${enemyId}`

  return (
    <div
      className={`${s.root} ${isDead ? s.corpse : ''}`}
      onClick={onClick}
      style={cursor ? { cursor } : undefined}
    >
      <svg
        ref={el => {
          (svgRef as React.MutableRefObject<SVGSVGElement | null>).current = el
          if (svgForwardRef) (svgForwardRef as React.MutableRefObject<SVGSVGElement | null>).current = el
        }}
        viewBox={`${-W/2} ${-H*0.7} ${W} ${H}`}
        className={[
          s.svg,
          !isDead && sublocationtype === 'elite' ? s.eliteGlow : '',
          !isDead && sublocationtype === 'boss'  ? s.bossGlow  : '',
        ].join(' ')}
        style={{ opacity: isDead ? 0.3 : 0.85 + hpPct * 0.15 }}
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="45%" r="50%">
            <stop offset="0%"   stopColor="#2e2255" stopOpacity="0.95"/>
            <stop offset="60%"  stopColor="#1c1840" stopOpacity="0.70"/>
            <stop offset="100%" stopColor="#1c1840" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx={0} cy={-20} rx={108} ry={148} fill={`url(#${gradId})`}/>
        <ellipse cx={0} cy={H*0.25} rx={80} ry={16} fill="rgba(80,50,140,0.18)"/>
        <Art />
      </svg>
    </div>
  )
}
