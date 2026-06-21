# Pakiet usprawnień nauki: glosariusz, kolejność sesji, generacja fiszek, dekoder METAR

Cztery niezależne jednostki. Wdrażane osobno, każda weryfikowana niezależnie;
ta sama dokumentacja projektowa.

---

## Jednostka A - glosariusz + podpowiedzi tylko w odpowiedzi + więcej kodów METAR

### A1. Grupa "Wielkości lotnicze" w glosariuszu

- Nowy plik danych `src/lib/glossary/aero-terms.json` w kształcie `{ pairs: [{a,b,hint}] }`
  (jak inne źródła), ale TYLKO dla glosariusza - nie jest zestawem quizu, więc nie
  pojawi się jako drill.
- Zawartość (PL/EN): `Cx` (wsp. siły oporu), `Cz` (wsp. siły nośnej), `Cm`
  (wsp. momentu), `Cz/Cx` (doskonałość), `n` (wsp. obciążenia), prędkości
  `VNE, VNO, VA, VRA, VS, VS0, VS1, VFE` - każde z krótkim wyjaśnieniem.
- `glossaryGroups()` zwraca trzecią grupę. Nowy komunikat i18n `glossary_group_aero`.
- Terminy renderowane jako zwykły tekst (Cx, Cz/Cx, VNE) - prosta wyszukiwarka.

### A2. Podpowiedzi tylko po stronie odpowiedzi

- `RichText` dostaje opcjonalny prop `glossary` jako OGRANICZENIE (nie nadpisanie):
  `enabled = glossaryEnabled() && (glossary ?? true)`. Dzięki temu poza nauką
  (egzamin) tooltipy nigdy się nie pojawią, a w nauce wyłączamy je po stronie
  pytania.
- `RecallCard`: przód (`prompt`) → `glossary={false}`; tył + mnemonik bez zmian (on).
- `McqQuestion`: `stem` i każda odpowiedź do wyboru → `glossary={false}`;
  wyjaśnienie bez zmian (on).
- `ScenarioCard` bez zmian (dotyczy tylko fiszek i MCQ).

### A3. Więcej kodów METAR

- Rozszerz `metar-codes.json` o brakujące, popularne kody: intensywność `-`/`+`,
  opady `RA SN DZ SHRA TSRA GR`, zamglenia `BR FG HZ FU`, chmury
  `SCT BKN OVC NSC TCU CB`, oraz `BECMG TEMPO NOSIG VRB 9999` (pomijając
  istniejące). Zgodne ze schematem quizu (a/b/hint). Wzbogaca glosariusz i quiz.

---

## Jednostka C - inna kolejność dla każdej sesji (seed)

Problem: `buildStudyQueue` dokleja karty `fresh` (nigdy niewidziane) w stałej
kolejności decku, więc po otwarciu fiszek kolejność jest identyczna na każdym
urządzeniu. Karty `due` (z zapisanym stanem) są sortowane przez algorytm FSRS.

- Nowy util `src/lib/engine/shuffle.ts`: `seededShuffle(array, seed)` (Fisher-Yates
  - mulberry32). Czysty, testowalny.
- `buildStudyQueue` dostaje opcję `shuffleSeed`: gdy podana, tasuje `fresh` tym
  seedem; gdy nie - zachowuje kolejność decku (zgodność wsteczna testów).
- Strona sesji (`rebuild`) generuje losowy seed przy każdym otwarciu
  (`Math.floor(Math.random() * 2 ** 32)`) i przekazuje do `buildStudyQueue`.
- Karty `due` nadal sortowane po czasie wymagalności (algorytm). Czyli: nowe
  karty losowo per sesja, trwająca sesja (karty ze stanem) wg algorytmu.
- Seed stały w obrębie jednego otwarcia (liczony raz), więc kolejność nie skacze.

---

## Jednostka B - generacja fiszek (osobny workflow)

Cel: ~100 fiszek na przedmiot (~800 łącznie, 8 przedmiotów), dwujęzyczne,
zgodne ze schematem `flashcardSchema` (id, type:'flashcard', front{pl,en},
back{pl,en}, microSkill, loIds[≥1], licenses['SPL'], tags, opcjonalny mnemonic).

