// One distinct armor SVG per player class (32×48 viewBox, height = size prop)

interface Props {
  classId: string
  size?: number
  className?: string
}

const CLASS_COLORS: Record<string, [string, string]> = {
  chronicler:  ['#7b99aa', '#a0bfcc'],
  sprinter:    ['#aaaacc', '#ccccee'],
  architect:   ['#888899', '#aaaacc'],
  researcher:  ['#9a7d5a', '#c4a478'],
  storyteller: ['#9966bb', '#bb88dd'],
  orator:      ['#cc8844', '#eea866'],
  curator:     ['#558855', '#77aa77'],
  teacher:     ['#6688bb', '#88aadd'],
  experimenter:['#448899', '#66aacc'],
  performer:   ['#cc5588', '#ee77aa'],
  polemicist:  ['#cc4444', '#ee6666'],
  aesthete:    ['#9955bb', '#bb77dd'],
  influencer:  ['#ccaa22', '#eedd44'],
  exposer:     ['#cc7722', '#ee9944'],
  prophet:     ['#7755cc', '#9977ee'],
}

const DEFAULT_COLOR: [string, string] = ['#888899', '#aaaacc']

export default function ArmorSprite({ classId, size = 48, className }: Props) {
  const w = Math.round((size * 2) / 3)
  const [P, S] = CLASS_COLORS[classId] ?? DEFAULT_COLOR
  return (
    <svg
      viewBox="0 0 32 48"
      width={w}
      height={size}
      aria-hidden="true"
      className={className}
    >
      {renderArmor(classId, P, S)}
    </svg>
  )
}

