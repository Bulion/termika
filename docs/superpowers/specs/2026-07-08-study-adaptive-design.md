# Deduplikacja pytań, losowa kolejność odpowiedzi, adaptacyjna nauka bez końca

## Problem

1. Na egzaminie potrafi pojawić się dwa razy „to samo" pytanie. Losowanie już
   jest bez zwracania (`pickQuestions` = shuffle + slice), ale baza ULC zawiera
   41 grup pytań IDENTYCZNYCH bajt w bajt (ten sam stem i te same odpowiedzi,
   różne ID), więc dwa duplikaty mogą trafić do jednej 20-pytaniowej sesji.
2. Odpowiedzi renderują się zawsze w kolejności z JSON-a - użytkownik uczy się
   pozycji odpowiedzi zamiast treści.
3. Nauka z bazy ULC (`/study/external`) ucina sesję do 20 pytań
   (`sessionSize` w `McqPractice`), czyli imituje egzamin zamiast służyć do
   nauki. Kolejne pytanie to po prostu następny element potasowanej talii -
   brak adaptacji do wyników, brak statystyk sesji.

## Cel

1. Egzamin nigdy nie pokaże dwóch identycznych pytań (duplikaty bajtowe).
   Warianty o tym samym stemie, ale innych odpowiedziach, POZOSTAJĄ dozwolone
   (decyzja użytkownika).
2. Kolejność odpowiedzi losowa przy każdej prezentacji pytania - na egzaminie
   i w nauce.
3. Nauka ULC bez końca: ważone losowanie kolejnego pytania wg trwałego
   rankingu (poprawność + szybkość odpowiedzi + szybkość kliknięcia „dalej"),
   okno chłodzenia 10 pytań, pasek statystyk sesji (dobre/złe/procent),
   wyjście w dowolnym momencie.

## Architektura

### A. Deduplikacja bajtowych duplikatów (`src/lib/exam/exam.ts`)

- Nowy czysty helper `dedupeExactMcqs(questions: Mcq[]): Mcq[]`:
  klucz = znormalizowany stem (lowercase, zbite białe znaki) + posortowane
  znormalizowane teksty odpowiedzi; zostaje pierwsze wystąpienie.
- Zastosowanie: pula w `startExternal()` (`exam/+page.svelte`) przed
  `pickQuestions` ORAZ pula nauki w `study/external/+page.svelte`
  (żeby tryb bez końca nie mielił identycznych kopii).
- Danych w `ulc-spl.json` NIE zmieniamy.

### B. Losowa kolejność odpowiedzi (`McqQuestion.svelte`)

- Tasowanie Fishera-Yatesa listy `choices` WEWNĄTRZ `McqQuestion`
  (`$derived` od `question`), wstrzykiwalny RNG (`pick` prop, domyślnie
  `Math.random`) dla testów.
- Kolejność stabilna przez cały czas wyświetlania pytania, łącznie z fazą
  `reveal` (feedback / przegląd egzaminu).
- Poprawność nietknięta: odpowiedź porównywana po ID opcji, nie po pozycji.
- Obejmuje automatycznie egzamin i naukę (oba renderują przez `McqQuestion`).

### C. Adaptacyjny silnik nauki (`src/lib/study/adaptive.ts` + Dexie v2)

- Nowa tabela Dexie `mcqStats` (bump do `version(2)`), wiersz per pytanie:
  `{ itemId, attempts, mastery, avgAnswerMs, updatedAt }`.
- `mastery` = wykładnicza średnia krocząca (EMA, alfa 0.3) w [0,1] z „ocen"
  pojedynczych odpowiedzi:
  - zła odpowiedź → 0;
  - dobra odpowiedź → 1.0 gdy szybka, liniowo do 0.6 gdy wolna
    (answerMs ≤ 15 s pełna, ≥ 60 s minimum);
  - mały bonus, gdy „dalej" kliknięte szybko po feedbacku (nextMs ≤ 3 s) -
    użytkownik nie musiał studiować wyjaśnienia.
- `updateStat(prev, { correct, answerMs, nextMs })` → nowy wiersz (czysta
  funkcja).
- `weightFor(stat | undefined)`: pytanie niewidziane → lekki boost (pokrycie
  całej bazy); widziane → waga rosnąca z (1 − mastery), słabo opanowane do
  ~10x częściej niż opanowane.
- `pickNext(pool, stats, recentIds, rng)`: ważone losowanie z puli
  z wykluczeniem ostatnich 10 pokazanych ID (w tym bieżącego); okno kurczy
  się automatycznie dla małych pul (nigdy nie blokuje całej puli).

### D. UI nauki bez końca (`McqPractice.svelte`, `study/external/+page.svelte`)

- `McqPractice` (używany tylko przez naukę ULC) przechodzi na tryb bez końca:
  znika `sessionSize`, skończona talia i pasek postępu.
- Pasek statystyk sesji na górze: liczba dobrych, złych, procent poprawnych.
  Statystyki sesji ulotne (reset przy wyjściu); `mastery` per pytanie trwałe
  w IndexedDB.
- Pomiar czasu w komponencie: `answerMs` = pokazanie pytania → „sprawdź";
  `nextMs` = feedback → „dalej".
- Po odpowiedzi: zapis `updateStat` do `mcqStats` (await, błędy propagują -
  bez cichych catchy) + istniejący `onAttempt` → FSRS bez zmian.
- Przycisk powrotu do listy kategorii w dowolnym momencie.
- Nowe komunikaty i18n (pl + en) dla paska statystyk.

## Testy

- `dedupeExactMcqs`: usuwa kopie bajtowe, zachowuje warianty o wspólnym
  stemie, zachowuje pierwsze wystąpienie, normalizacja białych znaków.
- `updateStat`: EMA, skala szybkości, bonus za szybkie „dalej", zła
  odpowiedź → spadek mastery.
- `pickNext`: honoruje chłodzenie, nigdy nie zwraca bieżącego pytania,
  kurczenie okna dla małych pul, preferencja słabo opanowanych (statystycznie
  z seedowanym RNG).
- Komponentowe: `McqQuestion` tasuje odpowiedzi (deterministyczny `pick`),
  poprawność po ID; `McqPractice` - pasek statystyk aktualizuje się, sesja
  nie kończy się po 20 pytaniach.
- Istniejące e2e (`exam.e2e.ts`, `study.e2e.ts`) zielone.

## Kolejność

1. `dedupeExactMcqs` + podpięcie w egzaminie i nauce (TDD).
2. Tasowanie odpowiedzi w `McqQuestion` + testy komponentowe.
3. `adaptive.ts` (updateStat, weightFor, pickNext) + Dexie v2 (TDD).
4. Przebudowa `McqPractice` na tryb bez końca ze statystykami + i18n.
5. E2E i pełna weryfikacja.

Commity/pushe przez pełne hooki.
