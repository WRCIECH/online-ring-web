# Weapons & Movesets — System Reference

## Weapons

A weapon is a `WeaponInstance` with:
- `weapon_class` — one of 26 classes (daggers, greatswords, etc.)
- `rarity` — common / magic / rare / epic / legendary
- `constant_movesets` — two always-available movesets (Light + Heavy variants)
- `moveset_slots` / `skill_slots` — extra equippable moveset slots (1–4 depending on rarity)
- `defense_movesets.block` — the weapon's block moveset
- `affixes` — 0–6 random passive bonuses (e.g. +15% damage, −20% stamina cost)
- `base_damage_mult` — a class-level multiplier on all damage this weapon deals
- `poise_weight` — light / medium / heavy / colossal — scales poise damage
- `heat_threshold` — how many steps before the weapon overheats (2 for colossal, 12 for fists/torches)
- `scaling` — which stats boost damage and at what grade (e.g. `{ DEX: 'A', STR: 'D' }`)

---

## Damage calculation

Every step has a `base_damage`. The final damage dealt goes through four layers:

### Layer 1 — `calcStepDamage` (`src/data/weapons.ts:21`)

```
finalDmg = floor(base_damage × classMult × (1 + level × levelMult + statBonus))
```

- **`classMult`** — `base_damage_mult` from the weapon class definition. Ranges from 0.6 (torch) to 2.4 (colossal weapons). This is the most impactful raw multiplier — a colossal sword deals 2.2× the damage of a straight sword on the same step.
- **`levelMult`** — per rarity: common 3%, magic 4%, rare 5%, epic 6%, legendary 8% per weapon level. A legendary weapon at +10 adds +80% to base damage.
- **`statBonus`** — for each stat in `weapon.scaling`, compute `max(0, statValue − 8) × GRADE_MULT[grade]`. Grade S = 3% per point, A = 2.2%, B = 1.5%, C = 1.0%, D = 0.6%, E = 0.3%. At stat 18 with grade A, that's 10 × 2.2% = +22% damage. Stats stack if the weapon scales multiple stats.

### Layer 2 — `ClassMod.dmgMult` (`src/engine/combat.ts:41`)

After `calcStepDamage`, the combat engine applies a weapon-class-specific multiplier:

| Class | dmgMult | Effect |
|---|---|---|
| daggers, thrusting, heavy_thrusting | ×1.2 | Precision bonus |
| katanas | ×1.15 | Swift bonus |
| bows/greatbows/crossbows/ballistas | ×1.5 | Ranged bonus (but 0 poise damage) |
| axes | ×1.25 | Reckless (+5 self-damage per hit) |
| straight_swords | ×1.1 | Balanced |
| hammers | ×0.8 | Trades HP damage for huge poise damage (×2.0) |
| colossal/great hammers/great axes | ×0.85 | Trades HP for massive poise (×2.5) |
| greatswords | ×(1 + chainIdx × 0.15) | Momentum — grows with each chained step |

### Layer 3 — Dual strike (twinblades only)

If `dualStrike: true`, a second hit fires at 40% of the primary. `totalDmg = finalDmg + floor(finalDmg × 0.4)`.

### Layer 4 — Poise damage (separate track)

Poise damage uses its own chain:

```
scaledPoise = round(step.poise_damage × gapMult × weightMult × variantMult × class.poiseMult)
```

- **`gapMult`** — the flow-state multiplier (see below). Zero if you've been idle 4+ hours, meaning zero poise damage.
- **`weightMult`** — light=0.5, medium=1.0, heavy=1.5, colossal=2.0
- **`variantMult`** — Light=0.7, Heavy=1.5, Skill=1.0, Jump=2.0
- **`class.poiseMult`** — spears/great_spears/halberds ×1.5, reapers/whips/flails ×1.6, hammers ×2.0, colossals ×2.5. Ranged weapons get ×0.

When poise hits 0, the enemy staggers — you get a free attack turn and poise resets.

---

## Flow-state multiplier

`gapMultiplier(lastMovesetCompletionMs)` in `combat.ts:15` checks wall-clock time since your last completed step:

- Under 15 min → **×1.5** (flow state, shown as `[flow]` in log)
- 15–60 min → **×1.0**
- 1–4 hours → **×0.5** (stale, shown as `[stale]`)
- Over 4 hours → **×0** (poise damage zeroed; gap resets to enemy max poise)

