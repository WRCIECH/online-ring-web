import type { LocationTheme } from '../types/game'
import { LOCATION_THEMES } from './locationThemes'
import type { LocationThemeDef } from './locationThemes'

export type LocationSize = 'small' | 'small-medium' | 'medium' | 'large' | 'very large'

export interface LocationDef {
  id: string
  region_id: string        // which region this location belongs to
  is_final_location: boolean  // completing this = region's gate boss defeated
  displayName: string
  bossName: string
  theme: LocationTheme
  difficulty: number       // BFS depth within the region's graph
  size: LocationSize
  numSublocations: number
  runDuration: number      // seconds
  requires: string[]       // location IDs (within same region)
}

// ── Graph entry type ───────────────────────────────────────────────────────

interface RegionGraphEntry {
  size: LocationSize
  theme: LocationTheme
  requires: string[]
  is_final_location?: boolean
}

// ── Region_0: Feed of Awakening (existing 50 locations) ───────────────────
// IDs: loc_0 … loc_49

const LOCATION_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  // Starting region — text theme
  { size: 'small',        theme: 'text',     requires: [] },                          // loc_0
  { size: 'small-medium', theme: 'text',     requires: ['loc_0'] },                   // loc_1
  // Agheel branch — video
  { size: 'medium',       theme: 'video',    requires: ['loc_0'] },                   // loc_2
  { size: 'medium',       theme: 'research', requires: ['loc_2'] },                   // loc_3
  { size: 'medium',       theme: 'research', requires: ['loc_3'] },                   // loc_4
  // Weeping Peninsula — audio
  { size: 'medium',       theme: 'audio',    requires: ['loc_2'] },                   // loc_5
  { size: 'medium',       theme: 'audio',    requires: ['loc_5'] },                   // loc_6
  // Stormhill chain — deadline
  { size: 'small-medium', theme: 'deadline', requires: ['loc_0'] },                   // loc_7
  { size: 'large',        theme: 'deadline', requires: ['loc_7'] },                   // loc_8
  // Liurnia — video + research
  { size: 'medium',       theme: 'video',    requires: ['loc_8'] },                   // loc_9
  { size: 'large',        theme: 'research', requires: ['loc_9'] },                   // loc_10
  { size: 'large',        theme: 'research', requires: ['loc_10'] },                  // loc_11
  { size: 'medium',       theme: 'text',     requires: ['loc_9'] },                   // loc_12
  { size: 'small-medium', theme: 'text',     requires: ['loc_12'] },                  // loc_13
  { size: 'medium',       theme: 'audio',    requires: ['loc_10'] },                  // loc_14
  { size: 'medium',       theme: 'graphic',  requires: ['loc_10'] },                  // loc_15
  // Caelid — graphic + social
  { size: 'medium',       theme: 'graphic',  requires: ['loc_2'] },                   // loc_16
  { size: 'small-medium', theme: 'social',   requires: ['loc_16'] },                  // loc_17
  { size: 'large',        theme: 'video',    requires: ['loc_16'] },                  // loc_18
  { size: 'medium',       theme: 'deadline', requires: ['loc_16'] },                  // loc_19
  { size: 'large',        theme: 'social',   requires: ['loc_19'] },                  // loc_20
  { size: 'small',        theme: 'social',   requires: ['loc_20'] },                  // loc_21
  // Altus / Mt. Gelmir — deadline + graphic
  { size: 'medium',       theme: 'deadline', requires: ['loc_15'] },                  // loc_22
  { size: 'medium',       theme: 'deadline', requires: ['loc_22'] },                  // loc_23
  { size: 'small-medium', theme: 'social',   requires: ['loc_22'] },                  // loc_24
  { size: 'large',        theme: 'graphic',  requires: ['loc_22'] },                  // loc_25
  { size: 'large',        theme: 'graphic',  requires: ['loc_25'] },                  // loc_26
  // Leyndell — video + social
  { size: 'medium',       theme: 'video',    requires: ['loc_11', 'loc_19'] },        // loc_27
  { size: 'very large',   theme: 'social',   requires: ['loc_27'] },                  // loc_28
  { size: 'small',        theme: 'deadline', requires: ['loc_28'] },                  // loc_29
  { size: 'large',        theme: 'deadline', requires: ['loc_28'] },                  // loc_30
  { size: 'large',        theme: 'research', requires: ['loc_30'] },                  // loc_31
  // Forbidden Lands → Mountaintops — deadline + audio
  { size: 'small-medium', theme: 'deadline', requires: ['loc_29'] },                  // loc_32
  { size: 'large',        theme: 'audio',    requires: ['loc_32'] },                  // loc_33
  { size: 'medium',       theme: 'audio',    requires: ['loc_33'] },                  // loc_34
  { size: 'large',        theme: 'deadline', requires: ['loc_34'] },                  // loc_35
  { size: 'small',        theme: 'deadline', requires: ['loc_35'] },                  // loc_36
  // Consecrated Snowfield / Haligtree — research + text
  { size: 'large',        theme: 'research', requires: ['loc_33'] },                  // loc_37
  { size: 'small',        theme: 'text',     requires: ['loc_37'] },                  // loc_38
  { size: 'medium',       theme: 'social',   requires: ['loc_37'] },                  // loc_39
  { size: 'large',        theme: 'text',     requires: ['loc_38'] },                  // loc_40
  { size: 'very large',   theme: 'text',     requires: ['loc_40'] },                  // loc_41
  // Farum Azula — video + graphic
  { size: 'medium',       theme: 'video',    requires: ['loc_36'] },                  // loc_42
  { size: 'large',        theme: 'video',    requires: ['loc_42'] },                  // loc_43
  { size: 'medium',       theme: 'graphic',  requires: ['loc_43'] },                  // loc_44
  { size: 'medium',       theme: 'deadline', requires: ['loc_43'] },                  // loc_45
  // Final chain — deadline
  { size: 'medium',       theme: 'deadline', requires: ['loc_45'] },                  // loc_46
  { size: 'small',        theme: 'deadline', requires: ['loc_46'] },                  // loc_47
  { size: 'small',        theme: 'deadline', requires: ['loc_47'] },                  // loc_48
  { size: 'small',        theme: 'deadline', requires: ['loc_48'], is_final_location: true }, // loc_49
]

