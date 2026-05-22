# Weapons & Movesets

## Weapons Computation
Weapon ma losowane dozwolone typy obrażeń - fizyczne jest mandatory
Losuj typ broni i wagę
Dobierz skalowania ze statsami (np. Strength, intelligence, …)
Losuj dozwolone typy obrażeń (1-2 fizyczne, 0-1 niefizyczne)
Fizyczne = standard, strike, slash, pierce, lightening
Niefizyczne = holy, magic, fire, occult, grafting, poison
Losuj generację statusu

Losuj moveset dla silnego i normalnego ataku (...)
Light moveset is taken from short time-base
Strong moveset is taken from long time-base

Prawdopodobieństwa muszą być skonsultowane (mamy już rarity dla weapons)

Ile level-up zwiększa obrażeń?


Ile obrażeń broń zadaje na początku? Na pewno zalezy od czasu move, ale takze od trudnosci
Ile zabiera staminy? Zalezy od czasu move przede wszysktim
Ile zabiera poise? Zalezy od wagi broni
Ile zabiera FP? 
Ile generuje heat? Zalezy od weight

### Weapon Level

### Ataki
Normalny Atak - nadawany moveset z short base_time
Silny Atak - nadawany movest z long base time
Ash of War - mozna nadać samodzielnie jesli ash of war nie koliduje z wymaganiami broni


## Movesets
### Influzja
Movesety, które można przytwierdzić do bronie (a więc nie te, które są defautowo przytwierdzone do broni) posiadają infuzję, która zmienia defautowy skaling broni.

Mogą one np. Zredukować skaling broni z Dexterity z A na C i nadać skaling A z Intelligence

### Typ Contentu

Type = New | compression (same thing but shorter) | expansion (same thing but more elaborate) | recycle (platform pivot) | remaster (rework same content) | reboot (same idea from scratch) | zoom-in (focus on inner element) | zoom-out (focus on bigger picture) | audience_alter (focus on different audience need or type) | commentary

Losowany dla całego movesetu.


### Liczba moves
20% - 1
40% - 2
30% - 3
9% - 4
0.99% - 5
0.009% - 6
0.001% - 7
Medium Contentu
Medium = writing | audio | video | image
Dla każdego move losowane oddzielnie, ale promowane są jednolite movesety (w tym samym medium)
Tak więc losujemy dla pierwszego move medium i potem dla drugiego mamy 80% szansy, że to będzie te samo medium i 20%, że inne (itd. Dla wszystkich ruchów w movesecie)

### Czasy moves

Time = micro | short | medium | long | deep
Losuj podstawowy czas z jednej z 5 wymienionych. 
Każdy move ma prawdopodobieństwo:
60%, że będzie miał podsatwowy czas
20% szansy, że będzie miał o 1 jednostkę krótszy czas (np. medium -> short)
20% szansy, że będzie miał o 1 jednostkę dłuższy czas (np. Medium -> long)
Jeśli wysolowany jako podstawowy czas krańcowy time (micro lub deep), to odpuszczmy +1/-1, który jest poza skalą

### Damage Type
Damage Type = Standard | Pierce | Strike | Slash | Lightning | Fire | Magic | Holy | Occult | Grafting | Poison
Physical Damage Type = Standard | Pierce | Strike | Slash | Lightning
Nonphysical Damage Type = Fire | Magic | Holy | Occult | Grafting | Poison

Losuj dla movesetu base damage type i secondary damage type, tertiary_damage_type
Każdy move w movesecie musi mieć jakiś damage type. Move może mieć jeden physical i jeden non-physical jednocześnie, a

Base_damage_type ma największą szansę na znalezienie się w move (powiedzmy 80%), secondary - mniejszą (powiedzmy ok. 20%), tertiary - znacznie mniejszą (powiedzmy ok. 2%). 


### Stage Content

Stage Content = ideate | research | outline | generate | glue(order) | refine | publish

Każdy kolejny move w movesecie przechodzi do kolejnej fazy
Wszystkie poza ideate/publish mogą się duplikować.
Czyli np. Wylosowano 5 moves i wylosowano pierwszy move jako research
Może być: research -> reserach -> outline -> generate -> generate
Powiedzmy powinno być 50% szansy na duplikację, 50% na przejście dalej (ale zwróć uwagę na edge-casy, np 7 movów w movesecie, wtedy jest ograniczenie na tą logię zważywszy, ze publish może być tylko raz)

