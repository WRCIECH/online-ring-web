import type { WeaponClass, WeaponRarity, WeaponInstance, Affix, WeaponPerk } from '../../types/game'
import { WEAPON_CLASSES, ALL_WEAPON_CLASSES } from './weaponClasses'
import { rollFormatDraw } from './patternSlots'
import { registerWeapon } from '../weapons'
import { ALL_CONTENT_PRODUCTS } from './workflowGenerator'

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
  common: 55, uncommon: 25, rare: 12, epic: 6, legendary: 2,
}
const RARITIES: WeaponRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

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
    common: [0, 0], uncommon: [1, 2], rare: [2, 3], epic: [3, 4], legendary: [4, 5],
  }
  const [min, max] = counts[rarity]
  if (min === 0) return []
  const n = min + Math.floor(Math.random() * (max - min + 1))
  return [...AFFIXES].sort(() => Math.random() - 0.5).slice(0, n)
}

const PERK_COUNTS: Record<WeaponRarity, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
}

const PERK_BONUS_TABLE: Array<{ value: number; weight: number }> = [
  { value: 0.05, weight: 40 },
  { value: 0.10, weight: 30 },
  { value: 0.15, weight: 15 },
  { value: 0.20, weight: 10 },
  { value: 0.25, weight: 5  },
]

function rollPerks(rarity: WeaponRarity, cls: WeaponClass): WeaponPerk[] {
  const count = PERK_COUNTS[rarity]
  if (count === 0) return []

  const classDef = WEAPON_CLASSES[cls]
  const productPool = classDef.supported_products.length > 0
    ? classDef.supported_products
    : ALL_CONTENT_PRODUCTS
  const transformPool = classDef.content_transformations.S

  const candidates: Array<{ type: WeaponPerk['type']; target: string }> = [
    ...productPool.map(p => ({ type: 'product' as const, target: p })),
    ...transformPool.map(t => ({ type: 'transformation' as const, target: t })),
  ]

  // Shuffle in-place (Fisher-Yates)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  const result: WeaponPerk[] = []
  const seen = new Set<string>()
  for (const c of candidates) {
    if (result.length >= count) break
    if (seen.has(c.target)) continue
    seen.add(c.target)
    const bonus = pick(
      PERK_BONUS_TABLE.map(e => e.value),
      PERK_BONUS_TABLE.map(e => e.weight),
    )
    result.push({ type: c.type, target: c.target, bonus })
  }
  return result
}

const RARITY_PREFIXES: Record<WeaponRarity, string[]> = {
  common:    ['Crude', 'Plain', 'Common', 'Standard', 'Simple'],
  uncommon:     ['Sharp', 'Swift', 'Keen', 'Flowing', 'Measured'],
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
    rolled_draws:     rollFormatDraw(cls),
    perks:            rollPerks(rarity, cls),
  }

  registerWeapon(weapon)
  return weapon
}
