// Stub for spec §8 procedural mob generator.
// Not wired into any screen yet — provides the interface and SVG structure
// that mobAnimations.ts expects (data-anim attributes on key groups).

export type MobArchetype = 'humanoid' | 'beast' | 'construct' | 'spirit' | 'swarm' | 'giant'
export type MobSize = 'small' | 'medium' | 'large' | 'colossal'

interface Props {
  archetype: MobArchetype
  size: MobSize
  primaryColor: string
  accentColor: string
}

const SIZE_SCALE: Record<MobSize, number> = { small: 0.75, medium: 1.0, large: 1.25, colossal: 1.55 }

export default function ProceduralMob({ archetype, size, primaryColor, accentColor }: Props) {
  const sc = SIZE_SCALE[size]

  switch (archetype) {
    case 'humanoid':
      return (
        <g data-anim="mob-root" transform={`scale(${sc})`}>
          <g data-anim="head">
            <ellipse cx={0} cy={-70} rx={24} ry={26} fill={primaryColor} stroke={accentColor} strokeWidth={1.5}/>
            <circle cx={-8} cy={-74} r={4} fill={accentColor} opacity={0.8}/>
            <circle cx={8} cy={-74} r={4} fill={accentColor} opacity={0.8}/>
          </g>
          <g data-anim="body">
            <rect x={-18} y={-44} width={36} height={58} rx={5} fill={primaryColor} stroke={accentColor} strokeWidth={1.5}/>
            <line x1={-18} y1={-24} x2={-40} y2={-8} stroke={accentColor} strokeWidth={6} strokeLinecap="round"/>
            <line x1={18} y1={-24} x2={40} y2={-8} stroke={accentColor} strokeWidth={6} strokeLinecap="round"/>
            <line x1={-10} y1={14} x2={-10} y2={52} stroke={accentColor} strokeWidth={8} strokeLinecap="round"/>
            <line x1={10} y1={14} x2={10} y2={52} stroke={accentColor} strokeWidth={8} strokeLinecap="round"/>
          </g>
        </g>
      )

    case 'beast':
      return (
        <g data-anim="mob-root" transform={`scale(${sc})`}>
          <g data-anim="body">
            <ellipse cx={0} cy={0} rx={52} ry={34} fill={primaryColor} stroke={accentColor} strokeWidth={1.5}/>
          </g>
          <g data-anim="head">
            <ellipse cx={48} cy={-18} rx={22} ry={18} fill={primaryColor} stroke={accentColor} strokeWidth={1.5}/>
            <circle cx={54} cy={-24} r={4} fill={accentColor}/>
            <path d="M38,-8 L62,-8 L58,4 L42,4 Z" fill={accentColor} opacity={0.6}/>
          </g>
          <line x1={-40} y1={10} x2={-48} y2={40} stroke={accentColor} strokeWidth={7} strokeLinecap="round"/>
          <line x1={-14} y1={24} x2={-18} y2={50} stroke={accentColor} strokeWidth={7} strokeLinecap="round"/>
          <line x1={14} y1={24} x2={18} y2={50} stroke={accentColor} strokeWidth={7} strokeLinecap="round"/>
          <line x1={40} y1={10} x2={48} y2={40} stroke={accentColor} strokeWidth={7} strokeLinecap="round"/>
        </g>
      )

    case 'construct':
      return (
        <g data-anim="mob-root" transform={`scale(${sc})`}>
          <g data-anim="body">
            <rect x={-28} y={-70} width={56} height={80} rx={2} fill={primaryColor} stroke={accentColor} strokeWidth={2}/>
            <rect x={-20} y={-58} width={40} height={22} rx={1} fill={accentColor} opacity={0.2}/>
            {[-10, 0, 10].map(x => (
              <rect key={x} x={x - 3} y={-36} width={6} height={28} rx={1} fill={accentColor} opacity={0.4}/>
            ))}
          </g>
          <g data-anim="head">
            <rect x={-20} y={-90} width={40} height={22} rx={2} fill={primaryColor} stroke={accentColor} strokeWidth={1.5}/>
            <rect x={-12} y={-84} width={8} height={8} rx={1} fill={accentColor}/>
            <rect x={4} y={-84} width={8} height={8} rx={1} fill={accentColor}/>
          </g>
        </g>
      )

    case 'spirit':
      return (
        <g data-anim="mob-root" opacity={0.8} transform={`scale(${sc})`}>
          <g data-anim="body">
            <path
              d="M0,-90 Q22,-60 28,-20 Q36,20 20,60 Q10,70 0,60 Q-10,70 -20,60 Q-36,20 -28,-20 Q-22,-60 0,-90Z"
              fill={primaryColor} stroke={accentColor} strokeWidth={1.5}
            />
          </g>
          <g data-anim="head">
            <circle cx={-10} cy={-52} r={6} fill={accentColor} opacity={0.85}/>
            <circle cx={10} cy={-52} r={6} fill={accentColor} opacity={0.85}/>
          </g>
          <g data-anim="tentacles">
            {([[-44,-20],[-48,10],[-36,38],[44,-20],[48,10],[36,38]] as [number,number][]).map(([x,y],i) => (
              <ellipse key={i} cx={x} cy={y} rx={7} ry={10} fill={primaryColor} stroke={accentColor} strokeWidth={1} opacity={0.45 + i * 0.04}/>
            ))}
          </g>
        </g>
      )

    case 'swarm':
      return (
        <g data-anim="mob-root" transform={`scale(${sc})`}>
          {([[-26,12],[10,22],[38,-8],[-8,-18],[20,2],[-40,-4],[28,28]] as [number,number][]).map(([dx,dy],i) => (
            <g key={i} data-anim="blob" transform={`translate(${dx},${dy})`}>
              <ellipse cx={0} cy={0} rx={16} ry={18} fill={primaryColor} stroke={accentColor} strokeWidth={1.2}/>
              <circle cx={-4} cy={-4} r={2.5} fill={accentColor}/>
              <circle cx={4} cy={-4} r={2.5} fill={accentColor}/>
            </g>
          ))}
        </g>
      )

    case 'giant':
      return (
        <g data-anim="mob-root" transform={`scale(${sc})`}>
          <g data-anim="head">
            <ellipse cx={0} cy={-80} rx={36} ry={38} fill={primaryColor} stroke={accentColor} strokeWidth={2}/>
            <circle cx={-12} cy={-86} r={6} fill={accentColor}/>
            <circle cx={12} cy={-86} r={6} fill={accentColor}/>
          </g>
          <g data-anim="body">
            <rect x={-32} y={-42} width={64} height={80} rx={8} fill={primaryColor} stroke={accentColor} strokeWidth={2}/>
            <line x1={-32} y1={-22} x2={-60} y2={10} stroke={accentColor} strokeWidth={14} strokeLinecap="round"/>
            <line x1={32} y1={-22} x2={60} y2={10} stroke={accentColor} strokeWidth={14} strokeLinecap="round"/>
            <line x1={-16} y1={38} x2={-16} y2={72} stroke={accentColor} strokeWidth={16} strokeLinecap="round"/>
            <line x1={16} y1={38} x2={16} y2={72} stroke={accentColor} strokeWidth={16} strokeLinecap="round"/>
          </g>
        </g>
      )
  }
}
