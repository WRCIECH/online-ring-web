# System Statystyk RPG dla Kreatorów Treści (Content Production System)

Poniższy zestaw 9 podstawowych statystyk służy jako bezpośrednie przeliczniki do skalowania obrażeń (Damage Modifiers) dla poszczególnych klas postaci oraz typów publikowanego contentu.

---

## 1. TEXT (Tekst)
*Moc surowego słowa pisanego, logiki i struktury.*
* **Klasy główne:** `researcher`, `architect`, `curator`
* **Skalowanie mechaniczne (Formaty bazowe):** `Plaintext`, `StructuredText`, `IllustratedText`, `CurationFeed`
* **Modyfikatory etapów/stylu:** `Research`, `Plan`, `Intellectual`, `Segmentation`
* **Zastosowanie w walce:** Wolne, ale nieuchronne zadawanie stałych obrażeń. Idealne do rozbijania wrogów o wysokim pancerzu merytorycznym.

## 2. VIDEO (Wideo)
*Zdolność władania ruchomym obrazem, reżyserią i montażem.*
* **Klasy główne:** `aesthete`, `storyteller`, `experimenter`
* **Skalowanie mechaniczne (Formaty bazowe):** `CinematicVideo`, `MotionGraphics`, `ARollVideo`, `SlideshowVideo`, `Screencast`
* **Modyfikatory etapów/stylu:** `Produce`, `Refine`
* **Zastosowanie w walce:** Ataki "ciężkiego kalibru". Wymagają dużego zużycia Staminy/Czasu, ale generują potężne, jednorazowe tąpnięcia paska zdrowia wroga.

## 3. AUDIO (Audio / Głos)
*Moc żywego słowa, tonacji i akustycznej obecności.*
* **Klasy główne:** `orator`, `storyteller`, `performer`
* **Skalowanie mechaniczne (Formaty bazowe):** `RawAudio`, `ProducedAudio`
* **Zastosowanie w walce:** Generuje obrażenia rozłożone w czasie (DoT — Damage over Time). Treść konsumowana "w tle" sukcesywnie wysysa punkty życia przeciwnika, podczas gdy gracz może przygotowywać kolejny atak.

## 4. GRAPHIC (Grafika)
*Zdolność kompresji znaczenia do statycznej formy wizualnej i układu.*
* **Klasy główne:** `aesthete`, `sprinter`, `teacher`
* **Skalowanie mechaniczne (Formaty bazowe):** `SingleGraphic`, `Carousel`, `Infographic`
* **Zastosowanie w walce:** Odpowiednik zręczności (Dexterity). Szybkie, tanie w produkcji ataki o wysokiej szansie na trafienie krytyczne (Memiczny Krytyk).

## 5. VELOCITY (Tempo / Szybkość)
*Wskaźnik dynamiki, refleksu rynkowego i zdolności do ciągłego przetwarzania zasobów.*
* **Klasy główne:** `sprinter`, `chronicler`, `prophet`
* **Skalowanie mechaniczne (Modyfikatory pochodzenia):** `Recycled`, `Remastered`, `Revamped`, `Reboot`, `Similar`
* **Modyfikatory etapów/stylu:** `Publish`, `Promote`, `Fast`, `Cliffhanger`
* **Zastosowanie w walce:** Zmniejsza cooldowny i pozwala na wyprowadzanie seryjnych, błyskawicznych uderzeń (np. szybki recykling formatów cross-platformowych).

## 6. DEPTH (Głębia / Merytoryka)
*Współczynnik ciężaru właściwego treści. Przetwarzanie i synteza potężnych baz wiedzy.*
* **Klasy główne:** `researcher`, `architect`, `teacher`
* **Skalowanie mechaniczne (Modyfikatory pochodzenia):** `Expansion`, `ZoomIn`, `ZoomOut`
* **Modyfikatory etapów/stylu:** `Intellectual`, `ProblemSolving`
* **Zastosowanie w walce:** Ignoruje podstawowe tarcze i odporności przeciwników. Ataki z wysokim *Depth* nakładają na cel status "Zrozumienie", paraliżując jego akcje obronne.

