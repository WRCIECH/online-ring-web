import type { Enemy } from '../types/game'

export const ENEMIES: Record<string, Enemy> = {

  // ── Existing enemies (updated with affinities) ─────────────────────────

  procrastination_mob: {
    name: 'Tłum Prokrastynacji', description: 'A shambling horde of half-started tasks and abandoned drafts.',
    max_hp: 55, rune_reward: 50, is_boss: false,
    drops: [
      { id: 'weapon', first_kill_chance: 0.60, repeat_chance: 0.20 },
      { id: 'weapon', first_kill_chance: 0.40, repeat_chance: 0.15 },
    ],
    moveset: ['mindless_scroll', 'shiny_object'],
    affinities: {
      love:    { stages: ['Research', 'Plan'] },
      like:    { products: ['CurationFeed'], statuses: ['sleep'] },
      dislike: { stages: ['Refine', 'Publish'] },
      hate:    { origins: ['New'], stages: ['Produce'] },
    },
  },

  hater: {
    name: 'Hejter', description: 'Feeds on the gap between your work and its potential.',
    max_hp: 90, rune_reward: 150, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    moveset: ['public_criticism', 'mockery', 'credibility_slash'],
    affinities: {
      love:    { statuses: ['scarlet_rot', 'death_blight'] },
      like:    { origins: ['Commentary'], damage_types: ['strike'] },
      dislike: { statuses: ['sleep', 'grace'] },
      hate:    { damage_types: ['holy'], statuses: ['devotion'] },
    },
  },

  blank_page_omen: {
    name: 'Omen Pustej Kartki', description: 'The terror of the empty document made flesh.',
    max_hp: 110, rune_reward: 200, is_boss: false,
    boss_name: 'Terror Próżni',
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    moveset: ['infinite_loop', 'standard_terror', 'scope_creep'],
    affinities: {
      love:    { origins: ['New'], stages: ['Research', 'Plan'] },
      like:    { products: ['Plaintext'], statuses: ['dread'] },
      dislike: { origins: ['Commentary', 'Recycled'], stages: ['Refine'] },
      hate:    { origins: ['Revamped'], damage_types: ['strike'], stages: ['Produce'] },
    },
  },

  burnout_shade: {
    name: 'Cień Wypalenia', description: 'A hollow echo of someone who used to write every day.',
    max_hp: 65, rune_reward: 60, is_boss: false,
    drops: [
      { id: 'weapon', first_kill_chance: 0.30, repeat_chance: 0.10 },
      { id: 'weapon', first_kill_chance: 0.50, repeat_chance: 0.20 },
    ],
    moveset: ['hollow_stare', 'drag_down'],
    affinities: {
      love:    { stages: ['Produce'], statuses: ['dread'] },
      like:    { products: ['Plaintext', 'RawAudio'] },
      dislike: { damage_types: ['fire'], statuses: ['glintstone'] },
      hate:    { stages: ['Promote'], statuses: ['frenzy_flame', 'grace'] },
    },
  },

  comparison_engine: {
    name: 'Maszyna Porównań', description: 'An infinite scroll of everyone doing it better than you.',
    max_hp: 100, rune_reward: 160, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.80, repeat_chance: 0.30 }],
    moveset: ['viral_post', 'follower_count', 'trending_now'],
    affinities: {
      love:    { statuses: ['frostbite', 'yearning'] },
      like:    { products: ['Carousel', 'SingleGraphic'] },
      dislike: { origins: ['Reboot', 'Opposite'] },
      hate:    { damage_types: ['standard'], statuses: ['devotion'] },
    },
  },

  fear_phantom: {
    name: 'Widmo Strachu', description: 'The imagined audience that never lets you publish.',
    max_hp: 85, rune_reward: 130, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.70, repeat_chance: 0.25 }],
    moveset: ['what_if_they_laugh', 'stay_hidden', 'visibility_terror'],
    affinities: {
      love:    { stages: ['Publish', 'Promote'] },
      like:    { damage_types: ['poison'], statuses: ['dread'] },
      dislike: { origins: ['AudienceAlter', 'Commentary'] },
      hate:    { damage_types: ['strike'], stages: ['Produce'] },
    },
  },

  perfectionism_knight: {
    name: 'Rycerz Perfekcjonizmu',
    description: 'The final guardian. It will never let you call anything finished.',
    max_hp: 200, rune_reward: 500,
    is_boss: true, is_remembrance: true, unlocks_area: 'second_area',
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    moveset: ['revision_spiral', 'not_good_enough', 'one_more_source'],
    affinities: {
      love:    { stages: ['Refine'] },
      like:    { products: ['CinematicVideo', 'StructuredText'] },
      dislike: { products: ['Plaintext', 'RawAudio'] },
      hate:    { stages: ['Publish', 'Promote'] },
    },
  },

  // ── New mobs from mobs.md rows 3–9 ────────────────────────────────────

  algorytmiczny_zombie: {
    name: 'Algorytmiczny Zombie',
    description: 'A creature of pure engagement signals — chases reach, devours meaning.',
    max_hp: 95, rune_reward: 155, is_boss: false,
    boss_name: 'Suweren Feedu',
    drops: [{ id: 'weapon', first_kill_chance: 0.72, repeat_chance: 0.28 }],
    affinities: {
      love:    { products: ['ARollVideo', 'LiveStream'], damage_types: ['strike', 'lightning'] },
      like:    { origins: ['Revamped', 'Compression'], statuses: ['bleed', 'madness'] },
      dislike: { products: ['Plaintext', 'MultimediaPage'], origins: ['New', 'ZoomOut'] },
      hate:    { products: ['InteractiveApp', 'BranchingNarrative'], damage_types: ['magic'], stages: ['Research', 'Plan'] },
    },
  },

  kolekcjoner_kursow: {
    name: 'Kolekcjoner Kursów',
    description: 'Hoards tutorials compulsively but never ships anything.',
    max_hp: 88, rune_reward: 142, is_boss: false,
    boss_name: 'Archiwista Teorii',
    drops: [{ id: 'weapon', first_kill_chance: 0.65, repeat_chance: 0.22 }],
    affinities: {
      love:    { products: ['StructuredText', 'CurationFeed'], stages: ['Research'] },
      like:    { products: ['AssetPack', 'Infographic'], damage_types: ['pierce'], statuses: ['glintstone'] },
      dislike: { products: ['Plaintext', 'RawAudio'], origins: ['New', 'Reboot'] },
      hate:    { products: ['InteractiveApp', 'LiveStream'], damage_types: ['grafting'], stages: ['Produce', 'Publish'] },
    },
  },

  formatowy_purysta: {
    name: 'Formatowy Purysta',
    description: 'Will reject any content that deviates from its rigid structural doctrine.',
    max_hp: 92, rune_reward: 148, is_boss: false,
    boss_name: 'Inkwizytor Struktury',
    drops: [{ id: 'weapon', first_kill_chance: 0.68, repeat_chance: 0.24 }],
    affinities: {
      love:    { products: ['StructuredText', 'Screencast'], origins: ['Revamped'] },
      like:    { products: ['IllustratedText', 'ProducedAudio'], stages: ['Plan', 'Refine'] },
      dislike: { origins: ['AudienceAlter', 'Commentary'], statuses: ['frenzy_flame'] },
      hate:    { products: ['_blank', 'MultimediaPage'], origins: ['Reboot', 'Opposite'], damage_types: ['fire'] },
    },
  },

  architekt_sciany_tekstu: {
    name: 'Architekt Ściany Tekstu',
    description: 'Spawns dense unbroken prose that buries any signal in noise.',
    max_hp: 60, rune_reward: 55, is_boss: false,
    boss_name: 'Golem Monolitu',
    drops: [{ id: 'weapon', first_kill_chance: 0.55, repeat_chance: 0.18 }],
    affinities: {
      love:    { products: ['Plaintext'], damage_types: ['standard'], stages: ['Produce'] },
      like:    { products: ['RawAudio'], origins: ['Expansion'] },
      dislike: { products: ['Carousel', 'SingleGraphic'], statuses: ['yearning'] },
      hate:    { products: ['StructuredText', 'Infographic'], origins: ['Compression'], damage_types: ['pierce'] },
    },
  },

  baron_pivot: {
    name: 'Baron Pivot',
    description: 'Eternally pivoting, never committing — fuelled by plans, starved of output.',
    max_hp: 58, rune_reward: 52, is_boss: false,
    boss_name: 'Kapitan Słomianego Zapału',
    drops: [{ id: 'weapon', first_kill_chance: 0.50, repeat_chance: 0.16 }],
    affinities: {
      love:    { origins: ['Reboot', 'Recycled'], stages: ['Plan', 'Produce'] },
      like:    { products: ['_blank'], origins: ['AudienceAlter'], statuses: ['murmur'] },
      dislike: { products: ['CinematicVideo', 'InteractiveApp'], stages: ['Refine'] },
      hate:    { origins: ['Similar'], damage_types: ['slash'], stages: ['Publish', 'Promote'] },
    },
  },

  fabryka_wyswietlen: {
    name: 'Fabryka Wyświetleń',
    description: 'Pure reach maximisation — no message, only metrics.',
    max_hp: 108, rune_reward: 175, is_boss: false,
    boss_name: 'Lord Atencji',
    drops: [{ id: 'weapon', first_kill_chance: 0.78, repeat_chance: 0.30 }],
    affinities: {
      love:    { damage_types: ['poison', 'strike'], statuses: ['death_blight', 'scarlet_rot'] },
      like:    { products: ['Carousel', 'SingleGraphic'], origins: ['Compression', 'Commentary'] },
      dislike: { products: ['StructuredText'], damage_types: ['holy'] },
      hate:    { products: ['MultimediaPage', 'AssetPack'], damage_types: ['magic'], statuses: ['grace'] },
    },
  },

  // ── Audience-archetype mobs from mobs.md rows 17–25 ───────────────────

  sluchowiec: {
    name: 'Słuchowiec',
    description: 'Consumes audio exclusively — rejects visual and textual formats outright.',
    max_hp: 55, rune_reward: 45, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.50, repeat_chance: 0.15 }],
    affinities: {
      love:    { products: ['ProducedAudio', 'RawAudio'] },
      like:    { products: ['SlideshowVideo', 'LiveStream'] },
      dislike: { products: ['Plaintext', 'StructuredText'] },
      hate:    { products: ['SingleGraphic', 'Carousel'] },
    },
  },

  wzrokowiec: {
    name: 'Wzrokowiec',
    description: 'Visual-only consumer — words and audio bounce off it harmlessly.',
    max_hp: 60, rune_reward: 50, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.55, repeat_chance: 0.18 }],
    affinities: {
      love:    { products: ['CinematicVideo', 'MotionGraphics'] },
      like:    { products: ['Carousel', 'Infographic', 'SingleGraphic'] },
      dislike: { products: ['Plaintext'] },
      hate:    { products: ['RawAudio', 'ProducedAudio'] },
    },
  },

  czytacz: {
    name: 'Czytacz',
    description: 'Reads everything, watches nothing — motion triggers its flight response.',
    max_hp: 50, rune_reward: 42, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.48, repeat_chance: 0.14 }],
    affinities: {
      love:    { products: ['Plaintext', 'StructuredText'] },
      like:    { products: ['IllustratedText', 'CurationFeed'] },
      dislike: { products: ['LiveStream'] },
      hate:    { products: ['MotionGraphics', 'SingleGraphic'] },
    },
  },

  intelektualista: {
    name: 'Intelektualista',
    description: 'Demands nuance and depth — brainrot content enrages it.',
    max_hp: 85, rune_reward: 135, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.65, repeat_chance: 0.22 }],
    affinities: {
      love:    { damage_types: ['magic'], statuses: ['glintstone'] },
      like:    { products: ['MultimediaPage', 'BranchingNarrative'] },
      dislike: { damage_types: ['strike', 'poison'] },
      hate:    { statuses: ['bleed'] },
    },
  },

  brainless: {
    name: 'Brainless',
    description: 'Pure dopamine consumption — nuance slides off it like water.',
    max_hp: 48, rune_reward: 38, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.45, repeat_chance: 0.12 }],
    affinities: {
      love:    { statuses: ['bleed', 'frenzy_flame'] },
      like:    { products: ['SingleGraphic', 'ARollVideo'], damage_types: ['strike'] },
      dislike: { damage_types: ['magic'] },
      hate:    { products: ['MultimediaPage'], stages: ['Research'] },
    },
  },

  zmeczony: {
    name: 'Zmęczony',
    description: 'Exhausted by everything — only comfort content breaches its guard.',
    max_hp: 52, rune_reward: 44, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.48, repeat_chance: 0.14 }],
    affinities: {
      love:    { statuses: ['sleep', 'grace'] },
      like:    { products: ['Plaintext', 'RawAudio'] },
      dislike: { damage_types: ['strike'], statuses: ['yearning'] },
      hate:    { damage_types: ['poison'], statuses: ['dread'] },
    },
  },

  pobudzony: {
    name: 'Pobudzony',
    description: 'Hyperactivated and hunting — slow or gentle content repels it.',
    max_hp: 70, rune_reward: 90, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.60, repeat_chance: 0.20 }],
    affinities: {
      love:    { damage_types: ['lightning', 'strike'] },
      like:    { statuses: ['madness', 'yearning'] },
      dislike: { products: ['Plaintext'], statuses: ['sleep'] },
      hate:    { damage_types: ['magic'], stages: ['Plan'] },
    },
  },

  sfrustrowany: {
    name: 'Sfrustrowany',
    description: 'A ticking pressure vessel — clickbait and polish bounce off its rage.',
    max_hp: 75, rune_reward: 100, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.62, repeat_chance: 0.20 }],
    affinities: {
      love:    { statuses: ['madness', 'scarlet_rot'] },
      like:    { origins: ['Opposite', 'Commentary'] },
      dislike: { statuses: ['grace'] },
      hate:    { damage_types: ['poison'] },
    },
  },

  glupi: {
    name: 'Głupi',
    description: 'Immune to nuance — complex formats are invisible to it.',
    max_hp: 45, rune_reward: 36, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.42, repeat_chance: 0.12 }],
    affinities: {
      love:    { damage_types: ['strike'], statuses: ['frenzy_flame'] },
      like:    { products: ['StructuredText'] },
      dislike: { damage_types: ['magic'] },
      hate:    { products: ['BranchingNarrative', 'InteractiveApp'] },
    },
  },

  // ── Existing standalone boss entries (affinities TBD) ─────────────────

  notification_swarm: {
    name: 'Notification Swarm',
    description: 'A buzzing cloud of pings, alerts, and red-badge dopamine hooks.',
    max_hp: 42, rune_reward: 42, is_boss: false,
    drops: [
      { id: 'weapon', first_kill_chance: 0.55, repeat_chance: 0.18 },
      { id: 'weapon', first_kill_chance: 0.35, repeat_chance: 0.12 },
    ],
    moveset: ['ping_attack', 'alert_flood'],
  },

  impostor_shade: {
    name: 'Impostor Shade',
    description: 'Wears a mask of competence that keeps cracking at the edges.',
    max_hp: 85, rune_reward: 138, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.65, repeat_chance: 0.22 }],
    moveset: ['identity_erosion', 'credential_doubt'],
  },

  algorithm_specter: {
    name: 'Algorithm Specter',
    description: 'A cold geometric intelligence that optimises your voice for engagement over meaning.',
    max_hp: 95, rune_reward: 152, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.72, repeat_chance: 0.28 }],
    moveset: ['engagement_trap', 'shadow_ban', 'virality_curse'],
  },

  deadline_wraith: {
    name: 'Deadline Wraith',
    description: 'A cloaked figure whose chest holds a clock stopped a few minutes before midnight.',
    max_hp: 105, rune_reward: 168, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.60, repeat_chance: 0.20 }],
    moveset: ['time_pressure', 'clock_crush'],
  },

  overload_colossus: {
    name: 'Overload Colossus',
    description: 'A towering monstrosity built from stacked screens and overflowing research.',
    max_hp: 220, rune_reward: 520,
    is_boss: true, is_remembrance: true,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    moveset: ['data_tsunami', 'tab_avalanche', 'context_switch'],
  },

  distraction_weaver: {
    name: 'Distraction Weaver',
    description: 'A spider-entity that weaves a web of notifications and rabbit holes.',
    max_hp: 210, rune_reward: 495,
    is_boss: true, is_remembrance: true,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    moveset: ['attention_snare', 'rabbit_hole', 'hypnotic_feed'],
  },

  void_tyrant: {
    name: 'Void Tyrant',
    description: 'A vast cosmic entity that offers the comfortable silence of never having to create again.',
    max_hp: 245, rune_reward: 560,
    is_boss: true, is_remembrance: true,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    moveset: ['creative_void', 'meaningless_abyss', 'void_embrace'],
  },
}
