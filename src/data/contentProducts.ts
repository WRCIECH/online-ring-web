/**
 * ============================================================================
 * SYSTEM KLASYFIKACJI PRODUKTÓW CONTENTOWYCH (CONTENT PRODUCT ENGINE)
 * ============================================================================
 * Ten plik definiuje ostateczne produkty końcowe (formaty), jakie gracz może
 * wyprodukować w grze. Klasyfikacja odrzuca pojęcie platformy (TikTok, YouTube)
 * na rzecz czystej struktury komponentów oraz sposobu produkcji.
 *
 * Służy jako główny słownik dla silnika gry oraz kontekst dla modeli AI.
 * ============================================================================
 */

/**
 * Definicja 20 podstawowych archetypów produktów internetowych oraz typu '_blank'.
 * Każdy typ reprezentuje unikalny proces rzemieślniczy i logistykę produkcji.
 */
export type ContentProductType =
  // --- GRUPA A: PRODUKTY TEKSTOWE (BAZOWE) ---
  | 'Plaintext'                // 1. Czysty tekst liniowy (surowy wpis, przemyślenie, skrypt)
  | 'StructuredText'           // 2. Tekst strukturyzowany/użytkowy (podpunkty, tabele, formatowanie)
  | 'IllustratedText'          // 3. Tekst z elementami statycznymi (artykuł/blog wzbogacony o wykresy/zdjęcia)

  // --- GRUPA B: PRODUKTY WIZUALNE (STATYCZNE) ---
  | 'SingleGraphic'            // 4. Pojedyncza grafika/zdjęcie (mem, autorska fotografia, plakat)
  | 'Carousel'                 // 5. Sekwencja grafik (karuzela na IG, komiks, slajdy informacyjne bez audio)
  | 'Infographic'              // 6. Zaawansowana kompozycja danych (miks tekstu i grafiki tworzący nową strukturę)

  // --- GRUPA C: PRODUKTY AUDIO ---
  | 'RawAudio'                 // 7. Czysty monolog/dialog audio (surowa notatka głosowa, wywiad bez obróbki)
  | 'ProducedAudio'            // 8. Słuchowisko / Audio reżyserowane (podcast z sound designem i muzyką)

  // --- GRUPA D: PRODUKTY WIDEO / RUCHOME (LINIOWE) ---
  | 'ARollVideo'               // 9. Rejestracja rzeczywistości ("gadająca głowa", surowy vlog, relacja z telefonu)
  | 'SlideshowVideo'           // 10. Kompozycja statyczno-dynamiczna (lektor audio + montaż slajdów/B-Rollu/screenów)
  | 'Screencast'               // 11. Nagranie interfejsu (tutorial software, przechwycony ekran z komentarzem)
  | 'CinematicVideo'           // 12. Wideo wielowarstwowe (zaawansowany montaż, multicam, color grading)
  | 'MotionGraphics'           // 13. Animacja / Ruchoma grafika (wideo generowane 100% cyfrowo, np. explainer)

  // --- GRUPA E: PRODUKTY HYBRYDOWE, NIELINIOWE I ZASOBY ---
  | 'LiveStream'               // 14. Strumień na żywo (wideo-audio real-time, brak postprodukcji, interakcja)
  | 'MultimediaPage'           // 15. Publikacja wielomedialna (interaktywny reportaż webowy, media konsumowane nieliniowo)
  | 'BranchingNarrative'       // 16. Treść drzewiasta (wideo/tekst interaktywny typu "wybierz własną przygodę")
  | 'AssetPack'                // 17. Paczka aktywów / Szablony (presety, sample audio, szablony Notion)
  | 'CurationFeed'             // 18. Kuracja treści / Agregacja (prasówki, bazy linków, katalogi narzędzi)
  | 'CommunitySpace'           // 19. Przestrzeń społecznościowa (serwer Discord, zamknięte forum, Slack)
  | 'InteractiveApp'           // 20. Aplikacja / Gra / Micro-tool (pełna nieliniowość, kalkulatory, widgety, gry)

  /**
   * --- MARGINES SYSTEMU (AWANGARDA / COŚ INNEGO) ---
   * Gracz otrzymuje to jako zadanie stworzenia niesklasyfikowanego, awangardowego unikatu.
   *
   * PRZYKŁADY INSPIRACYJNE DLA TEGO TYPU (Do wykorzystania w UI / opisach zadań):
   * 1. Cyfrowy Rytuał: Content wymagający np. 3 minut absolutnej ciszy (0 dB) przed mikrofonem, by strona się załadowała.
   * 2. Anty-Content (Pustka): 24-godzinny stream z całkowicie czarnego i wygłuszonego pokoju jako manifest artystyczny.
   * 3. Data-Screaming: Zmiana rozszerzenia pliku "kernel32.dll" na ".mp3" i wydanie tego jako albumu z muzyką noise.
   * 4. Anomalia / ARG: 3-sekundowe wideo z kodem QR wyrytym na drzewie, prowadzące do współrzędnych GPS z zakopanym pendrivem.
   * 5. Skrajny Slow-TV: Wieloletnia transmisja na żywo pokazująca wyłącznie proces rdzewienia gwoździa w słoiku z wodą.
   * 6. SEO-Vomiting: Strona wygenerowana ze 100 000 losowych słów kluczowych ułożonych w poemat pod zglitchowanie botów Google.
   * 7. Kapsuła Czasu: Plik multimedialny zaszyfrowany kluczem, który odblokuje się automatycznie dopiero za 100 lat.
   * 8. Odwrócony Performance: Live-stream, na którym twórca rysuje mapy powiązań społecznościowych (SNA) ludzi piszących na czacie.
   * 9. Cyfrowy Pasożyt: Bot wstrzykujący skrajnie angażujące komentarze oparte na Cold Reading pod filmami innych twórców.
   * 10. Konceptualna Destrukcja: Budowanie wielkiej bazy wiedzy przez rok, tylko po to by usunąć ją i sformatować dyski na żywo.
   */
  | '_blank';