// ── Region_1: Lakes of Engagement (25 locations) ─────────────────────────
// IDs: r1_0 … r1_24   Themes: video, social, research

const REGION_1_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  { size: 'small',        theme: 'video',    requires: [] },                               // r1_0
  { size: 'small-medium', theme: 'social',   requires: ['r1_0'] },                         // r1_1
  { size: 'medium',       theme: 'video',    requires: ['r1_0'] },                         // r1_2
  { size: 'small',        theme: 'research', requires: ['r1_0'] },                         // r1_3
  { size: 'medium',       theme: 'social',   requires: ['r1_1'] },                         // r1_4
  { size: 'medium',       theme: 'research', requires: ['r1_2'] },                         // r1_5
  { size: 'large',        theme: 'video',    requires: ['r1_2'] },                         // r1_6
  { size: 'medium',       theme: 'research', requires: ['r1_3'] },                         // r1_7
  { size: 'large',        theme: 'social',   requires: ['r1_4'] },                         // r1_8
  { size: 'large',        theme: 'research', requires: ['r1_5'] },                         // r1_9
  { size: 'large',        theme: 'video',    requires: ['r1_6'] },                         // r1_10
  { size: 'medium',       theme: 'video',    requires: ['r1_7'] },                         // r1_11
  { size: 'large',        theme: 'social',   requires: ['r1_8', 'r1_9'] },                 // r1_12
  { size: 'medium',       theme: 'research', requires: ['r1_10', 'r1_11'] },               // r1_13
  { size: 'large',        theme: 'research', requires: ['r1_9'] },                         // r1_14
  { size: 'medium',       theme: 'social',   requires: ['r1_10'] },                        // r1_15
  { size: 'very large',   theme: 'social',   requires: ['r1_12'] },                        // r1_16
  { size: 'large',        theme: 'video',    requires: ['r1_13'] },                        // r1_17
  { size: 'medium',       theme: 'social',   requires: ['r1_16'] },                        // r1_18
  { size: 'large',        theme: 'research', requires: ['r1_17'] },                        // r1_19
  { size: 'large',        theme: 'video',    requires: ['r1_14', 'r1_15'] },               // r1_20
  { size: 'large',        theme: 'social',   requires: ['r1_18', 'r1_19'] },               // r1_21
  { size: 'large',        theme: 'video',    requires: ['r1_20'] },                        // r1_22
  { size: 'medium',       theme: 'research', requires: ['r1_21', 'r1_22'] },               // r1_23
  { size: 'very large',   theme: 'social',   requires: ['r1_23'], is_final_location: true }, // r1_24
]

