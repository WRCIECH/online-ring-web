import type { WeaponClass, AtomicTime, ContentProductType, RolledPatternDraws } from '../../types/game'
import { WEAPON_CLASSES } from './weaponClasses'
import { ALL_CONTENT_PRODUCTS } from './workflowGenerator'

export type SlotKind = 'format'

export const ATOMIC_TIMES: AtomicTime[] = ['Micro', 'Short', 'Medium', 'Long', 'Deep']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function poolFor(weaponClass: WeaponClass): readonly ContentProductType[] {
  const cls = WEAPON_CLASSES[weaponClass]
  return cls.supported_products.length > 0 ? cls.supported_products : ALL_CONTENT_PRODUCTS
}

// Rolls the single content-type draw for a weapon instance.
export function rollFormatDraw(weaponClass: WeaponClass): RolledPatternDraws {
  const value = pick(poolFor(weaponClass))
  return { format: [[value]], length: pick(ATOMIC_TIMES) }
}
