# Online Ring — System Design Spec

> Souls-like × Hack&Slash dla twórców contentu online.
> Tryb: eksperymentalny — pomysły do testu, nie balance sheet.

---

## 0. Filozofia projektu (TL;DR)

**Broń = tożsamość twórcza w danej walce.** Wybierając katanę, deklarujesz "dziś robię polished craft". Wybierając topór, deklarujesz "tnę i remixuję". To rozwiązuje paradox decyzyjny twórcy ("co mam dziś robić?") — nie wybierasz akcji, wybierasz narzędzie, a ono narzuca styl.

**Mob = wyzwanie z realu.** Trendy, hejt, algorithm shifts, burnout — wszystko skondensowane w telegrafowanych atakach z oknami reakcji.

**Dungeon = sesja twórcza.** Liniowy, ograniczony czasowo (48h), kończy się bossem-deliverable.

**Loot = nowe pomysły na movesety i bronie**, które rosną razem z Tobą.

---

## 1. Słownik pojęć

| Termin | Znaczenie w grze | Znaczenie w realu |
|---|---|---|
| **Weapon** | Klasa narzędzia z 1-4 movesetami | Typ contentu (long-form, micro, commentary, ...) |
| **Moveset** | Sekwencja 2-5 atomowych ruchów | Pipeline produkcji (outline → draft → publish) |
| **Move** | Pojedynczy atomowy ruch (kilka-kilkadziesiąt min) | Faktyczna akcja (napisanie outline'u, refine itp.) |
| **Reactive Move** | Krótka reakcja gracza na atak moba (kilkadziesiąt sek) | Szybka decyzja: odpowiedzieć na DM, zignorować trend, ... |
| **Dungeon** | Liniowa sekwencja sublokacji + boss, 48h limit | Sesja twórcza / sprint |
| **Mob** | Przeszkoda z attack patternem | Sytuacja wymagająca reakcji |
| **Boss** | Końcowy mob dungeona | Główny deliverable sesji |
| **Heat** | Licznik użycia broni w dungeonie | Wypalenie konkretnej formy |
| **Affix** | Prefix/suffix modyfikujący broń | Specjalne właściwości narzędzia |

---

## 2. Architektura warstwowa

```
DUNGEON (48h, liniowy)
  ├─ SUBLOCATION × N (5-12)
  │    ├─ MOB / ELITE / CHEST / MERCHANT / EVENT
  │    └─ Last: BOSS
  │
  └─ PLAYER (z 2 broniami w slotach)
       ├─ HP / Stamina / FP (Mana)
       ├─ Consumables (estus, cleanse, ...)
       └─ EQUIPMENT
             ├─ Main weapon (1-4 moveset slots)
             └─ Off-hand weapon (1-4 moveset slots)

MOVESET (przypisany do broni)
  ├─ Level 1-10 (rozszerza pipeline)
  ├─ Light variant (5-15 min)
  ├─ Heavy variant (25-60 min)
  └─ Skill variant (Ash-of-War slot — wymienialny)

MOB
  ├─ Archetype + size + speed_class
  ├─ Attack pattern (4-8 telegrafowanych ataków)
  └─ Weaknesses / resistances / loot_table
```

---

## 3. Klasy broni → content archetypes

Każda klasa broni mapuje się na typ twórczości. To jest sercem systemu — wybór broni = wybór formy.

| Weapon class | Content archetype | Tempo | Sygnatura |
|---|---|---|---|
| Daggers | Micro-content (tweety, shorty) | bardzo szybkie | Wysoka kadencja, niski damage/hit |
| Straight Swords | Standardowy blog / artykuł | średnie | Zbalansowane, all-purpose |
| Greatswords | Long-form essays | wolne | Ogromny damage, drogie staminowo |
| Colossal Swords | Książki, kursy, e-booki | bardzo wolne | Wymagają dużo prep, devastating damage |
| Thrusting Swords | Komentarze, reply-content | szybkie | Precyzja, counter-attacki |
| Heavy Thrusting | Pogłębione komentarze, analizy | średnie | Penetracja resistance'ów |
| Curved Swords | Storytelling, narracja | średnie | Płynne combo, flow-state friendly |
| Curved Greatswords | Saga / serial narracyjny | wolne | Long-form storytelling |
| Katanas | Polished craft pieces | średnio-szybkie | Bleed (hook stack), elegancja |
| Twinblades | Multi-platform cross-posting | szybkie | Dual-wielding mediów |
| Hammers | Hot takes, opinions | średnie | Stance break (przebijanie algo) |
| Great Hammers | Manifest, big opinion piece | wolne | Wielki stagger |
| Axes | Editing / compression istniejących treści | średnie | Cutting work |
| Great Axes | Recap / "year in review" content | wolne | Wielkie podsumowania |
| Flails | Spontaneous / improv | erratic | Trudne do kontroli, wysoki spread |
| Colossal Weapons | Mega-projekty (dokumenty, serie) | bardzo wolne | Cooldown-heavy |
| Spears | Research-driven content | średnie | Zasięg, dystans |
| Great Spears | Investigative content | wolne | Long-reach, pierce armor |
| Halberds | Hybrid research+opinion | średnie | Wszechstronność |
| Reapers | Commentary / takedowns | wolno-erratic | Death Blight potencjał |
| Whips | Series / cykle | średnie | Mid-range, multi-target |
| Fists / Claws | Raw BTS / vlogs | bardzo szybkie | Brak medium, czysta osobowość |
| Bows | Async content (newsletter) | wolne | Strzelasz i czekasz |
| Greatbows | Long-tail content | bardzo wolne | High-impact w dłuższym czasie |
| Crossbows | Email blasts, push content | średnie | Precyzyjny strzał |
| Ballistas | Big launches / produkty | bardzo wolne | Long charge, devastating |
| Torches | Lifestyle / lo-fi vlog | szybkie | Słaby damage, buff'uje innych |

> **Sub-classes broni (wymagane).** Każda broń ma poza weapon_class także **affinity sub-class** wynikającą z prefiksu (np. "Bleeding Katana", "Frostbite Katana", "Holy Greatsword"). Sub-class **zmienia signature movesetu**:
>
> - **Bleeding Katana** → moveset signature wymaga hooków/cliffhangerów, każdy ruch dodaje hook stack
> - **Frostbite Katana** → moveset signature wymaga strong opening (pierwsze 30s = 2× dmg), reszta movesetu może być słabsza
> - **Madness Hammer** → moveset signature wymaga opinion/stance move
> - **Poison Spear** → moveset signature wymaga evergreen framing
> - **Holy Greatsword** → moveset signature wymaga evergreen + brak trend-references
>
> To znaczy: nie ma "pustej" broni — każdy egzemplarz ma tożsamość. Wybór broni = wybór nie tylko klasy, ale i konkretnego "vibe" tworzenia.

---

## 4. Movesety w broni (light/heavy/skill/jump)

Każda broń ma sloty movesetów. **Liczba slotów Skill (Ash-of-War) zależy od rzadkości broni** — to jeden z kluczowych benefitów lepszego lootu:

```
WEAPON SLOTS:
  ├─ Light Moveset      — krótki (5-15 min), niski damage, niska stamina
  │                       Fixed dla weapon class.
  ├─ Heavy Moveset      — długi (25-60 min), wysoki damage, wysoka stamina + FP
  │                       Fixed dla weapon class.
  ├─ Skill Moveset(s)   — Ash-of-War sloty, wymienialne dropami:
  │                       Common:    1 slot
  │                       Magic:     1 slot
  │                       Rare:      2 sloty
  │                       Epic:      3 sloty
  │                       Legendary: 3-4 sloty
  │                       Mythic:    4 sloty
  └─ Jump Moveset       — sytuacyjny (po staggerze moba, bonus damage)
                          Fixed dla weapon class.
```

Light, Heavy, Jump są **fixed per weapon class** (charakteryzują ją). Skille są **swappable** — to gdzie odbywa się customization. Lepsza broń = więcej slotów Skill = więcej taktycznej elastyczności w walce.

> Przed walką gracz wybiera "active Skill" z dostępnych slotów (jeśli broń ma 3 Skille, w trakcie walki używa 1, pozostałe są "zapasem" do hot-swapu między walkami w dungeonie — jak Elden Ring war ash swap przy graces).

### Rytm walki

W trakcie walki mob telegrafuje ataki (windows reakcji 15-90 sek). Gracz nie chce w środku ataku moba odpalać 50-minutowego heavy. Stąd:

- **Light attacki** = robisz między telegrafami moba. Szybkie odpowiedzi, micro-content.
- **Heavy attacki** = otwierasz po staggerze / udanej parry / dużym oknie.
- **Skill** = sytuacyjny "special move" — odpalasz strategicznie.
- **Jump** = bonus po stagger break.

> **Eksperyment:** ataki wymagają **commitmentu** — odpaliłeś heavy = nie możesz się wycofać przez X sekund. Mob może w trakcie odpalić atak, którego nie unikniesz, jeśli źle wytimingowałeś.

---

## 5. Levelowanie movesetów i broni

Dwa niezależne tory progresji: **movesety** rosną przez wykonywanie w walce, **bronie** rosną przez killcount mobami.

---

### 5.1 Levelowanie movesetu — "prep → execution"

Twoja koncepcja: niższe levele = prep work, wyższe levele = pełny pipeline.

```
MOVESET PROGRESSION (przykład: "Long-form Essay" na katanie):
  Lvl 1: [Outline]                                        20 min, dmg ★
  Lvl 2: [Outline → Draft]                                35 min, dmg ★★
  Lvl 3: [Outline → Draft → Refine]                       50 min, dmg ★★★
  Lvl 4: [Draft → Refine → Publish]                       45 min, dmg ★★★★
         (drop Outline — "masz w głowie")
  Lvl 5: [Draft → Refine → Publish → Repurpose]           60 min, dmg ★★★★★ + loot bonus

  Lvl 6+: Unlock variants
  Lvl 8+: Reduced stamina cost
  Lvl 10: Mastery — passive bonus active wherever this moveset jest equipped
```

#### Jak movesety zdobywają XP

- Wykonanie ruchu w walce = XP do tego konkretnego movesetu.
- XP nie skaluje się z liczbą walk, tylko z **łącznym czasem włożonym** (i ewentualnie z trudnością moba).
- XP **persistent** między dungeonami — nawet jak run skończy się porażką, XP movesetu zostaje.

#### Variants (od lvl 6)

Każdy moveset może mieć 2-3 warianty odblokowane na wyższych levelach:

- **Long variant** — dłużej, więcej damage
- **Compressed variant** — krócej, mniej damage, ale **nie buduje heat** (do alternacji broni)
- **Risky variant** — wymaga "Death Blight check" (spicy take) — albo insta-kill, albo backfire

Gracz wybiera wariant **przed każdym wykonaniem movesetu**. To realny choice.

---

### 5.2 Levelowanie broni — "+0 do +10"

Klasyczny Souls-like system upgrade'u, **bez smithing stones** (nie ma osobnego upgrade material). Broń rośnie sama, gdy nią walczysz.

```
WEAPON PROGRESSION:
  +0  ← baseline (broń przy dropie)
  +1  ← podstawowa progresja
  ...
  +10 ← cap (mastery z bronią)
```

#### Jak bronie zdobywają XP

- **Każdy pokonany mob daje XP do aktywnej broni** (tej która zadała ostatni cios lub była użyta w bezpośrednim combo).
- XP **persistent** między dungeonami.
- Boss-kill: znaczący bonus XP (np. 5-10× regular mob XP).
- XP **nie** skaluje się z czasem włożonym (jak moveset XP) — to czysty killcount.
- XP curve rośnie z każdym levelem (więcej killi potrzebnych na wyższe poziomy).

Dwa tory zachęcają do różnych aktywności: leveluj broń przez **eksplorację** (więcej walk), leveluj moveset przez **głębię** (dłuższe sesje).

#### Co odblokowuje levelowanie broni

```
WEAPON LEVEL BENEFITS (od +1 do +10):
  Każdy level:        +base_damage scaling
                      (skala zależna od rarity — zob. niżej)

  +3:                 +1 affix slot (jeśli rarity ≥ Magic)
                      Pusta sloty można uzupełnić affixami z drops/forge.

  +5:                 +1 Skill slot (Ash-of-War)
                      (jeśli weapon nie jest już na cap dla swojej rarity)

  +7:                 +1 affix slot (jeśli rarity ≥ Rare)

  +10:                Mastery — broń zyskuje unique passive lub
                      wzmocniony już posiadany special property (dla Epic+)
```

Affix slots **odblokowane przez level są puste** — gracz może je uzupełnić affixami zdobytymi z forge events lub specjalnych dropów (TBD: skąd dokładnie pochodzą "luźne" affixy).

#### Damage scaling per rarity

**Rarity wpływa na siłę levelowania.** Im lepsza broń, tym więcej daje każdy level — ale każda broń może osiągnąć +10.

```
DAMAGE SCALING per level (per rarity):
  Common (white):    +3% damage per level    (cap +10 = +30%)
  Magic (blue):      +4% damage per level    (cap +10 = +40%)
  Rare (yellow):     +5% damage per level    (cap +10 = +50%)
  Epic (purple):     +6% damage per level    (cap +10 = +60%)
  Legendary (orange): +8% damage per level   (cap +10 = +80%)
  Mythic (red):      +10% damage per level   (cap +10 = +100%)
```

To znaczy: Common +10 nadal kop ie, ale Legendary +10 jest dramatycznie silniejszy. Warto inwestować czas w lepsze bronie, ale Common +5 z dobrym setupem affixów + movesetem może być konkurencyjny do Rare +0.

#### Cap Skill slots per rarity (z uwzględnieniem levelowania)

| Rarity | Base Skill slots | Cap przy +10 |
|---|---|---|
| Common | 1 | 1 |
| Magic | 1 | 1 |
| Rare | 2 | 2 |
| Epic | 3 | 3 |
| Legendary | 3-4 | 4 |
| Mythic | 4 | 4 |

Skill slot z levelowania (+5) dodawany jest **tylko jeśli rarity pozwala na więcej** — Common nigdy nie przekracza 1 slot. Legendary z bazowymi 3 slot przy +5 zyskuje 4. Mythic startuje już z 4 i nie zyskuje więcej.

#### Mastery (+10) — special properties

Na +10 broń zyskuje unikalny passive zależny od weapon_class i rarity:

| Broń + Rarity | Mastery effect |
|---|---|
| Common/Magic | +1 affix slot bonus |
| Rare | Affix re-roll: jeden affix można jednorazowo zmienić |
| Epic | Wzmocnienie istniejącego special property o +50% |
| Legendary | Druga instancja unique mechanic (np. Rhythm Weapon: 2× rhythm bonus) |
| Mythic | Game-changer X2 — np. compass weapon odblokowuje dwie alternatywne ścieżki zamiast jednej |

#### Whetstone shrines (event reward)

Event "Whetstone shrine" (sublocation event) daje **jednorazowy boost +1 do levelu wybranej broni** w obrębie dungeona. To przyspiesza progresję, ale nie zastępuje normalnego XP-killcount toru — to bonus, nie main path.

---

## 6. Generator broni (loot algorithm)

### Krzywa rzadkości

| Rarity | Affixy | Moveset slots | Special |
|---|---|---|---|
| Common (white) | 0 | 1 base | — |
| Magic (blue) | 1-2 | 1-2 | — |
| Rare (yellow) | 3-4 | 2-3 | + 1 unique moveset |
| Epic (purple) | 5-6 | 3-4 | + 1 special property |
| Legendary (orange) | fixed template + scaling | 3-4 | unique gameplay mechanic |
| Mythic (red) | game-changer | 3-4 | level-design altering |

### Pseudo-algorytm

```
ROLL_WEAPON(dungeon_level, luck, biome, mob_tier):
  1. weapon_class      ← weighted_random(biome.weapon_affinity)
  2. rarity            ← roll_rarity_curve(luck, mob_tier)
  3. base_damage       ← scale(dungeon_level, weapon_class.base)
  4. n_moveset_slots   ← table_lookup(weapon_class, rarity)
  5. base_movesets     ← pick_n(weapon_class.moveset_pool, n_moveset_slots)
  6. affixes           ← roll_affixes(rarity.affix_count, weapon_class.allowed_pool)
  7. if rarity >= Epic:
        special_property ← pick(unique_pool, weighted_by_class)
  8. if rarity >= Legendary:
        replace with curated template from legendary_pool
  9. heat_threshold    ← weapon_class.base_heat × rarity_multiplier
  10. return WeaponInstance(...)
```

### Affixy (strukturalizacja)

**Stat prefiksy/sufiksy** (Diablo-tier, częste):
- `+X% damage`, `-X% czas movesetu`, `-X stamina`, `-X FP`, `+X% XP`
- `+X% damage vs <mob_archetype>` (np. vs algorithmic, vs niche)
- Element affinity: Fire (urgency/trendy), Magic (educational), Lightning (viral/fast), Holy (evergreen), Strike/Slash/Pierce (formy nacisku)

**Status effect prefiksy** — wszystkie działają w obrębie walki, bez external metrics:

| Status | Mechanika in-fight |
|---|---|
| Bleed | Po combo dodaje "Hook stack" do moba. Następny moveset wymaga hooka → bonus dmg |
| Madness | Następny moveset musi mieć "opinion move" → bonus |
| Frost Bite | Pierwsze 30s movesetu robi 2x dmg, jeśli zawiera hook opening |
| Poison | Slow damage, ale moveset musi być evergreen-coded |
| Scarlet Rot | Damage proporcjonalny do długości — karze za long dives bez compression |
| Sleep | Mob ignoruje krótkie movesety, tylko deep moves go budzą |
| Death Blight | Insta-kill chance, gdy moveset zawiera "spicy take" — risk/reward |

### Rare special properties (Epic)

Z Twoich notatek, tylko mechaniczne:

| Property | Mechanika |
|---|---|
| **Lifesteal** | +X stamina po wykonaniu udanego combo |
| **Mana steal** | +X FP po pokonaniu moba |
| **Moveset theft** | Po pokonaniu moba: szansa Y% na drop jego movesetu (jeśli ma) |
| **Stat theft** | Po pokonaniu moba: jego damage type staje się Twoją resistance na 1 dungeon |
| **Drop bonus** | +X% szansy na dropienie movesetu zamiast broni |
| **Rhythm bonus** | +X% damage za każdy powtórzony moveset w sekwencji (consistency reward) |
| **Stance breaker** | +X% szansy na stagger moba (synergia z Heavy / Hammers) |
| **FP burner** | Konwersja stamina → FP w trakcie walki |

### Legendary game-changers

Z Twoich notatek, po przerobieniu na czyste mechanics:

#### Broń ucząca się gracza
Po N walkach: jej movesety **re-rollują się z biased RNG** ku Twoim najczęściej używanym move_types. Jeśli najczęściej grasz "Outline → Draft", broń zacznie generować movesety zaczynające się tymi etapami.

#### Broń-pasożyt
Przed dungeonem: pobiera X% staminy z capa. W dungeonie: +Y% damage. Po dungeonie: nie regeneruje przez 1 cooldown dungeon. High-output streak weapon.

#### Broń z pamięcią przeciwników
Każdy zabity mob danego archetypu: +1% damage vs ten archetyp (cap 30%). **Persistent across dungeons**. Specjalizacja w niszy.

#### Broń narracyjna (mechanical version)
Pamięta **typy** Twoich movesetów. Co 10 walk **odblokowuje nowy moveset slot** złożony z najczęściej używanych ruchów. Konkretny mechanizm progresji + flavor text zmienia się dynamicznie.

#### Broń społeczna
Buff aktywuje się tylko, gdy wykonasz "collab move" w movesecie (mention, response, quote, RT-z-dodaną-myślą). +X% damage tylko wtedy.

#### Rhythm weapon
+X% damage za każdy z rzędu moveset wykonany tym samym kombo. Reset przy zmianie. Klasyczne "consistency reward".

#### Fear weapon
Po pokonaniu bossa: następny mini-boss w łańcuchu dungeonów ma debuff. Inwestycja w streak between dungeons.

### Mythic (level-design altering)
Bardzo rzadkie. Przykład: **Compass weapon** — odblokowuje dodatkową ścieżkę w dungeonie (alternatywna sublocation z bonusowym lootem).

---

## 6.5 Generator movesetów

Movesety są **osobnym lootem** od broni (jak Ash of War w Elden Ring). Wypadają z mobów/bossów albo są wbudowane jako fixed Light/Heavy/Jump w broni przy roll'u.

### Anatomia movesetu (poziom moveset)

```
MOVESET:
  archetype:        Long-form | Micro | Commentary | Compression | Expansion |
                    Remix | Research | Storytelling | Hot-take | Series | Async
  weapon_affinity:  list of allowed weapon_classes (np. [Katana, Curved Sword])
  variant_type:     Light | Heavy | Skill | Jump
  combo_length:     2-5 (rolled by level/rarity)
  moves:            list of ATOMIC MOVES (każdy ma własne wymiary — zob. niżej)
  signature_tags:   list of required tags (hook | opinion | evergreen | spicy | ...)
                    — patrz sub-class broni dla bonusów
  base_damage:      sum of moves[].damage_contribution
  stamina_cost:     sum of moves[].stamina_cost
  fp_cost:          sum of moves[].fp_cost (głównie z Heavy/Skill moves)
  heat_cost:        bazowy heat per użycie (Light=1, Heavy=3, Skill=2, Jump=2)
  rarity:           Common → Mythic
  poise_damage:     bazowy poise (zależny od variant_type i weapon_affinity)
```

### Anatomia atomic move (7 wymiarów + statystyki)

Każdy atomic move w combo ma 7 wymiarów ortogonalnych. Generator losuje wymiary spójnie (nie wszystkie kombinacje są dopuszczalne — zob. reguły spójności).

```
ATOMIC_MOVE:
  # 1. MEDIUM — co fizycznie produkujesz
  medium:           Writing | Audio | Video | Image | Design | Outline | Hybrid

  # 2. COGNITIVE MODE — jak pracujesz
  cognitive_mode:   Creating | Consuming | Connecting | Commentary |
                    Compressing | Expanding | Remixing

  # 3. STAGE — gdzie w pipeline content lifecycle
  stage:            Ideate | Outline | Draft | Produce | Refine |
                    Publish | Repurpose | Consume | React | Connect

  # 4. PLANNING — jak start pracy
  planning:         Spontaneous | Planned | Scheduled

  # 5. PUBLICATION — co dzieje się z output
  publication:      just_work | private | draft_published | public

  # 6. TIME BUDGET — bucket czasowy
  time_budget:      Micro (5 min) | Short (15 min) | Medium (25 min) |
                    Long (50 min) | Deep (90+ min)

  # 7. CONTENT ORIGIN — skąd content
  content_origin:   New | Compression | Expansion | Recycled (port) |
                    Remastered | Revamped | Reboot

  # Stats — wyliczane z wymiarów
  damage_contribution: f(time_budget, mode, publication)
  stamina_cost:        f(time_budget, medium)
  fp_cost:             f(mode, stage)                    # high dla Connect/Compress/Expand
  poise_contribution:  f(time_budget, weapon_weight)

  # Tags — dla synergii ze statusami i sub-classes broni
  tags:                subset of {hook, opinion, evergreen, spicy, niche,
                                  collab, viral_potential, slow_burn, ...}
```

#### Skalowanie statów

```
DAMAGE_CONTRIBUTION:
  base by time_budget:   Micro=1, Short=2, Medium=4, Long=7, Deep=12
  × mode_mult:           Creating=1.0, Remixing=0.7, Commentary=0.9,
                          Connecting=1.1, Compressing=0.6, Expanding=0.8,
                          Consuming=0.0  (input, no direct damage)
  × publication_mult:    just_work=0.4, private=0.6, draft_published=1.0,
                          public=1.3

STAMINA_COST:
  base by time_budget:   Micro=2, Short=5, Medium=10, Long=20, Deep=40
  × medium_mult:         Writing=1.0, Audio=1.1, Video=1.3, Image=0.9,
                          Design=1.2, Outline=0.6, Hybrid=1.4

FP_COST (high-intelligence moves):
  +5 per Connecting move
  +5 per Compressing move
  +3 per Expanding move
  +3 per Remixing move
  +0 dla Creating/Consuming/Commentary (chyba że Deep — wtedy +3)
```

### Pula atomic moves — przykłady wymiarów

Atomic move nie jest pojedynczą nazwą — jest **kombinacją wymiarów**. Te same nazwy mogą reprezentować różne wymiary. Przykłady:

| Move name | Medium | Mode | Stage | Time | Origin | Tags |
|---|---|---|---|---|---|---|
| Bullet outline | Outline | Creating | Outline | Short | New | — |
| Long-form write | Writing | Creating | Draft | Deep | New | hook? |
| Quick tweet | Writing | Creating | Publish | Micro | New | spicy? |
| Hot take | Writing | Creating | Publish | Short | New | opinion, spicy |
| Reply post | Writing | Commentary | React | Short | New | — |
| Quote-tweet riff | Writing | Commentary | React | Micro | New | viral_potential |
| Synthesis post | Writing | Connecting | Connect | Long | New | evergreen |
| Roundup | Writing | Connecting | Connect | Medium | New | — |
| Research dive | — | Consuming | Consume | Long | — | — |
| Watch reference | Video | Consuming | Consume | Medium | — | — |
| Video draft | Video | Creating | Draft | Long | New | — |
| Voice memo | Audio | Creating | Draft | Short | New | spontaneous |
| Record podcast | Audio | Creating | Produce | Deep | New | — |
| Color grade | Video | Creating | Produce | Medium | New | — |
| Polish copy | Writing | Refining (Compressing) | Refine | Medium | Compression | — |
| Hook rewrite | Writing | Compressing | Refine | Short | Compression | hook |
| Thumbnail design | Image | Creating | Refine | Short | New | viral_potential |
| Final publish | — | Creating | Publish | Micro | — | — |
| Schedule post | — | Creating | Publish | Micro | — | — |
| Recut to short | Video | Compressing | Repurpose | Medium | Compression | viral_potential |
| Adapt to text | Writing | Remixing | Repurpose | Medium | Recycled | — |
| Cross-post | — | Remixing | Repurpose | Micro | Recycled | — |
| Long essay from short | Writing | Expanding | Repurpose | Deep | Expansion | — |
| Remaster old post | Writing | Remixing | Refine | Medium | Remastered | — |
| Revamp series | Hybrid | Remixing | Produce | Deep | Revamped | — |
| Reboot concept | Hybrid | Creating | Ideate | Long | Reboot | — |

> Lista jest reprezentatywna, nie wyczerpująca. Generator w trakcie rolla **konstruuje** atomic move z wymiarów, niekoniecznie wybierając z fixed listy.

### Reguły spójności wymiarów

Nie wszystkie kombinacje wymiarów mają sens. Generator je waliduje:

```
SPÓJNOŚĆ:
  Consume mode + stage Consume   → required (sam siebie definiuje)
  Consuming mode + publication=public → INVALID (consume nie ma outputu)
  Commentary mode → stage musi być React lub Connect
  Compressing/Expanding mode → content_origin musi NIE być "New"
  Remixing mode → content_origin musi być Recycled/Remastered/Revamped/Reboot
  stage Publish → time_budget zazwyczaj Micro/Short (publikacja jest szybka)
  stage Ideate/Outline → publication=just_work zwykle (prep nie publikuje)
  medium=Outline + stage≠(Ideate|Outline|Draft) → unusual (flag, ale OK)
  time_budget=Deep + medium=Outline → unusual (outline rzadko trwa 90 min)
```

### Pseudo-algorytm rolla movesetu

```
ROLL_MOVESET(source: monster | weapon_base, rarity, weapon_affinity):

  # POZIOM MOVESETU
  1. archetype       ← weighted by source biome + weapon_affinity
  2. variant_type    ← Light (40%) | Heavy (25%) | Skill (30%) | Jump (5%)
  3. combo_length    ← table_lookup(rarity, variant_type)
       Light:  2-3 ruchy
       Heavy:  3-5 ruchów
       Skill:  2-4 ruchy
       Jump:   1-2 ruchy
  4. signature_tags  ← weighted by source.element / monster.weaknesses
       (np. mob z Bleed weakness → moveset z "hook" w tags)

  # WYBÓR DOMINANT AXES (spójność w obrębie movesetu)
  5. dominant_medium ← weighted by archetype + weapon_affinity
       (Long-form → Writing | Audio long, Micro → Writing | Image short,
        Storytelling → Writing | Video, Async → Audio | Writing, ...)
  6. dominant_planning ← weighted by archetype
       (Hot-take → Spontaneous, Long-form → Planned, Series → Scheduled)
  7. dominant_origin ← weighted by archetype
       (Long-form → New, Compression archetype → Compression,
        Remix → Recycled/Remastered/Revamped/Reboot)
  8. target_publication ← weighted by rarity + archetype
       (rarity Common → just_work/private bias, rarity Epic+ → public bias)
  9. target_time_budget ← weighted by variant_type
       (Light → Micro/Short, Heavy → Long/Deep, Skill → Short/Medium, Jump → Micro)

  # KONSTRUKCJA COMBO (per atomic move)
  10. stage_chain    ← pick valid chronological chain
        (np. Outline → Draft → Refine → Publish for Long-form Heavy)
  11. for each slot i in combo_length:
        atomic_move ← {
          medium:        dominant_medium (lub komplementarne, np. Hybrid mid-combo)
          cognitive_mode: zależnie od stage (Outline=Creating, Refine=Compressing,
                                              Repurpose=Remixing, ...)
          stage:         stage_chain[i]
          planning:      dominant_planning (czasem variation per move)
          publication:   eskaluje przez combo (last move = target_publication,
                                                 wcześniejsze = just_work/private/draft)
          time_budget:   distribute target_time_budget across moves
                         (z biasem na Draft/Produce w środku, krótsze ends)
          content_origin: dominant_origin (czasem variation, np. ostatni Repurpose move
                          może mieć origin=Recycled)
          tags:          drawn from signature_tags + random extras
        }
        validate_consistency(atomic_move) → reject + redraw if INVALID

  # STATYSTYKI
  12. base_damage      ← sum of moves[].damage_contribution × archetype_mult
  13. base_stamina     ← sum of moves[].stamina_cost
  14. base_fp          ← sum of moves[].fp_cost
  15. poise_damage     ← f(combo_length, variant_type, dominant_medium_weight)

  # RZADKOŚĆ
  16. rarity affixy    ← per rarity:
        Common:    none
        Magic:     1-2 stat affixy (+dmg, -stamina, ...)
        Rare:      2-3 affixy + 1 signature_tag bonus
        Epic:      3-4 affixy + special effect
        Legendary: unique mechanic
        Mythic:    game-changer

  17. return MovesetInstance(moves, signature_tags, stats, rarity_effects, ...)
```

### Walidacja chronologii (przykłady valid chains)

| Archetype | Typowy chain |
|---|---|
| Long-form Heavy | Outline → Draft → Refine → Publish |
| Micro Light | Ideate → Publish |
| Commentary | Consume → React → Publish |
| Research | Consume → Connect → Publish |
| Compression | (skip Outline) Draft → Refine (Compress) → Publish |
| Remix | Consume (own) → Repurpose → Publish |
| Storytelling Deep | Ideate → Outline → Draft → Produce → Refine → Publish |
| Async Bow | Outline → Draft → Schedule (Publish) |
| Series | Outline → Draft → Refine → Schedule + future Repurpose |
| Hot-take | Spontaneous Draft → Publish (z opcjonalnym Refine) |

Wyższe levele movesetu mogą **dropować early stages** ("masz w głowie") — zob. sekcja 5.

### Rzadkość movesetu → siła

| Rarity | Combo | Bonusy |
|---|---|---|
| Common | 2-3 | brak |
| Magic | 2-4 | 1-2 stat affixy |
| Rare | 3-4 | 2-3 affixy + signature_tag = bonus |
| Epic | 3-5 | 3-4 affixy + special effect (np. "Free Repurpose": kolejny moveset costs 0) |
| Legendary | 4-5 | unique mechanic (np. "Echo Chamber": moveset gra się 2× za jednym razem) |
| Mythic | 5 | game-changer (np. "Time Fold": następna walka in dungeon ma -50% timer cost) |

### Skąd movesety wypadają

- **Boss**: gwarantowany moveset min. Rare, zgodny z bossowym archetypem.
- **Elite mob**: szansa Y% na moveset zgodny z mob archetypem.
- **Regular mob**: niska szansa na Common/Magic moveset.
- **Chest**: szansa na moveset (vs broń vs consumable).
- **Forge event**: kombinowanie dwóch movesetów w hybrid.

### Equippowanie movesetu w broni

- Moveset ląduje w **Skill slot** broni (Ash-of-War style).
- Wymóg: `weapon_affinity` movesetu musi zawierać klasę broni.
- Niektóre movesety są **uniwersalne** (any weapon).
- Light/Heavy/Jump movesetów **nie da się podmienić** — są częścią identity broni.

> **Spójność z sub-classes broni:** Bleeding Katana + moveset z signature "hook" = synergia (bonus dmg). Holy Greatsword + spicy moveset = penalty/conflict. Eksperymentowanie z combinations = część gry.

### Mob/weapon biasing wymiarów (jak loot source wpływa na rolla)

Każdy mob/broń ma **affinity weights** dla wymiarów. Generator je miksuje z archetypem:

```
ALGORITHM_WASTES biome bias:
  preferred medium:     Writing/Video (fast paced)
  preferred planning:   Spontaneous
  preferred origin:     New
  preferred time:       Micro/Short
  preferred publication: public

EVERGREEN_FOREST biome bias:
  preferred medium:     Writing (long-form, SEO)
  preferred planning:   Planned
  preferred origin:     New | Expansion
  preferred time:       Long/Deep
  preferred publication: public | draft_published

VIRAL_PEAKS biome bias:
  preferred medium:     Video/Image
  preferred planning:   Scheduled (drop timing)
  preferred origin:     New | Recycled
  preferred time:       Short/Medium
  preferred publication: public
  preferred tags:       viral_potential, hook, spicy
```

To znaczy: **dropując movesety w danym biomie, dostajesz movesety pasujące do tego "stylu pracy"**. Granie w wielu biomach = budowanie zróżnicowanego portfolio movesetów.

---

## 7. Weapon Overheat — core constraint

Najważniejsza mechanika antymonotonii. **Wymusza switching broni MIĘDZY dungeonami** — nie w obrębie jednego runu. W obrębie dungeona broń działa normalnie (chcesz pełnej mocy w trudnym lochu); to wybór które bronie zabrać w kolejne dungeony jest limitowany.

```
HEAT MECHANICS (across-dungeon cooldown):
  - W obrębie dungeona: każde użycie movesetu zwiększa weapon.heat.
  - Heat akumuluje się przez cały run.
  - Po zakończeniu dungeona (sukces lub reset):
       Heat broni jest porównywany z jej heat_threshold.
       Jeśli heat ≥ threshold → broń trafia na COOLDOWN.
       Cooldown = niedostępność broni przez N kolejnych dungeonów.
  - heat_threshold zależy od weapon_class i rarity:
       Dagger:         8-12 użyć (wysoki — to natural spam weapon)
       Straight sword: 6-8 użyć
       Greatsword:     3-5 użyć
       Colossal:       2-3 użycia
  - Cooldown length: 1-3 dungeony, zależnie od jak bardzo przekroczono threshold.
  - Cooldown DECREMENTUJE się tylko gdy broń NIE jest w stash slotach
    na entry kolejnego dungeona (nie używasz jej → ostygnie).
```

To znaczy: **w obrębie dungeona masz pełne 2 bronie i używasz ich jak chcesz**. Ale jeśli "spaliłeś" katanę w dungeonie A, następny dungeon (B) prawdopodobnie nie będzie miał katany w slot wyborze — przez 1-3 runy musisz grać czymś innym.

### Realne mapping

To odzwierciedla **wypalenie formy** — po intensywnym sprincie long-form essayów potrzebujesz tygodnia bez nich, a w tym czasie robisz coś krótszego. Gra wymusza ten cykl.

### Alternation reward

Niektóre bronie mają passive:
> *"+X% damage w dungeonie, jeśli ostatni ukończony dungeon był z inną bronią w slocie"*

Zachęca do **realnej rotacji** typów contentu między sprintami — nie spamujesz katany przez 5 dungeonów z rzędu.

### "Cool weapon" synergia

Niektóre bronie redukują heat **innej broni z drugiego slotu** w obrębie dungeona. Np. "Resting Quill" — co X walk daje -1 heat drugiej broni. Pozwala dłużej operować "main" broni w lochu.

---

## 8. Generator mobów

Moby losowo generowane, z tożsamością inspirowaną Elden Ringiem.

### Anatomia moba

```
MONSTER:
  archetype:        humanoid | beast | construct | spirit | swarm | giant
  size:             small | medium | large | colossal
  speed_class:      slow | medium | fast | erratic
  attack_pattern:   list of telegraphed_attacks  (4-8 dla mobów, 8-12 dla bossów)
  reactive_window:  base reaction time (modyfikowany przez speed_class)
  weaknesses:       1-2 damage types / status effects
  resistances:      1-2 damage types / status effects
  loot_table:       weights for weapon_classes / movesetów
  hp_pool:          scaled with dungeon_level
  damage_output:    scaled with dungeon_level
```

### Pula ataków (telegraphed_attacks)

| Attack | Reaction window | Reactive move | Notes |
|---|---|---|---|
| Quick jab | 15s | Dodge / Block | Spam attack |
| Wide swing | 30s | Parry (bonus) / Dodge | Reward za parry |
| Charge thrust | 45s | Side-step dodge | Block fails |
| Grab attempt | 20s | Dodge only | Parry fails |
| AOE slam | 60s | Roll out | Long telegraph |
| Ranged projectile | 30s | Block / Dodge | Distance check |
| Delayed strike | 90s (z fake-out) | Late dodge | Fake-out timing |
| Status spit | 25s | Dodge / Cleanse | Apply status |

### Archetypy mobów → metafory contentu

| Archetype | Metafora | Sygnatura ataków |
|---|---|---|
| Humanoid | Inni twórcy / konkurenci | Zbalansowane, parry-friendly |
| Beast | Trends / algorytmy | Erratic, szybkie, niezpryzkocyjne |
| Construct | Platformy / systemy | Slow, predictable, high HP |
| Spirit | Inner doubts / burnout | AOE, status-heavy |
| Swarm | Hejt / haterzy | Multi-target, niski indywidualny dmg |
| Giant | Big launches / wirale | Colossal, slow, devastating windows |

### Biomy + grupowanie mobów

| Biome | Mob types | Weapon affinity |
|---|---|---|
| Algorithm Wastes | Beasts (trends), Constructs (algo) | Daggers, Katanas |
| Niche Caverns | Specialists (Humanoid niche-creators) | Spears, Halberds |
| Viral Peaks | Giants (virals), Swarms (hype crowd) | Bows, Ballistas |
| Evergreen Forest | Slow Constructs (SEO golems) | Greatswords |
| Community Hollows | Swarms (engagement sprites, hater imps) | Whips, social weapons |
| Burnout Abyss | Spirits (inner demons, doubt phantoms) | Torch, narrative weapons |

Bronie z **pasującą affinity** dostają bonus damage w biomie. To wymusza budowanie kolekcji broni.

### Pseudo-algorytm generacji moba

```
ROLL_MONSTER(dungeon_level, biome, position_in_dungeon):
  1. archetype       ← weighted_random(biome.archetype_pool)
  2. size            ← weighted(position_in_dungeon)
                       (later in dungeon → bigger)
  3. speed_class     ← random_per_archetype
  4. n_attacks       ← 4-6 (mob), 8-12 (boss)
  5. attack_pattern  ← pick_n(archetype.attack_pool, n_attacks)
  6. sequence them   ← with cooldowns + chaining rules
  7. weaknesses      ← 1-2 from {damage_types, statuses}
  8. resistances     ← 1-2 from same pools (no overlap)
  9. hp/damage       ← scale_to_dungeon_level(dungeon_level, size)
  10. loot_table     ← biome-biased weapon_classes + movesetów
  11. return MonsterInstance(...)
```

### Bossowie

- 8-12 ataków zamiast 4-6
- **Druga faza** po 50% HP — pattern zmienia się, dodaje 2-3 nowe ataki
- **Gwarantowany loot**: min. Rare weapon lub moveset
- Możliwy **unique drop** dla konkretnego bossa (jak w Soulsach)

---

## 9. Reaktywne ruchy gracza (parry/dodge/block/roll)

Osobny zestaw od broni — to instynkt gracza, nie tool.

| Move | Stamina cost | Mechanic |
|---|---|---|
| **Dodge** | Niski | Krótkie i-frames, uniwersalny |
| **Block** | Średni | Redukcja damage, wymaga off-hand z tarczą |
| **Parry** | Wąskie okno | Stagger moba + critical follow-up |
| **Roll** | Wysoki | Długi dystans, dla AOE |

### Specjalizacja per weapon class

- Katana: lepszy parry window
- Fists / Claws: lepszy dodge
- Heavy weapons (Greatsword, Colossal): worse dodge, ale lepszy block
- Reapers: unique "soul dodge" — teleport krótki dystans

To dodaje warstwę identity broni poza damage profile.

---

## 10. Dungeon structure

### Stała struktura dungeona

**Ważne:** dungeony NIE są re-generowane przy każdym wejściu. To **kafelki z fixed narrative**, inspirowane Elden Ring:

- "Limgrave — Margit"
- "Castleblack — Godrick"
- ... (rosnąca trudność)
- "Ash Lyendell — Radagon + Elden Beast"

Każdy dungeon = stały region z mobami, sublokacjami i bossem. Wracając do tego samego dungeona, gracz widzi tę samą sekwencję (jeśli nie ukończył wcześniej) lub re-aktywowany dungeon (jeśli zaliczony — możliwy farming).

### Pseudo-algorytm (generacja PRZY TWORZENIU GRY, nie per wejście)

```
GENERATE_DUNGEON(narrative_slot, target_difficulty):
  1. biome             ← narrative_slot.biome
  2. n_sublocations    ← ~20 (15-25 zależnie od narrative_slot)
  3. for each sublocation (i in 1..n):
        position_ratio ← i / n
        content_roll   ← weighted_random:
          55% mob_encounter (1-2 mobs)
          15% elite_mob (silniejszy, gwarantowany loot)
          10% chest (loot bez walki, czasem mimic)
          10% merchant / NPC
          10% event (zob. niżej)
  4. last sublocation → BOSS (fixed dla tego narrative_slot)
  5. eskalacja: liniowa difficulty curve od start do boss
  6. spójność: wszystkie moby z biomu, archetypy spójne
  7. time_budget: estimate(sum of expected_moveset_times) × buffer
                  → display jako "Estimated work: X-Yh. Time limit: 48h"
```

### Czym są EVENTY (sublocation type)

Eventy to sublokacje **bez walki**, dające gracze inny typ wyzwania lub nagrody. Pomysły:

| Event type | Mechanika | Reward |
|---|---|---|
| **Forge** | Możliwość połączenia 2 movesetów (jeśli kompatybilne) lub przeniesienia Ash-of-War między broniami | Crafted item |
| **Whetstone shrine** | Up-level wybranej broni o +1 (jednorazowo) | Permanent weapon upgrade |
| **Shortcut** | Otwiera skrót do późniejszej sublokacji — można pominąć N kolejnych mobów | Skip mob fights, ale mniej XP |
| **Site of Inspiration** | Mini "konsumpcja" cudzego contentu — gracz deklaruje że obejrzał/przeczytał coś — buff na X kolejnych walk | Temporary +dmg buff |
| **Mysterious altar** | Wybór: poświęć 1 moveset XP za buff/loot, lub odejdź | Risk/reward |
| **Memorial stone** | Mini-deklaracja refleksji nad ostatnimi walkami — heal HP/FP | Recovery bez palenia flask |
| **Trial gate** | Mini-wyzwanie (np. "Wykonaj 3 light moves w 10 min") — sprawdza tempo | Bonus loot |
| **Riddle keeper** | NPC stawia pytanie / wyzwanie kreatywne — flavor + reward | Unique consumable |
| **Stagger pit** | Forced encounter z trudnym mobem, ale gwarantowany rare drop | Rare weapon |
| **Lost soul** | Mini-narrative spotkanie — buff lub debuff zależnie od wyboru | Karma fork |

Eventy są **statyczne dla danego dungeona** (część jego tożsamości), nie losowe per wejście.

### Wybór broni

- Przed wejściem: 2 bronie ze stash.
- W trakcie: nie można zmienić tych 2 broni.
- Można znaleźć nowe bronie w dungeonie → idą do **temporary inventory**, dostępne PO zakończeniu dungeona.
- Reset (wycofanie): tracisz progres dungeona, bronie dropnięte w stash → dostępne.

### Co dzieje się gdy timer 48h leci a Ty śpisz

**Hard timer.** Czas leci niezależnie od stanu gracza. Trzeba ukończyć wszystkie sublokacje (włącznie z bossem) w określonym czasie. Brak pause, brak sleep recovery.

To brutalne, ale czyste — zmusza do realistycznego planowania sesji 48h. Jeśli wybrałeś dungeon z 10 sublocations × 30 min/moveset = ~10h realnej pracy, masz mnóstwo buforu. Jeśli wybrałeś dungeon ekstremalny z deep-dive movesetami — musisz planować sen wokół zobowiązań.

> **Konsekwencja designowa:** generator dungeonów MUSI dobrze szacować realistyczny time_budget. Najlepiej z liczbowym preview przed wejściem ("Estimated work: 8-12h. Time limit: 48h."). Gracz świadomie wybiera trudność.

### Reset / Abandon run

Klasyczna decyzja:
- Tracisz dungeon progress (wracasz do start).
- Tracisz loot zdobyty w trakcie (chyba że masz "Stash Talisman").
- Odzyskujesz bronie do main inventory.
- Można od razu wejść w inny dungeon **lub ten sam** — przy ponownym wejściu sublokacje są te same (struktura dungeona jest stała, zob. sekcja 10). Re-roll dotyczy tylko nowo wygenerowanego lootu z mobów po pokonaniu.

---

## 11. Player stats

Twoje obecne 3 staty wystarczą:

```
PLAYER:
  HP      — wytrzymałość psychiczna. Mob może zadać realny damage gdy nie udaje się rolla.
            Death: porażka dungeona.
  Stamina — koszt każdego ruchu movesetu. Regeneruje się powoli w trakcie / między walkami.
  FP/Mana — koszt potężniejszych ruchów (heavy moves, skill moves wymagające intelektu).
            Regeneracja: rzadsza, np. z lifesteal/mana steal affixów, consumables, eventów.
```

### Czy dodawać levelowanie bohatera?

**Sugestia eksperymentalna:** minimalne, opcjonalne.

- Bez skill trees.
- 4 staty z możliwością inwestowania punktów (np. raz na 5 dungeonów):
   - **Vigor** → +HP cap
   - **Endurance** → +Stamina cap
   - **Intelligence** → +FP cap
   - **Recovery** → szybsza regeneracja między walkami
- Brak gradacji per moveset/weapon — to wszystko leveluje osobno.

**Lub w ogóle bez** — bohater to tylko pojemnik, cała progresja jest w broniach/movesetach. To czystszy design ("naprawdę chodzi o narzędzia, nie ego twórcy").

---

## 12. Consumables (Estus & co)

### Estus / Focus Flasks

Klasyczny Souls-like resource z konkretną mechaniką:

```
ESTUS / FOCUS FLASKS:
  - Gracz ma X estus + Y focus flask na DUNGEON.
  - Liczba flask: bazowa wartość + bonusy z talizmanów/affixów.
  - Reset: PO ZAKOŃCZENIU DUNGEONA (sukces lub reset).
  - NIE odnawiają się w trakcie dungeona.
  - Brak bonfire/checkpointów — to single resource pool na cały run.
```

To wymusza **decyzje "kiedy palić"**: oszczędzasz na bossa, czy używasz wcześniej żeby przeżyć trudny mob mid-dungeon?

| Consumable | Effect | Reset rule |
|---|---|---|
| **Estus Flask** | Restore X% HP | N na dungeon, reset on exit |
| **Focus Flask** | Restore X% FP | M na dungeon, reset on exit |
| **Cleanse Stone** | Usuwa status effect z gracza | Limited per dungeon (drop) |
| **Stash Talisman** | W razie reset: zachowuje 1 wybrany item z dungeona | One-shot, rare |
| **Heat Coolant** | Resetuje heat na jednej broni | One-shot, drop |
| **Time Ash** | Pauza timera na 2h | One-shot, bardzo rzadkie |

---

## 13. Sloty ekwipunku

```
EQUIPMENT_SLOTS:
  Main hand weapon       — 1 broń
  Off hand weapon        — 1 broń lub tarcza (jeśli twinblade → blokuje off hand)
  Talisman × 3           — passive buffy (np. "+10% pisanie rano")
  Consumables × N        — flask, cleanse, etc.
```

### Talizmany (passive buffy)

- Bardzo flexibilna kategoria do balancowania.
- Przykłady: "Morning Sigil" (+10% dmg w godzinach 6-10), "Caffeine Charm" (+stamina, -recovery), "Silence Token" (+dmg na Skill moves), itp.

---

## 13.5 Stance break / Poise — mechanika tempa

Każdy mob ma **poise** (stagger resistance). Stance break aktywuje się przez **rozpoczynanie kolejnych movesetów szybko po skończeniu poprzedniego** — bez długich przerw między aktami pracy.

```
POISE MECHANICS:
  - Każdy mob ma poise_pool (np. 100).
  - Każdy moveset zadaje "poise damage" przy ZAKOŃCZENIU.

  - GAP = czas między KOŃCEM poprzedniego movesetu a STARTEM następnego.
    (Długość samego movesetu NIE wpływa na multiplier — liczy się tylko przerwa.)

  - Gap multiplier:
       gap < 15 min   → 1.5×  poise damage
       gap 15-60 min  → 1.0×
       gap 60 min - 4h→ 0.5×
       gap > 4h       → 0.0× + poise mobu zaczyna się regenerować

  - WEAPON WEIGHT MULTIPLIER (dodatkowo):
       Light weapons (Daggers, Fists, Torches):       0.5× poise damage
       Medium (Straight, Curved, Katana, Spear, ...): 1.0×
       Heavy (Greatsword, Hammer, Axe, Halberd):      1.5×
       Colossal (Colossal Sword, Great Hammer, ...):  2.0×

  - VARIANT MULTIPLIER:
       Light moveset:  0.7× poise damage  (mało stagger pressure)
       Heavy moveset:  1.5× poise damage  (główne narzędzie stagger)
       Skill moveset:  1.0× (zależy od skill type)
       Jump moveset:   2.0× — exploit już oszołomionego moba

  - Final poise damage = base × gap_mult × weapon_mult × variant_mult

  - Poise = 0 → STAGGER:
       Mob ogłuszony na X sekund — okno na Jump Attack lub Heavy combo
       Bonus: critical damage z Jump moveset (×3-5)
       Poise regeneruje się PO staggerze (mob wstaje z pełnym poise)
```

To mechaniczne odzwierciedlenie **realnego flow state** — gdy szybko zaczynasz kolejny akt pracy, kumulujesz momentum. Robisz długą przerwę = tracisz tempo. **Ciężkie bronie biją mocniej w poise** — jedna sesja deep-essay (Greatsword) bardziej "wystawia" mobu na stagger niż kilka tweetów (Dagger).

### Synergie i konflikty

- **Heavy weapons + short gaps** = optymalny stagger build (ale Heat rośnie szybko, w obrębie dungeona OK; dochodzi cooldown po runie).
- **Light weapons + ultra-short gaps** = damage spam, ale słaby stagger.
- **Mieszany build**: Light między Heavy = utrzymujesz gap krótki + Heavy zadaje big poise.
- **Long form sessions**: jedna Greatsword + krótkie gaps = bardzo szybki stagger.

> Mechanika nagradza **konsekwentne rzemiosło**: jeśli skończyłeś essay i w 10 min zaczynasz refine — silny stagger. Jeśli skończyłeś essay i wracasz po 6h — zaczynasz od zera.

---

## 14. Domknięte decyzje + pozostałe open questions

### Domknięte

| Decyzja | Rozstrzygnięcie |
|---|---|
| Validation movesetów | **Zaufanie**. Gracz deklaruje, system wierzy. |
| Multiplayer / co-op | **Deklaracja**, nie real-time co-op. |
| Czas mierzony? | **Tak** — timer jest zaimplementowany. |
| Re-roll economy | **Nie** — bronie zlootowane są stałe. Modyfikowalność idzie przez Ash-of-War (Skill slots). |
| Death penalty | **Utrata progresu dungeona** — wystarczająca kara. |
| Trudność dungeonów | **Wybór kafelka** z fixed narrative (Limgrave → Castleblack → ... → Ash Lyendell). Trudność narratywna, nie skalowanie. |

### Pozostałe open questions

1. **Streak between dungeons** — czy istnieje meta-progresja (np. 5 dungeonów z rzędu ukończonych → unlock)?

2. **Re-entry pokonanego dungeona** — czy ukończony dungeon respawn'uje moby (farming)? Z jakim timerem cooldown'u?

3. **Stat scaling broni** — czy bronie mają fixed scaling per weapon_class (np. Greatsword = Strength scaling), czy każdy egzemplarz losuje scaling? (Klasyczne soulsy: per weapon_class fixed. Klasyczne h&s: losowe per item.)

4. **Trade economy** — czy gracz może sprzedawać duplikaty broni/movesetów merchantom? Za jaką walutę? Co kupuje?

---

## 15. MVP / Implementation focus

> **Status:** MVP rdzenia już zaimplementowany.
> **Następne priorytety implementacyjne:**

### Kluczowe do dokończenia (algorytmy losowego generowania)

1. **Generator broni** (sekcja 6) — pełny pipeline z rzadkością, affixami, sub-classami, Skill slot count.
2. **Generator movesetów** (sekcja 6.5) — pełny pipeline z archetypami, atomic moves, signature tags, walidacją chronologii.
3. **Generator mobów** (sekcja 8) — archetypy, attack patterns z telegrafami, weaknesses/resistances spójne z biomem.
4. **Generator bossów** — rozszerzenie generatora mobów + faza 2 + gwarantowany loot.

### Pomocnicze (do iteracji po generatorach)

- Implementacja stałych dungeonów (Elden Ring–style narrative slots).
- Eventy w sublokacjach (sekcja 10).
- Levelowanie movesetów (prep → execution).
- Sub-classes broni → moveset signature bonuses.
- Heat / overheat z cooldown across dungeons.

---

## 16. Najbardziej eksperymentalne pomysły do dyskusji

Rzeczy "out there", które mogą być genialne albo upadną. Wrzucam do późniejszej selekcji:

1. **Ghost echoes** — w dungeonie pojawiają się "duchy" innych graczy (asynchronicznie) z ich movesetami. Inspiracja od współtwórców. Możesz "wezwać ducha" jako Summon = realny co-op deklaracja.

2. **Boss as deliverable** — pokonanie bossa = w realu opublikowanie konkretnego, zadeklarowanego deliverable. Boss "umiera" gdy publikujesz.

3. **Curse system** — niektóre dungeons mają "klątwy" (constraints), np. "No daggers allowed" (zmuszają do Long-form), "Triple stamina cost" (test wytrzymałości). Reward: większy loot.

4. **NPC merchants jako mentory** — różni merchants sprzedają różne typy talizmanów. Spotkania z nimi = "rozmowa z mentorem" w realu (research session, czytanie). Mechaniczna nagroda za consumowanie cudzego contentu.

5. **Forge / Smithing** — łączenie 2 movesetów w jeden hybrydowy. Np. "Outline" + "Commentary" = "Reactive Outline". Eksperymentalne formuły.

6. **Lore-driven dungeons** — niektóre dungeony mają specyficzne tematy (np. "The Tower of Refinement" — tylko Refine moves dają damage). Wymuszają eksperymenty z formami.

7. **Player tomb / past selves** — Twoje stare publikacje stają się "tombs" na mapie. Możesz je odwiedzić, dostać buff "remember when..." lub respawnować jako mini-mob (recykling / repurpose).

8. **Dual currencies** — np. "Ideas" (zdobywane z consumingu / research) vs "Souls" (zdobywane z publikowania). Różne rzeczy kupowane różnymi walutami.

9. **Boss requests** — bossowie mają "wymagania" znalezione w pre-fight lore (np. "Defeat me with a moveset containing a hook"). Spełnienie → bonus loot.

10. **Weapon affinity drift** — broń, której używasz dużo, **zmienia swoją tożsamość** w czasie. Katana intensywnie używana do commentary stopniowo zmienia się w Reaper. Adaptacja narzędzia.

---

## 17. Podsumowanie

System ma 3 warstwy decyzji w skali czasowej:

- **Macro (tygodnie)**: budowanie kolekcji broni, leveling broni i movesetów, eksploracja biomów.
- **Meso (dungeon, 48h)**: wybór 2 broni, alternation, oszczędzanie heat, planowanie sesji.
- **Micro (walka, kilka godzin)**: rytm light/heavy, parry/dodge, reagowanie na telegraf mobów.

Wszystkie 3 warstwy mapują się na realne decyzje twórcze:
- Macro = strategia kariery
- Meso = strategia sprintu / projektu
- Micro = strategia dnia

To nie jest aplikacja do tracking productivity. To **gra, której wynik jest tożsamy z Twoim portfolio**.