// ── Region_2: The Viral Plateau (28 locations) ────────────────────────────
// IDs: r2_0 … r2_27   Themes: video, social, deadline

const REGION_2_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  { size: 'small',        theme: 'video',    requires: [] },                               // r2_0
  { size: 'medium',       theme: 'social',   requires: ['r2_0'] },                         // r2_1
  { size: 'medium',       theme: 'video',    requires: ['r2_0'] },                         // r2_2
  { size: 'small-medium', theme: 'deadline', requires: ['r2_0'] },                         // r2_3
  { size: 'large',        theme: 'social',   requires: ['r2_1'] },                         // r2_4
  { size: 'medium',       theme: 'video',    requires: ['r2_2'] },                         // r2_5
  { size: 'medium',       theme: 'deadline', requires: ['r2_3'] },                         // r2_6
  { size: 'large',        theme: 'video',    requires: ['r2_4'] },                         // r2_7
  { size: 'large',        theme: 'social',   requires: ['r2_5'] },                         // r2_8
  { size: 'medium',       theme: 'deadline', requires: ['r2_6'] },                         // r2_9
  { size: 'large',        theme: 'video',    requires: ['r2_5'] },                         // r2_10
  { size: 'medium',       theme: 'social',   requires: ['r2_8'] },                         // r2_11
  { size: 'large',        theme: 'deadline', requires: ['r2_9'] },                         // r2_12
  { size: 'very large',   theme: 'video',    requires: ['r2_7', 'r2_8'] },                 // r2_13
  { size: 'large',        theme: 'social',   requires: ['r2_11'] },                        // r2_14
  { size: 'large',        theme: 'deadline', requires: ['r2_12'] },                        // r2_15
  { size: 'medium',       theme: 'video',    requires: ['r2_10'] },                        // r2_16
  { size: 'large',        theme: 'social',   requires: ['r2_13'] },                        // r2_17
  { size: 'large',        theme: 'video',    requires: ['r2_14', 'r2_16'] },               // r2_18
  { size: 'large',        theme: 'deadline', requires: ['r2_15'] },                        // r2_19
  { size: 'medium',       theme: 'social',   requires: ['r2_17'] },                        // r2_20
  { size: 'large',        theme: 'video',    requires: ['r2_18'] },                        // r2_21
  { size: 'large',        theme: 'social',   requires: ['r2_19', 'r2_20'] },               // r2_22
  { size: 'very large',   theme: 'deadline', requires: ['r2_21'] },                        // r2_23
  { size: 'large',        theme: 'video',    requires: ['r2_22', 'r2_23'] },               // r2_24
  { size: 'medium',       theme: 'social',   requires: ['r2_24'] },                        // r2_25
  { size: 'large',        theme: 'deadline', requires: ['r2_25'] },                        // r2_26
  { size: 'very large',   theme: 'video',    requires: ['r2_26'], is_final_location: true }, // r2_27
]

// ── Region_3: Valley of Monetization (32 locations) ──────────────────────
// IDs: r3_0 … r3_31   Themes: deadline, research, text

