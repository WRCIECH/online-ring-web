// Geographic seed positions for the 50 locations in a 1100×720 SVG coordinate space.
// Keys are "loc_0"…"loc_49", matching LOCATION_DEFINITIONS order in locations.ts.
// Used for Voronoi tessellation in the location select map.
export const LOCATION_SEEDS: Record<string, { x: number; y: number }> = {
  // ── Starting region (loc_0–8) ─────────────────────────────────────────────
  'loc_0':  { x: 240, y: 545 },
  'loc_1':  { x: 155, y: 498 },
  'loc_2':  { x: 330, y: 535 },
  'loc_3':  { x: 415, y: 515 },
  'loc_4':  { x: 435, y: 572 },
  'loc_5':  { x: 205, y: 630 },
  'loc_6':  { x: 168, y: 692 },
  'loc_7':  { x: 222, y: 462 },
  'loc_8':  { x: 208, y: 412 },

  // ── Liurnia chain (loc_9–15) ──────────────────────────────────────────────
  'loc_9':  { x: 188, y: 365 },
  'loc_10': { x: 162, y: 318 },
  'loc_11': { x: 128, y: 272 },
  'loc_12': { x: 100, y: 232 },
  'loc_13': { x: 80,  y: 190 },
  'loc_14': { x: 198, y: 288 },
  'loc_15': { x: 252, y: 265 },

  // ── Caelid cluster (loc_16–21) ────────────────────────────────────────────
  'loc_16': { x: 505, y: 505 },
  'loc_17': { x: 590, y: 478 },
  'loc_18': { x: 615, y: 432 },
  'loc_19': { x: 600, y: 550 },
  'loc_20': { x: 568, y: 595 },
  'loc_21': { x: 552, y: 648 },

  // ── Altus / Mt. Gelmir (loc_22–26) ───────────────────────────────────────
  'loc_22': { x: 308, y: 232 },
  'loc_23': { x: 362, y: 210 },
  'loc_24': { x: 395, y: 228 },
  'loc_25': { x: 232, y: 215 },
  'loc_26': { x: 178, y: 195 },

  // ── Leyndell region (loc_27–31) ───────────────────────────────────────────
  'loc_27': { x: 428, y: 278 },
  'loc_28': { x: 450, y: 248 },
  'loc_29': { x: 455, y: 215 },
  'loc_30': { x: 442, y: 322 },
  'loc_31': { x: 418, y: 365 },

  // ── Mountaintops (loc_32–36) ──────────────────────────────────────────────
  'loc_32': { x: 508, y: 188 },
  'loc_33': { x: 558, y: 162 },
  'loc_34': { x: 638, y: 142 },
  'loc_35': { x: 700, y: 120 },
  'loc_36': { x: 745, y: 100 },

  // ── Consecrated Snowfield / Haligtree (loc_37–41) ────────────────────────
  'loc_37': { x: 472, y: 140 },
  'loc_38': { x: 408, y: 118 },
  'loc_39': { x: 445, y: 102 },
  'loc_40': { x: 368, y: 90  },
  'loc_41': { x: 328, y: 74  },

  // ── Farum Azula (loc_42–45) ───────────────────────────────────────────────
  'loc_42': { x: 838, y: 238 },
  'loc_43': { x: 882, y: 198 },
  'loc_44': { x: 935, y: 218 },
  'loc_45': { x: 872, y: 158 },

  // ── Final chain (loc_46–49) ───────────────────────────────────────────────
  'loc_46': { x: 990, y: 290 },
  'loc_47': { x: 1018, y: 262 },
  'loc_48': { x: 1040, y: 238 },
  'loc_49': { x: 1058, y: 214 },
}
