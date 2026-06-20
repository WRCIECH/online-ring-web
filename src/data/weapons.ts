import type { WeaponInstance, WeaponRarity, Stats, Grade, ContentProductType } from '../types/game'
import { CONTENT_TYPE_STATS } from './contentTypeScaling'
import { CONTENT_TYPE_STAT_BONUS } from './constants'

// Runtime registry of weapon instances (populated by rollWeapon + store hydration)
export const WEAPONS: Record<string, WeaponInstance> = {}

// Damage bonus per weapon level, by rarity
export const LEVEL_MULT: Record<WeaponRarity, number> = {
  common:    0.03,
  magic:     0.04,
  rare:      0.05,
  epic:      0.06,
  legendary: 0.08,
}

const GRADE_MULT: Record<Grade, number> = {
  S: 0.030, A: 0.022, B: 0.015, C: 0.010, D: 0.006, E: 0.003,
}

export function calcTileReward(
  baseValue: number,
  weapon: WeaponInstance,
  level: number,
  stats: Stats,
  contentType?: ContentProductType,
): number {
  const levelMult = LEVEL_MULT[weapon.rarity] ?? 0.03
  let statBonus = 0
  for (const [stat, grade] of Object.entries(weapon.scaling) as [keyof Stats, Grade][]) {
    const points = Math.max(0, (stats[stat] ?? 8) - 8)
    statBonus += points * (GRADE_MULT[grade] ?? 0)
  }
  if (contentType) {
    for (const stat of CONTENT_TYPE_STATS[contentType]?.stats ?? []) {
      const points = Math.max(0, (stats[stat] ?? 8) - 8)
      statBonus += points * CONTENT_TYPE_STAT_BONUS
    }
  }
  const affixMult = weapon.affixes.reduce((m, a) => m * (a.damage_mult ?? 1), 1)
  return Math.floor(baseValue * weapon.base_damage_mult * affixMult * (1 + level * levelMult + statBonus))
}

export { statLevelCost, weaponUpgradeCost } from './constants'

export function registerWeapon(w: WeaponInstance): void {
  WEAPONS[w.instance_id] = w
}
