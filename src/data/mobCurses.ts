// Passive per-enemy curses: active by default while fighting that enemy,
// lifted by a specific in-fight condition, cushioned by stamina in the
// meantime. See ActiveCurse (engine/combat.ts) for the runtime progress
// tracking that conditions below are checked against.

export interface CurseCondition {
  type: 'forwardStreak' | 'firstTile' | 'idleGap' | 'noRepeatStreak' | 'publish' | 'variety' | 'heavyMove'
  count?: number // for forwardStreak / noRepeatStreak
}

export interface CursePenalty {
  damagePct: number          // multiplicative malus on damage dealt to enemy
  rewardPct: number          // multiplicative malus on rune reward
  hpDrainPerTile: number     // flat HP lost per tile completed while cursed
  staminaCostPerTile: number // stamina drained per tile to cushion the above
}

export interface MobCurseDef {
  name: string
  flavor: string
  condition: CurseCondition
  penalty: CursePenalty
}

export const MOB_CURSES: Record<string, MobCurseDef> = {
  procrastination_mob: {
    name: 'The Drift', flavor: 'Half-finished work pulls you back toward nothing.',
    condition: { type: 'forwardStreak', count: 3 },
    penalty: { damagePct: 0.15, rewardPct: 0.15, hpDrainPerTile: 5, staminaCostPerTile: 8 },
  },
  hater: {
    name: 'The Gap', flavor: 'Every safe choice feeds it a little more.',
    condition: { type: 'heavyMove' },
    penalty: { damagePct: 0.15, rewardPct: 0.15, hpDrainPerTile: 4, staminaCostPerTile: 6 },
  },
  blank_page_omen: {
    name: 'The Stare', flavor: 'The terror of the empty page, before anything exists.',
    condition: { type: 'firstTile' },
    penalty: { damagePct: 0.30, rewardPct: 0.30, hpDrainPerTile: 10, staminaCostPerTile: 10 },
  },
  burnout_shade: {
    name: 'The Hollow', flavor: 'It only gets stronger the longer you stay away.',
    condition: { type: 'idleGap' },
    penalty: { damagePct: 0.30, rewardPct: 0.30, hpDrainPerTile: 6, staminaCostPerTile: 6 },
  },
  comparison_engine: {
    name: 'The Scroll', flavor: 'Generic work feeds the comparison. Show it something new.',
    condition: { type: 'variety' },
    penalty: { damagePct: 0.15, rewardPct: 0.15, hpDrainPerTile: 5, staminaCostPerTile: 5 },
  },
  fear_phantom: {
    name: 'The Audience', flavor: 'Imagined judgment, right up until you actually publish.',
    condition: { type: 'publish' },
    penalty: { damagePct: 0.20, rewardPct: 0.20, hpDrainPerTile: 6, staminaCostPerTile: 8 },
  },
  perfectionism_knight: {
    name: 'Never Finished', flavor: 'It will not let you call anything done.',
    condition: { type: 'noRepeatStreak', count: 5 },
    penalty: { damagePct: 0.25, rewardPct: 0.25, hpDrainPerTile: 8, staminaCostPerTile: 10 },
  },
}

export const CURSE_PENALTY_CAP = 0.75