### Naming convention for Movesets
Prefix od typu contantu i medium contentu (dla medium contentu jeśli jest (prawie) ten sam typ contentu), 
Prefix dla czasu podstawowego powinien być
Prefix dla base damage_type i ew. Secondary_damage_type
Liczba moves:
Brak prefixu jeśli tylko jeden move
Duo - 2 moves
Trio - 3 moves
Combo - 4 moves
Super Combo - 5
Epic Combo - 6 moves
Legendary Combo  - 7 moves
Combo - jeśli wiecej niż 2 moves, a SuperCombo - jeśli więcej niż 4 moves



### Multipliers
todo!
Damage:
Stamina Take:
FP Take:
Poise Take: depends on weapon, not moveset


## Weapon Types

### SZTYLETY & MIECZE (Daggers, Straight Swords, Greatswords, Colossal Swords)

| Parametr | Daggers (Sztylety) | Straight Swords (Proste miecze) | Greatswords (Wielkie miecze) | Colossal Swords (Wielkie m. kolosalne) |
| :--- | :--- | :--- | :--- | :--- |
| **Weight** | 1.5 (Ekstremalnie lekka) | 3.5 (Lekka) | 9.0 (Średnia/Ciężka) | 22.0 (Ekstremalnie ciężka) |
| **Stats (Base / Infused)** | Base: DEX (S)<br>Infused: **ARC (A)** | Base: STR (D), DEX (D)<br>Infused: **INT/FAI/ARC (A)** | Base: STR (B), DEX (D)<br>Infused: **INT/FAI (A)** | Base: STR (S)<br>Infused: **INT (A)** |
| **Status Mod** | Base: Brak<br>Infused: **Poison** (+50%) | Base: Brak<br>Infused: Zależy od magii | Base: Brak<br>Infused: **Sleep** (+40%) | **Madness** (+50% do kumulacji) |
| **Damage Type Mod** | **Lightning** (+25% DMG) | **Standard** (+15% DMG) | **Slash** (+20% DMG) | **Strike** (+40% DMG) |
| **Time Mod** | **-20%** do czasu pracy | Brak | **+15%** do czasu pracy | **+50%** do czasu pracy |
| **Medium Mod** | Mikro-Wideo / Krótki Tekst | Standardowe Wideo / Blog | Długie Wideo / Podcast | Dokument Wideo / Audiobook |
| **Content Type Mod** | `compression` (+30% DMG) | `remaster` / `recycle` (+25%) | `expansion` (+20% DMG) | `reboot` (+40% DMG) |
| **Moves Mod & DMG Scale** | +4 Moves. Każdy hit: +5% do DMG. | Standard (3 Moves). Brak progresji. | -1 Move. Każdy hit: +15% do DMG. | Tylko 2 Moves. Drugi hit: +40% DMG. |
| **FP / Stamina Mod** | -30% kosztu Staminy | Standardowe koszty | +20% kosztu Staminy | +50% kosztu Staminy |
| **Heat Mod & Infusion Cost** | **Wysoki (20 użyć)**.<br>Infuzja: -2 do Heat Max. | **Średni (12 użyć)**.<br>Infuzja: -1 do Heat Max. | **Niski (6 użyć)**.<br>Infuzja: Bez zmian. | **Ekstremalnie niski (3 użycia)**.<br>Infuzja: Pobiera 15 FP/hit. |
| **Poise (Powalenie)** | 5 (Minimalna szansa) | 25 (Średnia szansa) | 55 (Wysoka szansa) | 100 (Gwarantowane powalenie) |
| **Stage Content Mod** | Ekstremalny buff dla: `generate` | Zbalansowany buff dla: `refine` | Zwiększa efektywność: `outline` | Ekstremalny buff dla: `research` |

