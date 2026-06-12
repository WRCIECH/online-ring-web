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
  distraction_weaver:     DistractionWeaver,
  void_tyrant:            VoidTyrant,
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
