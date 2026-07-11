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
    affinities: {
      love:    { stages: ['Research', 'Plan'] },
      like:    { products: ['CurationFeed'], emotions: ['Comfort'] },
      dislike: { stages: ['Refine'] },
      hate:    { origins: ['New'], stages: ['Produce'] },
    },
  },

  hater: {
    name: 'Hejter', description: 'Feeds on the gap between your work and its potential.',
    max_hp: 90, rune_reward: 150, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    affinities: {
      love:    { emotions: ['Polarization', 'Drama'] },
      like:    { styles: ['Shock'] },
      dislike: { emotions: ['Comfort', 'Hope'] },
      hate:    { styles: ['ProblemSolving'], emotions: ['Parasocial'] },
    },
  },

  blank_page_omen: {
    name: 'Omen Pustej Kartki', description: 'The terror of the empty document made flesh.',
    max_hp: 110, rune_reward: 200, is_boss: false,
    boss_name: 'Terror Próżni',
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    affinities: {
      love:    { origins: ['New'], stages: ['Research', 'Plan'] },
      like:    { products: ['Plaintext'], emotions: ['Fear'] },
      dislike: { stages: ['Refine'] },
      hate:    { styles: ['Shock'], stages: ['Produce'] },
    },
  },

  burnout_shade: {
    name: 'Cień Wypalenia', description: 'A hollow echo of someone who used to write every day.',
    max_hp: 65, rune_reward: 60, is_boss: false,
    drops: [
      { id: 'weapon', first_kill_chance: 0.30, repeat_chance: 0.10 },
      { id: 'weapon', first_kill_chance: 0.50, repeat_chance: 0.20 },
    ],
    affinities: {
      love:    { stages: ['Produce'], emotions: ['Fear'] },
      like:    { products: ['Plaintext', 'RawAudio'] },
      dislike: { styles: ['Passion'], emotions: ['Wow'] },
      hate:    { emotions: ['Humor', 'Hope'] },
    },
  },

  comparison_engine: {
    name: 'Maszyna Porównań', description: 'An infinite scroll of everyone doing it better than you.',
    max_hp: 100, rune_reward: 160, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.80, repeat_chance: 0.30 }],
    affinities: {
      love:    { emotions: ['Envy', 'Fomo'] },
      like:    { products: ['Carousel', 'SingleGraphic'] },
      dislike: { origins: ['Opposite'] },
      hate:    { styles: ['Minimalism'], emotions: ['Parasocial'] },
    },
  },

  fear_phantom: {
    name: 'Widmo Strachu', description: 'The imagined audience that never lets you publish.',
    max_hp: 85, rune_reward: 130, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.70, repeat_chance: 0.25 }],
    affinities: {
      like:    { styles: ['Cliffhanger'], emotions: ['Fear'] },
      hate:    { styles: ['Shock'], stages: ['Produce'] },
    },
  },

  perfectionism_knight: {
    name: 'Rycerz Perfekcjonizmu',
    description: 'The final guardian. It will never let you call anything finished.',
    max_hp: 200, rune_reward: 500,
    is_boss: true, is_remembrance: true, unlocks_area: 'second_area',
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
    affinities: {
      love:    { stages: ['Refine'] },
      like:    { products: ['CinematicVideo', 'StructuredText'] },
      dislike: { products: ['Plaintext', 'RawAudio'] },
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
      love:    { products: ['ARollVideo', 'LiveStream'], styles: ['Shock', 'Fast'] },
      like:    { origins: ['Compression'], emotions: ['Viral', 'Controversion'] },
      dislike: { products: ['Plaintext', 'MultimediaPage'], origins: ['New', 'ZoomOut'] },
      hate:    { products: ['InteractiveApp', 'BranchingNarrative'], styles: ['Intellectual'], stages: ['Research', 'Plan'] },
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
      like:    { products: ['AssetPack', 'Infographic'], styles: ['Segmentation'], emotions: ['Wow'] },
      dislike: { products: ['Plaintext', 'RawAudio'], origins: ['New'] },
      hate:    { products: ['InteractiveApp', 'LiveStream'], styles: ['Interactive'], stages: ['Produce'] },
    },
  },

  formatowy_purysta: {
    name: 'Formatowy Purysta',
    description: 'Will reject any content that deviates from its rigid structural doctrine.',
    max_hp: 92, rune_reward: 148, is_boss: false,
    boss_name: 'Inkwizytor Struktury',
    drops: [{ id: 'weapon', first_kill_chance: 0.68, repeat_chance: 0.24 }],
    affinities: {
      love:    { products: ['StructuredText', 'Screencast'] },
      like:    { products: ['IllustratedText', 'ProducedAudio'], stages: ['Plan', 'Refine'] },
      dislike: { emotions: ['Humor'] },
      hate:    { products: ['_blank', 'MultimediaPage'], origins: ['Opposite'], styles: ['Passion'] },
    },
  },

  architekt_sciany_tekstu: {
    name: 'Architekt Ściany Tekstu',
    description: 'Spawns dense unbroken prose that buries any signal in noise.',
    max_hp: 60, rune_reward: 55, is_boss: false,
    boss_name: 'Golem Monolitu',
    drops: [{ id: 'weapon', first_kill_chance: 0.55, repeat_chance: 0.18 }],
    affinities: {
      love:    { products: ['Plaintext'], styles: ['Minimalism'], stages: ['Produce'] },
      like:    { products: ['RawAudio'], origins: ['Expansion'] },
      dislike: { products: ['Carousel', 'SingleGraphic'], emotions: ['Fomo'] },
      hate:    { products: ['StructuredText', 'Infographic'], origins: ['Compression'], styles: ['Segmentation'] },
    },
  },

  baron_pivot: {
    name: 'Baron Pivot',
    description: 'Eternally pivoting, never committing — fuelled by plans, starved of output.',
    max_hp: 58, rune_reward: 52, is_boss: false,
    boss_name: 'Kapitan Słomianego Zapału',
    drops: [{ id: 'weapon', first_kill_chance: 0.50, repeat_chance: 0.16 }],
    affinities: {
      love:    { stages: ['Plan', 'Produce'] },
      like:    { products: ['_blank'], emotions: ['Rumor'] },
      dislike: { products: ['CinematicVideo', 'InteractiveApp'], stages: ['Refine'] },
      hate:    { origins: ['Similar'], styles: ['Narration'] },
    },
  },

  fabryka_wyswietlen: {
    name: 'Fabryka Wyświetleń',
    description: 'Pure reach maximisation — no message, only metrics.',
    max_hp: 108, rune_reward: 175, is_boss: false,
    boss_name: 'Lord Atencji',
    drops: [{ id: 'weapon', first_kill_chance: 0.78, repeat_chance: 0.30 }],
    affinities: {
      love:    { styles: ['Cliffhanger', 'Shock'], emotions: ['Drama', 'Polarization'] },
      like:    { products: ['Carousel', 'SingleGraphic'], origins: ['Compression'] },
      dislike: { products: ['StructuredText'], styles: ['ProblemSolving'] },
      hate:    { products: ['MultimediaPage', 'AssetPack'], styles: ['Intellectual'], emotions: ['Hope'] },
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
      love:    { styles: ['Intellectual'], emotions: ['Wow'] },
      like:    { products: ['MultimediaPage', 'BranchingNarrative'] },
      dislike: { styles: ['Shock', 'Cliffhanger'] },
      hate:    { emotions: ['Viral'] },
    },
  },

  brainless: {
    name: 'Brainless',
    description: 'Pure dopamine consumption — nuance slides off it like water.',
    max_hp: 48, rune_reward: 38, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.45, repeat_chance: 0.12 }],
    affinities: {
      love:    { emotions: ['Viral', 'Humor'] },
      like:    { products: ['SingleGraphic', 'ARollVideo'], styles: ['Shock'] },
      dislike: { styles: ['Intellectual'] },
      hate:    { products: ['MultimediaPage'], stages: ['Research'] },
    },
  },

  zmeczony: {
    name: 'Zmęczony',
    description: 'Exhausted by everything — only comfort content breaches its guard.',
    max_hp: 52, rune_reward: 44, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.48, repeat_chance: 0.14 }],
    affinities: {
      love:    { emotions: ['Comfort', 'Hope'] },
      like:    { products: ['Plaintext', 'RawAudio'] },
      dislike: { styles: ['Shock'], emotions: ['Fomo'] },
      hate:    { styles: ['Cliffhanger'], emotions: ['Fear'] },
    },
  },

  pobudzony: {
    name: 'Pobudzony',
    description: 'Hyperactivated and hunting — slow or gentle content repels it.',
    max_hp: 70, rune_reward: 90, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.60, repeat_chance: 0.20 }],
    affinities: {
      love:    { styles: ['Fast', 'Shock'] },
      like:    { emotions: ['Controversion', 'Fomo'] },
      dislike: { products: ['Plaintext'], emotions: ['Comfort'] },
      hate:    { styles: ['Intellectual'], stages: ['Plan'] },
    },
  },

  sfrustrowany: {
    name: 'Sfrustrowany',
    description: 'A ticking pressure vessel — clickbait and polish bounce off its rage.',
    max_hp: 75, rune_reward: 100, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.62, repeat_chance: 0.20 }],
    affinities: {
      love:    { emotions: ['Controversion', 'Polarization'] },
      like:    { origins: ['Opposite'] },
      dislike: { emotions: ['Hope'] },
      hate:    { styles: ['Cliffhanger'] },
    },
  },

  glupi: {
    name: 'Głupi',
    description: 'Immune to nuance — complex formats are invisible to it.',
    max_hp: 45, rune_reward: 36, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.42, repeat_chance: 0.12 }],
    affinities: {
      love:    { styles: ['Shock'], emotions: ['Humor'] },
      like:    { products: ['StructuredText'] },
      dislike: { styles: ['Intellectual'] },
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
  },

  impostor_shade: {
    name: 'Impostor Shade',
    description: 'Wears a mask of competence that keeps cracking at the edges.',
    max_hp: 85, rune_reward: 138, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.65, repeat_chance: 0.22 }],
  },

  algorithm_specter: {
    name: 'Algorithm Specter',
    description: 'A cold geometric intelligence that optimises your voice for engagement over meaning.',
    max_hp: 95, rune_reward: 152, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.72, repeat_chance: 0.28 }],
  },

  deadline_wraith: {
    name: 'Deadline Wraith',
    description: 'A cloaked figure whose chest holds a clock stopped a few minutes before midnight.',
    max_hp: 105, rune_reward: 168, is_boss: false,
    drops: [{ id: 'weapon', first_kill_chance: 0.60, repeat_chance: 0.20 }],
  },

  overload_colossus: {
    name: 'Overload Colossus',
    description: 'A towering monstrosity built from stacked screens and overflowing research.',
    max_hp: 220, rune_reward: 520,
    is_boss: true, is_remembrance: true,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
  },

  distraction_weaver: {
    name: 'Distraction Weaver',
    description: 'A spider-entity that weaves a web of notifications and rabbit holes.',
    max_hp: 210, rune_reward: 495,
    is_boss: true, is_remembrance: true,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
  },

  void_tyrant: {
    name: 'Void Tyrant',
    description: 'A vast cosmic entity that offers the comfortable silence of never having to create again.',
    max_hp: 245, rune_reward: 560,
    is_boss: true, is_remembrance: true,
    drops: [{ id: 'weapon', first_kill_chance: 1.0, repeat_chance: 0.0 }],
  },
}