### BROŃ OBUCHOWA & TOPORY (Hammers, Great Hammers, Colossal Weapons, Axes, Great Axes, Flails)
| Parametr | Hammers (Młoty) | Great Hammers (Wielkie młoty) | Colossal Weapons (Bronie kolosalne) | Axes (Topory) | Great Axes (Wielkie topory) | Flails (Kiścienie) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Weight** | 5.5 (Średnia) | 12.0 (Ciężka) | 24.0 (Najcięższa) | 5.0 (Średnia) | 13.0 (Ciężka) | 5.0 (Średnia) |
| **Stats (Base / Infused)** | Base: STR (A)<br>Infused: **FAI (A)** | Base: STR (A)<br>Infused: **FAI (A)** | Base: STR (S)<br>Infused: **ARC (A)** | Base: STR (C), DEX (D)<br>Infused: **INT (A)** | Base: STR (A)<br>Infused: **Brak opcji** | Base: DEX (B), STR (D)<br>Infused: **ARC (A)** |
| **Status Mod** | Base: Brak<br>Infused: **Grace** (+35%) | **Death Blight** (+40% do bazowego ładowania) | **Madness** (+100% obustronne) | Base: Brak<br>Infused: **Glintstone** (+30%) | Brak (Czysta brutalność) | **Bleed** (+35% z bazy) |
| **Damage Type Mod** | **Strike** (+30% DMG) | **Strike** (+40% DMG) | **Strike** (+50% DMG) | **Slash** (+15% DMG) | **Slash** (+30% DMG) | **Strike** (+20% DMG) |
| **Time Mod** | Brak | +20% do czasu | +60% do czasu | -10% do czasu | +25% do czasu | Brak |
| **Medium Mod** | Posty Opiniodawcze | Wideo Śledcze | Filmy Kinowe / Premium | Surowy Vlog | Debaty / Panele | Satyra Wideo / Rolki |
| **Content Type Mod** | `commentary` (+30%) | `zoom-in` (+30% DMG) | `New` (+50% DMG) | `reboot` (+20% DMG) | `audience_alter` (+35%) | `commentary` (+40%) |
| **Moves Mod & DMG** | Std. Bez progresji. | -1 Move. +10% DMG/hit. | 1-2 Moves. +30% DMG/hit. | +1 Move. +8% DMG/hit. | -1 Move. +15% DMG/hit. | +3 Moves. +4% DMG/hit. |
| **FP / Stamina Mod** | +15% koszt Staminy | +30% koszt Staminy | +60% koszt Staminy | Standard | +35% koszt Staminy | -15% koszt Staminy |
| **Heat Mod (Przegrzanie)** | Średni (10 użyć) | Niski (5 użyć) | Ekstr. niski (2 użycia) | Średni (12 użyć) | Niski (6 użyć) | Wysoki (15 użyć) |
| **Poise (Powalenie)** | 45 (Wysokie) | 75 (Potężne) | 120 (Absolutne) | 30 (Średnie) | 65 (Bardzo wysokie) | 35 (Omija blok wroga) |
| **Stage Content Mod** | Buff dla: `publish` | Buff dla: `research` | Buff dla: `ideate` | Buff dla: `generate` | Buff dla: `glue(order)` | Buff dla: `refine` |
### MAGIA, ESTETYKA & INTERAKCJA (Katanas, Curved Swords, Curved Greatswords, Twinblades, Reapers, Torches)
| Parametr | Katanas (Katany) | Curved Swords (M. zakrzywione) | Curved Greatswords | Twinblades (Bl. ostrza) | Reapers (Kosy) | Torches (Pochodnie) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Weight** | 5.5 (Średnia) | 4.0 (Lekka) | 10.0 (Ciężka) | 7.0 (Średnia) | 9.5 (Średnia/Ciężka) | 1.5 (Ultrolekka) |
| **Stats (Wrodzone / Inf.)** | Base: DEX (A)<br>Infused: **INT (A)** | Base: DEX (A)<br>Infused: **ARC (A)** | Base: DEX (B), STR (D)<br>Infused: **Brak** | Base: DEX (S)<br>Infused: **ARC (S)** | **ARC (A)**, DEX (D)<br>*(Wrodzona magia)* | **FAI (A)**<br>*(Wrodzona magia)* |
| **Status Mod** | **Bleed** (Wrodzony pasyw) | Base: Brak<br>Infused: **Murmur** (+40%) | Brak | **Scarlet Rot** (+25%) | **Dread** (+50% do wampiryzmu) | **Sleep** / **Grace** (+40%) |
| **Damage Type Mod** | **Slash** (+25% DMG) | **Slash** (+20% DMG) | **Slash** (+30% DMG) | **Slash** (+15% DMG) | **Slash** & **Occult** (+20%) | **Fire** (+30% DMG) |
| **Time Mod** | -5% do czasu | -15% do czasu | +15% do czasu | -10% do czasu | +20% do czasu | -30% do czasu pracy |
| **Medium Mod** | Algorytmiczne YT Wideo | Vlog Podróżniczy | Serie Fabularne YT | TikTok / Shorts / Reels | True Crime / Eseje | Nocny Live Stream |
| **Content Type Mod** | `New` (+25% DMG) | `recycle` (+30% DMG) | `zoom-out` (+35% DMG) | `compression` (+30%) | `zoom-in` (+40% DMG) | `commentary` (+50% DMG) |
| **Moves Mod & DMG** | +1 Move. +6% DMG/hit. | +2 Moves. +5% DMG/hit. | Std. +12% DMG/hit. | +4 Moves. +3% DMG/hit. | -1 Move. +20% DMG/hit. | Nieskończone Combo |
| **FP / Stamina Mod** | Standard | -20% koszt Staminy | +15% koszt Staminy | +10% koszt Staminy | +20% koszt Staminy | -50% koszt Staminy |
| **Heat Mod (Przegrzanie)** | Średni (12 użyć) | Wysoki (16 użyć) | Niski (7 użyć) | Bardzo wysoki (18 użyć) | Niski (6 użyć). *Zamiast Heat pożera 5 FP/hit.* | **Brak przegrzania (Nieskończona)** |
| **Poise (Powalenie)** | 20 (Niskie) | 15 (Niskie) | 40 (Średnie/Wysokie) | 15 (Niskie) | 45 (Wysokie) | 2 (Znikome) |
| **Stage Content Mod** | Buff dla: `generate` | Buff dla: `glue(order)` | Buff dla: `outline` | Buff dla: `generate` | Buff dla: `research` | Buff dla: `publish` (Stałe leczenie) |
### DRZEWCOWE, PCHNIĘCIA & DYSTANS (Spears, Great Spears, Halberds, Thrusting Swords, Heavy Thrusting Swords, Whips)
| Parametr | Spears (Włócznie) | Great Spears (W. włócznie) | Halberds (Halberdy) | Thrusting Swords (Rapiery) | Heavy Thrusting Swords | Whips (Bicze) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Weight** | 4.5 (Lekka) | 9.5 (Średnia/Ciężka) | 8.0 (Średnia) | 2.5 (Lekka) | 6.5 (Średnia) | 3.0 (Lekka) |
| **Stats (Wrodzone / Inf.)** | Base: DEX (B), STR (D)<br>Infused: **FAI (A)** | Base: STR (B), DEX (C)<br>Infused: **FAI (A)** | Base: STR (C), DEX (C)<br>Infused: **INT (A)** | **INT (A)**, DEX (D)<br>*(Wrodzona magia)* | **INT (B)**, STR (D)<br>*(Wrodzona magia)* | **ARC (B)**, DEX (C)<br>*(Wrodzona magia)* |
| **Status Mod** | Base: Brak<br>Infused: **Devotion** (+30%) | Base: Brak<br>Infused: **Devotion** (+40%) | Base: Brak<br>Infused: **Glintstone** (+30%) | **Sleep** (+35% z bazy) | **Glintstone** (+40% z bazy) | **Poison** (+50% do clickbaitu) |
| **Damage Type Mod** | **Pierce** (+30% DMG) | **Pierce** (+40% DMG) | **Pierce** & **Slash** (+20%) | **Pierce** & **Magic** (+15%) | **Pierce** & **Magic** (+20%) | **Poison** & **Occult** (+20%) |
| **Time Mod** | Brak | +10% do czasu | Brak | -15% do czasu | +5% do czasu | -10% do czasu |
| **Medium Mod** | Threads / Karuzele | Mega-Infografiki | Formaty Hybrydowe | Recenzje / Felietony | Analizy Rynkowe S-Tier | Prowokacje / Dramy |
| **Content Type Mod** | `zoom-out` (+25%) | `expansion` (+35% DMG) | `audience_alter` (+30%) | `commentary` (+30% DMG) | `zoom-in` (+30% DMG) | `commentary` (+45% DMG) |
| **Moves Mod & DMG** | Std. Bez progresji. | -1 Move. +15% DMG/hit. | +1 Move. Alternacja typów. | +3 Moves. +7% DMG/hit. | Std. +10% DMG/hit. | +2 Moves. Atak obszarowe. |
| **FP / Stamina Mod** | -10% koszt Staminy | +20% koszt Staminy | +10% koszt Staminy | -25% koszt Staminy | +10% koszt Staminy | -5% koszt Staminy |
| **Heat Mod (Przegrzanie)** | Średni (11 użyć) | Niski (6 użyć) | Średni (9 użyć) | Wysoki (15 użyć). *Pobiera 4 FP/hit.* | Średni (10 użyć). *Pobiera 6 FP/hit.* | Wysoki (14 użyć). *Pobiera 5 FP/hit.* |
| **Poise (Powalenie)** | 25 (Średnie) | 50 (Wysokie) | 40 (Średnie) | 10 (Niskie) | 35 (Średnie) | 5 (Przerywa akcje wroga) |
| **Stage Content Mod** | Buff dla: `glue(order)` | Buff dla: `research` | Buff dla: `outline` | Buff dla: `refine` | Buff dla: `research` | Buff dla: `generate` |
### BRONIE STRZELECKIE (Bows, Greatbows, Crossbows, Ballistas)
| Parametr | Bows (Łuki) | Greatbows (Wielkie łuki) | Crossbows (Kusze) | Ballistas (Balisty) |
| :--- | :--- | :--- | :--- | :--- |
| **Weight** | 4.0 (Lekka) | 11.0 (Ciężka) | 4.5 (Lekka) | 16.0 (Bardzo ciężka) |
| **Stats (Wrodzone / Inf.)** | Base: DEX (A)<br>Infused: **Brak** | **FAI (A)**, STR (D)<br>*(Wrodzona magia)* | Brak skalowania<br>*(Stałe wartości fizyczne)* | Brak skalowania<br>*(Gigantyczny stały nuke)* |
| **Status Mod** | Zależy od użytej amunicji | **Yearning** (+50% do FOMO) | Zależy od amunicji | **Death Blight** (Natychmiastowy trigger) |
| **Damage Type Mod** | **Lightning** (+30% DMG) | **Holy** (+40% DMG) | Standard (Zależny od bełtu) | Ekstremalny **Standard** DMG |
| **Time Mod** | Przygotowanie: -25% czasu | Przygotowanie: +40% czasu | Automatyzacja: -50% czasu | Przygotowanie: +100% czasu |
| **Medium Mod** | Insta Stories / Szybkie posty | Wielkie Kampanie Mark. | Automatyczne RSS Re-uploady | Leak / Potężne oskarżenie |
| **Content Type Mod** | `commentary` (+30% DMG) | `New` (+40% DMG) | `recycle` (+50% wydajności) | `New` (+100% krytyk) |
| **Moves Mod & DMG** | Brak combo. Zużywa zasoby. | Wolny strzał ładowany. | Brak combo. Stałe okno. | Przeładowanie (Pauza na 1 turę). |
| **FP / Stamina Mod** | -15% koszt Staminy | +40% koszt Staminy | 0 Stamina (Koszt przeładowania) | +50% koszt Staminy |
| **Heat Mod (Przegrzanie)** | Wysoki (15 strzałów) | Niski (4 strzały). *Zużywa 20 FP/strzał.* | **Brak przegrzania (Automaty)** | Ekstremalnie niski (1 strzał) |
| **Poise (Powalenie)** | 8 (Niskie) | 60 (Potężne odrzucenie) | 12 (Niskie) | 150 (Całkowite zmiażdżenie) |
| **Stage Content Mod** | Skipuje do: `publish` | Blokuje na etapie: `ideate` | Pomija: `ideate` do `refine` | Wymaga pełnego: `research` |