const REGION_3_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  { size: 'small',        theme: 'text',     requires: [] },                               // r3_0
  { size: 'medium',       theme: 'deadline', requires: ['r3_0'] },                         // r3_1
  { size: 'medium',       theme: 'research', requires: ['r3_0'] },                         // r3_2
  { size: 'small-medium', theme: 'text',     requires: ['r3_0'] },                         // r3_3
  { size: 'medium',       theme: 'deadline', requires: ['r3_1'] },                         // r3_4
  { size: 'large',        theme: 'research', requires: ['r3_2'] },                         // r3_5
  { size: 'medium',       theme: 'text',     requires: ['r3_3'] },                         // r3_6
  { size: 'large',        theme: 'deadline', requires: ['r3_4'] },                         // r3_7
  { size: 'large',        theme: 'research', requires: ['r3_5'] },                         // r3_8
  { size: 'medium',       theme: 'text',     requires: ['r3_6'] },                         // r3_9
  { size: 'large',        theme: 'deadline', requires: ['r3_7'] },                         // r3_10
  { size: 'medium',       theme: 'text',     requires: ['r3_8'] },                         // r3_11
  { size: 'large',        theme: 'research', requires: ['r3_9'] },                         // r3_12
  { size: 'medium',       theme: 'deadline', requires: ['r3_10'] },                        // r3_13
  { size: 'large',        theme: 'research', requires: ['r3_11', 'r3_12'] },               // r3_14
  { size: 'very large',   theme: 'deadline', requires: ['r3_13'] },                        // r3_15
  { size: 'large',        theme: 'text',     requires: ['r3_14'] },                        // r3_16
  { size: 'large',        theme: 'deadline', requires: ['r3_15'] },                        // r3_17
  { size: 'medium',       theme: 'research', requires: ['r3_16'] },                        // r3_18
  { size: 'medium',       theme: 'text',     requires: ['r3_17'] },                        // r3_19
  { size: 'large',        theme: 'deadline', requires: ['r3_18', 'r3_19'] },               // r3_20
  { size: 'medium',       theme: 'research', requires: ['r3_20'] },                        // r3_21
  { size: 'large',        theme: 'text',     requires: ['r3_20'] },                        // r3_22
  { size: 'large',        theme: 'deadline', requires: ['r3_21'] },                        // r3_23
  { size: 'large',        theme: 'research', requires: ['r3_22'] },                        // r3_24
  { size: 'medium',       theme: 'text',     requires: ['r3_23'] },                        // r3_25
  { size: 'very large',   theme: 'deadline', requires: ['r3_24', 'r3_25'] },               // r3_26
  { size: 'large',        theme: 'research', requires: ['r3_26'] },                        // r3_27
  { size: 'medium',       theme: 'text',     requires: ['r3_26'] },                        // r3_28
  { size: 'large',        theme: 'deadline', requires: ['r3_27', 'r3_28'] },               // r3_29
  { size: 'medium',       theme: 'research', requires: ['r3_29'] },                        // r3_30
  { size: 'very large',   theme: 'deadline', requires: ['r3_30'], is_final_location: true }, // r3_31
]

// ── Region_4: Ashwastes of Burnout (30 locations) ────────────────────────
// IDs: r4_0 … r4_29   Themes: deadline, text, audio

const REGION_4_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  { size: 'small',        theme: 'text',     requires: [] },                               // r4_0
  { size: 'small-medium', theme: 'deadline', requires: ['r4_0'] },                         // r4_1
  { size: 'medium',       theme: 'audio',    requires: ['r4_0'] },                         // r4_2
  { size: 'medium',       theme: 'text',     requires: ['r4_0'] },                         // r4_3
  { size: 'medium',       theme: 'deadline', requires: ['r4_1'] },                         // r4_4
  { size: 'large',        theme: 'text',     requires: ['r4_2'] },                         // r4_5
  { size: 'large',        theme: 'deadline', requires: ['r4_3'] },                         // r4_6
  { size: 'medium',       theme: 'audio',    requires: ['r4_4'] },                         // r4_7
  { size: 'large',        theme: 'text',     requires: ['r4_5'] },                         // r4_8
  { size: 'large',        theme: 'deadline', requires: ['r4_6'] },                         // r4_9
  { size: 'large',        theme: 'audio',    requires: ['r4_7'] },                         // r4_10
  { size: 'medium',       theme: 'text',     requires: ['r4_8'] },                         // r4_11
  { size: 'very large',   theme: 'deadline', requires: ['r4_9'] },                         // r4_12
  { size: 'large',        theme: 'audio',    requires: ['r4_10'] },                        // r4_13
  { size: 'large',        theme: 'text',     requires: ['r4_11'] },                        // r4_14
  { size: 'large',        theme: 'deadline', requires: ['r4_12'] },                        // r4_15
  { size: 'medium',       theme: 'audio',    requires: ['r4_13'] },                        // r4_16
  { size: 'large',        theme: 'deadline', requires: ['r4_14', 'r4_15'] },               // r4_17
  { size: 'medium',       theme: 'text',     requires: ['r4_16'] },                        // r4_18
  { size: 'large',        theme: 'audio',    requires: ['r4_17'] },                        // r4_19
  { size: 'large',        theme: 'text',     requires: ['r4_18'] },                        // r4_20
  { size: 'very large',   theme: 'deadline', requires: ['r4_19', 'r4_20'] },               // r4_21
  { size: 'medium',       theme: 'audio',    requires: ['r4_21'] },                        // r4_22
  { size: 'large',        theme: 'text',     requires: ['r4_21'] },                        // r4_23
  { size: 'large',        theme: 'deadline', requires: ['r4_22', 'r4_23'] },               // r4_24
  { size: 'medium',       theme: 'audio',    requires: ['r4_24'] },                        // r4_25
  { size: 'medium',       theme: 'text',     requires: ['r4_24'] },                        // r4_26
  { size: 'large',        theme: 'deadline', requires: ['r4_25', 'r4_26'] },               // r4_27
  { size: 'medium',       theme: 'audio',    requires: ['r4_27'] },                        // r4_28
  { size: 'very large',   theme: 'text',     requires: ['r4_28'], is_final_location: true }, // r4_29
]