/**
 * Interfejs strukturyzujący informacje o produkcie na potrzeby UI gry lub systemów oceny.
 */
interface ContentProductDetails {
  id: ContentProductType;
  displayName: string;
  category: 'Text' | 'Visual' | 'Audio' | 'Video' | 'Hybrid' | 'Exotic';
  description: string;
}

/**
 * Główny rejestr stałych danych systemowych.
 * Claude Code używa tego obiektu do mapowania nazw i opisów w UI gry.
 */
export class ContentRegistry {
  public static readonly Products: Record<ContentProductType, ContentProductDetails> = {
    Plaintext: { id: 'Plaintext', displayName: 'Czysty tekst liniowy', category: 'Text', description: 'Surowy strumień świadomości, przemyślenie lub manifest pozbawiony formatowania.' },
    StructuredText: { id: 'StructuredText', displayName: 'Tekst strukturyzowany', category: 'Text', description: 'Treść sformatowana pod szybką konsumpcję: wypunktowania, nagłówki, tabele.' },
    IllustratedText: { id: 'IllustratedText', displayName: 'Artykuł ilustrowany', category: 'Text', description: 'Obszerna treść pisana, gdzie statyczne obrazy lub wykresy pełnią rolę wsparcia narracji.' },
    SingleGraphic: { id: 'SingleGraphic', displayName: 'Pojedyncza grafika', category: 'Visual', description: 'Samodzielny komunikat wizualny: mem, plakat autorski lub pojedyncze zdjęcie.' },
    Carousel: { id: 'Carousel', displayName: 'Sekwencja grafik (Karuzela)', category: 'Visual', description: 'Seria powiązanych obrazów przeglądanych linearnie bez dźwięku (np. komiks, slajdy).' },
    Infographic: { id: 'Infographic', displayName: 'Infografika syntezująca', category: 'Visual', description: 'Głęboka fuzja danych liczbowych z architekturą graficzną, opowiadająca zamkniętą historię.' },
    RawAudio: { id: 'RawAudio', displayName: 'Surowy zapis audio', category: 'Audio', description: 'Rejestracja głosu bez czyszczenia szumów, efektów i muzyki tła. Czysta autentyczność.' },
    ProducedAudio: { id: 'ProducedAudio', displayName: 'Słuchowisko reżyserowane', category: 'Audio', description: 'Zmontowana ścieżka dźwiękowa: mastering, sound design, efekty i muzyka tła.' },
    ARollVideo: { id: 'ARollVideo', displayName: 'Rejestracja rzeczywistości (A-Roll)', category: 'Video', description: 'Gadająca głowa lub bezpośrednia relacja z kamery telefonu z prostymi cięciami.' },
    SlideshowVideo: { id: 'SlideshowVideo', displayName: 'Kompozycja statyczno-dynamiczna', category: 'Video', description: 'Oś audio (lektor) zsynchronizowana z montażem grafik, slajdów lub darmowych klipów stockowych.' },
    Screencast: { id: 'Screencast', displayName: 'Nagranie interfejsu (Screencast)', category: 'Video', description: 'Przechwycony obraz z ekranu komputera/telefonu z nałożonym komentarzem lub samouczkiem.' },
    CinematicVideo: { id: 'CinematicVideo', displayName: 'Wideo wielowarstwowe (Cinematic)', category: 'Video', description: 'Skomplikowana struktura: zaawansowany montaż, korekcja barwna, wielokamerowość, reżyseria.' },
    MotionGraphics: { id: 'MotionGraphics', displayName: 'Animacja cyfrowa (Motion)', category: 'Video', description: 'Obraz wygenerowany w całości cyfrowo (2D/3D). Brak ujęć z realnego świata.' },
    LiveStream: { id: 'LiveStream', displayName: 'Strumień na żywo (Live)', category: 'Hybrid', description: 'Produkcja i dystrybucja w czasie rzeczywistym. Brak postprodukcji, pełna improwizacja.' },
    MultimediaPage: { id: 'MultimediaPage', displayName: 'Strona wielomedialna', category: 'Hybrid', description: 'Nieliniowy reportaż internetowy łączący tekst, wideo i interaktywne osie czasu.' },
    BranchingNarrative: { id: 'BranchingNarrative', displayName: 'Treść drzewiasta', category: 'Hybrid', description: 'Interaktywne wideo lub tekst, gdzie decyzje odbiorcy rozgałęziają fabułę.' },
    AssetPack: { id: 'AssetPack', displayName: 'Paczka aktywów (Asset Pack)', category: 'Hybrid', description: 'Cyfrowe narzędzia dla innych twórców: presety, sample, szablony systemów, kody źródłowe.' },
    CurationFeed: { id: 'CurationFeed', displayName: 'Kuracja treści (Agregacja)', category: 'Hybrid', description: 'Autorskie filtrowanie chaosu sieci: bazy linków, prasówki, rankingi cudzych dzieł.' },
    CommunitySpace: { id: 'CommunitySpace', displayName: 'Przestrzeń społecznościowa', category: 'Hybrid', description: 'Tworzenie architektury relacji – serwery, fora i zamknięte ekosystemy dyskusyjne.' },
    InteractiveApp: { id: 'InteractiveApp', displayName: 'Aplikacja / Gry / Widgety', category: 'Hybrid', description: 'Pełna nieliniowość kodu. Narzędzia jednofunkcyjne, kalkulatory lub pełnoprawne gry.' },
    _blank: { id: '_blank', displayName: 'Coś innego (Eksperyment)', category: 'Exotic', description: 'Awangardowa publikacja łamiąca standardowe ramy produkcji i percepcji internetu.' }
  };
}
