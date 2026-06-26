# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (HMR)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # Preview production build
npx tsc --noEmit   # Type-check without emitting (use before committing)
```

No test suite exists. Verify changes by running `npm run dev` and exercising the relevant screens in the browser.

## What this app is

A dark-fantasy writing-habit RPG. The player runs 48-hour "runs", travels a spiral map, and fights enemies by completing real writing tasks (timed prompts). Weapons are writing tools; movesets are writing techniques. The combat loop is: player picks a writing task → completes it in a timer → damage is dealt → enemy attacks → player defends.

## Architecture

### Routing (`src/App.tsx`)
Seven screens in a linear flow:
```
/ (TitleScreen)
  → /start-class (ClassSelectScreen)
  → /locations (LocationSelectScreen)
  → /weapons (WeaponSelectScreen)
  → /map (RunMapScreen)
  → /combat (CombatScreen)
  → /run-complete (RunCompleteScreen)
```
All navigation is client-side via `react-router-dom`. Guards redirect if preconditions aren't met (e.g., `/combat` redirects to `/map` if `pending_encounter` is null).

### State (`src/store/gameStore.ts`)
Single Zustand store (`useGameStore`) holds all persistent `GameState` (see `src/types/game.ts`). Every mutation calls `get().save()` which writes to `localStorage`. The store is the only place that talks to `src/engine/save.ts`.

Key selectors exported from the store:
- `selectRunRemainingSeconds` — computes wall-clock time left in the run
- `selectIsRunExpired` — true when timer hits zero
- `selectCurrentLocation` / `selectEnemyData` — current map node

Key store actions:
- `spendRunesOnStat(stat)` — levels a player stat; cost is `statLevelCost(total_levels_spent)` (exponential)
- `syncCombatResult(hp, estus, fp, stamina)` — called on combat end to write results back

### Combat engine (`src/engine/combat.ts`)
Pure reducer (`combatReducer`) + `initCombatState`. Combat state lives entirely in a local `useReducer` inside `CombatScreen` — it is **not** in the Zustand store. Only the final result (HP, estus, FP, stamina) is synced back on victory/defeat.

Combat phases: `PLAYER_TURN → STEP_TIMER → PLAYER_TURN ... → VICTORY | DEFEAT | FLED`

Drop rolls happen **once** when phase reaches `VICTORY` (inside a `useEffect` in `CombatScreen`), stored in local `lootItems` state, and applied to the store only when the player clicks Continue.

**Boss-rush bonus**: a damage multiplier keyed to the gap since `GameState.last_boss_kill_at`, using the `FLOW_GAP_HOT/WARM/COLD_MINS` thresholds and `FLOW_MULT_HOT/WARM/COLD/DEAD` tiers in `constants.ts` (1.5× under 15 min since your last boss kill, down to 0× after 4 hours), scaled per weapon class by `WeaponClassDef.boss_rush_coeff`. Computed once at fight-init in `CombatScreen.tsx`, only for boss encounters.

**Runes only come from defeating an enemy** — `CombatState.runesEarned` is set once, to `Enemy.rune_reward`, at the `VICTORY` transition (no location-difficulty scaling). Completing a tile never grants runes directly; instead every per-attack bonus/penalty that used to scale the (now-removed) per-tile reward — weapon rarity/affixes/stat-scaling (`calcWeaponScaledDamage` in `weapons.ts`, formerly `calcTileReward`), the per-weapon Heavy bonus, the consistency streak, the per-weapon content-slot bonus, the scaling repeat penalty, the abandon penalty, and each mob curse's penalty — was folded into the **damage** formula instead (`calcTileDamage`/`previewMove`/`TIMER_RESULT` in `combat.ts`). Mob curses now only have a single `damagePct` (the old separate `rewardPct` was identical to `damagePct` for every curse, so it was dropped rather than doubling the penalty).

### Player stats and leveling
Stats: `VIG END MND STR DEX INT FAI ARC`. Max HP = `VIG × 10`, max stamina = `END × 5`, max FP = `MND × 3`.

FP (Focus Points) is spent by skill movesets (generated non-constant moves). Constant movesets cost only stamina. `fp_cost` is stored on the moveset.

Leveling costs runes; cost increases with `total_levels_spent`. Six starting classes (`src/data/classes.ts`): Chronicler, Sprinter, Architect, Researcher, Storyteller, Orator — each sets starting stats and weapon class.

### Weapon generation (`src/data/generators/`)
Weapons are procedurally generated at runtime — no static weapon list for loot drops.

- `rollWeapon(weaponClass?, minRarity?)` → `WeaponInstance` with rarity, affixes, poise_weight, base_damage_mult
- 27 weapon classes in `weaponClasses.ts` — each has `base_damage_mult`, `poise_weight`, `content_slots`, `heavy_bonus_mult`, `boss_rush_coeff`, `time_mod`, `stamina_mod`, stat scaling, plus the per-class draw pools used by `weaponPatterns.ts` (`supported_products`, `styles`, `emotions`, `allowed_transformations`)

### Data layer (`src/data/`)
Static records — no API calls, no async:
- `weapons.ts` — `WEAPONS: Record<string, Weapon>` (static + runtime-registered), `calcStepDamage`, `getWeaponMovesets`
- `movesets.ts` — `MOVES: Record<string, Moveset>` (13 static movesets; defense moves have `types: ['defense', ...]`; runtime-generated movesets are registered here via `registerMoveset`)
- `enemies.ts` — `ENEMIES: Record<string, Enemy>`
- `enemyMovesets.ts` — `ENEMY_MOVES: Record<string, EnemyMove>` (each move has `dodge_task` and `publish_task`)
- `locations.ts` — 50 `LocationDef` entries; `generateLocationSequence()` builds a run's node list with T1/T2/T3 mobs + boss distribution
- `classes.ts` — 6 player class definitions

Adding a new static moveset: add an entry to `MOVES` in `movesets.ts`, reference its `id` in a weapon's `constant_movesets` or as an enemy drop.

### Location and run structure
50 locations of 5 sizes (small → very large), mapping to 10–30 map nodes and 34–58h run durations. `generateLocationSequence()` in `locations.ts` builds the combat encounter list. Locations can have prerequisites (`requires` field).

### Map (`src/screens/RunMapScreen.tsx`)
Drawn on a `<canvas>` (1200×800 coordinate space, CSS-scaled to 3:2 aspect ratio). Node positions use polar coordinates (center `CX=600, CY=390`, base radius `R0=45`, step `DR=16`, angle step `DTHETA=1.082`). The run timer ticks via `setInterval` in a `useEffect`.

### Overlays
- `EquipOverlay` (`src/components/overlays/EquipOverlay.tsx`) — modal triggered during combat to assign movesets to weapon skill slots. Shows weapon cards, moveset costs (stamina + FP), and a MovesetPicker for empty slots.

### Sound (`src/engine/sound.ts`)
Web Audio API with procedurally generated buffers — no audio files. Sounds synthesized on first user click (`initSound`) and cached. Available keys: `HIT BLOCK ROLL PARRY STAGGER VICTORY DEFEAT BUTTON_CLICK LEVEL_UP SITE_OF_Hope RUNE_GAIN LOOT_DROP TIMER_DONE`.

### Styling
CSS Modules (`.module.css`) per component. Global tokens in `src/styles/theme.css` (imported by `globals.css`). Canvas drawing uses hardcoded colors directly; UI components use CSS variables. The background is `--color-bg: #161228`.

### Save system
`localStorage` only. Two keys: `online_ring_save` (current) and `online_ring_save_backup` (previous, rotated on each save). Notes stored separately under `notes_draft` etc. No server, no auth.
