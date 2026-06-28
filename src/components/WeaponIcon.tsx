import type { WeaponClass } from '../types/game'

interface Props {
  weaponClass: WeaponClass
  className?: string
}

const C = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export default function WeaponIcon({ weaponClass, className }: Props) {
  switch (weaponClass) {

    case 'straight_swords': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M16,3 L19,40 L16,42 L13,40 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <line x1="5" y1="40" x2="27" y2="40" strokeWidth={2} {...C}/>
        <line x1="16" y1="40" x2="16" y2="51" strokeWidth={2.5} {...C}/>
        <circle cx="16" cy="54" r="2.5" fill="currentColor"/>
      </svg>
    )

    case 'daggers': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M16,10 L18,34 L16,36 L14,34 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <line x1="8" y1="34" x2="24" y2="34" strokeWidth={1.5} {...C}/>
        <line x1="16" y1="34" x2="16" y2="46" strokeWidth={2.5} {...C}/>
        <circle cx="16" cy="49" r="2" fill="currentColor"/>
      </svg>
    )

    case 'colossal_swords': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M16,2 L24,38 L16,41 L8,38 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <line x1="2" y1="38" x2="30" y2="38" strokeWidth={2.5} {...C}/>
        <line x1="16" y1="38" x2="16" y2="52" strokeWidth={3} {...C}/>
        <ellipse cx="16" cy="54.5" rx="3.5" ry="2" fill="currentColor"/>
      </svg>
    )

    case 'heavy_thrusting': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M16,3 L17.5,43 L16,45 L14.5,43 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={0.8}/>
        <path d="M10,43 L14,41 L18,41 L22,43" strokeWidth={1.5} {...C}/>
        <line x1="16" y1="43" x2="16" y2="52" strokeWidth={2} {...C}/>
        <circle cx="16" cy="54" r="2" fill="currentColor"/>
      </svg>
    )

    case 'curved_swords': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M14,4 Q22,22 20,40 L16,42 L13,40 Q10,22 14,4 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <line x1="8" y1="40" x2="22" y2="40" strokeWidth={1.5} {...C}/>
        <line x1="15" y1="40" x2="14" y2="52" strokeWidth={2.5} {...C}/>
        <circle cx="14" cy="54" r="2" fill="currentColor"/>
      </svg>
    )

    case 'curved_greatswords': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M13,3 Q25,18 22,42 L17,44 L12,42 Q8,18 13,3 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <path d="M4,42 Q16,38 26,42" strokeWidth={2} {...C}/>
        <line x1="15" y1="42" x2="14" y2="54" strokeWidth={3} {...C}/>
        <ellipse cx="14" cy="55" rx="3" ry="1.5" fill="currentColor"/>
      </svg>
    )

    case 'katanas': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M14,3 Q16,20 18,44 L16,46 L15,44 Q13,20 14,3 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <ellipse cx="16.5" cy="44" rx="6" ry="2" {...C} fill="currentColor" fillOpacity={0.25} strokeWidth={1.5}/>
        <line x1="16" y1="44" x2="16" y2="53" strokeWidth={2.5} {...C}/>
        <circle cx="16" cy="55" r="1.8" fill="currentColor"/>
      </svg>
    )

    case 'hammers': return (
      <svg viewBox="0 0 32 56" className={className}>
        <rect x="5" y="6" width="22" height="15" rx="2" {...C} fill="currentColor" fillOpacity={0.5} strokeWidth={1.5}/>
        <line x1="16" y1="21" x2="16" y2="54" strokeWidth={2.5} {...C}/>
        <line x1="13" y1="34" x2="19" y2="34" strokeWidth={1} {...C}/>
        <line x1="13" y1="42" x2="19" y2="42" strokeWidth={1} {...C}/>
      </svg>
    )

    case 'halberds': return (
      <svg viewBox="0 0 32 56" className={className}>
        <line x1="16" y1="14" x2="16" y2="56" strokeWidth={1.5} {...C}/>
        <path d="M16,3 L13,14 L16,13 L19,14 Z" {...C} fill="currentColor" fillOpacity={0.6} strokeWidth={1}/>
        <path d="M16,18 L5,25 L7,33 L16,30 Z" {...C} fill="currentColor" fillOpacity={0.5} strokeWidth={1}/>
        <path d="M16,22 L22,25 L16,28" strokeWidth={1} {...C}/>
      </svg>
    )

    case 'torches': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M16,4 C22,10 22,18 16,22 C10,18 10,10 16,4 Z" {...C} fill="currentColor" fillOpacity={0.6} strokeWidth={1}/>
        <path d="M16,10 C19,14 18,18 16,20 C14,18 13,14 16,10 Z" {...C} fill="currentColor" fillOpacity={0.3} strokeWidth={0.5}/>
        <rect x="13" y="22" width="6" height="30" rx="2" {...C} fill="currentColor" fillOpacity={0.35} strokeWidth={1.5}/>
        <line x1="13" y1="30" x2="19" y2="30" strokeWidth={1} {...C}/>
        <line x1="13" y1="38" x2="19" y2="38" strokeWidth={1} {...C}/>
        <line x1="13" y1="46" x2="19" y2="46" strokeWidth={1} {...C}/>
      </svg>
    )

    case 'bows': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M22,3 Q6,14 6,28 Q6,42 22,53" strokeWidth={2} {...C}/>
        <line x1="22" y1="3" x2="22" y2="53" strokeWidth={1} {...C}/>
        <line x1="22" y1="28" x2="30" y2="23" strokeWidth={1} {...C}/>
        <path d="M30,23 L27,23 L30,21 Z" {...C} fill="currentColor" fillOpacity={0.7} strokeWidth={0.8}/>
        <line x1="22" y1="28" x2="14" y2="30" strokeWidth={0.8} {...C}/>
      </svg>
    )

    case 'greatbows': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M24,2 Q4,12 4,28 Q4,44 24,54" strokeWidth={2.5} {...C}/>
        <line x1="24" y1="2" x2="24" y2="54" strokeWidth={1.2} {...C}/>
        <line x1="24" y1="28" x2="32" y2="23" strokeWidth={1} {...C}/>
        <path d="M32,23 L29,22 L32,21 Z" {...C} fill="currentColor" fillOpacity={0.7} strokeWidth={0.8}/>
      </svg>
    )

    case 'great_spears': return (
      <svg viewBox="0 0 32 56" className={className}>
        <path d="M16,2 L12,14 L16,16 L20,14 Z" {...C} fill="currentColor" fillOpacity={0.55} strokeWidth={1}/>
        <line x1="16" y1="14" x2="16" y2="56" strokeWidth={1.5} {...C}/>
        <line x1="12" y1="40" x2="20" y2="40" strokeWidth={1} {...C}/>
        <line x1="12" y1="48" x2="20" y2="48" strokeWidth={1} {...C}/>
      </svg>
    )

    case 'flails': return (
      <svg viewBox="0 0 32 56" className={className}>
        <rect x="13" y="38" width="6" height="16" rx="2" {...C} fill="currentColor" fillOpacity={0.35} strokeWidth={1.5}/>
        <path d="M16,38 C14,30 20,24 18,16" strokeWidth={1.5} strokeDasharray="3 2" {...C}/>
        <circle cx="18" cy="11" r="5" {...C} fill="currentColor" fillOpacity={0.45} strokeWidth={1.5}/>
        <line x1="18" y1="6" x2="18" y2="3" strokeWidth={1.5} {...C}/>
        <line x1="23" y1="11" x2="26" y2="11" strokeWidth={1.5} {...C}/>
        <line x1="21.5" y1="7.5" x2="23.5" y2="5.5" strokeWidth={1.5} {...C}/>
        <line x1="21.5" y1="14.5" x2="23.5" y2="16.5" strokeWidth={1.5} {...C}/>
        <line x1="13" y1="11" x2="10" y2="11" strokeWidth={1.5} {...C}/>
      </svg>
    )

    case 'whips': return (
      <svg viewBox="0 0 32 56" className={className}>
        <rect x="22" y="42" width="6" height="12" rx="2" {...C} fill="currentColor" fillOpacity={0.35} strokeWidth={1.5}/>
        <path d="M24,42 C22,34 10,30 14,22 C18,14 26,12 22,4" strokeWidth={1.5} {...C}/>
        <line x1="22" y1="4" x2="20" y2="2" strokeWidth={1} {...C}/>
      </svg>
    )

    default: return (
      <svg viewBox="0 0 32 56" className={className}>
        <line x1="16" y1="3" x2="16" y2="53" strokeWidth={2} stroke="currentColor" strokeLinecap="round"/>
      </svg>
    )
  }
}
