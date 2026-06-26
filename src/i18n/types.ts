import type { AtomicOrigin, AtomicStage, StyleType, Locale, StatusType } from '../types/game'
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
    product:  Record<ContentProductType, ContentEntry>
    origin:   Record<AtomicOrigin, ContentEntry>
    style: Record<StyleType, ContentEntry>
    status:   Record<StatusType, ContentEntry>
    stage:    Record<AtomicStage, ContentEntry>
  }
  weapons:        Record<string, { name: string; description: string }>
  enemies:        Record<string, { name: string; description: string }>
  classes:        Record<string, { name: string; description: string }>
  subloc_names:   Record<string, string>   // English sublocation name → locale name
  weapon_prefixes: Record<string, string>  // English rarity prefix → locale prefix
  locations:      Record<string, string>   // English loc.id → locale name
  ui:             Record<string, string>
}
