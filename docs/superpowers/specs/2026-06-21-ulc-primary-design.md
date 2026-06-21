# ULC jako główne źródło egzaminu + gotowość liczona z ULC

## Problem

Strona postępów pokazuje 0% we wszystkich kategoriach mimo ukończonych egzaminów
ULC. Przyczyna: gotowość liczy `computeMastery` ze stanów FSRS WBUDOWANYCH pytań
(nasze decki, study), a egzaminy ULC są zewnętrzne (`if (!activeExternal)` nie
zapisuje nic do `cardState`; pytania ULC mają `loId 'ulc'`, nie mapują się na
przedmiot). Egzamin ULC trafia tylko do historii (`mockResults`), nie do
gotowości.

Dodatkowo użytkownik bywa zdezorientowany: nasze własne pytania mieszają się z
oficjalnym materiałem ULC.

## Cel

1. ULC jest GŁÓWNYM (jedynym) źródłem egzaminu.
2. Gotowość na pulpicie liczona z wyników egzaminów ULC, per 9 kategorii ULC.
3. Nasze pytania = materiał NIEOFICJALNY (poszerzanie wiedzy) w sekcji Nauka,
   wyraźnie oznaczone.

## Architektura

### A. Egzamin tylko ULC (`src/routes/exam/+page.svelte`, `sources.ts`)

- Ekran egzaminu oferuje wyłącznie źródła zewnętrzne (ULC); „Wewnętrzne (SPL)”
  znika z wyboru. Domyślnie ULC. `INTERNAL_SOURCE_ID` zostaje (Study/external
  korzysta z `external` źródeł), ale nie jest pokazywane na egzaminie.

### B. Zapis wyniku per kategoria (`exam/+page.svelte`, `exam/score`)

- W `submit()` dla egzaminu ULC liczymy rozbicie po kategoriach z tagów
  `cat-N` odpowiadanych pytań: `{ [catId]: { correct, total } }`.
- Zapis do wiersza `mockResults` w nowym, NIEINDEKSOWANYM polu `categories`
  (Dexie nie wymaga migracji dla pól nieindeksowanych). Pole `scorePct`
  i `passed` bez zmian. Egzamin per kategoria → jedno wejście; cała baza →
  wiele wejść (wszystkie dotknięte kategorie).
- Typ `MockResultRow` (db.ts) zyskuje opcjonalne
  `categories?: { id: string; correct: number; total: number }[]`.

### C. Gotowość z ULC (`src/lib/mastery/ulc-readiness.ts`, dashboard)

- Nowy `computeUlcReadiness(rows, categories)`:
  - Per kategoria: średni % z OSTATNICH (do 5) podejść obejmujących tę kategorię.
    Źródło %: wejście w `row.categories` (correct/total) ALBO wiersz
    `subjectId === 'ulc:<id>'` (jego `scorePct`).
  - Ogólna gotowość: średni `scorePct` z ostatnich (do 5) podejść ULC
    (`subjectId` zaczyna się od `ulc`).
  - Zwraca `{ categories: [{ id, name, readinessPct, attempts }], overallPct }`.
- Pulpit (`dashboard/+page.svelte`): ładuje `mockResults` + listę kategorii ULC
  (`loadExternalCategories('ulc')`); sekcja „Przedmioty/Gotowość” pokazuje 9
  kategorii ULC z paskami; wskaźnik gotowości = `overallPct`. Zastępuje metrykę
  FSRS po wbudowanych pytaniach. Historyczne egzaminy (bez `categories`)
  zasilają tylko gotowość ogólną.
- Etykiety historii egzaminów: `subjectId` typu `ulc:<id>` → nazwa kategorii
  z listy ULC; `ulc` → nazwa źródła; wewnętrzne → bez zmian.

### D. Oznaczenie „nieoficjalne” (Nauka)

- Krótka notka/badge na `/study` i `/study/external`: „Materiał nieoficjalny -
  poszerzenie wiedzy. Do egzaminu obowiązuje baza ULC.” Nowy komunikat i18n.

## Testy

- `computeUlcReadiness`: średnia ostatnich per kategoria, gotowość ogólna, stan
  pusty (0%), wiersze legacy (`ulc:<id>` po `scorePct`), okno „ostatnich N”.
- Rozbicie po kategoriach w `submit`/score: poprawne grupowanie po `cat-N`.
- Komponent/E2E: ekran egzaminu pokazuje tylko ULC; po zapisaniu wyniku pulpit
  nie jest już 0%.

## Kolejność

1. `computeUlcReadiness` + typy (TDD).
2. Zapis rozbicia per kategoria w egzaminie.
3. Pulpit na nowej metryce + etykiety.
4. Egzamin tylko ULC.
5. Badge „nieoficjalne” w Nauce.
6. Testy E2E.

Commity/pushe przez pełne hooki.
