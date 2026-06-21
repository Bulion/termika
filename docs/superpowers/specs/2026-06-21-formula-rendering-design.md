# Renderowanie wzorów (KaTeX + składnia backtick)

## Problem

Wzory w treści pytań są słabo sformatowane. Przykłady:

- `Cśr` powinno mieć `śr` w indeksie dolnym (obecnie płaski tekst).
- Całe wzory (np. `L = CL · ½ρV² · S`, `PA = elewacja + (1013 − QNH) × 27 ft/hPa`)
  nie wyróżniają się z otaczającego tekstu.

Dane przechowują wzory jako zwykły tekst w plikach JSON. Parser `RichText` wspiera
`<sub>`/`<sup>`, ale dane ich nie używają, a sam mechanizm nie daje wizualnego
wyróżnienia wzoru.

## Cel

1. Wzory wyróżnione wizualnie - kafelek z tłem, jak inline code na Slacku
   (otoczenie tekstu backtickami).
2. Prawdziwe renderowanie matematyczne (KaTeX): poprawne indeksy dolne/górne,
   spójna typografia.

## Decyzje

- **Renderowanie:** KaTeX (pełny TeX). Wzory w aplikacji są liniowe, ale KaTeX daje
  poprawną typografię indeksów i jest jednoznaczny.
- **Składnia w danych:** wzór w backtickach `` ` `` (ogranicznik, jak Slack);
  zawartość to źródło TeX. Indeks dolny `_`, górny `^`, wieloznakowy w `{}`
  (natywna składnia TeX).

## Architektura

### `$lib/text/rich-text.ts`

Parser rozbija tekst na segmenty po backtickach:

- `{ kind: 'text', value }` - zwykły tekst (zachowuje istniejące parsowanie
  `<sub>`/`<sup>` dla kompatybilności wstecznej).
- `{ kind: 'formula', value }` - zawartość między backtickami; `value` to źródło TeX.

Reguły:

- Niesparowany backtick (nieparzysta liczba) - traktowany jako zwykły znak,
  nie psuje renderu.
- Escapowany backtick `` \` `` - literał backticka w tekście.

### `$lib/text/katex.ts` (nowy)

`renderFormula(tex: string): string`:

- Woła `katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' })`.
- Pre-pass normalizujący Unicode obecny w danych na makra TeX:
  `·` → `\cdot`, `×` → `\times`, `÷` → `\div`, `−` → `-`, `²` → `^2`, `³` → `^3`,
  `½` → `\tfrac12`, `√` → `\sqrt`, litery greckie (`ρ`,`α`,…) → makra, `°` → `^\circ`,
  `≈` → `\approx`. Dzięki temu istniejący styl zapisu też się renderuje.
- Na błędzie parsowania KaTeX: log błędu (nie wyciszamy) + fallback do surowego
  tekstu w kafelku, żeby UI się nie wywaliło.

### `RichText.svelte`

- Segmenty tekstowe renderowane jak dotychczas (`<sub>`/`<sup>`/tekst).
- Segmenty formuły: `{@html renderFormula(value)}` owinięte w `<span class="formula">`.
- `{@html}` bezpieczne: wejście wyłącznie z naszych zwalidowanych JSON-ów
  (nie od użytkownika), KaTeX sanityzuje wyjście.

## Styl

Nowe tokeny w `src/lib/styles/tokens.css` (light + dark):

- `--color-formula-bg`, `--color-formula-ink`, `--color-formula-border`.
- Light: delikatne chłodne tło (pochodna `--color-surface-2`/`--color-answer`).
- Dark: lekko jaśniejsze od tła.

Klasa `.formula` (inline): tło `--color-formula-bg`, padding `0 var(--space-1)`,
`border-radius: var(--radius-sm)`, cienki `--color-formula-border`, dopasowany
line-height. KaTeX dziedziczy kolor z `--color-formula-ink`.

KaTeX CSS importowane raz w `src/lib/styles/app.css`; fonty KaTeX bundlowane
lokalnie (bez zewnętrznego CDN - aplikacja jest PWA offline, prerenderowana na
GitHub Pages).

## Migracja danych

Składnia: wzór w backtickach, `_`/`^`/`{}` dla indeksów. Oba języki `pl` i `en`.

Zakres - pełny przegląd plików z wzorami:

- `src/lib/drills/data/*.json` - `rule` (prawie zawsze wzór) + `prompt` ze
  zmiennymi `{b}`,`{s}`. Zmienne są poza backtickami i podmieniane przed renderem,
  więc nie kolidują z TeX `{}`.
- `src/lib/content/decks/*.json` - `stem`/`back`/`explanation` ze wzorami/zmiennymi.
- `src/lib/quiz/data/*.json` - wpisy ze wzorami (skale, przeliczenia).

Migrujemy tylko realne wzory (nie `A = Alfa` w fonetyce).

## Testy

- `rich-text.spec.ts` (rozszerzenie): wydzielanie segmentów formuł, niesparowany
  backtick, escapowanie, kompatybilność `<sub>`/`<sup>`.
- `katex.ts` (nowe): `C_{śr}` → indeks dolny, fallback przy błędnym TeX,
  normalizacja Unicode.
- Drill `prompt` z `{b}` poza backtickiem nadal podmienia zmienne.
- Component/E2E: formuła renderuje element KaTeX z klasą `.formula`.

## Kolejność implementacji

1. Mechanizm: parser + `katex.ts` + styl + testy (TDD).
2. Weryfikacja na kilku wzorach.
3. Migracja danych - pełne przejście przez 3 katalogi, oba języki.
