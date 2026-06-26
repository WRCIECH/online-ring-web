# Online Ring — Todo

Tracked items from `fight_spec.md` review + observations from the codebase.
Not a priority order — use judgment based on what makes the game feel alive next.

---

## Combat mechanics

### Weapon heat indicator during combat
Heat accumulates each time a moveset step completes (`weaponHeatAccumulated` in `CombatState`), and if it exceeds `heat_threshold` at end-of-combat the weapon goes on cooldown. But the player has **zero visibility** during a fight — no bar, no counter, nothing. Overheat punishment currently feels arbitrary. Add a small heat bar or icon counter alongside the weapon name in the radial menu or QuickBar.

### Focus Flask urgently needed now that FP drain is live
FP drain is implemented; players run dry with no way to restore. A Focus Flask consumable (analogous to Estus but for FP) is the critical missing piece. See Consumables section for the full list, but this one is blocking a playable FP economy.

### Jump moveset attack during stagger window
The spec calls for a bonus Jump attack (×2.0 poise) only available after a stagger break.
The `ENEMY_STAGGERED` phase already exists — add a prompt to use a Jump moveset during that window before it auto-transitions back to `PLAYER_ATTACK`.

### Boss second phase
Spec §8: at 50% HP the boss changes its attack pattern and adds 2–3 new attacks.
Currently bosses have a single moveset pool throughout the fight.
Needs: a `phase_two_moveset` on boss enemies, triggered when HP crosses 50%.

### Status effects
Spec §6 defines 7 emotions: Viral (hook stack), Controversion, Frost Bite, Poison, Scarlet Rot, Comfort, Death Blight.
None are implemented. Foundation work: add `active_statuses` to `CombatState`, tick them each round, and expose their effects in the combat reducer. Can start with 1–2 (Viral is the most interesting mechanically).

### Damage types / weaknesses / resistances
Spec §6 mentions elemental affix types (Fire, Lightning, Holy, Magic) and mob weaknesses/resistances.
Currently all damage is flat. Need: damage type on movesets, resistance multiplier lookup in `calcStepDamage`.

---

## Weapon & moveset depth

### Weapon class mechanics not differentiated
All 27 weapon classes exist in the type system and generator, but they all play identically. The spec defines class-specific gameplay:
- **Twinblades** — dual combo hit (light + heavy in sequence)
- **Bows / Greatbows / Crossbows** — async timer: Passion and wait for the resolve step
- **Spears / Great Spears** — reach advantage: reduce enemy poise on successful tasks
- **Reapers** — apply Death Blight stacks passively per successful moveset
- **Curved Swords** — flow-state bonus: chained steps cost less stamina
Even implementing 2–3 of these would give weapon drops meaningful character.

### Weapon level not unlocking extra slots
Spec §5.2: at +3, +5, +7, weapons gain additional Skill and Affix slots (up to rarity cap).
`recordWeaponKill` tracks the level number but `weapon_extra_movesets` doesn't grow automatically on crossing those thresholds.

### Weapon rarity damage scaling not applied to loot rolls
When `rollWeapon` generates a weapon its `base_damage_mult` is class-based but rarity doesn't multiply base damage — Legendary should roll noticeably stronger than Common of the same class.

### Jump moveset in the generator
`movesetGenerator.ts` already produces a Jump variant type, but no weapons have Jump movesets assigned and no `jump_archetype` is plumbed into `weaponClasses.ts`.

### Weapon mastery at +10
Spec §5.2: reaching level 10 should trigger a rarity-specific mastery bonus (Common/Magic: +1 affix slot; Rare: re-roll affix; Epic: amplify special property; Legendary: second instance of unique mechanic).
Currently nothing happens at level 10 beyond hitting the XP cap.

### Weapon sub-class / affinity (Viraling, Envy, etc.)
Spec §3: every weapon instance has an affinity prefix that changes its moveset signature.
"Viraling Katana" rewards `hook`-tagged movesets; "Holy Greatsword" conflicts with `spicy` moves.
Start with: add `affinity` field to `WeaponInstance`, roll it in `weaponGenerator`, expose synergy bonuses as affix effects.

### Moveset weapon affinity check for equipping
Spec §6.5: a moveset can only be slotted into weapons whose class is in its `weapon_affinity` list.
Currently any moveset can be equipped to any weapon in `EquipOverlay.tsx`. The filter exists on the data but isn't enforced in the UI.

---

## Dungeon & map

