import type { LocationTheme, AtomicStage } from '../types/game'
import type { ContentProductType } from './contentProducts'

export interface LocationThemeDef {
  id: LocationTheme
  displayLabel: string
  color: string
  contentFocus: ContentProductType[]
  stageFocus: AtomicStage[]
  adjectives: string[]
  nouns: string[]
  bossNames: string[]
}

export const LOCATION_THEMES: Record<LocationTheme, LocationThemeDef> = {
  text: {
    id: 'text',
    displayLabel: 'Text Wastes',
    color: '#7a5ab0',
    contentFocus: ['Plaintext', 'StructuredText', 'IllustratedText'],
    stageFocus: [],
    adjectives: ['Blank', 'Hollow', 'Faded', 'Pale', 'Silent', 'Forgotten', 'Scarred', 'Ashen', 'Smudged', 'Corroded'],
    nouns: ['Page', 'Archive', 'Codex', 'Scriptorium', 'Vault', 'Manuscript', 'Library', 'Hall', 'Parchment', 'Column'],
    bossNames: ['The Blank Page', 'The Perfectionist', 'The Empty Codex', 'The Final Draft', 'The Last Word'],
  },
  video: {
    id: 'video',
    displayLabel: 'Video Den',
    color: '#b04040',
    contentFocus: ['ARollVideo', 'SlideshowVideo', 'Screencast', 'CinematicVideo', 'MotionGraphics', 'LiveStream'],
    stageFocus: [],
    adjectives: ['Viral', 'Dark', 'Ruined', 'Corrupted', 'Static', 'Flickering', 'Overexposed', 'Glitched', 'Burned', 'Cut'],
    nouns: ['Studio', 'Channel', 'Edit Bay', 'Stage', 'Frame', 'Reel', 'Screen', 'Set', 'Broadcast', 'Footage'],
    bossNames: ['The Algorithm', 'The Demonetizer', 'The View Count', 'The Viral Tyrant', 'The Unsubscriber'],
  },
  audio: {
    id: 'audio',
    displayLabel: 'Echo Forge',
    color: '#4070a0',
    contentFocus: ['RawAudio', 'ProducedAudio'],
    stageFocus: [],
    adjectives: ['Echoing', 'Droning', 'Hollow', 'Resonant', 'Muffled', 'Distorted', 'Reverberant', 'Dead', 'Silent', 'Hissing'],
    nouns: ['Chamber', 'Forge', 'Vault', 'Cave', 'Pit', 'Cavity', 'Hall', 'Cavern', 'Echo', 'Frequency'],
    bossNames: ['The Dead Air', 'The Noise Gate', 'The Void Frequency', 'The Hiss Lord', 'The Echo Tyrant'],
  },
  graphic: {
    id: 'graphic',
    displayLabel: 'Visual Pits',
    color: '#508050',
    contentFocus: ['SingleGraphic', 'Carousel', 'Infographic'],
    stageFocus: [],
    adjectives: ['Bleeding', 'Overexposed', 'Glitched', 'Fractured', 'Vivid', 'Dark', 'Faded', 'Saturated', 'Corrupt', 'Raw'],
    nouns: ['Canvas', 'Gallery', 'Palette', 'Render', 'Exposure', 'Frame', 'Studio', 'Print', 'Layer', 'Draft'],
    bossNames: ['The Pixel Colossus', 'The Resolution Wraith', 'The Compression Lord', 'The Render Demon', 'The Artifact'],
  },
  research: {
    id: 'research',
    displayLabel: 'Dark Archive',
    color: '#406080',
    contentFocus: ['MultimediaPage', 'BranchingNarrative', 'CurationFeed'],
    stageFocus: ['Research'],
    adjectives: ['Deep', 'Buried', 'Forgotten', 'Dark', 'Hidden', 'Ancient', 'Lost', 'Unindexed', 'Sealed', 'Vast'],
    nouns: ['Archive', 'Study', 'Repository', 'Index', 'Vault', 'Crypt', 'Depths', 'Source', 'Library', 'Catalog'],
    bossNames: ['The Unreachable Citation', 'The Source', 'The Deep Dive', 'The Rabbit Hole', 'The Null Reference'],
  },
  social: {
    id: 'social',
    displayLabel: 'Viral Grounds',
    color: '#906820',
    contentFocus: ['CommunitySpace', 'LiveStream', 'CurationFeed'],
    stageFocus: [],
    adjectives: ['Toxic', 'Broken', 'Scorched', 'Scattered', 'Hollow', 'Divided', 'Viral', 'Depleted', 'Collapsed', 'Flooded'],
    nouns: ['Feed', 'Network', 'Forum', 'Square', 'Grounds', 'Marketplace', 'Commons', 'Platform', 'Hub', 'Stream'],
    bossNames: ['The Ratio King', 'The Hive Mind', 'The Engagement Tyrant', 'The Viral Lord', 'The Echo Chamber'],
  },
  deadline: {
    id: 'deadline',
    displayLabel: 'The Grind',
    color: '#903020',
    contentFocus: [],
    stageFocus: ['Produce'],
    adjectives: ['Burning', 'Collapsing', 'Frantic', 'Desperate', 'Final', 'Last', 'Grinding', 'Crumbling', 'Forsaken', 'Relentless', 'Unforgiving', 'Brutal', 'Crushing', 'Wasted', 'Expired'],
    nouns: ['Pit', 'Furnace', 'Crucible', 'Clock', 'Grind', 'Threshold', 'Deadline', 'Abyss', 'Pressure', 'Edge', 'Maw', 'Chasm', 'Floor', 'March', 'Toll'],
    bossNames: ['The Final Hour', 'The Burnout', 'The Last Minute', 'The Overdue Colossus', 'The Deadline Wraith'],
  },
}
