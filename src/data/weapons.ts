import type { Weapon, WeaponInstance, WeaponRarity, Stats, Grade } from '../types/game'
import { MOVES } from './movesets'

// Mutable registry — generators and store hydration populate this at runtime
export const WEAPONS: Record<string, Weapon> = {}

// Damage bonus per weapon level, by rarity
export const LEVEL_MULT: Record<WeaponRarity, number> = {
  common:    0.03,
  magic:     0.04,
  rare:      0.05,
  epic:      0.06,
  legendary: 0.08,
}

// Stat scaling: % damage bonus per stat point above base 8
export const GRADE_MULT: Record<Grade, number> = {
  S: 0.030, A: 0.022, B: 0.015, C: 0.010, D: 0.006, E: 0.003,
}

export function calcStepDamage(
  step: { base_damage: number },
  weapon: Weapon,
  level: number,
  stats?: Stats,
): number {
  const wi        = weapon as WeaponInstance | undefined
  const levelMult = LEVEL_MULT[wi?.rarity ?? 'common'] ?? 0.03
  const classMult = wi?.base_damage_mult ?? 1.0

  let statBonus = 0
  if (stats && wi?.scaling) {
    for (const [stat, grade] of Object.entries(wi.scaling) as [keyof Stats, Grade][]) {
      const points = Math.max(0, (stats[stat] ?? 8) - 8)
      statBonus += points * (GRADE_MULT[grade] ?? 0)
    }
  }

  return Math.floor(step.base_damage * classMult * (1 + level * levelMult + statBonus))
}

export function getWeaponMovesets(weaponId: string, extraMovesets: string[]): typeof MOVES[string][] {
  const weapon = WEAPONS[weaponId]
  if (!weapon) return []
  const ids = [...weapon.constant_movesets, ...extraMovesets.filter(Boolean)]
  return ids.map(id => MOVES[id]).filter(Boolean)
}

/** Rune cost to level up a player stat. totalLevelsSpent = total upgrades taken so far. */
export function statLevelCost(totalLevelsSpent: number): number {
  return Math.floor(500 + totalLevelsSpent * 100 + totalLevelsSpent ** 2 * 20)
}

/** Rune cost to upgrade a weapon from currentLevel → currentLevel+1. */
export function weaponUpgradeCost(currentLevel: number): number {
  return (currentLevel + 1) * 500
}

/** Register a generated weapon instance into the runtime registry. */
export function registerWeapon(w: WeaponInstance): void {
  WEAPONS[w.instance_id] = w
}