// ── Region_5: The Comment Section (35 locations) ──────────────────────────
// IDs: r5_0 … r5_34   Themes: social, text, deadline

const REGION_5_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  { size: 'small',        theme: 'social',   requires: [] },                               // r5_0
  { size: 'medium',       theme: 'text',     requires: ['r5_0'] },                         // r5_1
  { size: 'medium',       theme: 'social',   requires: ['r5_0'] },                         // r5_2
  { size: 'small-medium', theme: 'deadline', requires: ['r5_0'] },                         // r5_3
  { size: 'large',        theme: 'text',     requires: ['r5_1'] },                         // r5_4
  { size: 'large',        theme: 'social',   requires: ['r5_2'] },                         // r5_5
  { size: 'medium',       theme: 'deadline', requires: ['r5_3'] },                         // r5_6
  { size: 'large',        theme: 'text',     requires: ['r5_4'] },                         // r5_7
  { size: 'very large',   theme: 'social',   requires: ['r5_5'] },                         // r5_8
  { size: 'large',        theme: 'deadline', requires: ['r5_6'] },                         // r5_9
  { size: 'medium',       theme: 'social',   requires: ['r5_4'] },                         // r5_10
  { size: 'large',        theme: 'text',     requires: ['r5_7'] },                         // r5_11
  { size: 'large',        theme: 'social',   requires: ['r5_8'] },                         // r5_12
  { size: 'large',        theme: 'deadline', requires: ['r5_9'] },                         // r5_13
  { size: 'medium',       theme: 'text',     requires: ['r5_10', 'r5_11'] },               // r5_14
  { size: 'very large',   theme: 'social',   requires: ['r5_12'] },                        // r5_15
  { size: 'large',        theme: 'deadline', requires: ['r5_13'] },                        // r5_16
  { size: 'large',        theme: 'text',     requires: ['r5_14'] },                        // r5_17
  { size: 'large',        theme: 'social',   requires: ['r5_15'] },                        // r5_18
  { size: 'large',        theme: 'deadline', requires: ['r5_16'] },                        // r5_19
  { size: 'medium',       theme: 'text',     requires: ['r5_17'] },                        // r5_20
  { size: 'large',        theme: 'social',   requires: ['r5_18'] },                        // r5_21
  { size: 'very large',   theme: 'deadline', requires: ['r5_19'] },                        // r5_22
  { size: 'large',        theme: 'text',     requires: ['r5_20', 'r5_21'] },               // r5_23
  { size: 'large',        theme: 'social',   requires: ['r5_22'] },                        // r5_24
  { size: 'medium',       theme: 'deadline', requires: ['r5_23'] },                        // r5_25
  { size: 'very large',   theme: 'text',     requires: ['r5_24', 'r5_25'] },               // r5_26
  { size: 'large',        theme: 'social',   requires: ['r5_26'] },                        // r5_27
  { size: 'large',        theme: 'deadline', requires: ['r5_26'] },                        // r5_28
  { size: 'large',        theme: 'text',     requires: ['r5_27'] },                        // r5_29
  { size: 'large',        theme: 'social',   requires: ['r5_28'] },                        // r5_30
  { size: 'medium',       theme: 'deadline', requires: ['r5_29', 'r5_30'] },               // r5_31
  { size: 'large',        theme: 'text',     requires: ['r5_31'] },                        // r5_32
  { size: 'medium',       theme: 'social',   requires: ['r5_32'] },                        // r5_33
  { size: 'very large',   theme: 'deadline', requires: ['r5_33'], is_final_location: true }, // r5_34
]

