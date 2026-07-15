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
    startingStats: { VIG:11, END:11, TEXT:9, VIDEO:9, AUDIO:9, GRAPHIC:9, VELOCITY:9, DEPTH:9, PARASOCIAL:9, FRICTION:9, INSIGHT:9 },
  },
  {
    id: 'sprinter',
    name: 'Sprinter',
    description: 'Fast, high-volume output. Many small pieces over one large one.',
    weaponClass: 'daggers',
    startingStats: { VIG:9, END:13, TEXT:8, VIDEO:8, AUDIO:8, GRAPHIC:13, VELOCITY:15, DEPTH:8, PARASOCIAL:8, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Heavy and deliberate. Builds structures designed to last.',
    weaponClass: 'colossal_swords',
    startingStats: { VIG:13, END:10, TEXT:13, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:8, DEPTH:15, PARASOCIAL:8, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Evidence-based and analytical. Depth before breadth.',
    weaponClass: 'spears',
    startingStats: { VIG:9, END:10, TEXT:12, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:8, DEPTH:15, PARASOCIAL:8, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Narrative, emotional arc. Puts story above everything else.',
    weaponClass: 'curved_swords',
    startingStats: { VIG:10, END:11, TEXT:8, VIDEO:15, AUDIO:13, GRAPHIC:8, VELOCITY:8, DEPTH:8, PARASOCIAL:8, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'orator',
    name: 'Orator',
    description: 'Voice-first, spoken content. Presence and clarity above polish.',
    weaponClass: 'torches',
    startingStats: { VIG:10, END:9, TEXT:8, VIDEO:8, AUDIO:15, GRAPHIC:8, VELOCITY:8, DEPTH:8, PARASOCIAL:13, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'curator',
    name: 'Curator',
    description: 'Discovers and organises. Connects scattered ideas into something valuable.',
    weaponClass: 'bows',
    startingStats: { VIG:9, END:10, TEXT:13, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:8, DEPTH:8, PARASOCIAL:8, FRICTION:8, INSIGHT:13 },
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Simplifies complexity. Turns knowledge into actionable understanding.',
    weaponClass: 'spears',
    startingStats: { VIG:9, END:10, TEXT:8, VIDEO:8, AUDIO:8, GRAPHIC:12, VELOCITY:8, DEPTH:13, PARASOCIAL:12, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'experimenter',
    name: 'Experimenter',
    description: 'Learns by doing. Publishes results instead of theories.',
    weaponClass: 'flails',
    startingStats: { VIG:9, END:12, TEXT:8, VIDEO:13, AUDIO:8, GRAPHIC:8, VELOCITY:8, DEPTH:8, PARASOCIAL:8, FRICTION:8, INSIGHT:15 },
  },
  {
    id: 'performer',
    name: 'Performer',
    description: 'Leads with personality. People return for the creator more than the topic.',
    weaponClass: 'curved_greatswords',
    startingStats: { VIG:9, END:11, TEXT:8, VIDEO:8, AUDIO:13, GRAPHIC:8, VELOCITY:8, DEPTH:8, PARASOCIAL:15, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'polemicist',
    name: 'Polemicist',
    description: 'Confrontational and uncompromising. Thrives in the clash of ideas.',
    weaponClass: 'hammers',
    startingStats: { VIG:13, END:10, TEXT:13, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:8, DEPTH:8, PARASOCIAL:8, FRICTION:16, INSIGHT:8 },
  },
  {
    id: 'aesthete',
    name: 'Aesthete',
    description: 'Form is content. Builds atmosphere, beauty, and a distinctive mood.',
    weaponClass: 'katanas',
    startingStats: { VIG:9, END:10, TEXT:8, VIDEO:13, AUDIO:8, GRAPHIC:13, VELOCITY:8, DEPTH:8, PARASOCIAL:8, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Aspirational and magnetic. Makes audiences want to be part of their world.',
    weaponClass: 'greatbows',
    startingStats: { VIG:11, END:9, TEXT:8, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:13, DEPTH:8, PARASOCIAL:15, FRICTION:8, INSIGHT:8 },
  },
  {
    id: 'exposer',
    name: 'Exposer',
    description: 'Hunts hidden truths. Uncovers what others prefer to leave unsaid.',
    weaponClass: 'great_spears',
    startingStats: { VIG:12, END:9, TEXT:8, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:8, DEPTH:13, PARASOCIAL:8, FRICTION:14, INSIGHT:8 },
  },
  {
    id: 'prophet',
    name: 'Prophet',
    description: 'Watches for coming change. Warns of threats and points toward the future.',
    weaponClass: 'whips',
    startingStats: { VIG:9, END:9, TEXT:8, VIDEO:8, AUDIO:8, GRAPHIC:8, VELOCITY:12, DEPTH:8, PARASOCIAL:8, FRICTION:12, INSIGHT:12 },
  },
]

export function getClassDef(id: string): ClassDef | undefined {
  return CLASS_DEFINITIONS.find(c => c.id === id)
}
