export interface RegionDef {
  id: string
  name: string
  lore: string
  difficultyMult: number  // multiplied into every encounter's mult in this region
  sublocMult: number      // scales BASE/MAX sublocations for runs in this region
  color: string           // primary accent hex (map cells, UI borders)
  bgColor: string         // SVG background of the per-region location map
  requires: string[]      // region IDs that must be completed first
  isFinalRegion?: boolean // beating its final boss = game_won
}

export const REGION_DEFINITIONS: RegionDef[] = [
  {
    id: 'region_0', name: 'Feed of Awakening',
    lore: 'Zero reach, first steps into the feed',
    difficultyMult: 1.0, sublocMult: 1.0,
    color: '#7c5cbf', bgColor: '#161228',
    requires: [],
  },
  {
    id: 'region_1', name: 'Lakes of Engagement',
    lore: 'Chasing CTR, attention spans, retention',
    difficultyMult: 1.3, sublocMult: 1.1,
    color: '#2a9db5', bgColor: '#0c1e2e',
    requires: ['region_0'],
  },
  {
    id: 'region_2', name: 'The Viral Plateau',
    lore: 'Hype, trending, big views — and bigger crashes',
    difficultyMult: 1.7, sublocMult: 1.2,
    color: '#d4a017', bgColor: '#1e1600',
    requires: ['region_1'],
  },
  {
    id: 'region_3', name: 'Valley of Monetization',
    lore: 'Sponsors, brand deals, and the price of compromise',
    difficultyMult: 2.2, sublocMult: 1.3,
    color: '#2ecc71', bgColor: '#0a1c0e',
    requires: ['region_2'],
  },
  {
    id: 'region_4', name: 'Ashwastes of Burnout',
    lore: 'Exhaustion, drought of ideas, slow movement',
    difficultyMult: 2.8, sublocMult: 1.4,
    color: '#c0392b', bgColor: '#1c0808',
    requires: ['region_3'],
  },
  {
    id: 'region_5', name: 'The Comment Section',
    lore: 'Toxic hate, roasts, cancellation waves',
    difficultyMult: 3.5, sublocMult: 1.6,
    color: '#27ae60', bgColor: '#001800',
    requires: ['region_4'],
  },
  {
    id: 'region_6', name: 'Shadow Capital of Shadowbans',
    lore: 'Algorithmic censorship, zero visibility, the final truth',
    difficultyMult: 4.5, sublocMult: 1.8,
    color: '#6c3483', bgColor: '#08000e',
    requires: ['region_5'],
    isFinalRegion: true,
  },
]