### More event sublocation types
Only Site of Hope and Trial Gate are implemented. Spec §10 defines 10 event types.
Next priority targets:

- **Forge** — combine 2 compatible movesets into a hybrid (hard, design-wise, do last)
- **Whetstone shrine** — +1 weapon level, one-time per run (easy to implement)
- **Site of Inspiration** — declare you consumed external content → +dmg buff for next N fights (medium)
- **Memorial stone** — HP/FP restore without combat (easy, similar to Site of Hope)
- **Mysterious altar** — risk/reward: sacrifice moveset XP for loot (medium)

### Chest sublocation
Loot without combat. Roll a weapon or moveset drop on node click, reveal it, advance the run. No enemy.

### Dungeon biomes
Spec §8: 6 biomes each with distinct mob archetypes, weapon affinities, and loot bias.
Currently all runs use the same mob pool. Biomes would give each run a distinct character and make weapon collection meaningful (bonus damage in matching biome).

### Fixed "narrative" dungeons
Spec §10 wants pre-designed dungeon slots (like Elden Ring's Limgrave → Castleblack → Ash Lyendell) rather than fully random sequences. A fixed pool of 5–8 dungeon templates with specific biomes and boss designations would give the game a sense of place.

### Abandon run from map screen
There is no way to deliberately quit a run from `RunMapScreen`. Player has to die in combat or wait for the timer. Add a "Retreat" button (behind a confirmation) that calls `endRunFailure`.

---

## Economy & meta-progression

### Talismans (passive slot items)
Spec §13: 3 talisman slots with passive buffs.
Start simple: a few hard-coded talismans ("+10% damage", "+1 Estus per run", "+Stamina cap") droppable from bosses and equippable from the main menu before a run.

### Consumables beyond Estus
Currently only Estus Flask exists. Missing:
- **Focus Flask** — restore FP (now urgent since FP drain is live)
- **Cleanse Stone** — remove a status effect
- **Heat Coolant** — instantly clear weapon heat
- **Time Ash** — pause the 48h timer for 2h (very rare, high-value)

### Streak meta-progression
Spec §14: bonus after N consecutive completed dungeons (e.g. unlock a biome or talisman slot after 5 wins in a row). `run_count` is already tracked — the multiplier/reward is the missing piece.

---

## Technical debt & code quality

### Poise bar hidden but potentially useful
Poise is tracked and drives stagger but the UI hides the enemy poise bar completely. Consider showing it as a thin secondary bar under the HP bar during combat, especially once stagger becomes more interesting with the Jump attack phase.

---

## UX & polish

### Mobile / small screen layout
The combat screen layout (radial menu, canvas map, equip overlay) is desktop-only. The canvas map clips on screens narrower than ~600px. At minimum, test and fix the 375px (iPhone SE) breakpoint.

### Tutorial / first-run onboarding
First-time players see a combat screen with no context for what any of the tasks mean. A one-screen intro explaining "write to attack, complete the task in time" would help enormously.

### Post-run summary stats
`RunCompleteScreen` shows stat level-up and earned movesets but no run statistics (how many enemies defeated, total damage dealt, time spent). These are already derivable from `run_defeated_enemies` and accumulated XP. Would make each run feel more like an achievement.

### Weapon select: show moveset pipeline, not just names
`WeaponSelectScreen` shows moveset tags but not what each step actually is. A quick expandable section showing the pipeline steps would let players make an informed weapon choice.

---

## Experimental (spec §16 — discuss before implementing)

- **Ghost echoes** — async other-player "spirits" appear in the dungeon with their movesets; can summon as co-op declaration
- **Boss as deliverable** — boss only dies when the player publishes the declared piece (external validation hook)
- **Curse system** — dungeon constraints ("no Daggers allowed", "triple stamina cost") with bonus loot reward
- **Forge / Smithing** — combine 2 compatible movesets into a hybrid via a Forge event
- **Lore-driven dungeon themes** — e.g. "Tower of Refinement" where only Refine-stage moves deal damage
- **Weapon affinity drift** — a weapon used heavily for commentary slowly reclassifies toward Reaper
- **Player tombs** — old published pieces appear as revisitable nodes on the map (respawn/repurpose mechanic)
- **Boss requests** — pre-fight lore reveals a required moveset tag; meeting it unlocks bonus drop
- **NPC merchant / mentor sublocations** — sell talismans, give lore, represent consuming others' content as a mechanic
