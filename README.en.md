# Termika

> Learn aviation theory that actually sticks.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
&nbsp;[🇵🇱 Polski](README.md) · **🇬🇧 English**

**Termika** is an open-source web app for learning the aviation theory needed to pass pilot
licence exams. The first supported licence (MVP) is the **SPL** - the sailplane (glider) pilot
licence. The app is fully **data-driven**: more licences and topics are added as data, without
code changes.

It runs in the browser, works **offline** (PWA), and has **no accounts and no backend** - all of
your progress stays on your device.

## Why Termika

Most study sites offer nothing but multiple-choice tests. Clicking through a question bank
teaches poorly - it is easy to memorise the shape of an answer instead of understanding the
material.

Termika **matches the learning method to the type of knowledge**: abbreviations are learned one
way, numeric values another, and in-flight decisions yet another. The exam is the check at the
end, not the only study tool.

## What it does

### Learning matched to the type of knowledge

- **Spaced-repetition flashcards** (FSRS algorithm) - active recall with a difficulty rating;
  material comes back right as you start to forget it.
- **Abbreviations trainer** - aviation abbreviations both ways (abbreviation → meaning and
  meaning → abbreviation).
- **Concept-to-value recall** - limits, minima, speeds and thresholds you must know from memory.
- **Decision scenarios** - in-flight situations where you plan your response, then compare it
  against a model checklist.

### Timed drills (parametrically generated)

Values are randomised on every attempt, so they cannot simply be memorised:

- unit conversions, navigation rules of thumb, fuel and mass,
- headings: **variation and deviation** (true ↔ magnetic ↔ compass),
- the **wind triangle** (E6B wind side): ground speed and heading to fly,
- performance: pressure and density altitude, glide range, ISA temperature,
- glider calculations: wing aspect ratio, load factor and stall speed in a turn.

### Active-recall quizzes

- the **ICAO phonetic alphabet**, **METAR/TAF codes**, and per-subject **key-facts** sets - you
  type the answer instead of picking it.

### Interactive E6B computer

A faithful, fully interactive replica of the circular flight computer (logarithmic slide rule +
wind side), touch-friendly, opening as a fluid panel next to the questions.

### Exam / ULC simulation

- The **official ULC LKE question bank (1354 questions)** with **our own, independently verified
  answer key**, plus a smaller curated set.
- Per-subject mode, with a justification and a regulation/principle reference for every question.

### Your data stays with you

- Progress is stored locally (IndexedDB), with **JSON export and import**.
- **Offline** (PWA), fully responsive (phone/tablet/desktop, any layout), **light and dark
  themes**, **PL/EN** interface.

## Trustworthiness and disclaimer

- The exam question text comes from the **official, public ULC bank** and was verified
  content-for-content against the official PDF.
- **The answer key is ours**: generated independently by a language model and cross-checked;
  contested questions were resolved by a separate, stronger model. A few items are flagged as
  needing review.
- Termika is an **unofficial study aid** and is not affiliated with ULC. It does not replace
  official materials or training - when in doubt, always check the source.

## License

Code and original content: **GPL-3.0-or-later** (see [LICENSE](LICENSE)). The official ULC
questions remain public, official material.

---

## Development

### Tech stack

- **SvelteKit 2 / Svelte 5** (runes) + **adapter-static** (SPA, hosted on GitHub Pages)
- **ts-fsrs** (spaced repetition), **Dexie** (IndexedDB), **Zod** (data validation)
- **Paraglide** (PL/EN i18n), **vite-plugin-pwa** (offline), **convert-units**, **Chart.js**
- Tests: **Vitest** (unit + in-browser component), **Playwright** (E2E)
- Quality: **ESLint**, **Prettier**, **stylelint**, **svelte-check**, **Husky** hooks

### Quick start

```bash
git clone <repo>
cd licencjeLotnicze
npm install        # installs dependencies and git hooks
npm run dev        # dev server
```

Production:

```bash
npm run build      # static build into ./build
npm run preview    # preview the production build locally
```

### Useful scripts

| Script                                                       | Description                                   |
| ------------------------------------------------------------ | --------------------------------------------- |
| `npm run dev` / `build` / `preview`                          | dev mode / build / preview                    |
| `npm run check`                                              | type checking (svelte-check)                  |
| `npm run lint` / `format`                                    | Prettier + ESLint + stylelint                 |
| `npm run test:unit` / `test:component` / `test:e2e` / `test` | tests                                         |
| `npm run messages`                                           | compile Paraglide translations                |
| `npm run gen:e6b`                                            | generate the E6B computer's static SVG assets |
| `npm run assemble:content`                                   | assemble content from source data             |

### Project layout

```
src/lib/content   data-driven content: decks, taxonomy (subjects + objectives), Zod schemas
src/lib/drills    timed-drill engine + JSON data
src/lib/quiz      quiz engine (typed answers) + JSON data
src/lib/engine    FSRS scheduler, Dexie, session building, progress
src/lib/e6b       interactive E6B computer
src/lib/exam      exam engine and question sources
src/routes        pages: study, drills, exam, progress
static/external   ulc-spl.json - the official SPL question bank
```

### How we work

- Content is **data** - new questions, flashcards and drills are added via Zod-validated JSON
  files, with no changes to the engine code.
- Every commit passes **lint and the full test suite** (enforced by the `pre-commit` hook).
- Styling has a **single source of truth** (design tokens); themes override a set of variables.
- Pull requests and issues are welcome.
