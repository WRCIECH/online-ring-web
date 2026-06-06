# Fight Specification

Current implementation reference. All values are taken directly from code.

---

## Player Stats

| Stat | Max resource formula | Primary use |
|---|---|---|
| VIG | HP: ≤25 → 300+VIG×12; 26–40 → 600+(VIG−25)×18; 41+ → 870+(VIG−40)×8 | Survival |
| END | Stamina: END × 10 | Attack frequency |
| MND | FP: MND × 3 | Skill movesets |
| STR | Damage scaling for heavy weapons | Damage |
| DEX | Damage scaling for fast/technical weapons | Damage |
| INT | Damage scaling for magic/piercing weapons | Damage |
| FAI | Damage scaling for faith/ranged weapons | Damage |
| ARC | Damage scaling for arcane/bleed weapons | Damage |

**Leveling cost:** `floor(500 + totalLevelsSpent × 100 + totalLevelsSpent² × 20)` runes per stat point.

---

## Damage Calculation

Final HP damage goes through four layers:

### Layer 1 — Base (`calcStepDamage`)

```
baseDmg = floor(step.base_damage × classMult × (1 + level × levelMult + statBonus))
```

- **classMult** = `weapon.base_damage_mult` (per weapon class, 0.6–2.4)
- **levelMult** = per rarity: common 3%, magic 4%, rare 5%, epic 6%, legendary 8%
- **statBonus** = sum of `max(0, statValue − 8) × GRADE_MULT[grade]` for each scaling stat

Grade multipliers per stat point above 8:

| S | A | B | C | D | E |
|---|---|---|---|---|---|
| 3.0% | 2.2% | 1.5% | 1.0% | 0.6% | 0.3% |

### Layer 2 — Class modifier (`ClassMod.dmgMult`)

Applied on top of `baseDmg`. See weapon class table below.

### Layer 3 — Damage type multiplier

```
typeMult = enemy has weakness to step.damage_type ? 1.3
         : enemy has resistance                   ? 0.7
         : 1.0
```

Active status debuffs stack additionally:
- **Frostbite active on enemy**: × 1.2 to all incoming damage for 2 turns.

### Layer 4 — Dual strike (twinblades only)

```
totalDmg = finalDmg + floor(finalDmg × 0.4)
```

### Grace lifesteal

If the Grace status is active on the player, each successful step heals `floor(totalDmg × 0.05)` HP.

---

## Weapon Level & Rarity

Weapon upgrade cost: `(currentLevel + 1) × 500` runes. Cap: +10.

Damage bonus per level by rarity: common +3%, magic +4%, rare +5%, epic +6%, legendary +8%.

---

## Poise System

```
scaledPoise = round(step.poise_damage × gapMult × weightMult × variantMult × class.poiseMult)
```

- **weightMult**: light=0.5, medium=1.0, heavy=1.5, colossal=2.0
- **variantMult**: Light=0.7, Heavy=1.5, Skill=1.0, Jump=2.0
- **class.poiseMult**: varies per class (see table)

When enemy poise reaches 0: enemy staggers, player gets a free attack turn, poise resets to max.

---

## Flow-State Gap Multiplier

Applies to poise damage only (not HP damage). Measures time since last completed step:

| Gap | Multiplier | Log label |
|---|---|---|
| < 15 min | × 1.5 | `[flow]` |
| 15–60 min | × 1.0 | — |
| 1–4 hours | × 0.5 | `[stale]` |
| > 4 hours | × 0.0 + poise resets to max | — |

Ranged weapons bypass the gap multiplier entirely (always × 1.0).

---

## Stamina & FP

**Stamina cost** at the moment of spending = `floor(moveset.stamina_cost × cls.staCoeff)`

Class `staCoeff` modifiers:
- Curved swords / curved greatswords: ×0.7 for steps after the first in a chain
- Fists: ×0 (free) + restore 8 STA per hit

**Block cost:** 15 STA (instant, no task, takes no damage)
**Defense gain (take hit / roll):** +25 STA

**FP** is spent only on skill movesets (non-constant). Constant movesets (Light + Heavy baked into the weapon) cost 0 FP. Base rule: `fp_cost = steps.length > 2 ? 3 : 0`. Some cognitive modes add more (Connecting +5, Compressing +5, Expanding +3, Remixing +3 per step; Deep time budget +3 if not those modes).

---

## Weapon Heat & Cooldown

Each successful step increments `weaponHeatAccumulated[weaponId]` by 1. On combat end:
- If accumulated heat ≥ weapon's `heat_threshold`: weapon enters cooldown
- Cooldown length in runs: excess ≤2 → 1 run, excess ≤5 → 2 runs, else → 3 runs
- Weapons on cooldown cannot be selected for the next run