// ── Region_6: Shadow Capital of Shadowbans (38 locations) ─────────────────
// IDs: r6_0 … r6_37   Themes: audio, research, social

const REGION_6_GRAPH: ReadonlyArray<RegionGraphEntry> = [
  { size: 'small',        theme: 'audio',    requires: [] },                               // r6_0
  { size: 'medium',       theme: 'research', requires: ['r6_0'] },                         // r6_1
  { size: 'medium',       theme: 'social',   requires: ['r6_0'] },                         // r6_2
  { size: 'small-medium', theme: 'audio',    requires: ['r6_0'] },                         // r6_3
  { size: 'large',        theme: 'research', requires: ['r6_1'] },                         // r6_4
  { size: 'large',        theme: 'social',   requires: ['r6_2'] },                         // r6_5
  { size: 'medium',       theme: 'audio',    requires: ['r6_3'] },                         // r6_6
  { size: 'large',        theme: 'research', requires: ['r6_4'] },                         // r6_7
  { size: 'very large',   theme: 'social',   requires: ['r6_5'] },                         // r6_8
  { size: 'large',        theme: 'audio',    requires: ['r6_6'] },                         // r6_9
  { size: 'large',        theme: 'research', requires: ['r6_7'] },                         // r6_10
  { size: 'large',        theme: 'social',   requires: ['r6_8'] },                         // r6_11
  { size: 'medium',       theme: 'audio',    requires: ['r6_9'] },                         // r6_12
  { size: 'large',        theme: 'research', requires: ['r6_10'] },                        // r6_13
  { size: 'very large',   theme: 'social',   requires: ['r6_11'] },                        // r6_14
  { size: 'large',        theme: 'audio',    requires: ['r6_12'] },                        // r6_15
  { size: 'large',        theme: 'research', requires: ['r6_13'] },                        // r6_16
  { size: 'large',        theme: 'social',   requires: ['r6_14'] },                        // r6_17
  { size: 'medium',       theme: 'audio',    requires: ['r6_15'] },                        // r6_18
  { size: 'large',        theme: 'research', requires: ['r6_16', 'r6_17'] },               // r6_19
  { size: 'large',        theme: 'audio',    requires: ['r6_18'] },                        // r6_20
  { size: 'very large',   theme: 'social',   requires: ['r6_19'] },                        // r6_21
  { size: 'large',        theme: 'audio',    requires: ['r6_20'] },                        // r6_22
  { size: 'large',        theme: 'research', requires: ['r6_21'] },                        // r6_23
  { size: 'large',        theme: 'social',   requires: ['r6_22', 'r6_23'] },               // r6_24
  { size: 'medium',       theme: 'audio',    requires: ['r6_24'] },                        // r6_25
  { size: 'large',        theme: 'research', requires: ['r6_24'] },                        // r6_26
  { size: 'very large',   theme: 'social',   requires: ['r6_25', 'r6_26'] },               // r6_27
  { size: 'large',        theme: 'audio',    requires: ['r6_27'] },                        // r6_28
  { size: 'large',        theme: 'research', requires: ['r6_27'] },                        // r6_29
  { size: 'medium',       theme: 'social',   requires: ['r6_28', 'r6_29'] },               // r6_30
  { size: 'large',        theme: 'audio',    requires: ['r6_30'] },                        // r6_31
  { size: 'large',        theme: 'research', requires: ['r6_30'] },                        // r6_32
  { size: 'very large',   theme: 'social',   requires: ['r6_31'] },                        // r6_33
  { size: 'large',        theme: 'audio',    requires: ['r6_32', 'r6_33'] },               // r6_34
  { size: 'large',        theme: 'research', requires: ['r6_34'] },                        // r6_35
  { size: 'large',        theme: 'social',   requires: ['r6_34'] },                        // r6_36
  { size: 'very large',   theme: 'audio',    requires: ['r6_35', 'r6_36'], is_final_location: true }, // r6_37
]

// ── Sublocation count (difficulty-scaled within per-size range) ────────────

const BASE_SUBLOCATIONS: Record<LocationSize, number> = {
  'small': 8, 'small-medium': 12, 'medium': 17, 'large': 22, 'very large': 27,
}
const MAX_SUBLOCATIONS: Record<LocationSize, number> = {
  'small': 13, 'small-medium': 18, 'medium': 24, 'large': 30, 'very large': 36,
}

