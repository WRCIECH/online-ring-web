import type { Enemy } from '../types/game'

export const ENEMIES: Record<string, Enemy> = {
  procrastination_mob: {
    name: 'Procrastination Mob', description: 'A shambling horde of half-started tasks and abandoned drafts.',
    max_hp: 180, initiative: 6, max_poise: 50, rune_reward: 50, is_boss: false,
    drops: [
      { id: 'immediate_strike', first_kill_chance: 0.60, repeat_chance: 0.20 },
      { id: 'recovery_roll',    first_kill_chance: 0.40, repeat_chance: 0.15 },
    ],
    status_multipliers: { bleed: 1.2, frost: 0.8 },
    moveset: ['mindless_scroll', 'shiny_object'],
  },
  hater: {
    name: 'The Hater', description: 'Feeds on the gap between your work and its potential.',
    max_hp: 360, initiative: 8, max_poise: 100, rune_reward: 150, is_boss: true,
    drops: [{ id: 'dagger', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    status_multipliers: { bleed: 0.8, madness: 1.5 },
    moveset: ['public_criticism', 'mockery', 'credibility_slash'],
  },
  blank_page_omen: {
    name: 'Blank Page Omen', description: 'The terror of the empty document made flesh.',
    max_hp: 460, initiative: 4, max_poise: 120, rune_reward: 200, is_boss: true,
    drops: [{ id: 'greatsword', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    status_multipliers: { frost: 1.3, scarlet_rot: 0.7 },
    moveset: ['infinite_loop', 'standard_terror', 'scope_creep'],
  },
  burnout_shade: {
    name: 'Burnout Shade', description: 'A hollow echo of someone who used to write every day.',
    max_hp: 200, initiative: 3, max_poise: 60, rune_reward: 60, is_boss: false,
    drops: [
      { id: 'endurance_strike', first_kill_chance: 0.30, repeat_chance: 0.10 },
      { id: 'recovery_roll',    first_kill_chance: 0.50, repeat_chance: 0.20 },
    ],
    status_multipliers: { scarlet_rot: 1.4, bleed: 0.6 },
    moveset: ['hollow_stare', 'drag_down'],
  },
  comparison_engine: {
    name: 'Comparison Engine', description: 'An infinite scroll of everyone doing it better than you.',
    max_hp: 410, initiative: 8, max_poise: 110, rune_reward: 160, is_boss: true,
    drops: [{ id: 'single_thought', first_kill_chance: 0.80, repeat_chance: 0.30 }],
    status_multipliers: { madness: 1.3, frost: 1.0 },
    moveset: ['viral_post', 'follower_count', 'trending_now'],
  },
  fear_phantom: {
    name: 'Fear Phantom', description: 'The imagined audience that never lets you publish.',
    max_hp: 320, initiative: 6, max_poise: 90, rune_reward: 130, is_boss: true,
    drops: [{ id: 'raw_take', first_kill_chance: 0.70, repeat_chance: 0.25 }],
    status_multipliers: { madness: 1.5, bleed: 0.5 },
    moveset: ['what_if_they_laugh', 'stay_hidden', 'visibility_terror'],
  },
  perfectionism_knight: {
    name: 'Perfectionism Knight',
    description: 'The final guardian. It will never let you call anything finished.',
    max_hp: 850, initiative: 10, max_poise: 200, rune_reward: 500,
    is_boss: true, is_remembrance: true, unlocks_area: 'second_area',
    drops: [{ id: 'fast_publish', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    status_multipliers: { bleed: 0.5, frost: 0.5, madness: 0.5, scarlet_rot: 0.5 },
    moveset: ['revision_spiral', 'not_good_enough', 'one_more_source'],
  },
}