`heat_threshold` = `round(classDef.heat_threshold × (legendary ? 1.5 : 1.0))`

Crossbows and Torches have `heat_threshold: 9999` (effectively infinite).

---

## Damage Types

11 types: **standard, strike, slash, pierce, lightning** (physical) and **fire, magic, holy, occult, grafting, poison** (non-physical).

Each generated step carries a `damage_type` from the weapon class's `base_damage_types[0]`. Enemies have `weaknesses[]` (+30% damage) and `resistances[]` (−30% damage).

### Enemy damage profiles

| Enemy | Weaknesses | Resistances |
|---|---|---|
| Procrastination Mob | lightning, slash | holy |
| The Hater | occult, bleed | standard |
| Blank Page Omen | fire, slash | holy, magic |
| Burnout Shade | holy, grace | poison, occult |
| Comparison Engine | magic, pierce | lightning, standard |
| Fear Phantom | fire, strike | magic, pierce |
| Perfectionism Knight | fire, occult | standard, pierce, slash |

---

## Status Effects

**Buildup per hit:** 35 points when the player checks the "Applied [Status]" checkbox in the task timer. Murmur doubles buildup rate when active. When accumulation reaches threshold the effect triggers and accumulation resets to 0.

| Status | Threshold | Trigger effect |
|---|---|---|
| **Bleed** | 100 | Burst: 15% enemy max HP + 20 flat damage; poise resets |
| **Scarlet Rot** | 80 | DOT: 5% max HP per turn for 3 turns; enemy resistance −20% |
| **Frostbite** | 80 | Burst: 10% max HP; enemy takes +20% all damage for 2 turns |
| **Madness** | 100 | Burst: 25% max HP; player loses all FP |
| **Sleep** | 60 | Enemy skips 2 turns; player stamina recovery boost |
| **Death Blight** | 100 | Insta-kill non-boss; vs boss: 30% max HP burst |
| **Glintstone** | 80 | Player +INT bonus damage for 3 turns |
| **Frenzy Flame** | 80 | Enemy armor broken for 2 turns; player regains 50% max FP |
| **Devotion** | 60 | Enemy passive: gives +5 FP/turn to player for 3 turns |
| **Yearning** | 60 | Player task timers −30% for 2 turns |
| **Dread** | 80 | Enemy stunned (skips turn); player gains 30% max STA |
| **Murmur** | 60 | Next status builds at 2× speed for 1 turn |
| **Grace** | 80 | Lifesteal: each hit heals 5% of damage dealt for 2 turns |

Status accumulation bars are displayed in the combat UI below the player resource bars.

---

## Weapon Class Mechanics (`ClassMod`)

| Class | dmgMult | poiseMult | staCoeff | Special |
|---|---|---|---|---|
| straight_swords | ×1.1 | ×1.1 | 1.0 | Balanced |
| greatswords | ×(1+chainIdx×0.15) | 1.0 | 1.0 | Momentum: grows per chained step |
| daggers | ×1.2 | 1.0 | 1.0 | Precise |
| thrusting_swords | ×1.2 | 1.0 | 1.0 | Precise |
| heavy_thrusting | ×1.2 | 1.0 | 1.0 | Precise |
| katanas | ×1.15 | 1.0 | 1.0 | Swift |
| bows / greatbows / crossbows / ballistas | ×1.5 | ×0 | 1.0 | Ranged: no poise, gap override=1.0 |
| twinblades | 1.0 | 1.0 | 1.0 | Dual strike: auto +40% off-hand hit |
| curved_swords / curved_greatswords | 1.0 | 1.0 | 0.7 in-chain | Flow: 30% STA discount after step 1 |
| hammers | ×0.8 | ×2.0 | 1.0 | Stagger |
| great_hammers / colossal_swords / colossal_weapons / great_axes | ×0.85 | ×2.5 | 1.0 | Crush |
| spears / great_spears / halberds | 1.0 | ×1.5 | 1.0 | Reach |
| reapers / whips / flails | 1.0 | ×1.6 | 1.0 | Grim |
| axes | ×1.25 | 1.0 | 1.0 | Reckless: +5 HP self-damage per hit |
| fists | 1.0 | 1.0 | ×0 | Relentless: 0 stamina cost, +8 STA per hit |
| torches | ×1.2 | ×0 | 1.0 | Attrition: no poise damage |

---

## All 27 Weapon Classes

