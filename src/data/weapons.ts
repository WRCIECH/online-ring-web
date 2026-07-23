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

const SELL_RARITY_BONUS: Record<WeaponRarity, number> = {
  common:       0,
  Intellectual: 25,
  rare:         75,
  epic:         175,
  legendary:    425,
}

/** Runes received when selling a weapon. Scales with rarity and poise weight. */
export function calcWeaponSellPrice(weapon: WeaponInstance): number {
  return 75 + SELL_RARITY_BONUS[weapon.rarity] + (weapon.poise_weight ?? 8) * 5
}

export { statLevelCost, weaponUpgradeCost } from './constants'

export function registerWeapon(w: WeaponInstance): void {
  WEAPONS[w.instance_id] = w
}
