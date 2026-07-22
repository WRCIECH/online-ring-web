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
    startingStats: { VIG:11, END:11, TEXT:1, VIDEO:1, AUDIO:1, GRAPHIC:1, VELOCITY:1, DEPTH:1, PARASOCIAL:1, FRICTION:1, INSIGHT:1 },
  },
  {
    id: 'sprinter',
    name: 'Sprinter',
    description: 'Fast, high-volume output. Many small pieces over one large one.',
    weaponClass: 'daggers',
    startingStats: { VIG:9, END:13, TEXT:0, VIDEO:0, AUDIO:0, GRAPHIC:2, VELOCITY:4, DEPTH:0, PARASOCIAL:0, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Heavy and deliberate. Builds structures designed to last.',
    weaponClass: 'colossal_swords',
    startingStats: { VIG:13, END:10, TEXT:3, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:0, DEPTH:4, PARASOCIAL:0, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Evidence-based and analytical. Depth before breadth.',
    weaponClass: 'spears',
    startingStats: { VIG:9, END:10, TEXT:2, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:0, DEPTH:4, PARASOCIAL:0, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Narrative, emotional arc. Puts story above everything else.',
    weaponClass: 'curved_swords',
    startingStats: { VIG:10, END:11, TEXT:0, VIDEO:4, AUDIO:2, GRAPHIC:0, VELOCITY:0, DEPTH:0, PARASOCIAL:0, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'orator',
    name: 'Orator',
    description: 'Voice-first, spoken content. Presence and clarity above polish.',
    weaponClass: 'torches',
    startingStats: { VIG:10, END:9, TEXT:0, VIDEO:0, AUDIO:4, GRAPHIC:0, VELOCITY:0, DEPTH:0, PARASOCIAL:2, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'curator',
    name: 'Curator',
    description: 'Discovers and organises. Connects scattered ideas into something valuable.',
    weaponClass: 'bows',
    startingStats: { VIG:9, END:10, TEXT:2, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:0, DEPTH:0, PARASOCIAL:0, FRICTION:0, INSIGHT:3 },
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Simplifies complexity. Turns knowledge into actionable understanding.',
    weaponClass: 'spears',
    startingStats: { VIG:9, END:10, TEXT:0, VIDEO:0, AUDIO:0, GRAPHIC:2, VELOCITY:0, DEPTH:2, PARASOCIAL:2, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'experimenter',
    name: 'Experimenter',
    description: 'Learns by doing. Publishes results instead of theories.',
    weaponClass: 'flails',
    startingStats: { VIG:9, END:12, TEXT:0, VIDEO:2, AUDIO:0, GRAPHIC:0, VELOCITY:0, DEPTH:0, PARASOCIAL:0, FRICTION:0, INSIGHT:4 },
  },
  {
    id: 'performer',
    name: 'Performer',
    description: 'Leads with personality. People return for the creator more than the topic.',
    weaponClass: 'curved_greatswords',
    startingStats: { VIG:9, END:11, TEXT:0, VIDEO:0, AUDIO:2, GRAPHIC:0, VELOCITY:0, DEPTH:0, PARASOCIAL:4, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'polemicist',
    name: 'Polemicist',
    description: 'Confrontational and uncompromising. Thrives in the clash of ideas.',
    weaponClass: 'hammers',
    startingStats: { VIG:13, END:10, TEXT:2, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:0, DEPTH:0, PARASOCIAL:0, FRICTION:4, INSIGHT:0 },
  },
  {
    id: 'aesthete',
    name: 'Aesthete',
    description: 'Form is content. Builds atmosphere, beauty, and a distinctive mood.',
    weaponClass: 'katanas',
    startingStats: { VIG:9, END:10, TEXT:0, VIDEO:2, AUDIO:0, GRAPHIC:2, VELOCITY:0, DEPTH:0, PARASOCIAL:0, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Aspirational and magnetic. Makes audiences want to be part of their world.',
    weaponClass: 'greatbows',
    startingStats: { VIG:11, END:9, TEXT:0, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:2, DEPTH:0, PARASOCIAL:4, FRICTION:0, INSIGHT:0 },
  },
  {
    id: 'exposer',
    name: 'Exposer',
    description: 'Hunts hidden truths. Uncovers what others prefer to leave unsaid.',
    weaponClass: 'great_spears',
    startingStats: { VIG:12, END:9, TEXT:0, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:0, DEPTH:2, PARASOCIAL:0, FRICTION:3, INSIGHT:0 },
  },
  {
    id: 'prophet',
    name: 'Prophet',
    description: 'Watches for coming change. Warns of threats and points toward the future.',
    weaponClass: 'whips',
    startingStats: { VIG:9, END:9, TEXT:0, VIDEO:0, AUDIO:0, GRAPHIC:0, VELOCITY:2, DEPTH:0, PARASOCIAL:0, FRICTION:2, INSIGHT:2 },
  },
]

export function getClassDef(id: string): ClassDef | undefined {
  return CLASS_DEFINITIONS.find(c => c.id === id)
}
