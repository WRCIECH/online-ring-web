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

A dark-fantasy writing-habit RPG. The player runs 48-hour "runs", travels a 22-node spiral map, and fights enemies by completing real writing tasks (timed prompts). Weapons are writing tools; movesets are writing techniques. The combat loop is: player picks a writing task → completes it in a timer → damage is dealt → enemy attacks → player defends.

## Architecture

### Routing (`src/App.tsx`)
Five screens in a linear flow:
```
/ (TitleScreen) → /weapons (WeaponSelectScreen) → /map (RunMapScreen)
  → /combat (CombatScreen) → /run-complete (RunCompleteScreen)
```
All navigation is client-side via `react-router-dom`. Guards redirect if preconditions aren't met (e.g., `/combat` redirects to `/map` if `pending_encounter` is null).

### State (`src/store/gameStore.ts`)
Single Zustand store (`useGameStore`) holds all persistent `GameState` (see `src/types/game.ts`). Every mutation calls `get().save()` which writes to `localStorage`. The store is the only place that talks to `src/engine/save.ts`.

Key selectors exported from the store:
- `selectRunRemainingSeconds` — computes wall-clock time left in the 48h run
- `selectIsRunExpired` — true when timer hits zero
- `selectCurrentLocation` / `selectEnemyData` — current map node

### Combat engine (`src/engine/combat.ts`)
Pure reducer (`combatReducer`) + `initCombatState`. Combat state lives entirely in a local `useReducer` inside `CombatScreen` — it is **not** in the Zustand store. Only the final result (HP, estus, weapon XP) is synced back to the store on victory/defeat via `store.syncCombatResult` and `store.flushWeaponXp`.

Combat phases: `INIT → PLAYER_ATTACK → STEP_TIMER → ENEMY_ATTACK → ENEMY_STAGGERED → VICTORY | DEFEAT`

Drop rolls happen **once** when phase reaches `VICTORY` (inside a `useEffect` in `CombatScreen`), stored in local `lootItems` state, and applied to the store only when the player clicks Continue.

### Data layer (`src/data/`)
Static records — no API calls, no async:
- `weapons.ts` — `WEAPONS: Record<string, Weapon>`, `calcStepDamage`, `getWeaponMovesets`
- `movesets.ts` — `MOVES: Record<string, Moveset>` (14 movesets; defense moves have `types: ['defense', ...]`)
- `enemies.ts` — `ENEMIES: Record<string, Enemy>` (7 enemies)
- `enemyMovesets.ts` — `ENEMY_MOVES: Record<string, EnemyMove>`

Adding a new moveset: add an entry to `MOVES`, reference its `id` in a weapon's `constant_movesets` or add it as a drop from an enemy.

### Map (`src/screens/RunMapScreen.tsx`)
The spiral map is drawn on a `<canvas>` (1200×800 coordinate space, CSS-scaled to maintain 3:2 aspect ratio via `min(100vw, 100vh * 1.5)`). Node positions are computed geometrically with polar coordinates (center `CX=600, CY=390`, base radius `R0=45`, step `DR=16`, angle step `DTHETA=1.082`). The run timer ticks via `setInterval` in a `useEffect`.

### Sound (`src/engine/sound.ts`)
Web Audio API with procedurally generated buffers — no audio files. Sounds are synthesized on first user click (`initSound`) and cached. Available keys: `HIT BLOCK ROLL PARRY STAGGER VICTORY DEFEAT BUTTON_CLICK LEVEL_UP SITE_OF_GRACE RUNE_GAIN LOOT_DROP TIMER_DONE`.

### Styling
CSS Modules (`.module.css`) per component. Global tokens in `src/styles/theme.css` (imported by `globals.css`). Canvas drawing uses hardcoded colors directly; UI components use CSS variables. The background is `--color-bg: #161228`.

### Save system
`localStorage` only. Two keys: `online_ring_save` (current) and `online_ring_save_backup` (previous, rotated on each save). Notes are stored separately under `notes_draft` etc. No server, no auth.
