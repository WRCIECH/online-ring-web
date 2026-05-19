import type { Weapon, WeaponInstance, WeaponRarity } from '../types/game'
import { MOVES } from './movesets'

// Mutable registry — generators and store hydration populate this at runtime
export const WEAPONS: Record<string, Weapon> = {}

// Damage bonus per weapon level, by rarity (fight_spec.md §5.2)
export const LEVEL_MULT: Record<WeaponRarity, number> = {
  common:    0.03,
  magic:     0.04,
  rare:      0.05,
  epic:      0.06,
  legendary: 0.08,
}

export function calcStepDamage(
  step: { base_damage: number },
  weapon: Weapon,
  level: number,
): number {
  const wi   = weapon as WeaponInstance | undefined
  const mult = LEVEL_MULT[wi?.rarity ?? 'common'] ?? 0.03
  return Math.floor(step.base_damage * (1 + level * mult))
}

export function getWeaponMovesets(weaponId: string, extraMovesets: string[]): typeof MOVES[string][] {
  const weapon = WEAPONS[weaponId]
  if (!weapon) return []
  const ids = [...weapon.constant_movesets, ...extraMovesets.filter(Boolean)]
  return ids.map(id => MOVES[id]).filter(Boolean)
}

/** Register a generated weapon instance into the runtime registry. */
export function registerWeapon(w: WeaponInstance): void {
  WEAPONS[w.instance_id] = w
}