| Class | weight | poise_value | heat | base_damage_mult | primary dmg type | scaling | time_mod | sta_mod | inherent_status |
|---|---|---|---|---|---|---|---|---|---|
| daggers | 1.5 | 5 | 20 | 0.7 | lightning | DEX S | 0.8 | 0.7 | — |
| straight_swords | 3.5 | 25 | 12 | 1.0 | standard | STR D, DEX D | 1.0 | 1.0 | — |
| greatswords | 9.0 | 55 | 6 | 1.5 | slash | STR B, DEX D | 1.15 | 1.2 | — |
| colossal_swords | 22.0 | 100 | 3 | 2.2 | strike | STR S | 1.5 | 1.5 | madness |
| katanas | 5.5 | 20 | 12 | 1.1 | slash | DEX A | 0.95 | 1.0 | bleed |
| curved_swords | 4.0 | 15 | 16 | 1.0 | slash | DEX A | 0.85 | 0.8 | — |
| curved_greatswords | 10.0 | 40 | 7 | 1.4 | slash | DEX B, STR D | 1.15 | 1.15 | — |
| twinblades | 7.0 | 15 | 18 | 0.9 | slash | DEX S | 0.9 | 1.1 | scarlet_rot |
| hammers | 5.5 | 45 | 10 | 1.3 | strike | STR A | 1.0 | 1.15 | — |
| great_hammers | 12.0 | 75 | 5 | 1.7 | strike | STR A | 1.2 | 1.3 | death_blight |
| colossal_weapons | 24.0 | 120 | 2 | 2.4 | strike | STR S | 1.6 | 1.6 | madness |
| axes | 5.0 | 30 | 12 | 0.9 | slash | STR C, DEX D | 0.9 | 1.0 | — |
| great_axes | 13.0 | 65 | 6 | 1.35 | slash | STR A | 1.25 | 1.35 | — |
| flails | 5.0 | 35 | 15 | 0.95 | strike | DEX B, STR D | 1.0 | 0.85 | bleed |
| spears | 4.5 | 25 | 11 | 1.0 | pierce | DEX B, STR D | 1.0 | 0.9 | — |
| great_spears | 9.5 | 50 | 6 | 1.25 | pierce | STR B, DEX C | 1.1 | 1.2 | — |
| halberds | 8.0 | 40 | 9 | 1.1 | pierce | STR C, DEX C | 1.0 | 1.1 | — |
| thrusting_swords | 2.5 | 10 | 15 | 0.75 | pierce/magic | INT A, DEX D | 0.85 | 0.75 | sleep |
| heavy_thrusting | 6.5 | 35 | 10 | 1.1 | pierce/magic | INT B, STR D | 1.05 | 1.1 | glintstone |
| reapers | 9.5 | 45 | 6 | 1.2 | slash/occult | ARC A, DEX D | 1.2 | 1.2 | dread |
| whips | 3.0 | 5 | 14 | 0.9 | poison/occult | ARC B, DEX C | 0.9 | 0.95 | poison |
| bows | 4.0 | 8 | 15 | 0.85 | lightning | DEX A | 0.75 | 0.85 | — |
| greatbows | 11.0 | 60 | 4 | 1.6 | holy | FAI A, STR D | 1.4 | 1.4 | yearning |
| crossbows | 4.5 | 12 | ∞ | 0.85 | standard | DEX B | 0.5 | 0.0 | — |
| ballistas | 16.0 | 150 | 1 | 2.2 | standard | STR C, DEX D | 2.0 | 1.5 | death_blight |
| torches | 1.5 | 2 | ∞ | 0.6 | fire | FAI A, INT D | 0.7 | 0.5 | grace |
| fists | 1.0 | 5 | 12 | 0.65 | standard | STR C, DEX C | 1.0 | 0.0 | — |

**Infused scaling** (applied to weapon when a skill moveset is equipped):
daggers→ARC A, straight_swords→INT A, greatswords→INT A, colossal_swords→INT A, katanas→INT A, curved_swords→ARC A, twinblades→ARC S, hammers→FAI A, great_hammers→FAI A, colossal_weapons→ARC A, axes→INT A, spears→FAI A, great_spears→FAI A, halberds→INT A, flails→ARC A.

---

## Moveset Generation

### Combo length distribution

Base weights (before variant clamp): 1=20%, 2=40%, 3=30%, 4=9%, 5=0.99%, 6=0.009%, 7=0.001%.

Variant max (epic/legendary +1): Light=3, Heavy=5, Skill=4, Jump=2.

### Medium coherence

First step uses the archetype's dominant medium. Each subsequent step has 80% chance to keep the same medium as the previous step; 20% chance to pick a different one from the archetype pool.