// ── BFS depth within a region's graph ────────────────────────────────────

function computeDepths(graph: ReadonlyArray<RegionGraphEntry>, makeId: (i: number) => string): number[] {
  const idToIdx = new Map<string, number>(graph.map((_, i) => [makeId(i), i]))
  const depths = new Array<number>(graph.length).fill(-1)
  depths[0] = 0
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < graph.length; i++) {
      if (depths[i] >= 0) continue
      const preds = graph[i].requires.map(r => {
        const idx = idToIdx.get(r)
        return idx !== undefined ? depths[idx] : -1
      })
      if (preds.every(d => d >= 0)) {
        depths[i] = (preds.length > 0 ? Math.max(...preds) : -1) + 1
        changed = true
      }
    }
  }
  return depths
}

// ── Name generation (per-theme counter, stride-7 nouns for uniqueness) ────

function generateName(theme: LocationThemeDef, themeIdx: number): string {
  const adj  = theme.adjectives[themeIdx % theme.adjectives.length]
  const noun = theme.nouns[(themeIdx * 7) % theme.nouns.length]
  return `${adj} ${noun}`
}

function pickBossName(theme: LocationThemeDef, themeIdx: number): string {
  return theme.bossNames[themeIdx % theme.bossNames.length]
}

// ── Generator ─────────────────────────────────────────────────────────────

function generateLocations(
  regionId: string,
  graph: ReadonlyArray<RegionGraphEntry>,
  makeId: (i: number) => string,
  sublocMult: number,
): LocationDef[] {
  const depths = computeDepths(graph, makeId)
  const themeCounters: Partial<Record<LocationTheme, number>> = {}

  return graph.map((entry, i) => {
    const theme    = LOCATION_THEMES[entry.theme]
    const themeIdx = themeCounters[entry.theme] ?? 0
    themeCounters[entry.theme] = themeIdx + 1

    const difficulty = depths[i]
    const scaledBase = Math.round(BASE_SUBLOCATIONS[entry.size] * sublocMult)
    const scaledMax  = Math.round(MAX_SUBLOCATIONS[entry.size]  * sublocMult)
    const numSublocations = Math.min(scaledMax, scaledBase + Math.floor(difficulty * 0.5))

    return {
      id:               makeId(i),
      region_id:        regionId,
      is_final_location: entry.is_final_location ?? false,
      displayName:      generateName(theme, themeIdx),
      bossName:         pickBossName(theme, themeIdx),
      theme:            entry.theme,
      difficulty,
      size:             entry.size,
      numSublocations,
      runDuration:      (24 + numSublocations) * 3600,
      requires:         entry.requires,
    }
  })
}

export const LOCATION_DEFINITIONS: LocationDef[] = [
  ...generateLocations('region_0', LOCATION_GRAPH,  i => `loc_${i}`, 1.0),
  ...generateLocations('region_1', REGION_1_GRAPH,  i => `r1_${i}`,  1.1),
  ...generateLocations('region_2', REGION_2_GRAPH,  i => `r2_${i}`,  1.2),
  ...generateLocations('region_3', REGION_3_GRAPH,  i => `r3_${i}`,  1.3),
  ...generateLocations('region_4', REGION_4_GRAPH,  i => `r4_${i}`,  1.4),
  ...generateLocations('region_5', REGION_5_GRAPH,  i => `r5_${i}`,  1.6),
  ...generateLocations('region_6', REGION_6_GRAPH,  i => `r6_${i}`,  1.8),
]

// ── Helpers ───────────────────────────────────────────────────────────────

export function getUnlockedLocationIds(completedIds: string[], regionId?: string): Set<string> {
  const done = new Set(completedIds)
  return new Set(
    LOCATION_DEFINITIONS
      .filter(loc =>
        (regionId == null || loc.region_id === regionId) &&
        loc.requires.every(r => done.has(r))
      )
      .map(loc => loc.id)
  )
}

export const SIZE_LABEL: Record<LocationSize, string> = {
  'small': 'S', 'small-medium': 'S-M', 'medium': 'M', 'large': 'L', 'very large': 'XL',
}

export const SIZE_COLOUR: Record<LocationSize, string> = {
  'small':        '#2ecc88',
  'small-medium': '#4488cc',
  'medium':       '#ccaa22',
  'large':        '#cc6622',
  'very large':   '#cc3333',
}
