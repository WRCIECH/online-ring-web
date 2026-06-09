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
    weaponClass: 'thrusting_swords',
    startingStats: { VIG:11, END:11, MND:10, STR:9, DEX:12, INT:11, FAI:9, ARC:7 },
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
    weaponClass: 'great_spears',
    startingStats: { VIG:13, END:10, MND:9, STR:14, DEX:10, INT:8, FAI:9, ARC:7 },
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
  {
    id: 'curator',
    name: 'Curator',
    description: 'Discovers and organises. Connects scattered ideas into something valuable.',
    weaponClass: 'spears',
    startingStats: { VIG:9, END:10, MND:11, STR:11, DEX:13, INT:10, FAI:9, ARC:7 },
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Simplifies complexity. Turns knowledge into actionable understanding.',
    weaponClass: 'halberds',
    startingStats: { VIG:9, END:10, MND:13, STR:8, DEX:8, INT:13, FAI:13, ARC:6 },
  },
  {
    id: 'experimenter',
    name: 'Experimenter',
    description: 'Learns by doing. Publishes results instead of theories.',
    weaponClass: 'katanas',
    startingStats: { VIG:9, END:12, MND:10, STR:8, DEX:14, INT:11, FAI:8, ARC:8 },
  },
  {
    id: 'performer',
    name: 'Performer',
    description: 'Leads with personality. People return for the creator more than the topic.',
    weaponClass: 'curved_greatswords',
    startingStats: { VIG:9, END:11, MND:9, STR:8, DEX:11, INT:8, FAI:14, ARC:10 },
  },
  {
    id: 'polemicist',
    name: 'Polemicist',
    description: 'Confrontational and uncompromising. Thrives in the clash of ideas.',
    weaponClass: 'colossal_swords',
    startingStats: { VIG:13, END:10, MND:8, STR:16, DEX:8, INT:8, FAI:9, ARC:8 },
  },
  {
    id: 'aesthete',
    name: 'Aesthete',
    description: 'Form is content. Builds atmosphere, beauty, and a distinctive mood.',
    weaponClass: 'reapers',
    startingStats: { VIG:9, END:10, MND:12, STR:8, DEX:11, INT:9, FAI:8, ARC:13 },
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Aspirational and magnetic. Makes audiences want to be part of their world.',
    weaponClass: 'greatbows',
    startingStats: { VIG:11, END:9, MND:10, STR:10, DEX:8, INT:8, FAI:15, ARC:9 },
  },
  {
    id: 'exposer',
    name: 'Exposer',
    description: 'Hunts hidden truths. Uncovers what others prefer to leave unsaid.',
    weaponClass: 'great_hammers',
    startingStats: { VIG:12, END:9, MND:9, STR:15, DEX:8, INT:12, FAI:8, ARC:7 },
  },
  {
    id: 'prophet',
    name: 'Prophet',
    description: 'Watches for coming change. Warns of threats and points toward the future.',
    weaponClass: 'whips',
    startingStats: { VIG:9, END:9, MND:13, STR:8, DEX:10, INT:11, FAI:8, ARC:12 },
  },
]

export function getClassDef(id: string): ClassDef | undefined {
  return CLASS_DEFINITIONS.find(c => c.id === id)
}
