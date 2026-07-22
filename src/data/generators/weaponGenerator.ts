import type { WeaponClass, WeaponRarity, WeaponInstance, Affix } from '../../types/game'
import { WEAPON_CLASSES, ALL_WEAPON_CLASSES } from './weaponClasses'
import { rollFormatDraw } from './patternSlots'
import { registerWeapon } from '../weapons'

function uid(): string {
  return 'w_' + Math.random().toString(36).slice(2, 10)
}

function pick<T>(items: T[], weights?: number[]): T {
  if (!weights) return items[Math.floor(Math.random() * items.length)]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
  return items[items.length - 1]
}

const RARITY_WEIGHTS: Record<WeaponRarity, number> = {
  common: 55, Intellectual: 25, rare: 12, epic: 6, legendary: 2,
}
const RARITIES: WeaponRarity[] = ['common', 'Intellectual', 'rare', 'epic', 'legendary']

function rollRarity(forceMin?: WeaponRarity): WeaponRarity {
  const minIdx   = forceMin ? RARITIES.indexOf(forceMin) : 0
  const available = RARITIES.slice(minIdx)
  const weights   = available.map(r => RARITY_WEIGHTS[r])
  return pick(available, weights)
}

const AFFIXES: Affix[] = [
  { id: 'dmg_15', label: '+15% damage', damage_mult: 1.15 },
  { id: 'dmg_25', label: '+25% damage', damage_mult: 1.25 },
  { id: 'dmg_10', label: '+10% damage', damage_mult: 1.10 },
]

function rollAffixes(rarity: WeaponRarity): Affix[] {
  const counts: Record<WeaponRarity, [number, number]> = {
    common: [0, 0], Intellectual: [1, 2], rare: [2, 3], epic: [3, 4], legendary: [4, 5],
  }
  const [min, max] = counts[rarity]
  if (min === 0) return []
  const n = min + Math.floor(Math.random() * (max - min + 1))
  return [...AFFIXES].sort(() => Math.random() - 0.5).slice(0, n)
}

const RARITY_PREFIXES: Record<WeaponRarity, string[]> = {
  common:    ['Crude', 'Plain', 'Common', 'Standard', 'Simple'],
  Intellectual:     ['Sharp', 'Swift', 'Keen', 'Flowing', 'Measured'],
  rare:      ['Radiant', 'Refined', 'Precise', 'Resonant', 'Vivid'],
  epic:      ['Sovereign', 'Blazing', 'Ancient', 'Profound', 'Relentless'],
  legendary: ['Legendary', 'Mythbound', 'Transcendent', 'Eternal'],
}

function generateWeaponName(cls: WeaponClass, rarity: WeaponRarity): string {
  const def    = WEAPON_CLASSES[cls]
  const prefix = pick(RARITY_PREFIXES[rarity])
  return `${prefix} ${def.name}`
}

export function rollWeapon(
  weaponClass?: WeaponClass,
  minRarity?: WeaponRarity,
): WeaponInstance {
  const cls      = weaponClass ?? pick(ALL_WEAPON_CLASSES)
  const rarity   = rollRarity(minRarity)
  const classDef = WEAPON_CLASSES[cls]
  const id       = uid()
  const affixes  = rollAffixes(rarity)

  const weapon: WeaponInstance = {
    instance_id:      id,
    weapon_class:     cls,
    rarity,
    affixes,
    base_damage_mult: classDef.base_damage_mult,
    poise_weight:     classDef.poise_weight,
    name:             generateWeaponName(cls, rarity),
    description:      classDef.description,
    stat_req:         {},
    scaling:          { ...classDef.scaling },
    rolled_draws:     rollFormatDraw(cls),
  }

  registerWeapon(weapon)
  return weapon
}
