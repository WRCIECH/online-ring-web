import type { LocationTheme } from '../types/game'
import { LOCATION_THEMES } from './locationThemes'
import type { LocationThemeDef } from './locationThemes'

export type LocationSize = 'small' | 'small-medium' | 'medium' | 'large' | 'very large'

export interface LocationDef {
  id: string              // "loc_0" … "loc_49"
  displayName: string
  bossName: string
  theme: LocationTheme
  difficulty: number      // BFS depth from loc_0
  size: LocationSize
  numSublocations: number
  runDuration: number     // seconds
  requires: string[]      // "loc_N" IDs
}

// ── Static graph skeleton (preserves prerequisite DAG with loc_N IDs) ─────

interface GraphEntry {
  size: LocationSize
  theme: LocationTheme
  requires: string[]
}

const LOCATION_GRAPH: ReadonlyArray<GraphEntry> = [
  // Starting region — text theme
  { size: 'small',        theme: 'text',     requires: [] },                         // loc_0
  { size: 'small-medium', theme: 'text',     requires: ['loc_0'] },                  // loc_1
  // Agheel branch — video
  { size: 'medium',       theme: 'video',    requires: ['loc_0'] },                  // loc_2
  { size: 'medium',       theme: 'research', requires: ['loc_2'] },                  // loc_3
  { size: 'medium',       theme: 'research', requires: ['loc_3'] },                  // loc_4
  // Weeping Peninsula — audio
  { size: 'medium',       theme: 'audio',    requires: ['loc_2'] },                  // loc_5
  { size: 'medium',       theme: 'audio',    requires: ['loc_5'] },                  // loc_6
  // Stormhill chain — deadline
  { size: 'small-medium', theme: 'deadline', requires: ['loc_0'] },                  // loc_7
  { size: 'large',        theme: 'deadline', requires: ['loc_7'] },                  // loc_8
  // Liurnia — video + research
  { size: 'medium',       theme: 'video',    requires: ['loc_8'] },                  // loc_9
  { size: 'large',        theme: 'research', requires: ['loc_9'] },                  // loc_10
  { size: 'large',        theme: 'research', requires: ['loc_10'] },                 // loc_11
  { size: 'medium',       theme: 'text',     requires: ['loc_9'] },                  // loc_12
  { size: 'small-medium', theme: 'text',     requires: ['loc_12'] },                 // loc_13
  { size: 'medium',       theme: 'audio',    requires: ['loc_10'] },                 // loc_14
  { size: 'medium',       theme: 'graphic',  requires: ['loc_10'] },                 // loc_15
  // Caelid — graphic + social
  { size: 'medium',       theme: 'graphic',  requires: ['loc_2'] },                  // loc_16
  { size: 'small-medium', theme: 'social',   requires: ['loc_16'] },                 // loc_17
  { size: 'large',        theme: 'video',    requires: ['loc_16'] },                 // loc_18
  { size: 'medium',       theme: 'deadline', requires: ['loc_16'] },                 // loc_19
  { size: 'large',        theme: 'social',   requires: ['loc_19'] },                 // loc_20
  { size: 'small',        theme: 'social',   requires: ['loc_20'] },                 // loc_21
  // Altus / Mt. Gelmir — deadline + graphic
  { size: 'medium',       theme: 'deadline', requires: ['loc_15'] },                 // loc_22
  { size: 'medium',       theme: 'deadline', requires: ['loc_22'] },                 // loc_23
  { size: 'small-medium', theme: 'social',   requires: ['loc_22'] },                 // loc_24
  { size: 'large',        theme: 'graphic',  requires: ['loc_22'] },                 // loc_25
  { size: 'large',        theme: 'graphic',  requires: ['loc_25'] },                 // loc_26
  // Leyndell — video + social
  { size: 'medium',       theme: 'video',    requires: ['loc_11', 'loc_19'] },       // loc_27
  { size: 'very large',   theme: 'social',   requires: ['loc_27'] },                 // loc_28
  { size: 'small',        theme: 'deadline', requires: ['loc_28'] },                 // loc_29
  { size: 'large',        theme: 'deadline', requires: ['loc_28'] },                 // loc_30
  { size: 'large',        theme: 'research', requires: ['loc_30'] },                 // loc_31
  // Forbidden Lands → Mountaintops — deadline + audio
  { size: 'small-medium', theme: 'deadline', requires: ['loc_29'] },                 // loc_32
  { size: 'large',        theme: 'audio',    requires: ['loc_32'] },                 // loc_33
  { size: 'medium',       theme: 'audio',    requires: ['loc_33'] },                 // loc_34
  { size: 'large',        theme: 'deadline', requires: ['loc_34'] },                 // loc_35
  { size: 'small',        theme: 'deadline', requires: ['loc_35'] },                 // loc_36
  // Consecrated Snowfield / Haligtree — research + text
  { size: 'large',        theme: 'research', requires: ['loc_33'] },                 // loc_37
  { size: 'small',        theme: 'text',     requires: ['loc_37'] },                 // loc_38
  { size: 'medium',       theme: 'social',   requires: ['loc_37'] },                 // loc_39
  { size: 'large',        theme: 'text',     requires: ['loc_38'] },                 // loc_40
  { size: 'very large',   theme: 'text',     requires: ['loc_40'] },                 // loc_41
  // Farum Azula — video + graphic
  { size: 'medium',       theme: 'video',    requires: ['loc_36'] },                 // loc_42
  { size: 'large',        theme: 'video',    requires: ['loc_42'] },                 // loc_43
  { size: 'medium',       theme: 'graphic',  requires: ['loc_43'] },                 // loc_44
  { size: 'medium',       theme: 'deadline', requires: ['loc_43'] },                 // loc_45
  // Final chain — deadline
  { size: 'medium',       theme: 'deadline', requires: ['loc_45'] },                 // loc_46
  { size: 'small',        theme: 'deadline', requires: ['loc_46'] },                 // loc_47
  { size: 'small',        theme: 'deadline', requires: ['loc_47'] },                 // loc_48
  { size: 'small',        theme: 'deadline', requires: ['loc_48'] },                 // loc_49
]