## Status Effects

Statusy są opcjonalne w zadaniu - musi być coś w rodzaju checkboxa - jeśli jest zaznaczony, to status został zaaplikowany

| Status w grze | Tematyka / Efekt emocjonalny | Mechanika Gameplayowa (Wpływ na walkę) |
| :--- | :--- | :--- |
| **Bleed** | Viral / Brainrot | **Nagły Burst DMG:** Po zapełnieniu paska zadaje natychmiastowe, potężne obrażenia paskowi oporu wroga (15% Max HP/Retencji + baza). Idealne na bossów. |
| **Scarlet Rot** | Polaryzacja / Wojna plemienna | **Głęboki DOT + Debuff:** Zabiera życie wroga czasowo (bardzo szybko), a dodatkowo zmniejsza odporność wroga na wszystkie inne typy obrażeń o 20%. |
| **Frostbite** | Zawiść / Hate-watching | **Burst DMG + Zamrożenie:** Zadaje średnie obrażenia natychmiast, zwiększa otrzymywane przez wroga obrażenia o 20% i drastycznie spowalnia jego reakcje (wróg rzadziej kontratakuje). |
| **Madness** | Kontrowersja / Hot Take | **High Risk Burst DMG:** Zadaje gigantyczne obrażenia wrogowi, ale rani również bohatera (odbija się na zdrowiu psychicznym) i całkowicie zeruje Twój obecny pasek FP/Focusu. |
| **Sleep** | Comfort Content / Relaks | **Kontrola tłumu + Haste:** Wróg zostaje uśpiony na kilka moves. W tym czasie bohater błyskawicznie regeneruje Staminę i skraca czas pracy nad kolejnym atakiem o 50%. |
| **Death Blight** | Drama / Cancel Culture | **Insta-Kill / Darmowy Estus:** Zwykłych wrogów zabija natychmiast. U bossów zadaje potężne obrażenia i w przypadku eliminacji odnawia bohaterowi ładunek Estusa (Świętej Butelki Odpoczynku). |
| **Glintstone Sorcery** | Edukacja / Ciekawostki | **Buff do statystyk:** Po zapełnieniu paska bohater otrzymuje tymczasowy bonus (+5 do Intelligence i Mind), co pozwala na odpalanie potężniejszych, bardziej skomplikowanych technologii. |
| **Frenzy-Flame** | Humor / Satyra / Roast | **Zniszczenie Pancerza + FP:** Całkowicie zeruje pancerz i odporności psychiczne wroga na 10 sekund, a bohater natychmiast odzyskuje dużą część paska FP (Focus Points) lub otrzymuje FP Flask. |
| **Devotion** | Więź Parasocjalna | **Generowanie zasobów:** Wróg zostaje "oczarmowany" i przez cały czas trwania statusu pasywnie generuje dla bohatera punkty FP oraz co jakiś czas upuszcza FP Flaski. |
| **Yearning** | FOMO / Pożądanie | **Buff do Szybkości (Haste):** Skraca czas pracy bohatera nad projektami o 30% (zwiększa Attack Speed) oraz zwiększa szansę na drop rzadkich przedmiotów (np. lepszych sponsorów) z wroga. |
| **Dread** | Niepokój / Doomscrolling | **Wampiryzm Staminy:** Zmniejsza prędkość poruszania się wroga o 50% i stale transferuje staminę od przerażonego wroga bezpośrednio do bohatera. |
| **Murmur** | Sianie Plotek / Intryga | **Modyfikator Statusów:** Nie zadaje bezpośrednich obrażeń, ale sprawia, że wróg staje się podatny – kolejny nałożony status (np. Bleed lub Death Blight) ładuje się 2x szybciej. |
| **Grace** | Wholesome / Inspiracja | **Leczenie bohatera (Wampiryzm HP):** Każde kolejne uderzenie wroga z nałożonym statusem Grace leczy pasek HP bohatera (odnawia odporność na wypalenie zawodowe). |


## Stats Influence

Stats: strength, dexterity, intellect, faith and arcane influence some of the properties

[STRENGTH]  ======> CIĘŻKIE FORMATE / SZOK      ======> MADNESS / DEATH BLIGHT
[DEXTERITY] ======> STORYTELLING / SZYBKOŚĆ     ======> BLEED / SCARLET ROT
[INTELLECT] ======> LOGIKA / ANALIZA / ACADEMIA ======> GLINTSTONE / SLEEP
[FAITH]     ======> PRAGMATYZM / INSPIRACJA     ======> GRACE / DEVOTION
[ARCANE]    ======> KLIMAT / MANIPULACJA        ======> POISON / DREAD