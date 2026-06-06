import type { Locale, TranslationBundle, ContentEntry } from './types'
import type { StepBadge } from '../types/game'
import en from './en'
import pl from './pl'
import { useGameStore } from '../store/gameStore'

export type { Locale, ContentEntry, TranslationBundle }
export { en, pl }

export function getT(locale: Locale): TranslationBundle {
  return locale === 'pl' ? pl : en
}

/** Resolve a badge's label and detail in the current locale.
 *  Falls back to the stored English strings for old saves that lack tr_key. */
export function resolveBadge(badge: StepBadge, locale: Locale): { label: string; detail: string } {
  if (!badge.tr_key) return { label: badge.label, detail: badge.detail }
  const t = getT(locale)
  const [prefix, key] = badge.tr_key.split('.')
  let entry: ContentEntry | undefined
  if (prefix === 'stage')    entry = (t.content.stage   as Record<string, ContentEntry>)[key]
  if (prefix === 'product')  entry = (t.content.product as Record<string, ContentEntry>)[key]
  if (prefix === 'origin')   entry = (t.content.origin  as Record<string, ContentEntry>)[key]
  if (prefix === 'dmg_type') entry = (t.content.dmg_type as Record<string, ContentEntry>)[key]
  if (prefix === 'status')   entry = (t.content.status  as Record<string, ContentEntry>)[key]

  let detailEntry: ContentEntry | undefined = entry
  if (badge.tr_detail_key) {
    const [dp, dk] = badge.tr_detail_key.split('.')
    if (dp === 'stage')    detailEntry = (t.content.stage   as Record<string, ContentEntry>)[dk]
    if (dp === 'product')  detailEntry = (t.content.product as Record<string, ContentEntry>)[dk]
    if (dp === 'origin')   detailEntry = (t.content.origin  as Record<string, ContentEntry>)[dk]
    if (dp === 'dmg_type') detailEntry = (t.content.dmg_type as Record<string, ContentEntry>)[dk]
    if (dp === 'status')   detailEntry = (t.content.status  as Record<string, ContentEntry>)[dk]
  }

  return {
    label:  entry?.badge_label ?? badge.label,
    detail: detailEntry?.detail ?? badge.detail,
  }
}

/** Hook — returns the active translation bundle for the current locale. */
export function useT(): TranslationBundle {
  const locale = useGameStore(s => s.locale)
  return getT(locale)
}
