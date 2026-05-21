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
- `applyWeaponHeat(heat)` — converts combat heat accumulation to cooldown runs
- `syncCombatResult(hp, estus, fp)` / `flushWeaponXp()` — called on combat end to write results back

### Combat engine (`src/engine/combat.ts`)
Pure reducer (`combatReducer`) + `initCombatState`. Combat state lives entirely in a local `useReducer` inside `CombatScreen` — it is **not** in the Zustand store. Only the final result (HP, estus, FP, weapon heat) is synced back on victory/defeat.

Combat phases: `PLAYER_ATTACK → STEP_TIMER → ENEMY_ATTACK → ENEMY_STAGGERED → VICTORY | DEFEAT`

Drop rolls happen **once** when phase reaches `VICTORY` (inside a `useEffect` in `CombatScreen`), stored in local `lootItems` state, and applied to the store only when the player clicks Continue.

**Flow-state multiplier** (`gapMultiplier` in combat.ts): damage scales by time since last moveset completion — 1.5× under 15 min, 1.0× at 15–60 min, 0.5× at 60–240 min, 0× after 4 hours.

**Enemy roll movesets**: `ENEMY_ROLL_CONFIG` maps each enemy type to a weapon class + rarity. At init, `rollMoveset()` generates a multi-step dodge challenge; steps chain across successive rolls in the same combat.

### Player stats and leveling
Stats: `VIG END MND STR DEX INT FAI ARC`. Max HP = `VIG × 10`, max stamina = `END × 5`, max FP = `MND × 3`.

FP (Focus Points) is spent by skill movesets (generated non-constant moves). Constant movesets cost only stamina. `fp_cost` is stored on the moveset.

Leveling costs runes; cost increases with `total_levels_spent`. Six starting classes (`src/data/classes.ts`): Chronicler, Sprinter, Architect, Researcher, Storyteller, Orator — each sets starting stats and weapon class.

### Weapon generation (`src/data/generators/`)
Weapons are procedurally generated at runtime — no static weapon list for loot drops.

- `rollWeapon(weaponClass?, minRarity?)` → `WeaponInstance` with rarity, affixes, heat_threshold, poise_weight, skill_slots, and two constant movesets (Light + Heavy variant)
- `rollMoveset(weaponClass, rarity, variant?)` → `GeneratedMoveset` registered into `MOVES` at runtime
- `rollBlockMoveset(weaponClass)` → defense block moveset (registered into `MOVES`)
- Movesets are built from atomic steps via `atomicMove.ts`: 9 archetypes (long_form, micro, commentary, research, compression, remix, storytelling, hot_take, async, editing) mapped to writing task prompts
- 26 weapon classes in `weaponClasses.ts` — each has `heat_threshold`, `base_damage_mult`, `poise_weight`, `preferred_archetypes`, stat scaling

### Weapon heat and cooldown
Each weapon has a `heat_threshold`. Heat accumulates during combat (`weaponHeatAccumulated` in CombatState). On combat end, `applyWeaponHeat` converts it to `weapon_cooldown[id]` (runs remaining). A weapon on cooldown cannot be selected for the next run — see `WeaponSelectScreen` which filters it from the default selection.

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
Web Audio API with procedurally generated buffers — no audio files. Sounds synthesized on first user click (`initSound`) and cached. Available keys: `HIT BLOCK ROLL PARRY STAGGER VICTORY DEFEAT BUTTON_CLICK LEVEL_UP SITE_OF_GRACE RUNE_GAIN LOOT_DROP TIMER_DONE`.

### Styling
CSS Modules (`.module.css`) per component. Global tokens in `src/styles/theme.css` (imported by `globals.css`). Canvas drawing uses hardcoded colors directly; UI components use CSS variables. The background is `--color-bg: #161228`.

### Save system
`localStorage` only. Two keys: `online_ring_save` (current) and `online_ring_save_backup` (previous, rotated on each save). Notes stored separately under `notes_draft` etc. No server, no auth.
