export type LocationSize = 'small' | 'small-medium' | 'medium' | 'large' | 'very large'

export interface LocationDef {
  id: string
  boss: string
  requires: string[]
  size: LocationSize
  numSublocations: number
  runDuration: number   // seconds = (24 + numSublocations) * 3600
}

const S: Record<LocationSize, number> = {
  'small': 10, 'small-medium': 15, 'medium': 20, 'large': 25, 'very large': 30,
}
function dur(size: LocationSize) { return (24 + S[size]) * 3600 }
function loc(id: string, boss: string, requires: string[], size: LocationSize): LocationDef {
  return { id, boss, requires, size, numSublocations: S[size], runDuration: dur(size) }
}

export const LOCATION_DEFINITIONS: LocationDef[] = [
  loc('First Steps & Center',          'Tree Sentinel',                          [],                                           'small'),
  loc('Stormfoot Catacombs',           'Erdtree Burial Watchdog',                ['First Steps & Center'],                     'small-medium'),
  loc('Agheel Lake',                   'Flying Dragon Agheel',                   ['First Steps & Center'],                     'medium'),
  loc('Mistwood',                      'Runebear',                               ['Agheel Lake'],                              'medium'),
  loc('Siofra River Bank',             'Ancestor Spirit',                        ['Mistwood'],                                 'medium'),
  loc('Weeping Peninsula Coast',       'Scalaly Misbegotten',                    ['Agheel Lake'],                              'medium'),
  loc('Castle Morne',                  'Leonine Misbegotten',                    ['Weeping Peninsula Coast'],                  'medium'),
  loc('Stormhill Approach',            'Margit, the Fell Omen',                  ['First Steps & Center'],                     'small-medium'),
  loc('Stormveil Castle',              'Godrick the Grafted',                    ['Stormhill Approach'],                       'large'),
  loc('Liurnia South Highway',         'Adan, Thief of Fire',                    ['Stormveil Castle'],                         'medium'),
  loc('Academy Gate Town',             'Glintstone Dragon Smarag',               ['Liurnia South Highway'],                    'large'),
  loc('Raya Lucaria Academy',          'Rennala, Queen of the Full Moon',        ['Academy Gate Town'],                        'large'),
  loc('Caria Manor',                   'Royal Knight Loretta',                   ['Liurnia South Highway'],                    'medium'),
  loc('Three Sisters',                 'Glintstone Dragon Adula',                ['Caria Manor'],                              'small-medium'),
  loc('Ainsel River Well',             'Dragonkin Soldier of Nokstella',         ['Academy Gate Town'],                        'medium'),
  loc('Ruin-Strewn Precipice',         'Magma Wyrm Makar',                       ['Academy Gate Town'],                        'medium'),
  loc('Caelid Highway West',           'Decaying Ekzykes',                       ['Agheel Lake'],                              'medium'),
  loc('Sellia, Town of Sorcery',       'Nox Swordstress & Priest',               ['Caelid Highway West'],                      'small-medium'),
  loc("Greyoll's Dragonbarrow",        'Black Blade Kindred',                    ['Caelid Highway West'],                      'large'),
  loc('Redmane Castle',                'Starscourge Radahn',                     ['Caelid Highway West'],                      'medium'),
  loc('Nokron, Eternal City',          'Mimic Tear',                             ['Redmane Castle'],                           'large'),
  loc("Night's Sacred Ground",         "Night's Cavalry Duo",                    ['Nokron, Eternal City'],                     'small'),
  loc('Altus Highway Junction',        'Ancient Dragon Lansseax',                ['Ruin-Strewn Precipice'],                    'medium'),
  loc('Shaded Castle',                 'Elemer of the Briar',                    ['Altus Highway Junction'],                   'medium'),
  loc('Windmill Village',              'Godskin Apostle',                        ['Altus Highway Junction'],                   'small-medium'),
  loc('Mt. Gelmir Slopes',             'Full-Grown Fallingstar Beast',           ['Altus Highway Junction'],                   'large'),
  loc('Volcano Manor',                 'Rykard, Lord of Blasphemy',              ['Mt. Gelmir Slopes'],                        'large'),
  loc('Leyndell Outskirts',            'Draconic Tree Sentinel',                 ['Raya Lucaria Academy', 'Redmane Castle'],   'medium'),
  loc('Leyndell Royal Capital',        'Godfrey, First Elden Lord (Golden Shade)',['Leyndell Outskirts'],                      'very large'),
  loc('Elden Throne',                  'Morgott, the Omen King',                 ['Leyndell Royal Capital'],                   'small'),
  loc('Subterranean Shunning-Grounds', 'Mohg, the Omen',                         ['Leyndell Royal Capital'],                   'large'),
  loc('Deeproot Depths',               "Fia's Champions",                        ['Subterranean Shunning-Grounds'],            'large'),
  loc('Forbidden Lands',               "Night's Cavalry (Forbidden)",            ['Elden Throne'],                             'small-medium'),
  loc('Mountaintops West',             'Commander Niall',                        ['Forbidden Lands'],                          'large'),
  loc('Mountaintops East',             'Borealis the Freezing Fog',              ['Mountaintops West'],                        'medium'),
  loc('Flame Peak',                    'Fire Giant',                             ['Mountaintops East'],                        'large'),
  loc('Forge of the Giants',           'Fire Prelate Guardian',                  ['Flame Peak'],                               'small'),
  loc('Consecrated Snowfield',         'Astel, Stars of Darkness',               ['Mountaintops West'],                        'large'),
  loc('Ordina, Liturgical Town',       'Black Knife Assassin Leader',            ['Consecrated Snowfield'],                    'small'),
  loc('Mohgwyn Palace',                'Mohg, Lord of Blood',                    ['Consecrated Snowfield'],                    'medium'),
  loc("Miquella's Haligtree",          'Loretta, Knight of the Haligtree',       ['Ordina, Liturgical Town'],                  'large'),
  loc('Elphael, Brace of the Haligtree','Malenia, Blade of Miquella',            ["Miquella's Haligtree"],                     'very large'),
  loc('Farum Azula Arrival',           'Beast Clergyman',                        ['Forge of the Giants'],                      'medium'),
  loc('Farum Azula Center',            'Godskin Duo',                            ['Farum Azula Arrival'],                      'large'),
  loc("Dragonlord's Seat",             'Dragonlord Placidusax',                  ['Farum Azula Center'],                       'medium'),
  loc('Farum Azula Peak',              'Maliketh, the Black Blade',              ['Farum Azula Center'],                       'medium'),
  loc('Leyndell, Capital of Ash',      'Sir Gideon Ofnir, the All-Knowing',      ['Farum Azula Peak'],                         'medium'),
  loc('Elden Throne In Ruins',         'Godfrey, First Elden Lord',              ['Leyndell, Capital of Ash'],                 'small'),
  loc("Radagon's Chamber",             'Radagon of the Golden Order',            ['Elden Throne In Ruins'],                    'small'),
  loc('Elden Beast Arena',             'Elden Beast',                            ["Radagon's Chamber"],                        'small'),
]

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
