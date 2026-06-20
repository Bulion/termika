# Termika

Data-driven web app for learning aviation theory for pilot licenses (MVP: **SPL**, gliders).
The teaching method is matched to the type of knowledge instead of a one-size-fits-all quiz:
spaced-repetition flashcards, an abbreviations trainer, a concept-to-number trainer, timed
unit-conversion drills, navigation rule-of-thumb drills, and a ULC-style exam simulation.

Bilingual **PL/EN**, fully responsive, offline-capable (PWA), progress stored locally
(IndexedDB) with JSON export/import. No backend; hosted as a static site on GitHub Pages.

## Stack

SvelteKit (`adapter-static`, SPA) · ts-fsrs (spaced repetition) · Dexie (IndexedDB) ·
vite-plugin-pwa · Chart.js · convert-units · Paraglide (i18n) · Vitest · Playwright.

## Development

```bash
npm install             # installs deps and git hooks
npm run dev             # dev server
npm run build           # static build into ./build
npm run preview         # preview the production build
npm run lint            # prettier + eslint + stylelint
npm run check           # svelte-check / TypeScript
npm run test:unit       # fast node unit tests
npm run test:component  # in-browser component tests (needs Playwright browsers)
npm run test:e2e        # end-to-end + visual tests
```

Pre-commit runs lint-staged + `svelte-check` + unit tests. Pre-push runs the full lint and
test suite. CI mirrors these gates.

## Content sources and licensing

The app is **GPL-3.0-or-later**. Content is normalized into a common item schema by per-source
adapters implementing `SourceAdapter`. The `fifly/PPL-A` set is GPL-3.0 and reused under those
terms: `npm run ingest:fifly` pulls the questions straight from the source and writes a
normalized deck into the git-ignored `content-generated/` directory (skipped malformed blocks
are reported, never silently dropped). A ULC-PDF adapter is a planned follow-up using the same
`SourceAdapter` contract. Questions derived from copyrighted catalogs (e.g. ECQB / commercial
banks) are **not** redistributed in this repository; adapters for such sources are intended for
local, private study only.

## License

[GPL-3.0-or-later](./LICENSE)
