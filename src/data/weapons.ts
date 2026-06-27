import type { WeaponInstance, WeaponRarity, Stats, Grade, ContentProductType, AtomicOrigin, StyleType, EmotionType } from '../types/game'
import { CONTENT_TYPE_STATS } from './contentTypeScaling'
import { ATOMIC_ORIGIN_STATS } from './atomicOriginScaling'
import { STYLE_TYPE_STATS } from './styleTypeScaling'
import { STATUS_TYPE_STATS } from './statusTypeScaling'
import { CONTENT_TYPE_STAT_BONUS } from './constants'

// Runtime registry of weapon instances (populated by rollWeapon + store hydration)
export const WEAPONS: Record<string, WeaponInstance> = {}

// Damage bonus per weapon level, by rarity
export const LEVEL_MULT: Record<WeaponRarity, number> = {
  common:    0.03,
  Intellectual:     0.04,
  rare:      0.05,
  epic:      0.06,
  legendary: 0.08,
}

export const GRADE_MULT: Record<Grade, number> = {
  S: 0.030, A: 0.022, B: 0.015, C: 0.010, D: 0.006, E: 0.003,
}

// Weapon-driven damage multiplier: rarity, affixes, weapon scaling stats, and
// content-type/origin/damage-type/status stat bonuses, applied on top of a
// tile's base (time-driven) damage.
export function calcWeaponScaledDamage(
  baseValue: number,
  weapon: WeaponInstance,
  level: number,
  stats: Stats,
  contentType?: ContentProductType,
  contentOrigin?: AtomicOrigin,
  styleType?: StyleType,
  status?: EmotionType,
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
  if (contentOrigin) {
    for (const stat of ATOMIC_ORIGIN_STATS[contentOrigin]?.stats ?? []) {
      const points = Math.max(0, (stats[stat] ?? 8) - 8)
      statBonus += points * CONTENT_TYPE_STAT_BONUS
    }
  }
  if (styleType) {
    for (const stat of STYLE_TYPE_STATS[styleType]?.stats ?? []) {
      const points = Math.max(0, (stats[stat] ?? 8) - 8)
      statBonus += points * CONTENT_TYPE_STAT_BONUS
    }
  }
  if (status) {
    for (const stat of STATUS_TYPE_STATS[status]?.stats ?? []) {
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
