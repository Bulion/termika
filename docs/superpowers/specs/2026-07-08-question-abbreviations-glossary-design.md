# Skróty z pytań w słowniczku

## Problem

Baza ULC (1354 pytania) i wbudowane decki (964 pozycje) używają ~424
różnych tokenów pisanych wersalikami; ~381 z nich nie ma wpisu w
słowniczku. Uczący się trafia w pytaniach na skróty (ICAO, FCL, QNH, ISA,
SERA, VMC, CTR, MTOM...), których aplikacja nigdzie nie objaśnia.

## Cel

Każdy PRAWDZIWY skrót lotniczy występujący w commitowanej treści pytań ma
wpis w `src/lib/quiz/data/abbreviations.json`. Przez istniejące mechanizmy
wpis automatycznie:

1. staje się terminem tooltipa w tekstach nauki (`buildGlossary`),
2. jest widoczny i wyszukiwalny na `/study/glossary`,
3. wchodzi do drilla „Skróty lotnicze".

Tooltipy w pytaniach quizów/egzaminu POZOSTAJĄ wyłączone
(`glossary={false}` w `McqQuestion`) - tooltip zdradzałby odpowiedzi typu
„co oznacza skrót QNH?".

## Zakres źródeł

Tylko treść commitowana: `static/external/ulc-spl.json`,
`src/lib/content/decks/spl-*.json` (8 plików), `src/lib/quiz/data/*.json`.
Banki gitignorowane (pplka, content-generated) poza zakresem.

## Architektura

### A. Ekstrakcja (jednorazowa, bez nowego kodu w repo)

Skrypt roboczy w scratchpadzie (nie commitowany): tokeny
`(?<![\p{L}\p{N}])[A-ZĄĆĘŁŃÓŚŹŻ]{2,6}[0-9]{0,2}(?![\p{L}\p{N}])` ze
stemów, odpowiedzi, wyjaśnień, frontów/backów; zliczenie częstości;
odjęcie tokenów już obecnych w trzech plikach słowniczka.

### B. Kuracja (ręczna, ~120-160 wpisów)

Wchodzą: skróty ICAO/EASA/urzędowe (ULC, PAŻP, PKBWL), przestrzeń i
procedury (CTR, TMA, FIS, SERA), meteo (ISA, DALR, QNH, QFE), nawigacja i
technika (WCA, VAR, HDG, MTOM, AFM), jednostki lotnicze (NM, FL, UTC),
licencjonowanie (FCL, SPL, LAPL, ARC, ATO, AME, MED), frazeologia radiowa
jako wpisy wielowyrazowe (MAYDAY, PAN PAN, SAY AGAIN, ROGER), prefiks
rejestracji SP.

Nie wchodzą: zwykłe słowa pisane wersalikami dla emfazy (PRZED, HEAVY),
alfabet fonetyczny (osobny quiz), liczebniki rzymskie, placeholdery
algebraiczne (OX, OY, OZ), artefakty egzaminacyjne oraz tokeny
niezidentyfikowane - te ostatnie trafiają do raportu dla użytkownika
zamiast do zgadywania.

### C. Format wpisu (konwencje istniejącego pliku)

- `id`: `abbr-<token małymi literami>` (spacje → myślnik, np.
  `abbr-pan-pan`).
- `a.pl`: skrót (wielowyrazowy dozwolony - regex słowniczka to obsługuje).
- `b.pl`: kanoniczne rozwinięcie - angielskie dla terminów
  międzynarodowych („International Civil Aviation Organization"), polskie
  dla instytucji polskich („Urząd Lotnictwa Cywilnego").
- `hint.pl` + `hint.en`: krótkie znaczenie potocznym językiem (tooltip
  pokazuje `hint ?? b`). KAŻDY nowy wpis ma hint.
- `acceptB`: alternatywne aktualne rozwinięcia, gdy istnieją.
- `keywordsB`: grupy słów kluczowych dla długich rozwinięć, żeby quiz
  tekstowy oceniał sprawiedliwie (wzorzec istniejących 22 par).

Nowe wpisy dopisane po istniejących 22, posortowane alfabetycznie po
`a.pl`. Istniejące wpisy bez zmian.

### D. Testy strażnicze (`src/lib/glossary/data.spec.ts`)

1. Brak duplikatów tokenów `a` w sumie trzech plików źródłowych
   słowniczka (duplikat = niejednoznaczny tooltip).
2. Każda para w `abbreviations.json` ma `hint` (spójność tooltipów).

Schemat zod (`quizSetSchema`) waliduje plik jak dotąd; pełna suita (w tym
e2e glossary i drill skrótów) musi pozostać zielona.

## Znane konsekwencje

- Talia drilla „Skróty" to wszystkie pary x kierunki, bez cięcia: rośnie z
  ~44 do ~300 pytań na przebieg. Zaakceptowane świadomie; ewentualny limit
  talii to osobna, przyszła zmiana.
- Rozmiar mapy tooltipów rośnie ~7x; `findGlossaryMatches` buduje jeden
  regex z alternatywą posortowaną malejąco po długości - koszt pomijalny.

## Wynik dodatkowy

Raport dla użytkownika: lista tokenów wykluczonych jako
niezidentyfikowane/wątpliwe (z częstościami), do ewentualnego uratowania.

## Kolejność

1. Ekstrakcja + kuracja listy (scratchpad).
2. Autorstwo wpisów i dopisanie do `abbreviations.json`.
3. Testy strażnicze.
4. Pełna weryfikacja suity + raport wykluczeń.

Commity/pushe przez pełne hooki.