// ── Sublocation count (difficulty-scaled within per-size range) ────────────

const BASE_SUBLOCATIONS: Record<LocationSize, number> = {
  'small': 8, 'small-medium': 12, 'medium': 17, 'large': 22, 'very large': 27,
}
const MAX_SUBLOCATIONS: Record<LocationSize, number> = {
  'small': 13, 'small-medium': 18, 'medium': 24, 'large': 30, 'very large': 36,
}

function calcSublocations(size: LocationSize, difficulty: number): number {
  return Math.min(
    MAX_SUBLOCATIONS[size],
    BASE_SUBLOCATIONS[size] + Math.floor(difficulty * 0.5),
  )
}

// ── BFS depth from loc_0 ──────────────────────────────────────────────────

function computeDepths(graph: ReadonlyArray<GraphEntry>): number[] {
  const depths = new Array<number>(graph.length).fill(-1)
  depths[0] = 0
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < graph.length; i++) {
      if (depths[i] >= 0) continue
      const predDepths = graph[i].requires.map(r => depths[parseInt(r.slice(4), 10)])
      if (predDepths.every(d => d >= 0)) {
        depths[i] = (predDepths.length > 0 ? Math.max(...predDepths) : -1) + 1
        changed = true
      }
    }
  }
  return depths
}

// ── Name generation (per-theme counter, stride-7 nouns for uniqueness) ────

// Uses stride-7 for nouns — coprime to any pool size up to ~50, ensuring all
// positions are visited before repeating within a single theme.
function generateName(theme: LocationThemeDef, themeIdx: number): string {
  const adj  = theme.adjectives[themeIdx % theme.adjectives.length]
  const noun = theme.nouns[(themeIdx * 7) % theme.nouns.length]
  return `${adj} ${noun}`
}

function pickBossName(theme: LocationThemeDef, themeIdx: number): string {
  return theme.bossNames[themeIdx % theme.bossNames.length]
}

// ── Generator ─────────────────────────────────────────────────────────────

function generateLocations(): LocationDef[] {
  const depths = computeDepths(LOCATION_GRAPH)
  const themeCounters: Partial<Record<LocationTheme, number>> = {}

  return LOCATION_GRAPH.map((entry, i) => {
    const theme     = LOCATION_THEMES[entry.theme]
    const themeIdx  = themeCounters[entry.theme] ?? 0
    themeCounters[entry.theme] = themeIdx + 1

    const difficulty      = depths[i]
    const numSublocations = calcSublocations(entry.size, difficulty)
    return {
      id:            `loc_${i}`,
      displayName:   generateName(theme, themeIdx),
      bossName:      pickBossName(theme, themeIdx),
      theme:         entry.theme,
      difficulty,
      size:          entry.size,
      numSublocations,
      runDuration:   (24 + numSublocations) * 3600,
      requires:      entry.requires,
    }
  })
}

export const LOCATION_DEFINITIONS: LocationDef[] = generateLocations()

// ── Helpers ───────────────────────────────────────────────────────────────

export function getUnlockedLocationIds(completedIds: string[]): Set<string> {
  const done = new Set(completedIds)
  return new Set(
    LOCATION_DEFINITIONS
      .filter(loc => loc.requires.every(r => done.has(r)))
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
