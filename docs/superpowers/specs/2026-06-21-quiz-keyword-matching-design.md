# Dopasowanie odpowiedzi w quizach po słowach kluczowych

## Problem

Quizy tekstowe (recall) wymagają niemal dosłownej zgodności z oczekiwaną
odpowiedzią. Poprawna merytorycznie, ale inaczej sformułowana odpowiedź jest
oznaczana jako błędna. Przy poprawnej odpowiedzi nie widać też wzorcowej.

Przykład: pytanie „Co mierzy prędkościomierz?”, oczekiwane „Prędkość przyrządowa
(IAS) - na podstawie ciśnienia dynamicznego...”. Wpisanie „IAS” powinno być
zaliczone.

## Cel

1. Quizy tekstowe oceniają po słowach kluczowych (rdzenie + skróty, łapiące
   odmiany), nie po dosłownym dopasowaniu.
2. Po każdej odpowiedzi (także poprawnej) widoczna jest odpowiedź wzorcowa.
3. Drille liczbowe (DrillRunner) bez zmian - dalej tolerancja numeryczna.

## Architektura

### Schemat (`src/lib/quiz/schema.ts`)

- `quizPairSchema` zyskuje opcjonalne `keywordsB` i `keywordsA` typu
  `string[][]` (domyślnie `[]`). Każdy element to GRUPA wymaganych wariantów
  (rdzenie/skróty) jednego pojęcia.

### Generator (`src/lib/quiz/generator.ts`)

- `QuizQuestion` zyskuje `keywordGroups: string[][]`. Dla kierunku `a-to-b`
  bierzemy `pair.keywordsB`, dla `b-to-a` `pair.keywordsA`.
- `isQuizAnswerCorrect(input, expected, accept, keywordGroups = [])`:
  - `normalizeAnswer` jak dziś (NFD, bez diakrytyków/interpunkcji, małe litery).
  - Zwraca `true`, gdy: znormalizowane `input` równa się `expected` lub
    elementowi `accept` (zachowanie zapasowe), LUB gdy `keywordGroups` jest
    niepuste i dla KAŻDEJ grupy istnieje wariant, którego znormalizowana postać
    jest podłańcuchem znormalizowanego `input`.
  - Dopasowanie po podłańcuchu rdzenia łapie odmiany (`przyrządow` →
    przyrządowa/-ą/-ej); skróty (`ias`) to własny wariant.
  - Puste `input` → `false`.

### UI (`src/lib/components/QuizRunner.svelte`)

- `submit` przekazuje `current.keywordGroups` do `isQuizAnswerCorrect`.
- Faza `feedback` pokazuje odpowiedź wzorcową ZAWSZE: przy poprawnej („Dobrze!”
  - odpowiedź wzorcowa), przy błędnej („Poprawnie: …”). Nowy komunikat i18n na
    etykietę wzorcowej odpowiedzi przy poprawnej.

## Dane (quizy `facts-*`)

- Workflow (jeden agent na plik `facts-*`) dodaje `keywordsB` do par z
  odpowiedzią-frazą. Dla każdej odpowiedzi MINIMALNE istotne grupy pojęć
  (zwykle jedna), z wariantami jako rdzenie + skróty (małe litery, bez
  diakrytyków). Konserwatywnie - tak, by jedno trafne pojęcie wystarczyło, gdy
  odpowiedź ma jeden istotny koncept.
- Quizy `abbreviations`, `metar-codes`, `phonetic` zostają na listach `accept`.
- Scalanie po walidacji schematem + dedup względem istniejących `acceptB`.

## Testy

- `isQuizAnswerCorrect`: trafienie po rdzeniu/odmianie, po skrócie, wymaganie
  wszystkich grup, zapasowe dopasowanie dokładne/accept, odrzucenie błędnej i
  pustej odpowiedzi.
- `QuizRunner`: odpowiedź wzorcowa widoczna przy poprawnej odpowiedzi.
- Schemat akceptuje `keywordsB`.

## Kolejność

1. Schemat + generator + matcher + UI + testy (TDD).
2. Workflow generujący `keywordsB` dla `facts-*`; scalenie i walidacja.

Commity/pushe przez pełne hooki.
