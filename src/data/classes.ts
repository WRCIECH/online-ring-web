import type { Stats, WeaponClass } from '../types/game'

export interface ClassDef {
  id: string
  name: string
  description: string
  weaponClass: WeaponClass
  startingStats: Stats
}

export const CLASS_DEFINITIONS: ClassDef[] = [
  {
    id: 'chronicler',
    name: 'Chronicler',
    description: 'Balanced and methodical. Covers all formats with equal confidence.',
    weaponClass: 'straight_swords',
    startingStats: { VIG:11, END:11, MND:10, STR:11, DEX:11, INT:9, FAI:9, ARC:8 },
  },
  {
    id: 'sprinter',
    name: 'Sprinter',
    description: 'Fast, high-volume output. Many small pieces over one large one.',
    weaponClass: 'daggers',
    startingStats: { VIG:9, END:13, MND:10, STR:8, DEX:15, INT:9, FAI:8, ARC:8 },
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Heavy and deliberate. Builds structures designed to last.',
    weaponClass: 'greatswords',
    startingStats: { VIG:13, END:10, MND:9, STR:15, DEX:8, INT:8, FAI:9, ARC:8 },
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Evidence-based and analytical. Depth before breadth.',
    weaponClass: 'heavy_thrusting',
    startingStats: { VIG:9, END:10, MND:12, STR:10, DEX:8, INT:15, FAI:8, ARC:8 },
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Narrative, emotional arc. Puts story above everything else.',
    weaponClass: 'curved_swords',
    startingStats: { VIG:10, END:11, MND:9, STR:8, DEX:14, INT:7, FAI:9, ARC:12 },
  },
  {
    id: 'orator',
    name: 'Orator',
    description: 'Voice-first, spoken content. Presence and clarity above polish.',
    weaponClass: 'torches',
    startingStats: { VIG:10, END:9, MND:14, STR:8, DEX:8, INT:9, FAI:15, ARC:7 },
  },
]

export function getClassDef(id: string): ClassDef | undefined {
  return CLASS_DEFINITIONS.find(c => c.id === id)
}
