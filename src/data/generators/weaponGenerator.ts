import type { WeaponClass, WeaponRarity, WeaponInstance, Affix } from '../../types/game'
import { WEAPON_CLASSES, ALL_WEAPON_CLASSES } from './weaponClasses'
import { rollMoveset, rollBlockMoveset } from './movesetGenerator'
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
  common: 55, magic: 25, rare: 12, epic: 6, legendary: 2,
}
const RARITIES: WeaponRarity[] = ['common','magic','rare','epic','legendary']

function rollRarity(forceMin?: WeaponRarity): WeaponRarity {
  const minIdx = forceMin ? RARITIES.indexOf(forceMin) : 0
  const available = RARITIES.slice(minIdx)
  const weights   = available.map(r => RARITY_WEIGHTS[r])
  return pick(available, weights)
}

function skillSlots(rarity: WeaponRarity): number {
  switch (rarity) {
    case 'common':    return 1
    case 'magic':     return 1 + (Math.random() < 0.5 ? 1 : 0)
    case 'rare':      return 2
    case 'epic':      return 3
    case 'legendary': return 3 + (Math.random() < 0.5 ? 1 : 0)
  }
}

const AFFIXES: Affix[] = [
  { id: 'dmg_15',    label: '+15% damage',      damage_mult: 1.15 },
  { id: 'dmg_25',    label: '+25% damage',      damage_mult: 1.25 },
  { id: 'sta_20',    label: '-20% stamina cost', stamina_mult: 0.80 },
  { id: 'sta_30',    label: '-30% stamina cost', stamina_mult: 0.70 },
  { id: 'fp_20',     label: '-20% FP cost',     fp_mult: 0.80 },
  { id: 'poise_20',  label: '+20% poise damage', poise_mult: 1.20 },
  { id: 'dmg_10',    label: '+10% damage',      damage_mult: 1.10 },
  { id: 'sta_15',    label: '-15% stamina cost', stamina_mult: 0.85 },
]

function rollAffixes(rarity: WeaponRarity): Affix[] {
  const counts: Record<WeaponRarity, [number, number]> = {
    common: [0,0], magic: [1,2], rare: [3,4], epic: [5,6], legendary: [5,6],
  }
  const [min, max] = counts[rarity]
  if (min === 0) return []
  const n = min + Math.floor(Math.random() * (max - min + 1))
  const shuffled = [...AFFIXES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

const RARITY_PREFIXES: Record<WeaponRarity, string[]> = {
  common:    ['Crude','Plain','Common','Standard','Simple'],
  magic:     ['Sharp','Swift','Keen','Flowing','Measured'],
  rare:      ['Radiant','Refined','Precise','Resonant','Vivid'],
  epic:      ['Sovereign','Blazing','Ancient','Profound','Relentless'],
  legendary: ['Legendary','Mythbound','Transcendent','Eternal'],
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

  const lightMs = rollMoveset(cls, 'common', 'Light')
  const heavyMs = rollMoveset(cls, rarity,   'Heavy')
  const blockMs = rollBlockMoveset(cls)

  const slots   = skillSlots(rarity)
  const affixes = rollAffixes(rarity)
  const heatT   = Math.round(classDef.heat_threshold * (rarity === 'legendary' ? 1.5 : 1.0))

  const weapon: WeaponInstance = {
    instance_id: id,
    weapon_class: cls,
    rarity,
    affixes,
    skill_slots: slots,
    heat_threshold: heatT,
    poise_weight: classDef.poise_weight,
    base_damage_mult: classDef.base_damage_mult,
    numeric_weight: classDef.weight,
    poise_value: classDef.poise_value,

    // Weapon interface fields
    name:              generateWeaponName(cls, rarity),
    description:       classDef.description,
    stat_req:          {},
    scaling:           { ...classDef.scaling },
    constant_movesets: [lightMs.id, heavyMs.id],
    moveset_slots:     slots,
    defense_movesets:  { block: blockMs.id },
  }

  registerWeapon(weapon)
  return weapon
}

export function rollSkillMovesets(weaponClass: WeaponClass, rarity: WeaponRarity, count: number): string[] {
  return Array.from({ length: count }, () => rollMoveset(weaponClass, rarity, 'Skill').id)
}
