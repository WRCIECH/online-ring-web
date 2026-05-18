import type { Weapon, WeaponInstance } from '../types/game'
import { MOVES } from './movesets'

// Mutable registry — generators and store hydration populate this at runtime
export const WEAPONS: Record<string, Weapon> = {}

export const GRADE_MULT: Record<string, number> = {
  S: 0.012, A: 0.010, B: 0.008, C: 0.006, D: 0.004, E: 0.002,
}

export function calcStepDamage(
  step: { base_damage: number },
  moveset: { scaling_stat: string },
  weapon: Weapon,
  stats: Record<string, number>,
): number {
  const stat = stats[moveset.scaling_stat] ?? 10
  const grade = weapon.scaling[moveset.scaling_stat as keyof typeof weapon.scaling] ?? 'E'
  return Math.floor(step.base_damage * (1 + stat * (GRADE_MULT[grade] ?? 0.002)))
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
