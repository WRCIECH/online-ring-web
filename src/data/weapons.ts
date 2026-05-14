import type { Weapon } from '../types/game'
import { MOVES } from './movesets'

export const WEAPONS: Record<string, Weapon> = {
  unarmed: {
    name: 'Fist',
    description: 'The original weapon. Slow, deliberate, and surprisingly effective.',
    stat_req: {},
    scaling: { END: 'D' },
    constant_movesets: ['starter_chain', 'no_backspace'],
    moveset_slots: 1,
    xp_thresholds: [100, 300, 700, 1500],
    defense_movesets: { block: 'unarmed_block', parry: 'unarmed_parry' },
  },
  dagger: {
    name: 'Pen',
    description: 'Fast, sharp, opinionated. A weapon for writers who commit without second-guessing.',
    stat_req: {},
    scaling: { END: 'D', MIND: 'C' },
    constant_movesets: ['question_jab', 'raw_take'],
    moveset_slots: 1,
    xp_thresholds: [100, 300, 700, 1500],
    defense_movesets: { block: 'unarmed_block', parry: 'unarmed_parry' },
  },
  greatsword: {
    name: 'Manuscript',
    description: 'Heavy and slow, but each completed page hits like a reckoning.',
    stat_req: {},
    scaling: { END: 'B' },
    constant_movesets: ['no_backspace', 'momentum_combo'],
    moveset_slots: 2,
    xp_thresholds: [100, 300, 700, 1500],
    defense_movesets: { block: 'unarmed_block', parry: 'unarmed_parry' },
  },
}

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
  const ids = [...weapon.constant_movesets, ...extraMovesets]
  return ids.map(id => MOVES[id]).filter(Boolean)
}