## 7. PARASOCIAL (Parasocjalność / Więź)
*Skracanie dystansu i magnetyzm osobisty. Budowanie lojalności plemiennej.*
* **Klasy główne:** `performer`, `influencer`, `teacher`
* **Skalowanie mechaniczne (Formaty bazowe):** `CommunitySpace`, `LiveStream`, `BranchingNarrative`, `MultimediaPage`
* **Modyfikatory emocji/stylu:** `Parasocial`, `Comfort`, `Hope`, `Humor`, `Wow`, `Interactive`, `Narration`
* **Zastosowanie w walce:** Ataki emocjonalne, które omijają mechaniczny pancerz wroga, uderzając bezpośrednio w jego lojalność. Buduje tarczę obronną dla gracza (ochrona społeczności przed backlashami).

## 8. FRICTION (Konfrontacja / Polaryzacja)
*Zdolność do generowania tarcia, wchodzenia w polemiki i uderzania w czułe punkty otoczenia.*
* **Klasy główne:** `polemicist`, `exposer`, `prophet`
* **Skalowanie mechaniczne (Modyfikatory emocji):** `Polarization`, `Controversion`, `Drama`, `Fear`, `Envy`, `Rumor`
* **Modyfikatory pochodzenia/stylu:** `Commentary`, `Opposite`, `Shock`
* **Zastosowanie w walce:** Ekstremalnie wysokie obrażenia bazowe (Czarne Runy internetu), które jednak generują wysoki poziom Aggro. Ryzyko otrzymania obrażeń zwrotnych (Backlash / Cancel).

## 9. INSIGHT (Inwencja / Eksperyment)
*Nieszablonowość, łamanie utartych ram formatowych, kuracja nieoczywistych powiązań.*
* **Klasy główne:** `experimenter`, `curator`, `prophet`
* **Skalowanie mechaniczne (Formaty bazowe):** `_blank` (Eksperyment)
* **Modyfikatory etapów/stylu:** `Interactive`
* **Zastosowanie w walce:** Wprowadza element chaosu i nieprzewidywalności do walki. Pozwala na generowanie unikalnych statusów i łamanie zasad, którymi posługuje się przeciwnik.

---

## Matryca Dopasowania Klas (Quick Reference Guide)

| Klasa (`class`) | Dominujące Statystyki (Skalowanie DMG) | Główny Format Ataku |
| :--- | :--- | :--- |
| **`chronicler`** | Zrównoważone (Wszystkie na średnim poziomie) | Dowolny format (brak słabych punktów) |
| **`sprinter`** | `VELOCITY`, `GRAPHIC` | `SingleGraphic`, `Carousel` (Styl: `Fast`) |
| **`architect`** | `DEPTH`, `TEXT` | `StructuredText` (Wielkie formy) |
| **`researcher`** | `DEPTH`, `TEXT` | `Plaintext`, `IllustratedText` (Styl: `Intellectual`) |
| **`storyteller`** | `VIDEO`, `AUDIO` | `CinematicVideo`, `ProducedAudio` (Styl: `Narration`) |
| **`orator`** | `AUDIO`, `PARASOCIAL` | `RawAudio`, `ProducedAudio` |
| **`curator`** | `TEXT`, `INSIGHT` | `CurationFeed` (Agregacja, bazy wiedzy) |
| **`teacher`** | `DEPTH`, `GRAPHIC`, `PARASOCIAL` | `Infographic` (Styl: `ProblemSolving`) |
| **`experimenter`**| `INSIGHT`, `VIDEO` | `_blank` (Eksperymenty, nieszablonowe formy) |
| **`performer`** | `PARASOCIAL`, `AUDIO` | `LiveStream` (Styl: `Interactive`) |
| **`polemicist`** | `FRICTION`, `TEXT` | `Commentary` (Styl: `Shock` / `Polarization`) |
| **`aesthete`** | `VIDEO`, `GRAPHIC` | `CinematicVideo` (Styl: `Estetic`) |
| **`influencer`** | `PARASOCIAL`, `VELOCITY` | `ARollVideo` (Styl: `Parasocial` / `Envy`) |
| **`exposer`** | `FRICTION`, `DEPTH` | `Plaintext`, `CinematicVideo` (Styl: `Drama`) |
| **`prophet`** | `INSIGHT`, `FRICTION`, `VELOCITY` | `SlideshowVideo` (Styl: `Fear` / `Cliffhanger`) |