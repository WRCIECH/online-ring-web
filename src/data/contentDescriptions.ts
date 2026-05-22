import type { AtomicOrigin, DamageType, StatusType } from '../types/game'

export const CONTENT_ORIGIN_LABELS: Record<AtomicOrigin, string> = {
  New:           'Original — created from scratch',
  Compression:   'Compression — same idea, shorter & tighter',
  Expansion:     'Expansion — same idea, more elaborate',
  Recycled:      'Recycle — platform pivot, new format',
  Remastered:    'Remaster — rework of existing content',
  Revamped:      'Revamp — updated with new elements',
  Reboot:        'Reboot — same idea, completely fresh start',
  ZoomIn:        'Zoom In — deep focus on one inner element',
  ZoomOut:       'Zoom Out — bigger picture perspective',
  AudienceAlter: 'Audience Alter — same content, different target',
  Commentary:    'Commentary — your take on existing content',
}

export const DMG_TYPE_CONTENT: Record<DamageType, string> = {
  standard:  'Universal — no particular style requirement',
  strike:    'Impact — makes people stop and think',
  slash:     'Sharp opinion — direct, cutting take',
  pierce:    'Research — gets through defences with evidence',
  lightning: 'Viral / Fast — rides trends or urgency',
  fire:      'Urgency — hot topic, time-sensitive',
  magic:     'Educational — teaches or explains something new',
  holy:      'Evergreen — timeless, stays relevant long-term',
  occult:    'Niche — serves a specific, devoted audience',
  grafting:  'Hybrid — combines formats or disciplines',
  poison:    'Slow-burn — builds over time, lingers in mind',
}

export const STATUS_CONTENT: Record<StatusType, string> = {
  bleed:        'Viral / Brainrot — hooks that spread uncontrollably',
  scarlet_rot:  'Polarisation — tribal, divides the audience',
  frostbite:    'Envy / Hate-watching — makes people strangely obsessed',
  madness:      'Controversy / Hot Take — strong reaction, risks backlash',
  sleep:        'Comfort Content — relaxing, safe, parasocial warmth',
  death_blight: 'Drama / Cancel Culture — explosive, ends things',
  glintstone:   'Education — genuine new knowledge delivered',
  frenzy_flame: 'Humour / Satire / Roast — laughter as weapon',
  devotion:     'Parasocial Bond — audience feels personally connected',
  yearning:     'FOMO / Desire — makes people feel they must not miss this',
  dread:        'Anxiety / Doomscrolling — taps into fear and uncertainty',
  murmur:       'Rumour / Intrigue — whispers that spread and multiply',
  grace:        'Wholesome / Inspiration — lifts people up',
}
