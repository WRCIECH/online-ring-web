import type { WeaponInstance, WeaponRarity } from '../types/game'

// Runtime registry of weapon instances (populated by rollWeapon + store hydration)
export const WEAPONS: Record<string, WeaponInstance> = {}

// Damage bonus per weapon level, by rarity
export const LEVEL_MULT: Record<WeaponRarity, number> = {
  common:       0.08,
  Intellectual: 0.09,
  rare:         0.10,
  epic:         0.12,
  legendary:    0.15,
}

// Weapon-driven damage multiplier: rarity, affixes, and level scaling.
// Stats no longer affect damage — they govern campaign modification actions instead.
export function calcWeaponScaledDamage(
  baseValue: number,
  weapon: WeaponInstance,
  level: number,
): number {
  const levelMult = LEVEL_MULT[weapon.rarity] ?? 0.03
  const affixMult = weapon.affixes.reduce((m, a) => m * (a.damage_mult ?? 1), 1)
  return Math.floor(baseValue * weapon.base_damage_mult * affixMult * (1 + level * levelMult))
}

export { statLevelCost, weaponUpgradeCost } from './constants'

export function registerWeapon(w: WeaponInstance): void {
  WEAPONS[w.instance_id] = w
}