function renderArmor(classId: string, P: string, S: string) {
  switch (classId) {
    case 'chronicler':
      // Balanced symmetric chest plate with two horizontal ribs
      return <>
        <polygon points="8,7 24,7 27,40 5,40" fill={P} stroke={S} strokeWidth="1.2"/>
        <rect x="5" y="4" width="22" height="5" rx="2" fill={S} opacity="0.7"/>
        <line x1="7" y1="19" x2="25" y2="19" stroke={S} strokeWidth="1.0"/>
        <line x1="7" y1="28" x2="25" y2="28" stroke={S} strokeWidth="1.0"/>
        <rect x="13" y="34" width="6" height="4" rx="1" fill={S} opacity="0.6"/>
      </>

    case 'sprinter':
      // Lightweight scale mail — three rows of offset ellipses
      return <>
        {([0,1,2] as const).map(row =>
          ([0,1,2,3] as const).map(col => {
            const key = row * 4 + col
            return <ellipse key={key}
              cx={5 + col * 7 + (row % 2) * 3.5}
              cy={10 + row * 11}
              rx={3.5} ry={5}
              fill={P} stroke={S} strokeWidth="0.7"
            />
          })
        )}
        <ellipse cx={8.5} cy={43} rx={3.5} ry={5} fill={P} stroke={S} strokeWidth="0.7"/>
        <ellipse cx={15.5} cy={43} rx={3.5} ry={5} fill={P} stroke={S} strokeWidth="0.7"/>
        <ellipse cx={22.5} cy={43} rx={3.5} ry={5} fill={P} stroke={S} strokeWidth="0.7"/>
      </>

    case 'architect':
      // Heavy double-layer plate with central vertical groove
      return <>
        <rect x="5" y="7" width="22" height="34" rx="2" fill={P} stroke={S} strokeWidth="1.3"/>
        <rect x="7" y="9" width="18" height="30" rx="1" fill="none" stroke={S} strokeWidth="0.7" opacity="0.5"/>
        <line x1="16" y1="7" x2="16" y2="41" stroke={S} strokeWidth="1.2"/>
        <rect x="4" y="5" width="24" height="6" rx="2" fill={S} opacity="0.75"/>
        <rect x="4" y="38" width="24" height="5" rx="2" fill={S} opacity="0.75"/>
      </>

    case 'researcher':
      // Studded leather: tapered shape with stud circles
      return <>
        <polygon points="9,7 23,7 26,41 6,41" fill={P} stroke={S} strokeWidth="1.1"/>
        {([10, 18, 27] as const).map((cy, ri) =>
          ([10, 16, 22] as const).map((cx, ci) => (
            <circle key={ri * 3 + ci} cx={cx} cy={cy} r={1.4} fill={S} opacity="0.8"/>
          ))
        )}
        <rect x="12" y="4" width="8" height="4" rx="1" fill={S} opacity="0.6"/>
        <line x1="6" y1="35" x2="26" y2="35" stroke={S} strokeWidth="0.7"/>
      </>

    case 'storyteller':
      // Wave-edged breastplate — organic silhouette
      return <>
        <path d="M8,8 Q16,4 24,8 L27,40 Q16,44 5,40 Z" fill={P} stroke={S} strokeWidth="1.1"/>
        <path d="M8,18 Q13,15 16,18 Q19,21 24,18" fill="none" stroke={S} strokeWidth="0.9"/>
        <path d="M7,27 Q12,24 16,27 Q20,30 25,27" fill="none" stroke={S} strokeWidth="0.9"/>
        <circle cx="16" cy="35" r="3" fill={S} opacity="0.5"/>
      </>

    case 'orator':
      // Resonance collar — semicircular top with radiating arcs
      return <>
        <path d="M5,24 L5,42 Q16,46 27,42 L27,24 Q16,10 5,24Z" fill={P} stroke={S} strokeWidth="1.1"/>
        <path d="M8,24 Q16,12 24,24" fill="none" stroke={S} strokeWidth="1.2"/>
        <path d="M10,24 Q16,16 22,24" fill="none" stroke={S} strokeWidth="0.9" opacity="0.7"/>
        <path d="M12,24 Q16,19 20,24" fill="none" stroke={S} strokeWidth="0.7" opacity="0.5"/>
        <line x1="16" y1="24" x2="16" y2="42" stroke={S} strokeWidth="0.8" opacity="0.5"/>
      </>

    case 'curator':
      // Grid compartment plate
      return <>
        <rect x="5" y="7" width="22" height="34" rx="2" fill={P} stroke={S} strokeWidth="1.1"/>
        <line x1="12.3" y1="7" x2="12.3" y2="41" stroke={S} strokeWidth="0.7"/>
        <line x1="19.7" y1="7" x2="19.7" y2="41" stroke={S} strokeWidth="0.7"/>
        <line x1="5" y1="16.3" x2="27" y2="16.3" stroke={S} strokeWidth="0.7"/>
        <line x1="5" y1="25.7" x2="27" y2="25.7" stroke={S} strokeWidth="0.7"/>
        <line x1="5" y1="35" x2="27" y2="35" stroke={S} strokeWidth="0.7"/>
        <rect x="5" y="7" width="22" height="34" rx="2" fill="none" stroke={S} strokeWidth="1.2"/>
      </>

    case 'teacher':
      // Minimal clean outline with central horizontal bar
      return <>
        <rect x="7" y="8" width="18" height="33" rx="3" fill={P} stroke={S} strokeWidth="1.3"/>
        <line x1="7" y1="22" x2="25" y2="22" stroke={S} strokeWidth="1.5"/>
        <line x1="16" y1="8" x2="16" y2="41" stroke={S} strokeWidth="0.6" opacity="0.4"/>
        <rect x="13" y="4" width="6" height="5" rx="1" fill={S} opacity="0.7"/>
      </>

    case 'experimenter':
      // Asymmetric mismatched sides
      return <>
        <polygon points="7,8 20,6 27,38 5,42" fill={P} stroke={S} strokeWidth="1.1"/>
        <line x1="7" y1="20" x2="21" y2="18" stroke={S} strokeWidth="1.1"/>
        <line x1="6" y1="31" x2="23" y2="29" stroke={S} strokeWidth="0.8"/>
        <circle cx="23" cy="12" r="2.5" fill={S} opacity="0.7"/>
        <rect x="5" y="38" width="8" height="3" rx="1" fill={S} opacity="0.6"/>
        <circle cx="24" cy="36" r="3" fill={S} opacity="0.5"/>
      </>

    case 'performer':
      // Winged pauldrons spread outward
      return <>
        <polygon points="12,14 20,14 22,40 10,40" fill={P} stroke={S} strokeWidth="1.1"/>
        <polygon points="4,8 14,14 12,28 2,22" fill={P} stroke={S} strokeWidth="1.1"/>
        <polygon points="28,8 18,14 20,28 30,22" fill={P} stroke={S} strokeWidth="1.1"/>
        <rect x="13" y="4" width="6" height="12" rx="2" fill={S} opacity="0.6"/>
        <line x1="12" y1="22" x2="20" y2="22" stroke={S} strokeWidth="1.0"/>
      </>

    case 'polemicist':
      // Spiked top — rectangular plate with 5 spikes
      return <>
        <rect x="5" y="14" width="22" height="28" rx="1" fill={P} stroke={S} strokeWidth="1.1"/>
        {([7, 11, 16, 21, 25] as const).map((cx, i) => (
          <polygon key={i} points={`${cx - 2},14 ${cx + 2},14 ${cx},5`} fill={S} opacity="0.85"/>
        ))}
        <line x1="5" y1="24" x2="27" y2="24" stroke={S} strokeWidth="0.9"/>
        <line x1="5" y1="33" x2="27" y2="33" stroke={S} strokeWidth="0.9"/>
      </>

    case 'aesthete':
      // Flowing organic leaf-shaped breastplate
      return <>
        <path d="M16,6 Q26,14 26,26 Q26,40 16,44 Q6,40 6,26 Q6,14 16,6Z"
          fill={P} stroke={S} strokeWidth="1.1"/>
        <path d="M16,10 Q23,17 23,26 Q23,37 16,40 Q9,37 9,26 Q9,17 16,10Z"
          fill="none" stroke={S} strokeWidth="0.7" opacity="0.5"/>
        <line x1="16" y1="6" x2="16" y2="44" stroke={S} strokeWidth="0.7" opacity="0.4"/>
        <ellipse cx="16" cy="26" rx="4" ry="5" fill={S} opacity="0.4"/>
      </>

    case 'influencer':
      // 8-pointed star burst
      return <>
        <polygon points="16,6 18,13 24,8 20,14 28,14 22,18 27,24 20,21 22,30 16,25 10,30 12,21 5,24 10,18 4,14 12,14 8,8 14,13"
          fill={P} stroke={S} strokeWidth="0.9"/>
        <circle cx="16" cy="18" r="5" fill={S} opacity="0.5"/>
        <polygon points="16,6 18,13 24,8 20,14 28,14 22,18 27,24 20,21 22,30 16,25 10,30 12,21 5,24 10,18 4,14 12,14 8,8 14,13"
          fill="none" stroke={S} strokeWidth="0.6"/>
        <rect x="13" y="30" width="6" height="12" rx="2" fill={P} stroke={S} strokeWidth="0.9"/>
      </>

    case 'exposer':
      // Three overlapping horizontal plates
      return <>
        <rect x="5" y="6" width="22" height="11" rx="2" fill={P} stroke={S} strokeWidth="1.1"/>
        <rect x="5" y="15" width="22" height="11" rx="2" fill={P} stroke={S} strokeWidth="1.1"/>
        <rect x="5" y="24" width="22" height="11" rx="2" fill={P} stroke={S} strokeWidth="1.1"/>
        <line x1="5" y1="37" x2="27" y2="37" stroke={S} strokeWidth="0.8" opacity="0.5"/>
        <rect x="12" y="37" width="8" height="5" rx="1" fill={P} stroke={S} strokeWidth="1.0"/>
        <line x1="7" y1="11" x2="13" y2="11" stroke={S} strokeWidth="0.7" opacity="0.6"/>
        <line x1="7" y1="20" x2="25" y2="20" stroke={S} strokeWidth="0.7" opacity="0.6"/>
        <line x1="7" y1="29" x2="25" y2="29" stroke={S} strokeWidth="0.7" opacity="0.6"/>
      </>

    case 'prophet':
      // Mandala ring with spokes
      return <>
        <circle cx="16" cy="22" r="16" fill={P} stroke={S} strokeWidth="1.0"/>
        <circle cx="16" cy="22" r="11" fill="none" stroke={S} strokeWidth="0.8"/>
        <circle cx="16" cy="22" r="5" fill={S} opacity="0.5"/>
        {([0,45,90,135,180,225,270,315]).map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <line key={i}
            x1={16 + Math.cos(rad) * 5} y1={22 + Math.sin(rad) * 5}
            x2={16 + Math.cos(rad) * 11} y2={22 + Math.sin(rad) * 11}
            stroke={S} strokeWidth="0.8"
          />
        })}
        <rect x="12" y="38" width="8" height="8" rx="1" fill={P} stroke={S} strokeWidth="0.9"/>
      </>

    default:
      // Fallback: plain plate
      return <>
        <rect x="7" y="8" width="18" height="33" rx="2" fill={P} stroke={S} strokeWidth="1.1"/>
      </>
  }
}
