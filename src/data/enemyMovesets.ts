import type { EnemyMove } from '../types/game'

export const ENEMY_MOVES: Record<string, EnemyMove> = {
  mindless_scroll: {
    id: 'mindless_scroll', name: 'Mindless Scrolling',
    description: 'Just 5 more minutes of social media.',
    damage: 12, block_damage: 5, poise_damage: 8,
    publish_task: { name: 'Write the title and platform for something you will publish today', time: 900 },
  },
  shiny_object: {
    id: 'shiny_object', name: 'Shiny Object',
    description: 'A new tool that absolutely needs researching right now.',
    damage: 18, block_damage: 8, poise_damage: 5,
    publish_task: { name: "Write your publish deadline for the piece you're currently working on", time: 900 },
  },
  public_criticism: {
    id: 'public_criticism', name: 'Public Criticism',
    description: 'Attacks your approach publicly, hoping others pile on.',
    damage: 28, block_damage: 12, poise_damage: 15,
    publish_task: { name: 'Write the title of the piece you will publish in spite of this criticism', time: 900 },
  },
  mockery: {
    id: 'mockery', name: 'Mockery',
    description: 'Ridicules your content to undermine your confidence.',
    damage: 18, block_damage: 7, poise_damage: 8,
    publish_task: { name: 'Write the publish date and platform for your next piece — commit to it now', time: 900 },
  },
  credibility_slash: {
    id: 'credibility_slash', name: 'Credibility Slash',
    description: 'Who are you to talk about this?',
    damage: 35, block_damage: 18, poise_damage: 20,
    publish_task: { name: 'Write the platform and date you will publish your next piece', time: 900 },
  },
  infinite_loop: {
    id: 'infinite_loop', name: 'Infinite Loop',
    description: 'Check notes, reread outline, check notes again. Nothing gets written.',
    damage: 22, block_damage: 10, poise_damage: 12,
    publish_task: { name: 'Name one piece you will schedule to publish this week — be specific', time: 900 },
  },
  standard_terror: {
    id: 'standard_terror', name: 'Standard Terror',
    description: "It's not good enough. You delete the paragraph. Again.",
    damage: 30, block_damage: 14, poise_damage: 18,
    publish_task: { name: 'Commit to a publish date for the piece you are working on right now', time: 900 },
  },
  scope_creep: {
    id: 'scope_creep', name: 'Scope Creep',
    description: 'You need to research more before you can even start.',
    damage: 15, block_damage: 6, poise_damage: 6,
    publish_task: { name: 'Write the publish deadline for your current piece — no extensions', time: 900 },
  },
  revision_spiral: {
    id: 'revision_spiral', name: 'Revision Spiral',
    description: 'Forces you back to revise the opening. Again.',
    damage: 35, block_damage: 16, poise_damage: 20,
    publish_task: { name: 'Set a publish date. Write it. Commit to it.', time: 900 },
  },
  not_good_enough: {
    id: 'not_good_enough', name: 'Not Good Enough',
    description: 'Compares your work to the best in the field.',
    damage: 45, block_damage: 22, poise_damage: 30,
    publish_task: { name: 'Write where and when you will publish this piece regardless of how it feels', time: 900 },
  },
  one_more_source: {
    id: 'one_more_source', name: 'One More Source',
    description: 'You just need to read one more thing before it\'s done.',
    damage: 25, block_damage: 10, poise_damage: 15,
    publish_task: { name: 'Write the title, platform, and publish date for the piece you will stop researching and ship', time: 900 },
  },
  hollow_stare: {
    id: 'hollow_stare', name: 'Hollow Stare',
    description: 'Stares through you, draining your will to continue.',
    damage: 16, block_damage: 7, poise_damage: 9,
    publish_task: { name: 'Write your next scheduled publish: title, platform, and exact date', time: 900 },
  },
  drag_down: {
    id: 'drag_down', name: 'Drag Down',
    description: 'Heavy mental fog pulls your creativity underwater.',
    damage: 24, block_damage: 10, poise_damage: 13,
    publish_task: { name: 'Write one publish or schedule commitment: title, platform, and date — before this session ends', time: 900 },
  },
  viral_post: {
    id: 'viral_post', name: 'Viral Post',
    description: "Shows you someone else's viral content to make you question yourself.",
    damage: 22, block_damage: 9, poise_damage: 11,
    publish_task: { name: 'Write the platform and date for your next publication', time: 900 },
  },
  follower_count: {
    id: 'follower_count', name: 'Follower Count',
    description: 'Reduces your creative worth to a number you can never beat.',
    damage: 28, block_damage: 12, poise_damage: 15,
    publish_task: { name: 'Write the title, platform, and publish date for a piece you will release regardless of reach', time: 900 },
  },
  trending_now: {
    id: 'trending_now', name: 'Trending Now',
    description: "Drowns your voice in the noise of what's popular this week.",
    damage: 36, block_damage: 17, poise_damage: 21,
    publish_task: { name: 'Write the title and publish date for your next piece', time: 900 },
  },
  what_if_they_laugh: {
    id: 'what_if_they_laugh', name: 'What If They Laugh',
    description: 'Conjures an imaginary audience mocking your unfinished work.',
    damage: 20, block_damage: 8, poise_damage: 10,
    publish_task: { name: 'Write the title of the piece you will publish anyway — right now', time: 900 },
  },
  stay_hidden: {
    id: 'stay_hidden', name: 'Stay Hidden',
    description: 'Whispers that you are safer staying unpublished.',
    damage: 16, block_damage: 6, poise_damage: 8,
    publish_task: { name: 'Write your publish commitment: platform, title, and date', time: 900 },
  },
  visibility_terror: {
    id: 'visibility_terror', name: 'Visibility Terror',
    description: 'Full existential panic at the thought of being truly seen.',
    damage: 32, block_damage: 15, poise_damage: 18,
    publish_task: { name: 'Write when and where you will publish your most important piece', time: 900 },
  },

  // ── notification_swarm ──────────────────────────────────────────────────────
  ping_attack: {
    id: 'ping_attack', name: 'Ping Attack',
    description: 'A barrage of alerts breaks your concentration.',
    damage: 11, block_damage: 5, poise_damage: 6,
    publish_task: { name: 'Write your publish plan: title, platform, and date — then silence your phone', time: 900 },
  },
  alert_flood: {
    id: 'alert_flood', name: 'Alert Flood',
    description: 'Every app screams for your attention at once.',
    damage: 17, block_damage: 7, poise_damage: 9,
    publish_task: { name: 'Write the next piece you will publish and its deadline — notifications off', time: 900 },
  },

  // ── impostor_shade ──────────────────────────────────────────────────────────
  identity_erosion: {
    id: 'identity_erosion', name: 'Identity Erosion',
    description: "Who are you to write about any of this?",
    damage: 23, block_damage: 10, poise_damage: 12,
    publish_task: { name: 'Write why you specifically are the right person to publish this piece', time: 900 },
  },
  credential_doubt: {
    id: 'credential_doubt', name: 'Credential Doubt',
    description: 'Whispers that every reader will notice you do not belong.',
    damage: 30, block_damage: 13, poise_damage: 17,
    publish_task: { name: 'Write the piece title, platform, and publish date — publish it as yourself', time: 900 },
  },

  // ── algorithm_specter ───────────────────────────────────────────────────────
  engagement_trap: {
    id: 'engagement_trap', name: 'Engagement Trap',
    description: 'Rewrites your ideas for clicks instead of meaning.',
    damage: 24, block_damage: 10, poise_damage: 13,
    publish_task: { name: 'Write your authentic title for this piece — one that serves the reader, not the feed', time: 900 },
  },
  shadow_ban: {
    id: 'shadow_ban', name: 'Shadow Ban',
    description: 'Makes you feel your work is vanishing into the void unseen.',
    damage: 28, block_damage: 12, poise_damage: 15,
    publish_task: { name: 'Write where and when you will publish — one reader is enough', time: 900 },
  },
  virality_curse: {
    id: 'virality_curse', name: 'Virality Curse',
    description: 'Forces you to chase trends instead of your own voice.',
    damage: 36, block_damage: 16, poise_damage: 20,
    publish_task: { name: 'Write the title of your most honest upcoming piece — not the one most likely to trend', time: 900 },
  },

  // ── deadline_wraith ─────────────────────────────────────────────────────────
  time_pressure: {
    id: 'time_pressure', name: 'Time Pressure',
    description: 'The clock ticks louder until you cannot think.',
    damage: 29, block_damage: 13, poise_damage: 15,
    publish_task: { name: 'Write your publish deadline — choose it, own it, commit to it', time: 900 },
  },
  clock_crush: {
    id: 'clock_crush', name: 'Clock Crush',
    description: 'The weight of the deadline slams down on your creative output.',
    damage: 40, block_damage: 18, poise_damage: 23,
    publish_task: { name: 'Write the exact date and time you will ship this piece — no more extensions', time: 900 },
  },

  // ── overload_colossus ───────────────────────────────────────────────────────
  data_tsunami: {
    id: 'data_tsunami', name: 'Data Tsunami',
    description: 'An ocean of information crashes over your ability to focus.',
    damage: 38, block_damage: 17, poise_damage: 22,
    publish_task: { name: 'Write what ONE idea your reader will walk away with from this piece', time: 900 },
  },
  tab_avalanche: {
    id: 'tab_avalanche', name: 'Tab Avalanche',
    description: 'Forty-seven open tabs collapse onto your working memory.',
    damage: 32, block_damage: 15, poise_damage: 18,
    publish_task: { name: 'Write the one piece you will finish today — close everything else', time: 900 },
  },
  context_switch: {
    id: 'context_switch', name: 'Context Switch',
    description: 'Splits your attention across three half-finished pieces.',
    damage: 46, block_damage: 22, poise_damage: 28,
    publish_task: { name: 'Write which single piece you will publish next and when — ignore the others', time: 900 },
  },

  // ── distraction_weaver ──────────────────────────────────────────────────────
  attention_snare: {
    id: 'attention_snare', name: 'Attention Snare',
    description: 'Weaves a web of notifications you cannot stop checking.',
    damage: 36, block_damage: 16, poise_damage: 20,
    publish_task: { name: 'Write your publish commitment and set a phone-free writing block around it', time: 900 },
  },
  rabbit_hole: {
    id: 'rabbit_hole', name: 'Rabbit Hole',
    description: 'Pulls you into an endless research spiral you never asked for.',
    damage: 28, block_damage: 12, poise_damage: 14,
    publish_task: { name: 'Write the title and publish date for the piece you will stop researching and ship', time: 900 },
  },
  hypnotic_feed: {
    id: 'hypnotic_feed', name: 'Hypnotic Feed',
    description: 'The scroll is infinite. An hour passes without a word written.',
    damage: 48, block_damage: 23, poise_damage: 30,
    publish_task: { name: 'Write the publish plan for your next piece before you open any social app again', time: 900 },
  },

  // ── void_tyrant ─────────────────────────────────────────────────────────────
  creative_void: {
    id: 'creative_void', name: 'Creative Void',
    description: 'Every idea you have dissolves before it can become a sentence.',
    damage: 40, block_damage: 18, poise_damage: 25,
    publish_task: { name: 'Write the title of the piece you will not let the void take from you', time: 900 },
  },
  meaningless_abyss: {
    id: 'meaningless_abyss', name: 'Meaningless Abyss',
    description: "Why write if no one reads? Why create if it doesn't matter?",
    damage: 52, block_damage: 25, poise_damage: 33,
    publish_task: { name: 'Write the title and date of the next piece you will publish — it matters', time: 900 },
  },
  void_embrace: {
    id: 'void_embrace', name: 'Void Embrace',
    description: 'Offers you comfortable silence in place of the difficulty of creation.',
    damage: 30, block_damage: 14, poise_damage: 16,
    publish_task: { name: 'Write the piece you have been putting off — title, platform, publish date', time: 900 },
  },
}

export function getEnemyMoves(ids: string[]): EnemyMove[] {
  return ids.map(id => ENEMY_MOVES[id]).filter(Boolean)
}
