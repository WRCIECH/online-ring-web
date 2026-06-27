// Geographic seed positions for the 50 locations in a 1100×720 SVG coordinate space.
// Layout follows Elden Ring's actual world map (Limgrave bottom-left → Mountaintops top-center
// → Farum Azula far-right). Used for Voronoi tessellation in the location select map.
export const LOCATION_SEEDS: Record<string, { x: number; y: number }> = {
  // ── Limgrave / starting area ─────────────────────────────────────────────
  'First Steps & Center':            { x: 240, y: 545 },
  'Stormfoot Catacombs':             { x: 155, y: 498 },
  'Agheel Lake':                     { x: 330, y: 535 },
  'Mistwood':                        { x: 415, y: 515 },
  'Siofra River Bank':               { x: 435, y: 572 },
  'Weeping Peninsula Coast':         { x: 205, y: 630 },
  'Castle Morne':                    { x: 168, y: 692 },
  'Stormhill Approach':              { x: 222, y: 462 },
  'Stormveil Castle':                { x: 208, y: 412 },

  // ── Liurnia ───────────────────────────────────────────────────────────────
  'Liurnia South Highway':           { x: 188, y: 365 },
  'Academy Gate Town':               { x: 162, y: 318 },
  'Raya Lucaria Academy':            { x: 128, y: 272 },
  'Caria Manor':                     { x: 100, y: 232 },
  'Three Sisters':                   { x: 80,  y: 190 },
  'Ainsel River Well':               { x: 198, y: 288 },

  // ── Altus Plateau / Mt. Gelmir ────────────────────────────────────────────
  'Ruin-Strewn Precipice':           { x: 252, y: 265 },
  'Altus Highway Junction':          { x: 308, y: 232 },
  'Shaded Castle':                   { x: 362, y: 210 },
  'Windmill Village':                { x: 395, y: 228 },
  'Mt. Gelmir Slopes':               { x: 232, y: 215 },
  'Volcano Manor':                   { x: 178, y: 195 },

  // ── Caelid ────────────────────────────────────────────────────────────────
  'Caelid Highway West':             { x: 505, y: 505 },
  "Sellia, Town of Sorcery":         { x: 590, y: 478 },
  "Greyoll's Dragonbarrow":          { x: 615, y: 432 },
  'Redmane Castle':                  { x: 600, y: 550 },
  'Nokron, Eternal City':            { x: 568, y: 595 },
  "Night's Sacred Ground":           { x: 552, y: 648 },

  // ── Leyndell ─────────────────────────────────────────────────────────────
  'Leyndell Outskirts':              { x: 428, y: 278 },
  'Leyndell Royal Capital':          { x: 450, y: 248 },
  'Elden Throne':                    { x: 455, y: 215 },
  'Subterranean Shunning-Grounds':   { x: 442, y: 322 },
  'Deeproot Depths':                 { x: 418, y: 365 },

  // ── Mountaintops ─────────────────────────────────────────────────────────
  'Forbidden Lands':                 { x: 508, y: 188 },
  'Mountaintops West':               { x: 558, y: 162 },
  'Mountaintops East':               { x: 638, y: 142 },
  'Flame Peak':                      { x: 700, y: 120 },
  'Forge of the Giants':             { x: 745, y: 100 },

  // ── Consecrated Snowfield / Haligtree ────────────────────────────────────
  'Consecrated Snowfield':           { x: 472, y: 140 },
  'Ordina, Liturgical Town':         { x: 408, y: 118 },
  'Mohgwyn Palace':                  { x: 445, y: 102 },
  "Miquella's Haligtree":            { x: 368, y: 90  },
  'Elphael, Brace of the Haligtree': { x: 328, y: 74  },

  // ── Farum Azula ───────────────────────────────────────────────────────────
  'Farum Azula Arrival':             { x: 838, y: 238 },
  'Farum Azula Center':              { x: 882, y: 198 },
  "Dragonlord's Seat":               { x: 935, y: 218 },
  'Farum Azula Peak':                { x: 872, y: 158 },

  // ── Endgame chain (post-Farum Azula — far right of map) ──────────────────
  'Leyndell, Capital of Ash':        { x: 990, y: 290 },
  'Elden Throne In Ruins':           { x: 1018, y: 262 },
  "Radagon's Chamber":               { x: 1040, y: 238 },
  'Elden Beast Arena':               { x: 1058, y: 214 },
}
