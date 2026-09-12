import type { ContentTransformation, AtomicStage, Locale, EmotionType } from '../types/game'

export type { Locale }

export interface ContentEntry {
  badge_label: string
  label: string
  detail: string
  example: string
}

export interface TranslationBundle {
  content: {
    // Loosened from Record<ContentProductType, ContentEntry>: also carries entries for the
    // newer Medium/Heavy content-type pools (MediumContentType/HeavyContentType in types/game.ts),
    // which are separate unions from ContentProductType.
    product:        Record<string, ContentEntry>
    transformation: Record<ContentTransformation, ContentEntry>
    emotion:        Record<EmotionType, ContentEntry>
    stage:          Record<AtomicStage, ContentEntry>
  }
  weapons:        Record<string, { name: string; description: string }>
  enemies:        Record<string, { name: string; description: string }>
  classes:        Record<string, { name: string; description: string }>
  subloc_names:   Record<string, string>   // English sublocation name → locale name
  weapon_prefixes: Record<string, string>  // English rarity prefix → locale prefix
  ui:             Record<string, string>
}
