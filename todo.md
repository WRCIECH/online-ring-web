# Online Ring — Todo

Tracked items from `fight_spec.md` review + observations from the codebase.
Not a priority order — use judgment based on what makes the game feel alive next.

---

## Combat mechanics

### Weapon level → damage bonus not applied
`calcStepDamage` in `src/data/weapons.ts` only uses stat scaling; it ignores weapon level.
Spec §5.2 defines: Common +3%/lvl, Magic +4%, Rare +5%, Epic +6%, Legendary +8% per level.
Formula: `finalDmg = baseDmg × (1 + level × rarityMult)` — straightforward to add.

### FP cost not enforced in combat
`fp_cost` exists on `Moveset` and `Step`, and `playerFp` is tracked in `CombatState`, but FP is never spent when selecting a moveset.
Heavy and Skill moves should drain FP; player can't use them when FP is 0.
Also need a Focus Flask consumable (restore FP during run) to go with it.

### Jump moveset attack type missing
The spec calls for Jump movesets (x2.0 poise) to be **only available after a stagger break** as a bonus attack.
Currently the jump variant exists in the generator types but there is no "post-stagger jump attack" phase in combat.
The ENEMY_STAGGERED phase already exists — add a prompt to use a Jump moveset during that window before it transitions back to PLAYER_ATTACK.

### Boss second phase
Spec §8: at 50% HP the boss changes its attack pattern and adds 2–3 new attacks.
Currently bosses have a single moveset pool throughout the fight.
Needs: a `phase_two_moveset` on boss enemies, triggered when HP crosses 50%.

### Status effects
Spec §6 defines 7 statuses: Bleed (hook stack), Madness, Frost Bite, Poison, Scarlet Rot, Sleep, Death Blight.
None are implemented. Foundation work: add `active_statuses` to `CombatState`, tick them each round, and expose their effects in the combat reducer. Can start with 1–2 (Bleed is the most interesting mechanically).

### Damage types / weaknesses / resistances
Spec §6 mentions elemental affix types (Fire, Lightning, Holy, Magic) and mob weaknesses/resistances.
Currently all damage is flat. Need: damage type on movesets, resistance multiplier lookup in `calcStepDamage`.

### Stamina regeneration between rounds
Stamina currently resets to max on every `enterPlayerAttack` (full restore each round). This was a quick compromise.
Spec implies stamina should regenerate gradually — or at minimum you shouldn't get full STA back if the enemy interrupts mid-combo. Worth revisiting once FP is also in play.

---

## Weapon & moveset depth

### Weapon level not unlocking extra slots
Spec §5.2: at +5, weapons gain +1 Skill slot (up to rarity cap); at +3 and +7, gain Affix slots.
Currently weapon level only tracks a number — the `weapon_extra_movesets` array doesn't grow automatically on level-up.
`recordWeaponKill` / `flushWeaponXp` in gameStore should push a new empty slot when crossing +3, +5, +7.

### Weapon rarity damage scaling not applied to loot rolls
When `rollWeapon` generates a weapon its `base_damage_mult` is class-based but rarity doesn't yet multiply that for better weapons. Legendary should roll noticeably stronger base damage than Common of the same class.

### Moveset variants from lvl 6 (Long / Compressed / Risky)
Spec §5.1: at lvl 6+ each moveset unlocks 2–3 variants the player picks **before executing**.
Not implemented at all. Foundation: add variant selection to the radial menu when `moveset_level[id] >= 6`.

### Jump moveset in the generator
`movesetGenerator.ts` already produces Jump variant type, but no weapons have Jump movesets assigned as `constant_movesets`. The weapon class definitions in `weaponClasses.ts` reference `heavy_archetype` and `light_archetype` but no `jump_archetype`. Plumb it in.

### Weapon mastery at +10
Spec §5.2: Common/Magic get +1 affix slot; Rare can re-roll an affix; Epic amplifies special property; Legendary gets second instance of unique mechanic.
Currently nothing happens at level 10 beyond hitting the XP cap.

### More weapon classes
`weaponClasses.ts` has 9 classes. Spec §3 lists 27+.
High-priority additions (each has distinct gameplay): Colossal Swords, Twinblades (dual-weapon mechanic), Curved Swords (flow-state bonus), Spears (research archetype), Reapers (Death Blight potential), Bows (async timer: fire and wait).

### Weapon sub-class / affinity (bleeding, frostbite, etc.)
Spec §3: every weapon instance has an affinity prefix that changes its moveset signature.
"Bleeding Katana" rewards movesets with `hook` tags; "Holy Greatsword" conflicts with `spicy` moves.
This is a big system. Start with: add `affinity` field to `WeaponInstance`, roll it in `weaponGenerator`, expose synergy bonuses as affix effects.