This only affects poise damage, not HP damage. Ranged weapons bypass it entirely (`gapOverride: 1.0`).

---

## Stamina

Stamina cost comes from the moveset, not the individual step. Two places set it:

**For generated movesets** (in `atomicMove.ts`):

```
staminaCost = round(TIME_STA[time_budget] × MEDIUM_STA[medium])
```

Time budgets: Micro=2, Short=4, Medium=7, Long=10, Deep=18.
Medium multipliers: Writing×1.0, Audio×1.1, Video×1.3, Image×0.9, Outline×0.6, Hybrid×1.4.

The moveset-level cost is: `sum of all steps' stamina costs × RARITY_STA_MULT × rarity_mult`.
Rarity reduces cost: common×1.0, magic×0.95, rare×0.9, epic×0.85, legendary×0.75.

**In combat**, the class `staCoeff` applies at the moment of spending:
- Curved swords in-chain: ×0.7 (30% discount after the first step)
- Fists: ×0 (free stamina) + restore 8 STA per hit

**FP** (Focus Points, based on MND stat) is only spent on non-constant movesets (skill slots). Constant movesets (Light + Heavy that come baked into the weapon) are always free on FP. `fp_cost` is set to `scaledSteps.length > 2 ? 3 : 0` — movesets with more than 2 steps cost 3 FP. Atomic modes like Connecting/Compressing/Expanding/Remixing add additional FP cost per step.

---

## How movesets are rolled

`rollWeapon()` calls `rollMoveset(cls, 'common', 'Light')` and `rollMoveset(cls, rarity, 'Heavy')` — these become the two constant movesets.

Inside `rollMoveset()` (`movesetGenerator.ts`):

1. **Pick archetype** — randomly from `classDef.preferred_archetypes`. Each class has 2–3 preferred archetypes that match its creative theme (e.g. daggers → micro, hot_take, commentary).

2. **Pick variant** — forced for constant movesets (Light/Heavy); otherwise weighted 40/25/30/5 for Light/Heavy/Skill/Jump.

3. **Determine combo length** — `comboLength(variant, rarity)`: Light=2–3, Heavy=3–5, Skill=2–4, Jump=1–2. Epic/legendary get +1 step.

4. **Pick a stage chain** — `pickStageChain(archetype, len)` picks the predefined chain closest to the desired length. Example chains:
   - `long_form`: `[Outline, Draft, Refine, Publish]` or `[Ideate, Outline, Draft, Refine, Publish]`
   - `micro`: `[Ideate, Publish]` or `[Draft, Publish]`
   - `commentary`: `[Consume, React, Publish]`
   - `hot_take`: `[Draft, Publish]`

