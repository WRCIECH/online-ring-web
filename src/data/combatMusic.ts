// YouTube video IDs for combat encounters.
// Swap any ID with your preferred YouTube video — just replace the string value.
// T1 enemies share a track, T2 share a track, T3 gets its own, each T4 boss is unique.

// Global playlist — all unique IDs collected from COMBAT_MUSIC. Used as default
// when no custom playlist has been saved.
export const DEFAULT_MUSIC_TRACKS: string[] = [
  'ajuY4ervxIg', 'IyOAoj_Qzjc', '1FyPE0u2muE',
  'O0xolF2TQVE', 'y4b0x0-IMZI', '_tknxEFZSsY',
  '57rEF9ZT0rg', 'Y1vGBukbYAo', 'jhdFe3evXpk',
  '_GKQi4a78ZE', 'czL48Pnidtw', '64elMyXoBtQ',
  'c7s9eKDQn9c', '88sARuFu-tc', 'lkY0cTOQKHs',
  'K-a8s8OLBSE', 'pNt0iVG2VOA', 'j_KyxK-9LYU',
  'MiMF2Wy6Chk', 'd2uE4P3P5sI', 'Ww2J-RMNBf0',
  'f-Nd5aWM2Ks', 'FM7MFYoylVs', 'QQB_pPMw5cs',
  'JDVIXexHJao', 'nPkoXItrLSM', '27t_q_jAvD0',
  '77VUJ12kcSQ', 'ZQRrpxz104Y',
]

export const COMBAT_MUSIC: Partial<Record<string, string>> = {

  // ── T1 — background Fear / dark lofi ──────────────────────────────────────
  procrastination_mob:    'ajuY4ervxIg',
  burnout_shade:          'IyOAoj_Qzjc',
  notification_swarm:     '1FyPE0u2muE',

  sluchowiec:             'O0xolF2TQVE',
  wzrokowiec:             'y4b0x0-IMZI',
  czytacz:                '_tknxEFZSsY',
  brainless:              '57rEF9ZT0rg',
  zmeczony:               'Y1vGBukbYAo',
  glupi:                  'jhdFe3evXpk',
  architekt_sciany_tekstu: '_GKQi4a78ZE',
  baron_pivot:            'czL48Pnidtw',

  // ── T2 — unsettling electronic / dark ambient ───────────────────────────────
  hater:               '64elMyXoBtQ',
  blank_page_omen:     'c7s9eKDQn9c',
  comparison_engine:   '88sARuFu-tc',
  fear_phantom:        'lkY0cTOQKHs',
  algorithm_specter:   'K-a8s8OLBSE',
  impostor_shade:      'pNt0iVG2VOA',
  pobudzony:           'j_KyxK-9LYU',
  sfrustrowany:        'MiMF2Wy6Chk',
  intelektualista:     'd2uE4P3P5sI',
  kolekcjoner_kursow:  'Ww2J-RMNBf0',
  formatowy_purysta:   'f-Nd5aWM2Ks',
  algorytmiczny_zombie: 'FM7MFYoylVs',
  fabryka_wyswietlen:  'QQB_pPMw5cs',

  // ── T3 — tension / countdown ────────────────────────────────────────────────
  deadline_wraith:     'JDVIXexHJao',

  // ── T4 bosses — each unique ─────────────────────────────────────────────────
  perfectionism_knight: 'nPkoXItrLSM',
  overload_colossus:    '27t_q_jAvD0',
  distraction_weaver:   '77VUJ12kcSQ',
  void_tyrant:          'ZQRrpxz104Y',
}