### Moveset weapon affinity check for equipping
Spec §6.5: a moveset can only be slotted into weapons whose class is in its `weapon_affinity` list.
Currently any moveset can be equipped to any weapon in `EquipOverlay.tsx`. The filter exists on the data but isn't enforced in the UI.

---

## Dungeon & map

### More event sublocation types
Only Site of Grace and Trial Gate are implemented. Spec §10 defines 10 event types.
Next priority targets:

- **Forge** — combine 2 compatible movesets into a hybrid (hard, design-wise, do last)
- **Whetstone shrine** — +1 weapon level, one-time per run (easy to implement)
- **Site of Inspiration** — declare you consumed external content → +dmg buff for next N fights (medium)
- **Memorial stone** — HP/FP restore without combat (easy, similar to Site of Grace)
- **Mysterious altar** — risk/reward: sacrifice moveset XP for loot (medium)

### Chest sublocation
Loot without combat. Roll a weapon or moveset drop on node click, reveal it, advance the run. No enemy.

### Dungeon biomes
Spec §8: 6 biomes each with distinct mob archetypes, weapon affinities, and loot bias.
Currently all runs use the same mob pool. Biomes would give each run a distinct character and make weapon collection meaningful (bonus damage in matching biome).

### Dungeon time-budget estimate
Spec §10: show estimated work hours before entering ("Estimated work: 8–12h. Time limit: 48h.").
Can compute from `sum(step.time)` across the generated sequence.

### Fixed "narrative" dungeons
Spec §10 wants pre-designed dungeon slots (like Elden Ring's Limgrave → Castleblack → Ash Lyendell) rather than fully random sequences. Right now every run randomizes the full 22-node sequence. A fixed pool of, say, 5–8 dungeon templates with specific biomes and boss designations would give the game a sense of place.

### Abandon run from map screen
There is no way to deliberately quit a run from `RunMapScreen`. Player has to die in combat or wait for the timer. Add a "Retreat" button (behind a confirmation) that calls `endRunFailure`.

---

## Economy & meta-progression

### Runes as currency
Enemy `rune_reward` is shown on the victory screen but never stored or spent.
Add `runes: number` to `GameState`, increment on each victory, and wire up a spend path (merchant, or just an Estus-refill at title screen).

### Talismans (passive slot items)
Spec §13: 3 talisman slots with passive buffs.
Start simple: a few hard-coded talismans ("+10% damage", "+1 Estus per run", "+Stamina cap") droppable from bosses and equippable from the main menu before a run.

### Consumables beyond Estus
Currently only Estus Flask exists. Missing:
- **Focus Flask** — restore FP (needed once FP drain is in)
- **Cleanse Stone** — remove a status effect
- **Heat Coolant** — instantly clear weapon heat (useful once heat system is tested)
- **Time Ash** — pause the 48h timer for 2h (very rare, high-value)

### Streak meta-progression
Spec §14 open question: bonus after N consecutive completed dungeons (e.g. unlock a biome or talisman slot after 5 wins in a row). `run_count` is already tracked — the multiplier/reward is the missing piece.

---

## Technical debt & code quality

### RunCompleteScreen shows all owned movesets, not just new ones from this run
The "Movesets earned this run" section shows `store.owned_movesets` filtered by `MOVES[id]` — this is the full owned list, not what was gained this run. Track `prev_owned_movesets` snapshot before the run starts, and diff on the complete screen.

### `calcStepDamage` ignores weapon level
See Combat section above. Weapon level is tracked but has zero effect on output damage, making the progression feel inert.

### Poise bar hidden but potentially useful
Poise is tracked and drives stagger but the UI hides the enemy poise bar completely. Consider showing it as a thin secondary bar under the HP bar during combat, especially once stagger becomes more interesting with the Jump attack phase.

### FP bar on player shows but is never depleted
The FP bar in `RunHeader` ticks down with nothing and refills never happen in combat. Until FP drain is implemented this bar is confusing. Either hide it (remove from header) or implement FP cost in combat.

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

### Log overflow in long fights
`CombatLog` accumulates every log entry indefinitely. In long fights (many steps, many movesets) this becomes a wall of text. Cap to the last 40 entries or add virtualization.

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
- **Dual currencies** — Ideas (from consuming/research events) and Souls (from publishing/combat); different shops
- **NPC merchant / mentor sublocations** — sell talismans, give lore, represent consuming others' content as a mechanic
