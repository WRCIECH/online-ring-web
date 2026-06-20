import type { Step } from '../types/game'

export interface Moveset {
  id: string
  name: string
  scaling_stat: string
  stamina_cost: number
  fp_cost?: number
  types: string[]
  steps: Step[]
}

// Mutable registry — legacy static moves below; kept for CharacterOverlay display
export const MOVES: Record<string, Moveset> = {
  starter_chain: {
    id: 'starter_chain', name: 'Starter Chain', scaling_stat: 'END', stamina_cost: 24,
    types: ['unarmed', 'starter', 'daily'],
    steps: [
      { name: 'Write continuously for 5 minutes',                              time: 300, base_damage: 40, poise_damage: 16 },
      { name: 'Write a summary paragraph of what you just wrote',              time: 180, base_damage: 28, poise_damage: 12 },
      { name: 'Expand your summary with one fully developed concrete example',  time: 180, base_damage: 28, poise_damage: 12 },
    ],
  },
  no_backspace: {
    id: 'no_backspace', name: 'No Backspace', scaling_stat: 'END', stamina_cost: 38,
    types: ['unarmed', 'anti_perfectionism', 'daily'],
    steps: [
      { name: 'Write for 10 minutes without deleting anything', time: 600, base_damage: 65, poise_damage: 25 },
    ],
  },
  immediate_strike: {
    id: 'immediate_strike', name: 'Immediate Strike', scaling_stat: 'END', stamina_cost: 20,
    types: ['unarmed', 'anti_hesitation', 'daily'],
    steps: [
      { name: 'Write your opening paragraph — no stopping, no editing', time: 180, base_damage: 28, poise_damage: 10 },
      { name: 'Continue writing the next paragraph immediately',         time: 120, base_damage: 22, poise_damage:  9 },
    ],
  },
  single_thought: {
    id: 'single_thought', name: 'Single Thought', scaling_stat: 'END', stamina_cost: 20,
    types: ['unarmed', 'opinion', 'daily'],
    steps: [
      { name: 'State your opinion and write the full reasoning behind it',            time: 180, base_damage: 28, poise_damage: 12 },
      { name: 'Write a full paragraph defending your opinion with a specific example', time: 120, base_damage: 22, poise_damage:  9 },
    ],
  },
  explain_simply: {
    id: 'explain_simply', name: 'Explain Simply', scaling_stat: 'END', stamina_cost: 24,
    types: ['unarmed', 'clarity', 'daily'],
    steps: [
      { name: 'Explain your idea in under 50 words',  time: 180, base_damage: 28, poise_damage: 12 },
      { name: 'Rewrite it using simpler language',    time: 180, base_damage: 28, poise_damage: 12 },
    ],
  },
  concrete_hit: {
    id: 'concrete_hit', name: 'Concrete Hit', scaling_stat: 'END', stamina_cost: 30,
    types: ['unarmed', 'examples', 'daily'],
    steps: [
      { name: 'Write 3 concrete examples related to your topic', time: 300, base_damage: 40, poise_damage: 16 },
    ],
  },
  question_jab: {
    id: 'question_jab', name: 'Question Jab', scaling_stat: 'END', stamina_cost: 28,
    types: ['unarmed', 'curiosity', 'daily'],
    steps: [
      { name: 'Write 5 genuine questions about your topic', time: 300, base_damage: 38, poise_damage: 14 },
    ],
  },
  momentum_combo: {
    id: 'momentum_combo', name: 'Momentum Combo', scaling_stat: 'END', stamina_cost: 32,
    types: ['unarmed', 'momentum', 'daily'],
    steps: [
      { name: 'Write 100 words',                            time: 300, base_damage: 35, poise_damage: 14 },
      { name: 'Write another 100 words immediately after',  time: 300, base_damage: 45, poise_damage: 18 },
    ],
  },
  recovery_roll: {
    id: 'recovery_roll', name: 'Recovery Roll', scaling_stat: 'END', stamina_cost: 16,
    types: ['unarmed', 'recovery', 'daily'],
    steps: [
      { name: 'Write 2-3 sentences recapping where you left off before the distraction', time: 120, base_damage: 22, poise_damage: 9 },
      { name: 'Continue writing from that point for 2 more minutes',                     time: 120, base_damage: 22, poise_damage: 9 },
    ],
  },
  raw_take: {
    id: 'raw_take', name: 'Raw Take', scaling_stat: 'END', stamina_cost: 24,
    types: ['unarmed', 'confidence', 'rare'],
    steps: [
      { name: "Write one opinion without using words like 'maybe', 'perhaps', or 'I think'", time: 180, base_damage: 35, poise_damage: 15 },
    ],
  },
  endurance_strike: {
    id: 'endurance_strike', name: 'Endurance Strike', scaling_stat: 'END', stamina_cost: 50,
    types: ['unarmed', 'focus', 'rare'],
    steps: [
      { name: 'Write continuously without switching tabs', time: 1800, base_damage: 140, poise_damage: 50 },
    ],
  },
  tight_edit: {
    id: 'tight_edit', name: 'Tight Edit', scaling_stat: 'END', stamina_cost: 30,
    types: ['unarmed', 'revision', 'rare'],
    steps: [
      { name: 'Cut your last paragraph by half — keep only the strongest sentences', time: 300, base_damage: 50, poise_damage: 20 },
    ],
  },
  unarmed_block: {
    id: 'unarmed_block', name: 'Focused Foundation', scaling_stat: 'END', stamina_cost: 28,
    types: ['defense', 'block'],
    steps: [
      { name: 'Write 3 words that describe what you are building right now', time: 25, base_damage: 0, poise_damage: 0 },
    ],
  },
}

/** Register a moveset into the runtime registry. */
export function registerMoveset(m: Moveset): void {
  MOVES[m.id] = m
}
