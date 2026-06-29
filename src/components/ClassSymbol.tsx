import type { SVGProps } from 'react'

interface Props extends SVGProps<SVGSVGElement> {
  classId: string
}

export default function ClassSymbol({ classId, ...props }: Props) {
  const inner = SYMBOLS[classId]
  if (!inner) return null
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {inner}
    </svg>
  )
}

const SYMBOLS: Record<string, React.ReactNode> = {

  /* ── Chronicler: open book + quill ───────────────────────────────────── */
  chronicler: <>
    <path d="M50 30 C38 26 20 28 14 33 L14 76 C20 71 38 69 50 73" />
    <path d="M50 30 C62 26 80 28 86 33 L86 76 C80 71 62 69 50 73" />
    <line x1="50" y1="30" x2="50" y2="73" />
    <line x1="22" y1="45" x2="44" y2="43" />
    <line x1="22" y1="53" x2="44" y2="51" />
    <line x1="22" y1="61" x2="44" y2="59" />
    <line x1="56" y1="43" x2="78" y2="45" />
    <line x1="56" y1="51" x2="78" y2="53" />
    <line x1="56" y1="59" x2="78" y2="61" />
    <path d="M72 12 C82 7 88 18 79 30 L58 73 L52 73 L60 59" />
    <line x1="72" y1="12" x2="60" y2="60" strokeWidth="0.9" />
  </>,

  /* ── Sprinter: lightning bolt ─────────────────────────────────────────── */
  sprinter: <>
    <path d="M58 12 L36 52 L53 52 L42 88 L72 44 L54 44 Z" />
    <line x1="12" y1="34" x2="26" y2="34" />
    <line x1="8"  y1="50" x2="24" y2="50" />
    <line x1="12" y1="66" x2="26" y2="66" />
  </>,

  /* ── Architect: drafting compass + arc ────────────────────────────────── */
  architect: <>
    <path d="M42 22 Q50 15 58 22" />
    <line x1="42" y1="22" x2="47" y2="38" />
    <line x1="58" y1="22" x2="53" y2="38" />
    <circle cx="50" cy="38" r="4" />
    <line x1="46.5" y1="40.5" x2="26" y2="80" />
    <line x1="53.5" y1="40.5" x2="74" y2="80" />
    <path d="M23 73 L27 81 L19 81 Z" fill="currentColor" strokeWidth="0" />
    <path d="M20 68 A35 35 0 0 1 80 68" strokeDasharray="5 3" />
  </>,

  /* ── Researcher: magnifying glass ────────────────────────────────────── */
  researcher: <>
    <circle cx="42" cy="42" r="25" />
    <line x1="61" y1="61" x2="84" y2="84" strokeWidth="3" />
    <line x1="30" y1="36" x2="54" y2="36" />
    <line x1="30" y1="43" x2="54" y2="43" />
    <line x1="30" y1="50" x2="47" y2="50" />
    <path d="M28 28 A18 18 0 0 1 46 22" strokeWidth="0.9" opacity="0.55" />
  </>,

  /* ── Storyteller: scroll ──────────────────────────────────────────────── */
  storyteller: <>
    <path d="M22 32 Q22 24 30 24 L70 24 Q78 24 78 32 L78 72 Q78 80 70 80 L30 80 Q22 80 22 72 Z" />
    <path d="M30 24 Q30 16 38 16 L62 16 Q70 16 70 24" />
    <path d="M30 80 Q30 88 38 88 L62 88 Q70 88 70 80" />
    <line x1="34" y1="40" x2="66" y2="40" />
    <line x1="34" y1="49" x2="66" y2="49" />
    <line x1="34" y1="58" x2="52" y2="58" />
    <path d="M60 62 L62 68 L68 68 L63 72 L65 78 L60 74 L55 78 L57 72 L52 68 L58 68 Z" strokeWidth="1" />
  </>,

  /* ── Orator: microphone + sound waves ────────────────────────────────── */
  orator: <>
    <path d="M40 16 Q40 10 50 10 Q60 10 60 16 L60 50 Q60 58 50 58 Q40 58 40 50 Z" />
    <line x1="44" y1="30" x2="56" y2="30" strokeWidth="0.9" />
    <line x1="44" y1="38" x2="56" y2="38" strokeWidth="0.9" />
    <line x1="44" y1="46" x2="56" y2="46" strokeWidth="0.9" />
    <path d="M32 28 Q25 35 25 42 Q25 49 32 56" />
    <path d="M22 22 Q12 34 12 42 Q12 50 22 62" strokeWidth="0.9" opacity="0.55" />
    <path d="M68 28 Q75 35 75 42 Q75 49 68 56" />
    <path d="M78 22 Q88 34 88 42 Q88 50 78 62" strokeWidth="0.9" opacity="0.55" />
    <line x1="50" y1="58" x2="50" y2="80" />
    <line x1="36" y1="80" x2="64" y2="80" />
    <line x1="38" y1="84" x2="62" y2="84" strokeWidth="0.9" />
  </>,

  /* ── Curator: connected node graph ───────────────────────────────────── */
  curator: <>
    <circle cx="50" cy="50" r="5" />
    <circle cx="50" cy="16" r="4" />
    <circle cx="80" cy="33" r="4" />
    <circle cx="80" cy="67" r="4" />
    <circle cx="50" cy="84" r="4" />
    <circle cx="20" cy="67" r="4" />
    <circle cx="20" cy="33" r="4" />
    <line x1="50" y1="45" x2="50" y2="20" />
    <line x1="54.3" y1="47.5" x2="76.5" y2="36" />
    <line x1="54.3" y1="52.5" x2="76.5" y2="64" />
    <line x1="50" y1="55" x2="50" y2="80" />
    <line x1="45.7" y1="52.5" x2="23.5" y2="64" />
    <line x1="45.7" y1="47.5" x2="23.5" y2="36" />
    <line x1="50" y1="20" x2="76.5" y2="36" strokeWidth="0.7" opacity="0.45" />
    <line x1="76.5" y1="36" x2="76.5" y2="64" strokeWidth="0.7" opacity="0.45" />
    <line x1="76.5" y1="64" x2="50" y2="80" strokeWidth="0.7" opacity="0.45" />
    <line x1="50" y1="80" x2="23.5" y2="64" strokeWidth="0.7" opacity="0.45" />
    <line x1="23.5" y1="64" x2="23.5" y2="36" strokeWidth="0.7" opacity="0.45" />
    <line x1="23.5" y1="36" x2="50" y2="20" strokeWidth="0.7" opacity="0.45" />
  </>,

  /* ── Teacher: lantern ────────────────────────────────────────────────── */
  teacher: <>
    <rect x="34" y="44" width="32" height="34" rx="3" />
    <path d="M34 44 L36 30 L64 30 L66 44" />
    <line x1="44" y1="30" x2="44" y2="20" />
    <line x1="56" y1="30" x2="56" y2="20" />
    <path d="M44 20 Q50 13 56 20" />
    <path d="M50 52 C46 58 46 66 50 68 C54 66 54 58 50 52" strokeWidth="1.3" />
    <line x1="20" y1="54" x2="30" y2="58" strokeWidth="0.9" />
    <line x1="16" y1="64" x2="28" y2="64" strokeWidth="0.9" />
    <line x1="20" y1="74" x2="30" y2="70" strokeWidth="0.9" />
    <line x1="80" y1="54" x2="70" y2="58" strokeWidth="0.9" />
    <line x1="84" y1="64" x2="72" y2="64" strokeWidth="0.9" />
    <line x1="80" y1="74" x2="70" y2="70" strokeWidth="0.9" />
    <line x1="40" y1="78" x2="60" y2="78" />
  </>,

  /* ── Experimenter: flask with bubbles ────────────────────────────────── */
  experimenter: <>
    <path d="M40 14 L40 44 L18 76 Q16 83 22 86 L78 86 Q84 83 82 76 L60 44 L60 14 Z" />
    <line x1="35" y1="14" x2="65" y2="14" />
    <line x1="37" y1="21" x2="63" y2="21" />
    <path d="M22 72 L78 72" strokeWidth="0.8" opacity="0.5" />
    <circle cx="36" cy="66" r="3.5" />
    <circle cx="52" cy="58" r="4.5" />
    <circle cx="65" cy="64" r="3" />
    <circle cx="44" cy="77" r="2.5" />
    <ellipse cx="50" cy="28" rx="20" ry="8" transform="rotate(-30 50 28)" strokeWidth="0.9" opacity="0.6" />
    <ellipse cx="50" cy="28" rx="20" ry="8" transform="rotate(30 50 28)" strokeWidth="0.9" opacity="0.6" />
  </>,

  /* ── Performer: smiling face with flourishes ──────────────────────────── */
  performer: <>
    <ellipse cx="50" cy="50" rx="30" ry="34" />
    <path d="M36 40 Q40 35 44 40" />
    <path d="M56 40 Q60 35 64 40" />
    <path d="M34 56 Q50 72 66 56" />
    <circle cx="35" cy="54" r="2" fill="currentColor" />
    <circle cx="65" cy="54" r="2" fill="currentColor" />
    <path d="M26 22 Q50 8 74 22" strokeWidth="1" />
    <path d="M18 18 L20 23 L25 23 L21 26 L23 31 L18 28 L13 31 L15 26 L11 23 L16 23 Z" strokeWidth="1" />
    <path d="M82 18 L84 23 L89 23 L85 26 L87 31 L82 28 L77 31 L79 26 L75 23 L80 23 Z" strokeWidth="1" />
  </>,

  /* ── Polemicist: crossed swords ──────────────────────────────────────── */
  polemicist: <>
    <line x1="20" y1="20" x2="80" y2="80" strokeWidth="2.2" />
    <line x1="27" y1="33" x2="14" y2="46" />
    <line x1="27" y1="33" x2="40" y2="20" />
    <circle cx="76" cy="76" r="4.5" />
    <line x1="80" y1="20" x2="20" y2="80" strokeWidth="2.2" />
    <line x1="73" y1="33" x2="86" y2="46" />
    <line x1="73" y1="33" x2="60" y2="20" />
    <circle cx="24" cy="76" r="4.5" />
    <circle cx="50" cy="50" r="4" fill="currentColor" strokeWidth="0" />
  </>,

  /* ── Aesthete: gem with facets ───────────────────────────────────────── */
  aesthete: <>
    <polygon points="50,8 88,50 50,92 12,50" />
    <polygon points="50,26 72,50 50,74 28,50" />
    <line x1="50" y1="8"  x2="50" y2="26" />
    <line x1="88" y1="50" x2="72" y2="50" />
    <line x1="50" y1="92" x2="50" y2="74" />
    <line x1="12" y1="50" x2="28" y2="50" />
    <line x1="50" y1="8"  x2="72" y2="50" strokeWidth="0.8" opacity="0.5" />
    <line x1="50" y1="8"  x2="28" y2="50" strokeWidth="0.8" opacity="0.5" />
    <line x1="88" y1="50" x2="50" y2="74" strokeWidth="0.8" opacity="0.5" />
    <line x1="12" y1="50" x2="50" y2="74" strokeWidth="0.8" opacity="0.5" />
    <circle cx="50" cy="50" r="3.5" fill="currentColor" strokeWidth="0" />
  </>,

  /* ── Influencer: planet with rings + orbiting dots ────────────────────── */
  influencer: <>
    <circle cx="50" cy="50" r="18" />
    <ellipse cx="50" cy="50" rx="42" ry="15" transform="rotate(-18 50 50)" />
    <ellipse cx="50" cy="50" rx="34" ry="12" transform="rotate(-18 50 50)" strokeWidth="0.8" opacity="0.55" />
    <circle cx="14" cy="22" r="2.5" fill="currentColor" strokeWidth="0" />
    <circle cx="86" cy="22" r="2.5" fill="currentColor" strokeWidth="0" />
    <circle cx="8"  cy="50" r="2"   fill="currentColor" strokeWidth="0" />
    <circle cx="92" cy="50" r="2"   fill="currentColor" strokeWidth="0" />
    <circle cx="18" cy="78" r="2.5" fill="currentColor" strokeWidth="0" />
    <circle cx="82" cy="78" r="2.5" fill="currentColor" strokeWidth="0" />
  </>,

  /* ── Exposer: eye ────────────────────────────────────────────────────── */
  exposer: <>
    <path d="M8 50 Q50 8 92 50 Q50 92 8 50 Z" />
    <circle cx="50" cy="50" r="20" />
    <circle cx="50" cy="50" r="10" />
    <circle cx="50" cy="50" r="5" fill="currentColor" strokeWidth="0" />
    <circle cx="56" cy="43" r="2.5" fill="currentColor" stroke="none" />
    <line x1="30" y1="30" x2="34" y2="22" strokeWidth="0.9" />
    <line x1="44" y1="22" x2="46" y2="14" strokeWidth="0.9" />
    <line x1="56" y1="22" x2="54" y2="14" strokeWidth="0.9" />
    <line x1="70" y1="30" x2="66" y2="22" strokeWidth="0.9" />
  </>,

  /* ── Prophet: hourglass + orbiting stars ─────────────────────────────── */
  prophet: <>
    <path d="M22 10 L78 10 L78 15 L56 50 L78 85 L78 90 L22 90 L22 85 L44 50 L22 15 Z" />
    <path d="M28 20 L72 20 L56 46" strokeWidth="0.9" opacity="0.6" />
    <path d="M34 80 Q50 70 66 80" strokeWidth="0.9" opacity="0.6" />
    <line x1="50" y1="46" x2="50" y2="58" strokeWidth="1.2" />
    <circle cx="10"  cy="24" r="2.5" fill="currentColor" strokeWidth="0" />
    <circle cx="90"  cy="24" r="2.5" fill="currentColor" strokeWidth="0" />
    <circle cx="6"   cy="50" r="3"   fill="currentColor" strokeWidth="0" />
    <circle cx="94"  cy="50" r="3"   fill="currentColor" strokeWidth="0" />
    <circle cx="10"  cy="76" r="2.5" fill="currentColor" strokeWidth="0" />
    <circle cx="90"  cy="76" r="2.5" fill="currentColor" strokeWidth="0" />
    <line x1="10" y1="26" x2="10" y2="30" strokeWidth="0.9" opacity="0.5" />
    <line x1="8"  y1="28" x2="12" y2="28" strokeWidth="0.9" opacity="0.5" />
    <line x1="90" y1="26" x2="90" y2="30" strokeWidth="0.9" opacity="0.5" />
    <line x1="88" y1="28" x2="92" y2="28" strokeWidth="0.9" opacity="0.5" />
  </>,
}
