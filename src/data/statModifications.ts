import type { StatKey, MediumContentType, HeavyContentType } from '../types/game'

// Reverse mapping: which Medium chunk types each stat governs (for the per-chunk modification picker).
export const STAT_MEDIUM_TYPES: Partial<Record<StatKey, MediumContentType[]>> = {
  TEXT:       ['Text', 'Question', 'Reply', 'Correct', 'Commentary'],
  VIDEO:      ['Video', 'Livestream'],
  AUDIO:      ['Podcast'],
  GRAPHIC:    ['Graphic', 'Carousel', 'Infographic'],
  VELOCITY:   ['Poll', 'DM', 'LinkShare', 'Recycle'],
  DEPTH:      ['Infographic', 'Interview', 'Commentary'],
  PARASOCIAL: ['Interview', 'Meeting', 'Q&A'],
  FRICTION:   ['Correct', 'Reply'],
  INSIGHT:    ['Q&A', 'Meeting', 'LinkShare'],
}

// Reverse mapping: which Heavy product types each stat governs (for the whole-piece modification picker).
export const STAT_HEAVY_TYPES: Partial<Record<StatKey, HeavyContentType[]>> = {
  TEXT:       ['Text'],
  VIDEO:      ['Audio/Video'],
  AUDIO:      ['Audio/Video'],
  GRAPHIC:    [],
  VELOCITY:   [],
  DEPTH:      ['Software'],
  PARASOCIAL: ['Community'],
  FRICTION:   [],
  INSIGHT:    ['Software', 'Community'],
}

// Stats that govern modification actions (all except VIG and END).
export const MODIFICATION_STATS: StatKey[] = [
  'TEXT', 'VIDEO', 'AUDIO', 'GRAPHIC', 'VELOCITY', 'DEPTH', 'PARASOCIAL', 'FRICTION', 'INSIGHT',
]

export function statMediumTypes(stat: StatKey): MediumContentType[] {
  return STAT_MEDIUM_TYPES[stat] ?? []
}

export function statHeavyTypes(stat: StatKey): HeavyContentType[] {
  return STAT_HEAVY_TYPES[stat] ?? []
}