- **Generacja (fan-out):** dla każdego przedmiotu kilku agentów; każdy tworzy
  ~20-25 fiszek dla przydzielonych celów kształcenia (loIds danego przedmiotu),
  dostaje listę istniejących `front` (deduplikacja) oraz dozwolone wartości
  `microSkill`; zwraca JSON zgodny ze schematem.
- **Recenzja (pipeline):** każdą partię sprawdza drugi agent pod kątem
  poprawności merytorycznej, jakości PL/EN, formatu/schematu i duplikatów -
  istotne, bo to materiał do licencji lotniczej.
- **Scalanie (poza workflow):** deduplikacja globalna i względem istniejących,
  nadanie unikatowych id, dopisanie do plików decków, walidacja Zod
  (`loadContent`) + pełny zestaw testów.
- Token-heavy (~40+ agentów); uruchamiany w tle, raport liczb na końcu.

---

## Jednostka D - dekoder METAR (nowy moduł w Ćwiczeniach)

Interaktywne ćwiczenie: wygenerowany METAR u góry, pod spodem opisy do wyboru;
klikając token po tokenie składamy zdanie opisujące pogodę; aktualnie
dekodowany fragment METAR jest podświetlony; na koniec wynik.

### Generator (`src/lib/metar/generator.ts`)

- Proceduralnie składa poprawny METAR z elementów (seedowany PRNG, reuse
  `seededShuffle`/mulberry32): stacja (ICAO np. EPKK/EPWA/EPGD), czas DDHHMMZ,
  wiatr (`dddssKT`, warianty: cisza `00000KT`, zmienny `VRB`, porywy `G`),
  widzialność (`9999`/`NNNN`/`CAVOK`), zjawiska (opcjonalnie `-RA`, `+TSRA`,
  `BR`...), chmury (`FEW/SCT/BKN/OVC`+wysokość, `NSC`, `CB/TCU`), temperatura/
  punkt rosy (`TT/DD`, `M` dla ujemnych), ciśnienie (`Qxxxx`).
- Zwraca: pełny string METAR, listę tokenów pogodowych z poprawnym opisem PL/EN
  każdego (stacja+czas pokazane jako kontekst, nie dekodowane).

### Mechanika

- Token po tokenie, po kolei: aktualny token podświetlony w stringu METAR;
  użytkownik wybiera opis z listy; wybór dołącza do budowanego zdania; przejście
  do kolejnego tokenu.
- Dystraktory NIEOCZYWISTE: dla każdego tokenu opcje to poprawny opis + kilka
  wiarygodnych błędnych z tej samej kategorii (inne kierunki/prędkości wiatru,
  inne ilości chmur, podobne zjawiska), tasowane seedem. Bez natychmiastowego
  ujawniania poprawności.
- Koniec: wynik per token (ile poprawnie) + werdykt całości + podgląd
  poprawnego rozszyfrowania.

### UI / umiejscowienie

- Nowy kafelek w `/drills` → trasa `src/routes/drills/metar/+page.svelte`,
  komponent `MetarDecoder.svelte`. Tokeny pogodowe i podświetlanie spójne ze
  stylem aplikacji. Komunikaty i18n. Bez tooltipów glosariusza (to test).

### Testy

- Generator: poprawny format każdego tokenu, deterministyczny przy tym samym
  seedzie, poprawne opisy, dystraktory różne od poprawnej odpowiedzi.
- Komponent: podświetla bieżący token, dołącza wybór do zdania, liczy wynik,
  pokazuje werdykt; klawiatura/dostępność.
- E2E: ukończenie jednej rozgrywki i zobaczenie wyniku; brak poziomego
  przepełnienia (dodać trasę do overlap.e2e).

---

## Kolejność wdrożenia

1. A + C jako jedna zmiana kodu (TDD), własne testy i deploy.
2. D jako osobny moduł (TDD).
3. B jako workflow w tle; scalenie i walidacja po recenzji.

Wszystkie commity i pushe przez pełne hooki (bez `--no-verify`).
