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
  loc('1. First Steps & Center', 'Tree Sentinel', [], 'small'),
  loc('2. Stormfoot Catacombs (Opcjonalna)', 'Erdtree Burial Watchdog', ['1. First Steps & Center'], 'small-medium'),
  loc('3. Agheel Lake', 'Flying Dragon Agheel', ['1. First Steps & Center'], 'medium'),
  loc('4. Mistwood (Opcjonalna)', 'Runebear', ['3. Agheel Lake'], 'medium'),
  loc('5. Siofra River Bank (Opcjonalna)', 'Ancestor Spirit', ['4. Mistwood (Opcjonalna)'], 'medium'),
  loc('6. Weeping Peninsula Coast', 'Scalaly Misbegotten', ['3. Agheel Lake'], 'medium'),
  loc('7. Castle Morne', 'Leonine Misbegotten', ['6. Weeping Peninsula Coast'], 'medium'),
  loc('8. Stormhill Approach', 'Margit, the Fell Omen', ['1. First Steps & Center'], 'small-medium'),
  loc('9. Stormveil Castle', 'Godrick the Grafted', ['8. Stormhill Approach'], 'large'),
  loc('10. Liurnia South Highway', 'Adan, Thief of Fire', ['9. Stormveil Castle'], 'medium'),
  loc('11. Academy Gate Town', 'Glintstone Dragon Smarag', ['10. Liurnia South Highway'], 'large'),
  loc('12. Raya Lucaria Academy', 'Rennala, Queen of the Full Moon', ['11. Academy Gate Town'], 'large'),
  loc('13. Caria Manor (Opcjonalna)', 'Royal Knight Loretta', ['10. Liurnia South Highway'], 'medium'),
  loc('14. Three Sisters (Opcjonalna)', 'Glintstone Dragon Adula', ['13. Caria Manor (Opcjonalna)'], 'small-medium'),
  loc('15. Ainsel River Well (Opcjonalna)', 'Dragonkin Soldier of Nokstella', ['11. Academy Gate Town'], 'medium'),
  loc('16. Ruin-Strewn Precipice', 'Magma Wyrm Makar', ['11. Academy Gate Town'], 'medium'),
  loc('17. Caelid Highway West', 'Decaying Ekzykes', ['3. Agheel Lake'], 'medium'),
  loc('18. Sellia, Town of Sorcery', 'Nox Swordstress & Priest', ['17. Caelid Highway West'], 'small-medium'),
  loc('19. Greyoll\'s Dragonbarrow', 'Black Blade Kindred', ['17. Caelid Highway West'], 'large'),
  loc('20. Redmane Castle', 'Starscourge Radahn', ['17. Caelid Highway West'], 'medium'),
  loc('21. Nokron, Eternal City (Opcjonalna)', 'Mimic Tear', ['20. Redmane Castle'], 'large'),
  loc('22. Night\'s Sacred Ground (Opcjonalna)', "Night's Cavalry Duo", ['21. Nokron, Eternal City (Opcjonalna)'], 'small'),
  loc('23. Altus Highway Junction', 'Ancient Dragon Lansseax', ['16. Ruin-Strewn Precipice'], 'medium'),
  loc('24. Shaded Castle (Opcjonalna)', 'Elemer of the Briar', ['23. Altus Highway Junction'], 'medium'),
  loc('25. Windmill Village', 'Godskin Apostle', ['23. Altus Highway Junction'], 'small-medium'),
  loc('26. Mt. Gelmir Slopes', 'Full-Grown Fallingstar Beast', ['23. Altus Highway Junction'], 'large'),
  loc('27. Volcano Manor', 'Rykard, Lord of Blasphemy', ['26. Mt. Gelmir Slopes'], 'large'),
  loc('28. Leyndell Outskirts', 'Draconic Tree Sentinel', ['12. Raya Lucaria Academy', '20. Redmane Castle'], 'medium'),
  loc('29. Leyndell Royal Capital', 'Godfrey, First Elden Lord (Golden Shade)', ['28. Leyndell Outskirts'], 'very large'),
  loc('30. Elden Throne', 'Morgott, the Omen King', ['29. Leyndell Royal Capital'], 'small'),
  loc('31. Subterranean Shunning-Grounds', 'Mohg, the Omen', ['29. Leyndell Royal Capital'], 'large'),
  loc('32. Deeproot Depths (Opcjonalna)', "Fia's Champions", ['31. Subterranean Shunning-Grounds'], 'large'),
  loc('33. Forbidden Lands', "Night's Cavalry (Forbidden)", ['30. Elden Throne'], 'small-medium'),
  loc('34. Mountaintops West', 'Commander Niall', ['33. Forbidden Lands'], 'large'),
  loc('35. Mountaintops East', 'Borealis the Freezing Fog', ['34. Mountaintops West'], 'medium'),
  loc('36. Flame Peak', 'Fire Giant', ['35. Mountaintops East'], 'large'),
  loc('37. Forge of the Giants', 'Fire Prelate Guardian', ['36. Flame Peak'], 'small'),
  loc('38. Consecrated Snowfield (Opcjonalna)', 'Astel, Stars of Darkness', ['34. Mountaintops West'], 'large'),
  loc('39. Ordina, Liturgical Town (Opcj.)', 'Black Knife Assassin Leader', ['38. Consecrated Snowfield (Opcjonalna)'], 'small'),
  loc('40. Mohgwyn Palace (Opcjonalna)', 'Mohg, Lord of Blood', ['38. Consecrated Snowfield (Opcjonalna)'], 'medium'),
  loc('41. Miquella\'s Haligtree (Opcjonalna)', 'Loretta, Knight of the Haligtree', ['39. Ordina, Liturgical Town (Opcj.)'], 'large'),
  loc('42. Elphael, Brace of the Haligtree (Opcj)', 'Malenia, Blade of Miquella', ['41. Miquella\'s Haligtree (Opcjonalna)'], 'very large'),
  loc('43. Farum Azula Arrival', 'Beast Clergyman', ['37. Forge of the Giants'], 'medium'),
  loc('44. Farum Azula Center', 'Godskin Duo', ['43. Farum Azula Arrival'], 'large'),
  loc('45. Dragonlord\'s Seat (Opcjonalna)', 'Dragonlord Placidusax', ['44. Farum Azula Center'], 'medium'),
  loc('46. Farum Azula Peak', 'Maliketh, the Black Blade', ['44. Farum Azula Center'], 'medium'),
  loc('47. Leyndell, Capital of Ash', 'Sir Gideon Ofnir, the All-Knowing', ['46. Farum Azula Peak'], 'medium'),
  loc('48. Elden Throne In Ruins', 'Godfrey, First Elden Lord', ['47. Leyndell, Capital of Ash'], 'small'),
  loc('49. Radagon\'s Chamber', 'Radagon of the Golden Order', ['48. Elden Throne In Ruins'], 'small'),
  loc('50. Elden Beast Arena', 'Elden Beast', ['49. Radagon\'s Chamber'], 'small'),
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
