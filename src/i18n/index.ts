import type { Locale, TranslationBundle, ContentEntry } from './types'
import type { WeaponInstance } from '../types/game'
import en from './en'
import pl from './pl'
import { useGameStore } from '../store/gameStore'

export type { Locale, ContentEntry, TranslationBundle }
export { en, pl }

export function getT(locale: Locale): TranslationBundle {
  return locale === 'pl' ? pl : en
}

/** Translate a generated weapon's display name using locale prefix + class name.
 *  Falls back to the stored English name for any unexpected format. */
export function localizeWeaponName(wi: WeaponInstance, t: TranslationBundle): string {
  const spaceIdx = wi.name.indexOf(' ')
  if (spaceIdx < 0) return wi.name
  const prefix          = wi.name.slice(0, spaceIdx)
  const translatedPrefix = t.weapon_prefixes[prefix] ?? prefix
  const translatedClass  = t.weapons[wi.weapon_class]?.name ?? wi.name.slice(spaceIdx + 1)
  return `${translatedPrefix} ${translatedClass}`
}

/** Hook — returns the active translation bundle for the current locale. */
export function useT(): TranslationBundle {
  const locale = useGameStore(s => s.locale)
  return getT(locale)
}
