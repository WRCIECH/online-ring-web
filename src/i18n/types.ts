import type { AtomicOrigin, AtomicStage, DamageType, Locale, StatusType } from '../types/game'
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
    dmg_type: Record<DamageType, ContentEntry>
    status:   Record<StatusType, ContentEntry>
    stage:    Record<AtomicStage, ContentEntry>
  }
  weapons:  Record<string, { name: string; description: string }>
  enemies:  Record<string, { name: string; description: string }>
  classes:  Record<string, { name: string; description: string }>
  ui:       Record<string, string>
}