5. **Roll each step** — `rollAtomicMove(stage, variant, archetype, ...)` picks a `time_budget` (weighted by variant: Light skews Micro/Short, Heavy skews Long/Deep), derives the cognitive mode from the stage (e.g. Consume→Consuming, React→Commentary, Refine in a compression archetype→Compressing), assigns publication level (early stages=just_work, Refine=draft_published, Publish/Repurpose=full public/rarity-gated), then validates consistency rules (e.g. Consuming mode can't publish publicly, Compressing requires non-New origin).

6. **Convert to Step** — `toStep(dims)` calls:
   - `base_damage = round(TIME_DMG × MODE_MULT × PUB_MULT × 10)` where TIME_DMG: Micro=1..Deep=12, MODE_MULT: Creating=1.0, Commentary=0.9, Remixing=0.7, Compressing=0.6, Consuming=0.4, PUB_MULT: just_work=0.4, public=1.3
   - `poise_damage = round(TIME_DMG × 1.5)`
   - `time = TIME_SECS[time_budget]`: Micro=300s (5 min), Short=600s, Medium=900s, Long=1500s, Deep=2700s (45 min)

7. **Apply rarity multipliers** — damage ×1.0/1.1/1.2/1.35/1.5 by rarity; stamina ×1.0/0.95/0.9/0.85/0.75.

8. **Name the moveset** — `"${archetypeLabel} (${variantLabel})"`, e.g. "Hot Take (light)".

9. **Register** — `registerMoveset(m)` writes it into the global `MOVES` record. Weapons only store the ID; lookups go through `MOVES[id]` at runtime.

---

## How player stats affect combat

Stats affect two things:

**HP and resource pools** (in store):
- Max HP = `VIG × 10`
- Max stamina = `END × 5`
- Max FP = `MND × 3`

**Damage scaling** (in `calcStepDamage`):
Only the stats in `weapon.scaling` matter. Each point above the baseline of 8 adds a percentage per grade (S=3%, A=2.2%, B=1.5%, C=1.0%, D=0.6%, E=0.3%). STR governs greatswords, hammers, axes; DEX governs daggers, bows, curved swords; INT governs spears, thrusting swords; ARC governs katanas, reapers; FAI governs torches.

STR/DEX stats are the primary combat damage stats. MND matters if you want to use many skill movesets without running out of FP.

---

## How weapon class affects the fight

Beyond raw damage multipliers and stat scaling, `getClassMod` gives each class a distinct **mechanical identity**:

| Pattern | Classes | Mechanic |
|---|---|---|
| Poise shredders | hammers, great hammers, colossals | Low HP damage but 2.0–2.5× poise — force staggers faster than damage |
| Ranged | bows, greatbows, crossbows, ballistas | 1.5× HP damage, zero poise, immune to flow-state gap decay |
| Dual strike | twinblades | Auto +40% off-hand hit on every step |
| Precision | daggers, thrusting swords, heavy thrusting | Flat 1.2× multiplier, good for quick multi-step chains |
| Momentum | greatswords | dmgMult grows by ×0.15 per chained step — weak alone, powerful in combos |
| Flow | curved swords/greatswords | Stamina discount (×0.7) for steps after the first in a chain |
| Relentless | fists | Stamina cost is zero; each hit restores 8 STA instead |
| Reckless | axes | 1.25× damage but deal 5 HP self-damage per hit |
| Grim reapers | reapers, whips, flails | 1.6× poise multiplier — soft poise shredders |
| Reach | spears, great_spears, halberds | 1.5× poise multiplier |

**Heat threshold** also shapes playstyle: daggers/fists/torches have thresholds of 10–12 (use them freely all run), colossal weapons and greatbows have threshold 2 (two steps and the weapon goes on cooldown for the next run). This makes colossal weapons a high-commitment single-encounter tool.

---

## All 27 weapon classes

Columns: **base dmg mult** · **poise weight** · **heat threshold** · **primary scaling** · **combat mechanic**

---

### Daggers
*Micro-content: tweets, shorts, quick reactions.*
- 0.7× base dmg · light · heat 10 · DEX A / STR D
- Preferred archetypes: micro, hot_take, commentary
- **◈ Precise** — flat ×1.2 HP damage multiplier. Low base damage, compensated by precision bonus and very high heat tolerance. Best on DEX builds firing many fast steps.

---

### Straight Swords
*Standard articles and blog posts.*
- 1.0× base dmg · medium · heat 7 · STR C / DEX C
- Preferred archetypes: long_form, commentary, research
- **≈ Balanced** — ×1.1 HP damage and ×1.1 poise. No special trade-offs; scales evenly with both STR and DEX. The all-rounder.

---

### Greatswords
*Long-form essays and deep dives.*
- 1.5× base dmg · heavy · heat 4 · STR B / DEX E
- Preferred archetypes: long_form, storytelling, research
- **↑ Momentum** — dmgMult starts at ×1.0 and grows by +0.15 per chained step (step 2 = ×1.15, step 3 = ×1.30, etc.). Weak on isolated hits; devastating in long combos. Heavy variant movesets (3–5 steps) maximise this.

---

### Katanas
*Polished craft pieces — quality over quantity.*
- 1.1× base dmg · medium · heat 6 · DEX B / ARC D
- Preferred archetypes: long_form, storytelling, editing
- **⊘ Swift** — flat ×1.15 HP damage. Combines good base mult with a clean bonus and no downside. ARC secondary scaling makes it pair well with reapers in a mixed kit.

---

### Hammers
*Hot takes and opinion pieces.*
- 1.3× base dmg · heavy · heat 5 · STR B
- Preferred archetypes: hot_take, commentary
- **⊗ Stagger** — HP dmgMult ×0.8 (lower than raw base), poiseMult ×2.0. The trade: you deal less HP damage per hit but break enemy poise twice as fast. Ideal for triggering stagger turns when the enemy has high HP but low poise.

---

### Spears
*Research-driven content.*
- 1.0× base dmg · medium · heat 6 · DEX C / INT D
- Preferred archetypes: research, long_form
- **⋯ Reach** — poiseMult ×1.5. Solid, no-trade-off poise bonus. INT secondary scaling is unique and benefits builds using heavy_thrusting as a pair.

---

### Axes
*Editing and compression of existing content.*
- 0.9× base dmg · medium · heat 6 · STR B
- Preferred archetypes: editing, compression, remix
- **✗ Reckless** — ×1.25 HP damage but deals 5 HP self-damage per successful step (minimum 1 HP; cannot kill self). High risk/reward; pairs poorly with long multi-step combos where self-damage accumulates.

---

### Bows
*Async content — newsletters, scheduled posts.*
- 0.85× base dmg · light · heat 5 · DEX B
- Preferred archetypes: async, research
- **⟶ Ranged** — ×1.5 HP damage, zero poise damage, flow-state gap override = 1.0 (always full multiplier regardless of idle time). The only class where it doesn't matter how long ago you last wrote — the damage is always consistent.

---

### Fists
*Raw BTS content and vlogs.*
- 0.65× base dmg · light · heat 12 · STR C / DEX C
- Preferred archetypes: micro, hot_take, commentary
- **◉ Relentless** — stamina cost is zero (staCoeff=0); each successful step restores +8 STA. Can chain indefinitely without running out of stamina. Very low base damage compensated by infinite sustainability and the highest heat threshold in the game.

---

### Colossal Swords
*Books, courses, and long-form products.*
- 2.2× base dmg · colossal · heat 2 · STR A
- Preferred archetypes: long_form, storytelling
- **⊕ Crush** — ×0.85 HP damage mult (applied on top of the massive 2.2× base), poiseMult ×2.5. Net result: still enormous HP damage plus the best poise shred in the game. Heat 2 means it overheats after 2 steps — a committed single-encounter nuke.

---

### Thrusting Swords
*Comments and reply content.*
- 0.75× base dmg · light · heat 10 · DEX A / INT D
- Preferred archetypes: micro, commentary
- **◈ Precise** — ×1.2 HP damage. Effectively 0.75 × 1.2 = 0.9× net, with DEX A scaling pulling it up on dex builds. High heat tolerance similar to daggers. INT secondary makes it the only precise weapon that benefits from INT investment.

---

### Heavy Thrusting Swords
*In-depth analysis and commentary.*
- 1.1× base dmg · medium · heat 6 · DEX B / INT C
- Preferred archetypes: research, commentary
- **◈ Precise** — ×1.2 HP damage. 1.1 × 1.2 = 1.32× net before stats. The highest single-hit precise weapon by net output. INT C scaling is meaningful on INT builds.

---

### Curved Swords
*Storytelling and narrative content.*
- 1.0× base dmg · medium · heat 7 · DEX A
- Preferred archetypes: storytelling, long_form
- **〜 Flow** — from step 2 onward in a chain, stamina cost is reduced to ×0.7 (30% cheaper). First step costs full stamina. DEX A is the best pure DEX scaling in medium-weight class. Rewards long combo chains.

---

### Curved Greatswords
*Epic series and narrative sagas.*
- 1.4× base dmg · heavy · heat 4 · DEX B / STR D
- Preferred archetypes: storytelling, long_form
- **〜 Flow** — same ×0.7 stamina discount in-chain as curved swords, but on a 1.4× base. High damage flow weapon; DEX-primary with light STR secondary. Heat 4 limits total steps per run.

---

### Twinblades
*Multi-platform cross-posting.*
- 0.9× base dmg · medium · heat 7 · DEX B / ARC D
- Preferred archetypes: remix, micro
- **⚔ Dual** — every hit auto-fires a second off-hand strike at 40% of main damage. Net effective multiplier: 0.9 × 1.4 = 1.26× per step before stats. ARC secondary pairs thematically with reapers and katanas.

---

### Great Hammers
*Manifestos and major opinion pieces.*
- 1.7× base dmg · heavy · heat 3 · STR A
- Preferred archetypes: hot_take, commentary
- **⊕ Crush** — ×0.85 HP damage, poiseMult ×2.5. Net HP: 1.7 × 0.85 = 1.445×. Combined with STR A scaling and heavy poise weight, this is the premier stagger weapon for STR builds. Heat 3 means 3 steps then cooldown.

---

### Great Axes
*Recaps, roundups, and year-in-review content.*
- 1.35× base dmg · heavy · heat 4 · STR A
- Preferred archetypes: compression, editing, remix
- **⊕ Crush** — ×0.85 HP, poiseMult ×2.5. Net HP: 1.35 × 0.85 = 1.15×. Slightly lower output than great hammers but 1 extra heat step and preferred archetypes lean into compression/editing, generating shorter moveset chains.

---

### Flails
*Spontaneous and improv content.*
- 0.95× base dmg · medium · heat 6 · STR C / DEX D
- Preferred archetypes: micro, hot_take
- **⊛ Grim** — poiseMult ×1.6. Mid-tier poise shredder with balanced dual scaling. Spontaneous archetypes mean generated movesets tend to be short (1–2 steps), making each combat round fast.

---

### Colossal Weapons
*Mega-projects — documentaries, full series.*
- 2.4× base dmg · colossal · heat 2 · STR S
- Preferred archetypes: long_form, storytelling
- **⊕ Crush** — ×0.85 HP, poiseMult ×2.5. Net HP: 2.4 × 0.85 = 2.04×. Highest base damage in the game. STR S scaling means every STR point above 8 adds 3% damage. Heat 2 — two steps and it's done for the run.

---

### Great Spears
*Investigative content.*
- 1.25× base dmg · heavy · heat 4 · STR C / INT C
- Preferred archetypes: research, long_form
- **⋯ Reach** — poiseMult ×1.5. The only heavy weapon with dual STR+INT scaling at equal grades; benefits mixed builds. Investigative archetypes generate multi-step research chains.

---

### Halberds
*Hybrid research and opinion.*
- 1.1× base dmg · medium · heat 6 · STR C / DEX D
- Preferred archetypes: research, commentary
- **⋯ Reach** — poiseMult ×1.5. Medium weight keeps poise output moderate. Hybrid archetypes generate varied moveset types mixing research and reaction steps.

---

### Reapers
*Commentary, takedowns, and critiques.*
- 1.2× base dmg · heavy · heat 4 · ARC B / INT D
- Preferred archetypes: commentary, hot_take
- **⊛ Grim** — poiseMult ×1.6. The only heavy weapon scaling primarily off ARC, making it ideal for ARC/INT builds. Strong against high-poise enemies.

---

### Whips
*Series and content cycles.*
- 0.9× base dmg · medium · heat 7 · DEX C / ARC D
- Preferred archetypes: async, storytelling
- **⊛ Grim** — poiseMult ×1.6. Lower base damage compensated by poise bonus and good heat tolerance. Async archetypes favour longer-duration scheduled steps.

---

### Greatbows
*Long-tail evergreen content.*
- 1.6× base dmg · colossal · heat 2 · STR B / DEX D
- Preferred archetypes: async, research
- **⟶ Ranged** — ×1.5 HP damage, zero poise, gap override = 1.0. Net HP: 1.6 × 1.5 = 2.4× — the highest ranged output. Colossal poise weight is irrelevant since poiseMult=0 for ranged. Heat 2 forces commitment.

---

### Crossbows
*Email blasts and push notifications.*
- 0.85× base dmg · medium · heat 6 · DEX B
- Preferred archetypes: micro, async
- **⟶ Ranged** — ×1.5 HP, zero poise, gap override = 1.0. Net HP: 0.85 × 1.5 = 1.275×. Moderate damage, sustainable heat. Good for players who write in short async bursts and want consistent damage regardless of session frequency.

---

### Ballistas
*Major product launches.*
- 2.2× base dmg · colossal · heat 2 · STR C / DEX D
- Preferred archetypes: long_form, async
- **⟶ Ranged** — ×1.5 HP, zero poise, gap override = 1.0. Net HP: 2.2 × 1.5 = 3.3× — the single highest per-step HP damage output in the game. Heat 2 and no poise damage means it's a pure HP-nuke for two steps, then done.

---

### Torches
*Lifestyle and lo-fi vlog content.*
- 0.6× base dmg · light · heat 12 · FAI B / INT D
- Preferred archetypes: micro, hot_take
- **≋ Attrition** — ×1.2 HP damage, poiseMult ×0 (zero poise damage). Net HP: 0.6 × 1.2 = 0.72×. The only FAI-scaling weapon; unique stat niche. Zero poise means it can never stagger enemies — purely an HP-chip weapon. Highest heat tolerance alongside fists. INT secondary adds mild INT synergy.