### Stage chains per archetype

| Archetype | Chains |
|---|---|
| long_form | `[Outline,Generate,Refine,Publish]` or `[Ideate,Outline,Generate,Refine,Publish]` |
| micro | `[Ideate,Publish]` or `[Generate,Publish]` |
| commentary | `[Research,React,Publish]` or `[Research,React,Glue,Publish]` |
| research | `[Research,Glue,Publish]` or `[Research,Outline,Generate,Publish]` |
| compression | `[Generate,Refine,Publish]` or `[Research,Refine,Publish]` |
| remix | `[Research,Repurpose,Publish]` or `[Repurpose,Refine,Publish]` |
| storytelling | `[Ideate,Outline,Generate,Glue,Refine,Publish]` |
| hot_take | `[Generate,Publish]` or `[Ideate,Generate,Publish]` |
| async | `[Outline,Generate,Publish]` or `[Generate,Refine,Publish]` |
| editing | `[Research,Refine,Publish]` or `[Generate,Refine,Repurpose,Publish]` |

### Atomic step stats

```
base_damage  = round(TIME_DMG × MODE_MULT × 10)
poise_damage = round(TIME_DMG × 1.5)
time         = TIME_SECS[time_budget]
```

**TIME_DMG:** Micro=1, Short=2, Medium=4, Long=7, Deep=12

**MODE_MULT:** Creating=1.0, Connecting=1.1, Commentary=0.9, Expanding=0.8, Remixing=0.7, Compressing=0.6, Consuming=0.4

**TIME_SECS:** Micro=300s (5 min), Short=600s, Medium=900s, Long=1500s, Deep=2700s (45 min)

**Stamina per step:** `round(TIME_STA[time_budget] × MEDIUM_STA[medium])`
TIME_STA: Micro=2, Short=4, Medium=7, Long=10, Deep=18
MEDIUM_STA: Writing×1.0, Audio×1.1, Video×1.3, Image×0.9, Design×1.2, Outline×0.6, Hybrid×1.4

### Rarity multipliers (applied to all steps)

| Rarity | Damage | Stamina |
|---|---|---|
| common | ×1.0 | ×1.0 |
| magic | ×1.1 | ×0.95 |
| rare | ×1.2 | ×0.9 |
| epic | ×1.35 | ×0.85 |
| legendary | ×1.5 | ×0.75 |

### Class modifiers applied at generation time

- `time_mod` multiplies every step's time (e.g. daggers ×0.8, colossal weapons ×1.6)
- `stamina_mod` multiplies total moveset stamina cost

### Naming convention

`"<Archetype> · <Time> · <DmgType> · <ComboLabel>"`

ComboLabels: 1=no suffix, 2=Duo, 3=Trio, 4=Combo, 5=Super Combo, 6=Epic Combo, 7=Legendary Combo.

---

## Infusion System

Skill movesets generated for a weapon class carry `infusion: classDef.infused_scaling`. When equipped to a weapon slot via the EquipOverlay, the infusion stats are merged into the weapon's `scaling` field (original scaling backed up in `scaling_original`). Removing the moveset restores the original scaling.

---

## Combat Phases

```
PLAYER_ATTACK → STEP_TIMER → (back to PLAYER_ATTACK or ENEMY_ATTACK)
ENEMY_ATTACK  → STEP_TIMER → PLAYER_ATTACK
ENEMY_STAGGERED → PLAYER_ATTACK
VICTORY | DEFEAT | FLED
```

On entering enemy turn: active status DOT/effects are processed first (`processActiveStatuses`), then the enemy selects a random move from its moveset.

---

## Defense Options

| Action | Stamina | Task | Success reward | Failure |
|---|---|---|---|---|
| Roll | 0 cost | Enemy's `dodge_task` (20s) | +25 STA, 0 damage | Full damage |
| Block | −15 STA | None (instant) | 0 damage | — |
| Parry | 0 cost | Enemy's `publish_task` (20s) | Counter-damage + full STA restore | Full damage |
| Take Hit | +25 STA | None (instant) | — | Full damage |
| Flee | — | None | Ends run, runes preserved | — |

Roll also chains through the enemy's generated roll moveset steps (multi-step across successive rolls in the same combat).

---

## Weapon Slots

```
constant_movesets[0]  Light moveset  — always available, 0 FP
constant_movesets[1]  Heavy moveset  — always available, 0 FP
weapon_extra_movesets Skill slots    — from drops, costs FP, carries infusion
defense_movesets.block Block moveset — used on Block action
```

Skill slot count by rarity: common=1, magic=1, rare=2, epic=3, legendary=3–4.
