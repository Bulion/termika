# Glosariusz: tooltipy skrótów + przeszukiwalna strona

## Problem

W treści do nauki pojawiają się lotnicze skróty (METAR, QNH, VFR...) bez
wyjaśnienia. Uczący się musi przerywać naukę, by sprawdzić ich znaczenie.
Brakuje też jednego miejsca, gdzie można przeszukać wszystkie skróty.

## Cel

1. W trybie nauki skróty są podkreślone linią przerywaną; najechanie/fokus/tap
   pokazuje dymek z wyjaśnieniem. NIE w trybie sprawdzania wiedzy (drille,
   egzamin), gdzie podpowiedź byłaby ściąganiem.
2. Osobna, przeszukiwalna strona glosariusza (pod sekcją Nauka) ze skrótami
   i kodami METAR.

## Decyzje

- Źródło definicji tooltipów: `src/lib/quiz/data/abbreviations.json`. Token =
  skrót (`a`), definicja = `hint[locale]` (wyjaśnienie zwykłym językiem),
  fallback `b[locale]`.
- Zakres tooltipów: tylko `/study/*` (nauka). Wyłączone w `/drills/*` i `/exam`.
- Wykrywanie: automatyczne, całe słowa, z rozróżnieniem wielkości liter, tylko
  PIERWSZE wystąpienie danego skrótu w danym bloku tekstu.
- Dymek: własny, stylowany; hover + focus + tap; dostępny.
- Strona glosariusza: pod `/study`, zawiera skróty + kody METAR
  (`metar-codes.json`), z wyszukiwarką.

## Architektura i zakres (scoping)

Te same komponenty (`McqQuestion`, `RichText`) są używane i w nauce, i w
egzaminie, więc funkcji nie można włączać per-komponent. Sterujemy nią
**kontekstem Svelte**:

- `src/lib/glossary/context.ts` - `setGlossaryEnabled()` / `glossaryEnabled()`
  przez `setContext`/`getContext` (klucz `Symbol`). Domyślnie wyłączone.
- `src/routes/study/+layout.svelte` - ustawia flagę na `true`, obejmując
  `/study`, `/study/session`, `/study/external`, `/study/glossary`.
- `RichText.svelte` czyta flagę. Gdy wyłączona - zachowanie bez zmian (drille,
  egzamin renderują się jak dziś).

## Tooltipy inline

### `src/lib/glossary/data.ts`

- Buduje (memoizowaną per-locale) mapę `token -> definicja` z
  `abbreviations.json`: token = `a[locale] ?? a.pl`, definicja =
  `hint[locale] ?? hint.pl ?? b[locale] ?? b.pl`.
- Udostępnia prekompilowany matcher: alternatywa regex ze wszystkich skrótów,
  escapowanych, sortowanych od najdłuższego, z granicami słów, dopasowanie z
  rozróżnieniem wielkości liter.

### `findGlossaryMatches(text, locale)`

Czysta funkcja. Dzieli tekst na części wokół PIERWSZEGO wystąpienia każdego
odrębnego skrótu (longest-match, całe słowo, case-sensitive). Zwraca listę
fragmentów: zwykły tekst lub `{ term, definition }`. Zakres "pierwsze
wystąpienie" = pojedyncza instancja `RichText` (jedno pole, np. stem albo dana
odpowiedź).

### `GlossaryTerm.svelte`

- Renderuje skrót z podkreśleniem linią przerywaną.
- Dymek stylowany tokenami (`--color-surface`, `--color-outline`,
  `--shadow-card`, oba motywy), pokazywany na hover, focus i tap.
- Dostępność: element fokusowalny (`<button type="button">`), `aria` wiążące
  dymek z terminem; zamknięcie Esc/blur.
- Pozycjonowanie nad/pod terminem; `max-width` i zawijanie, bez wypychania
  strony w poziomie (spójnie z testem overlap/overflow).

### `RichText.svelte`

- Gdy `glossaryEnabled()` jest `true`, segmenty `'normal'` przepuszczane przez
  `findGlossaryMatches`; dopasowania renderowane jako `GlossaryTerm`.
- Segmenty `formula` / `sub` / `sup` nietknięte.
- Gdy wyłączone - kod jak dotychczas.

## Strona glosariusza

- Nowa trasa `src/routes/study/glossary/+page.svelte` + kafelek na `/study`.
- Wczytuje `abbreviations.json` i `metar-codes.json`; dwie grupy:
  "Skróty" i "Kody METAR".
- Pole wyszukiwania filtruje po terminie LUB po znaczeniu; bez rozróżniania
  wielkości liter i znaków diakrytycznych (normalizacja NFD + usunięcie
  diakrytyków).
- Każdy wiersz: termin, rozwinięcie (`b`), wyjaśnienie (`hint`). Zlokalizowane,
  offline (dane w paczce), tokeny i `<title>`/SEO jak inne strony.

## Testy

- Jednostkowe `data.ts`: budowa mapy, fallback `hint`→`b`, dopasowanie całych
  słów i z rozróżnieniem wielkości liter, tylko pierwsze wystąpienie,
  longest-match, brak dopasowania wewnątrz słowa, locale.
- Komponentowe: `GlossaryTerm` (klasa podkreślenia, dymek pokazuje definicję po
  focusie, dostępne `aria`); `RichText` (z kontekstem - opakowuje pierwszy
  skrót; bez kontekstu - brak; formuły nietknięte).
- Strona glosariusza: renderuje wpisy, wyszukiwarka filtruje.
- E2E: ekran `/study` pokazuje podkreślony termin z dymkiem; `/exam` NIE;
  `/study/glossary` - wyszukiwanie filtruje wyniki.

## Kolejność implementacji

1. `context.ts` + `/study/+layout.svelte`.
2. `data.ts` + `findGlossaryMatches` (TDD).
3. `GlossaryTerm.svelte` + integracja w `RichText` (TDD).
4. Strona `/study/glossary` + kafelek + wyszukiwarka.
5. Testy E2E.
