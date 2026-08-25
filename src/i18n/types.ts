import type { ContentTransformation, AtomicStage, Locale, EmotionType, PropagandaShift, MediumAudienceShift, StyleShift } from '../types/game'
import type { ContentProductType } from '../data/contentProducts'

export type { Locale }

export interface ContentEntry {
  badge_label: string
  label: string
  detail: string
  example: string
}

export interface TranslationBundle {
  content: {
    product:        Record<ContentProductType, ContentEntry>
    transformation: Record<ContentTransformation, ContentEntry>
    emotion:        Record<EmotionType, ContentEntry>
    stage:          Record<AtomicStage, ContentEntry>
    constraint: {
      propaganda: Record<PropagandaShift,       { label: string; description: string }>
      audience:   Record<MediumAudienceShift,   { label: string; description: string }>
      style:      Record<StyleShift,             { label: string; description: string }>
    }
  }
  weapons:        Record<string, { name: string; description: string }>
  enemies:        Record<string, { name: string; description: string }>
  classes:        Record<string, { name: string; description: string }>
  subloc_names:   Record<string, string>   // English sublocation name → locale name
  weapon_prefixes: Record<string, string>  // English rarity prefix → locale prefix
  ui:             Record<string, string>
}
