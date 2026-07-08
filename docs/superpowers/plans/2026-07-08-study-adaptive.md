# Adaptive Study, Answer Shuffle, Exam Dedupe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove byte-identical duplicate questions from exam/study pools, randomize answer order everywhere MCQs render, and turn ULC study into an endless adaptive session with persisted per-question mastery and a session stats strip.

**Architecture:** Pure helpers in `src/lib/exam/exam.ts` (dedupe, seeded per-question choice order) and a new pure module `src/lib/study/adaptive.ts` (mastery EMA, weights, weighted draw with cooldown). Persistence is a new Dexie table `mcqStats` (version 2). UI: `McqQuestion.svelte` renders seeded-shuffled choices; `McqPractice.svelte` becomes an endless adaptive runner with a stats strip; `study/external/+page.svelte` wires stats load/save.

**Tech Stack:** SvelteKit (Svelte 5 runes), TypeScript, Dexie (IndexedDB), Vitest 4 (server project + browser/component project via vitest-browser-svelte), Playwright e2e, Paraglide i18n.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-08-study-adaptive-design.md`.
- Indentation: tabs (project prettier config). Follow existing file style; short JSDoc one-liners on exported helpers match `exam.ts` convention; no other comments.
- Correctness is always compared by choice ID (`selected === question.answer`), never by position.
- `static/external/ulc-spl.json` must NOT be modified.
- Same-stem question variants with DIFFERENT choice texts stay eligible; only byte-identical (stem + all choice texts) duplicates are dropped.
- Cooldown window: last 10 shown question IDs, shrinking to `pool.length - 1` for small pools.
- No silent catches; DB writes awaited, errors propagate.
- i18n: every new UI string gets a key in BOTH `messages/pl.json` and `messages/en.json`. No em-dash in copy.
- Commits: conventional commits, no AI attribution. Pre-commit hook runs prettier + svelte-check + unit tests automatically; commits are slow, expect the hook output.
- Test commands: `npx vitest run --project=server <path>` (node), `npx vitest run --project=client <path>` (browser components), `npm run test:e2e` (Playwright).

---

### Task 1: `dedupeExactMcqs` + wiring into exam and study pools

**Files:**

- Modify: `src/lib/exam/exam.ts` (add helper after `pickQuestions`, ~line 46)
- Modify: `src/lib/exam/exam.spec.ts` (new describe block)
- Modify: `src/routes/exam/+page.svelte:142` (`startExternal`)
- Modify: `src/routes/study/external/+page.svelte:53` (`start`)

**Interfaces:**

- Consumes: existing `Mcq`, `LocalizedText` types from `$lib/content/schema`.
- Produces: `dedupeExactMcqs(questions: Mcq[]): Mcq[]` - keeps first occurrence, drops later byte-identical questions (normalized stem + sorted normalized choice texts, both locales).

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/exam/exam.spec.ts` (add `dedupeExactMcqs` to the existing import from `./exam`):

```ts
describe('dedupeExactMcqs', () => {
	const build = (id: string, stem: string, choiceTexts: string[], answer = 'a'): Mcq => ({
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['ulc'],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: stem },
		choices: choiceTexts.map((text, i) => ({ id: 'abcd'[i], text: { pl: text } })),
		answer
	});

	it('drops later byte-identical questions and keeps the first', () => {
		const original = build('q1', 'Kto podlega badaniom?', ['Pilot', 'Nikt']);
		const copy = build('q2', 'Kto podlega badaniom?', ['Pilot', 'Nikt'], 'b');
		expect(dedupeExactMcqs([original, copy]).map((q) => q.id)).toEqual(['q1']);
	});

	it('keeps same-stem variants with different choice texts', () => {
		const a = build('q1', 'Komu licencja?', ['Osobie A', 'Osobie B']);
		const b = build('q2', 'Komu licencja?', ['Osobie C', 'Osobie D']);
		expect(dedupeExactMcqs([a, b])).toHaveLength(2);
	});

	it('ignores whitespace, letter case and choice order', () => {
		const a = build('q1', 'Kto  podlega\nbadaniom?', ['Pilot', 'Nikt']);
		const b = build('q2', 'kto podlega badaniom?', ['nikt', 'PILOT']);
		expect(dedupeExactMcqs([a, b])).toHaveLength(1);
	});

	it('treats questions with different stems as distinct', () => {
		const a = build('q1', 'Pytanie pierwsze?', ['Pilot', 'Nikt']);
		const b = build('q2', 'Pytanie drugie?', ['Pilot', 'Nikt']);
		expect(dedupeExactMcqs([a, b])).toHaveLength(2);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=server src/lib/exam/exam.spec.ts`
Expected: FAIL - `dedupeExactMcqs` is not exported.

- [ ] **Step 3: Implement `dedupeExactMcqs`**

In `src/lib/exam/exam.ts`, extend the type import on line 1:

```ts
import type { License, LocalizedText, Mcq, StudyItem } from '../content/schema';
```

Insert after `pickQuestions` (after line 46):

```ts
function normalizedTextKey(text: LocalizedText): string {
	const normalize = (value: string | undefined) =>
		(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
	return `${normalize(text.pl)}|${normalize(text.en)}`;
}

/**
 * Drops byte-identical duplicate questions (same stem and same choice texts, ignoring
 * case, whitespace and choice order). Same-stem variants with different choices stay.
 */
export function dedupeExactMcqs(questions: Mcq[]): Mcq[] {
	const seen = new Set<string>();
	return questions.filter((question) => {
		const choiceKeys = question.choices.map((choice) => normalizedTextKey(choice.text)).sort();
		const key = [normalizedTextKey(question.stem), ...choiceKeys].join('||');
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project=server src/lib/exam/exam.spec.ts`
Expected: PASS (all, including pre-existing tests).

- [ ] **Step 5: Wire into the exam pool**

In `src/routes/exam/+page.svelte`:

- Add `dedupeExactMcqs` to the import from `$lib/exam/exam` (lines 11-18).
- In `startExternal` change line 142 from `const pool = await loadExternalMcqs(sourceId, category?.id);` to:

```ts
const pool = dedupeExactMcqs(await loadExternalMcqs(sourceId, category?.id));
```

- [ ] **Step 6: Wire into the study pool**

In `src/routes/study/external/+page.svelte`:

- Add import: `import { dedupeExactMcqs } from '$lib/exam/exam';`
- In `start` change line 53 from `questions = await loadExternalMcqs(source.id, category?.id);` to:

```ts
questions = dedupeExactMcqs(await loadExternalMcqs(source.id, category?.id));
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/exam/exam.ts src/lib/exam/exam.spec.ts src/routes/exam/+page.svelte src/routes/study/external/+page.svelte
git commit -m "feat: drop byte-identical duplicate questions from exam and study pools"
```

---

### Task 2: Seeded random answer order in `McqQuestion`

**Files:**

- Modify: `src/lib/exam/exam.ts` (add `choiceOrder` after `dedupeExactMcqs`)
- Modify: `src/lib/exam/exam.spec.ts` (new describe block)
- Modify: `src/lib/components/McqQuestion.svelte`
- Modify: `src/lib/components/McqQuestion.svelte.spec.ts`
- Modify: `src/routes/exam/+page.svelte` (session seed, both render sites)

**Interfaces:**

- Consumes: `shuffle` from `./exam` (same file), `mulberry32` from `$lib/engine/shuffle`.
- Produces: `choiceOrder(question: Mcq, seed: number): Mcq['choices']` - deterministic per (question.id, seed). `McqQuestion` gains optional prop `shuffleSeed?: number` (defaults to a random 32-bit integer per component instance).

Why seeded: the exam result screen re-creates `McqQuestion` instances in a separate `{#each}` block (`exam/+page.svelte:290`); with an unseeded shuffle the review would show a DIFFERENT choice order than the learner saw while answering. One seed per exam session keeps them identical.

- [ ] **Step 1: Write the failing unit tests for `choiceOrder`**

Append to `src/lib/exam/exam.spec.ts` (add `choiceOrder` to the import from `./exam`):

```ts
describe('choiceOrder', () => {
	const question: Mcq = {
		...mcq('q-order', 'AIRLAW.1'),
		choices: [
			{ id: 'a', text: { pl: 'A' } },
			{ id: 'b', text: { pl: 'B' } },
			{ id: 'c', text: { pl: 'C' } },
			{ id: 'd', text: { pl: 'D' } }
		]
	};

	it('keeps every choice exactly once', () => {
		const ids = choiceOrder(question, 7)
			.map((c) => c.id)
			.sort();
		expect(ids).toEqual(['a', 'b', 'c', 'd']);
	});

	it('is stable for the same question and seed', () => {
		expect(choiceOrder(question, 7)).toEqual(choiceOrder(question, 7));
	});

	it('produces a different order for at least one seed', () => {
		const original = question.choices.map((c) => c.id).join('');
		const seeds = Array.from({ length: 30 }, (_, i) => i);
		const orders = seeds.map((seed) =>
			choiceOrder(question, seed)
				.map((c) => c.id)
				.join('')
		);
		expect(orders.some((order) => order !== original)).toBe(true);
	});

	it('orders different questions differently under the same seed', () => {
		const other: Mcq = { ...question, id: 'q-other' };
		const seeds = Array.from({ length: 30 }, (_, i) => i);
		const differs = seeds.some(
			(seed) =>
				choiceOrder(question, seed)
					.map((c) => c.id)
					.join('') !==
				choiceOrder(other, seed)
					.map((c) => c.id)
					.join('')
		);
		expect(differs).toBe(true);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=server src/lib/exam/exam.spec.ts`
Expected: FAIL - `choiceOrder` is not exported.

- [ ] **Step 3: Implement `choiceOrder`**

In `src/lib/exam/exam.ts` add the import:

```ts
import { mulberry32 } from '../engine/shuffle';
```

Insert after `dedupeExactMcqs`:

```ts
function hashString(value: string): number {
	let hash = 5381;
	for (let i = 0; i < value.length; i += 1) {
		hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
	}
	return hash;
}

/** Per-question choice order, stable for one session seed so answering and review match. */
export function choiceOrder(question: Mcq, seed: number): Mcq['choices'] {
	return shuffle(question.choices, mulberry32(hashString(question.id) ^ seed));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project=server src/lib/exam/exam.spec.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing component test**

Append inside the `describe('McqQuestion', ...)` block of `src/lib/components/McqQuestion.svelte.spec.ts`, and add the import `import { choiceOrder } from '$lib/exam/exam';` at the top:

```ts
it('renders choices in the seeded shuffled order', async () => {
	const fourChoices: Mcq = {
		...question,
		choices: [
			{ id: 'a', text: { pl: 'Alfa' } },
			{ id: 'b', text: { pl: 'Beta' } },
			{ id: 'c', text: { pl: 'Gamma' } },
			{ id: 'd', text: { pl: 'Delta' } }
		]
	};
	const expected = choiceOrder(fourChoices, 7).map((c) => c.text.pl);
	const screen = render(McqQuestion, {
		question: fourChoices,
		index: 1,
		locale: 'pl',
		shuffleSeed: 7
	});
	const texts = [...screen.container.querySelectorAll('.choice-text')].map((el) =>
		el.textContent?.trim()
	);
	expect(texts).toEqual(expected);
});
```

- [ ] **Step 6: Run component tests to verify the new one fails**

Run: `npx vitest run --project=client src/lib/components/McqQuestion.svelte.spec.ts`
Expected: FAIL - `shuffleSeed` prop unknown / order equals raw JSON order.

- [ ] **Step 7: Shuffle choices inside `McqQuestion.svelte`**

In `src/lib/components/McqQuestion.svelte`:

Add to the script imports:

```ts
import { choiceOrder } from '$lib/exam/exam';
```

Extend the props (line 6-18):

```ts
let {
	question,
	index,
	locale = 'pl',
	selected = $bindable(null),
	reveal = false,
	shuffleSeed = Math.floor(Math.random() * 4294967296)
}: {
	question: Mcq;
	index: number;
	locale?: ContentLocale;
	selected?: string | null;
	reveal?: boolean;
	shuffleSeed?: number;
} = $props();
```

Add below `const name = $derived(...)`:

```ts
const orderedChoices = $derived(choiceOrder(question, shuffleSeed));
```

Change the each block (line 36) from `{#each question.choices as choice (choice.id)}` to:

```svelte
	{#each orderedChoices as choice (choice.id)}
```

- [ ] **Step 8: Run component tests to verify they pass**

Run: `npx vitest run --project=client src/lib/components/McqQuestion.svelte.spec.ts`
Expected: PASS (all four tests; the pre-existing ones query by accessible name, unaffected by order).

- [ ] **Step 9: Thread one seed per exam session**

In `src/routes/exam/+page.svelte`:

Add near the other state declarations (after line 43 `let timer...`):

```ts
let shuffleSeed = $state(0);
```

In `begin(...)` (line 99), add as the first line of the body:

```ts
shuffleSeed = Math.floor(Math.random() * 4294967296);
```

Pass the seed at BOTH `McqQuestion` render sites:

Running phase (line 276):

```svelte
<McqQuestion
	{question}
	index={i + 1}
	locale={locale()}
	{shuffleSeed}
	bind:selected={answers[question.id]}
/>
```

Result phase (line 291):

```svelte
<McqQuestion
	{question}
	index={i + 1}
	locale={locale()}
	{shuffleSeed}
	selected={answers[question.id] ?? null}
	reveal
/>
```

(`McqPractice.svelte` passes no seed; each question instance gets its own random default, which is correct for study.)

- [ ] **Step 10: Run both unit and component suites**

Run: `npm run test:unit && npm run test:component`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/lib/exam/exam.ts src/lib/exam/exam.spec.ts src/lib/components/McqQuestion.svelte src/lib/components/McqQuestion.svelte.spec.ts src/routes/exam/+page.svelte
git commit -m "feat: randomize answer order with session-stable seeding"
```

---

### Task 3: Adaptive engine (`adaptive.ts`) + Dexie v2 `mcqStats` table

**Files:**

- Create: `src/lib/study/adaptive.ts`
- Create: `src/lib/study/adaptive.spec.ts`
- Modify: `src/lib/engine/db.ts`

**Interfaces:**

- Consumes: `Mcq` from `$lib/content/schema`, `mulberry32` from `$lib/engine/shuffle` (tests only).
- Produces (used verbatim by Task 4):
  - `interface McqStat { itemId: string; attempts: number; mastery: number; avgAnswerMs: number; updatedAt: Date }`
  - `interface AttemptSignal { correct: boolean; answerMs: number; nextMs: number }`
  - `gradeAttempt(signal: AttemptSignal): number`
  - `updateStat(prev: McqStat | undefined, itemId: string, signal: AttemptSignal, now: Date): McqStat`
  - `weightFor(stat: McqStat | undefined): number`
  - `pickNext(pool: Mcq[], stats: Map<string, McqStat>, recentIds: readonly string[], rng?: () => number): Mcq`
  - `COOLDOWN_SIZE = 10`
  - Dexie: `db.mcqStats` as `Table<McqStat, string>` keyed by `itemId`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/study/adaptive.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Mcq } from '../content/schema';
import { mulberry32 } from '../engine/shuffle';
import {
	COOLDOWN_SIZE,
	gradeAttempt,
	pickNext,
	updateStat,
	weightFor,
	type McqStat
} from './adaptive';

function mcq(id: string): Mcq {
	return {
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['ulc'],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: id },
		choices: [
			{ id: 'a', text: { pl: 'A' } },
			{ id: 'b', text: { pl: 'B' } }
		],
		answer: 'a'
	};
}

function stat(itemId: string, mastery: number): McqStat {
	return { itemId, attempts: 1, mastery, avgAnswerMs: 10_000, updatedAt: new Date(0) };
}

describe('gradeAttempt', () => {
	it('grades a wrong answer 0 regardless of speed', () => {
		expect(gradeAttempt({ correct: false, answerMs: 1000, nextMs: 1000 })).toBe(0);
	});

	it('grades a fast correct answer 1', () => {
		expect(gradeAttempt({ correct: true, answerMs: 10_000, nextMs: 10_000 })).toBe(1);
	});

	it('grades a slow correct answer 0.6 (floor)', () => {
		expect(gradeAttempt({ correct: true, answerMs: 90_000, nextMs: 10_000 })).toBe(0.6);
	});

	it('scales linearly between fast and slow', () => {
		expect(gradeAttempt({ correct: true, answerMs: 37_500, nextMs: 10_000 })).toBeCloseTo(0.8);
	});

	it('adds a bonus for a quick next click', () => {
		expect(gradeAttempt({ correct: true, answerMs: 90_000, nextMs: 2000 })).toBeCloseTo(0.7);
	});

	it('caps the grade at 1', () => {
		expect(gradeAttempt({ correct: true, answerMs: 5000, nextMs: 1000 })).toBe(1);
	});
});

describe('updateStat', () => {
	const now = new Date('2026-07-08T10:00:00Z');

	it('creates a first stat from the attempt grade', () => {
		const next = updateStat(
			undefined,
			'q1',
			{ correct: true, answerMs: 10_000, nextMs: 10_000 },
			now
		);
		expect(next).toEqual({
			itemId: 'q1',
			attempts: 1,
			mastery: 1,
			avgAnswerMs: 10_000,
			updatedAt: now
		});
	});

	it('moves mastery toward the grade with EMA alpha 0.3', () => {
		const prev = stat('q1', 0.5);
		const next = updateStat(prev, 'q1', { correct: false, answerMs: 10_000, nextMs: 10_000 }, now);
		expect(next.mastery).toBeCloseTo(0.35);
		expect(next.attempts).toBe(2);
	});

	it('keeps a running mean of answer time', () => {
		const prev = stat('q1', 0.5);
		const next = updateStat(prev, 'q1', { correct: true, answerMs: 20_000, nextMs: 10_000 }, now);
		expect(next.avgAnswerMs).toBe(15_000);
	});
});

describe('weightFor', () => {
	it('boosts unseen questions', () => {
		expect(weightFor(undefined)).toBe(1.5);
	});

	it('weights a mastered question at the floor', () => {
		expect(weightFor(stat('q1', 1))).toBe(0.25);
	});

	it('weights a struggling question 10x a mastered one', () => {
		expect(weightFor(stat('q1', 0))).toBe(2.5);
	});
});

describe('pickNext', () => {
	it('throws on an empty pool', () => {
		expect(() => pickNext([], new Map(), [])).toThrow(RangeError);
	});

	it('never picks a question from the cooldown window', () => {
		const pool = Array.from({ length: 20 }, (_, i) => mcq(`q${i}`));
		const recent = pool.slice(0, COOLDOWN_SIZE).map((q) => q.id);
		const rng = mulberry32(1);
		for (let i = 0; i < 200; i += 1) {
			expect(recent).not.toContain(pickNext(pool, new Map(), recent, rng).id);
		}
	});

	it('shrinks the cooldown so small pools stay playable', () => {
		const pool = [mcq('q1'), mcq('q2'), mcq('q3')];
		const picked = pickNext(pool, new Map(), ['q1', 'q2', 'q3'], () => 0);
		expect(picked.id).toBe('q1');
	});

	it('repeats the only question of a single-item pool', () => {
		expect(pickNext([mcq('q1')], new Map(), ['q1'], () => 0).id).toBe('q1');
	});

	it('draws by weight deterministically', () => {
		const pool = [mcq('mastered'), mcq('weak')];
		const stats = new Map([
			['mastered', stat('mastered', 1)],
			['weak', stat('weak', 0)]
		]);
		expect(pickNext(pool, stats, [], () => 0.05).id).toBe('mastered');
		expect(pickNext(pool, stats, [], () => 0.5).id).toBe('weak');
	});

	it('prefers weak questions statistically', () => {
		const pool = [mcq('mastered'), mcq('weak')];
		const stats = new Map([
			['mastered', stat('mastered', 1)],
			['weak', stat('weak', 0)]
		]);
		const rng = mulberry32(42);
		let weak = 0;
		for (let i = 0; i < 1000; i += 1) {
			if (pickNext(pool, stats, [], rng).id === 'weak') weak += 1;
		}
		expect(weak).toBeGreaterThan(800);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=server src/lib/study/adaptive.spec.ts`
Expected: FAIL - cannot resolve `./adaptive`.

- [ ] **Step 3: Implement `adaptive.ts`**

Create `src/lib/study/adaptive.ts`:

```ts
import type { Mcq } from '../content/schema';

export interface McqStat {
	itemId: string;
	attempts: number;
	mastery: number;
	avgAnswerMs: number;
	updatedAt: Date;
}

export interface AttemptSignal {
	correct: boolean;
	answerMs: number;
	nextMs: number;
}

const EMA_ALPHA = 0.3;
const FAST_ANSWER_MS = 15_000;
const SLOW_ANSWER_MS = 60_000;
const SLOW_ANSWER_GRADE = 0.6;
const FAST_NEXT_MS = 3_000;
const FAST_NEXT_BONUS = 0.1;
const UNSEEN_WEIGHT = 1.5;
const MIN_WEIGHT = 0.25;
const WEIGHT_SPAN = 2.25;

export const COOLDOWN_SIZE = 10;

/** Grade of one attempt in [0, 1]: wrong is 0; correct scales down with slowness, plus a quick-next bonus. */
export function gradeAttempt(signal: AttemptSignal): number {
	if (!signal.correct) return 0;
	const clamped = Math.min(Math.max(signal.answerMs, FAST_ANSWER_MS), SLOW_ANSWER_MS);
	const slowness = (clamped - FAST_ANSWER_MS) / (SLOW_ANSWER_MS - FAST_ANSWER_MS);
	const base = 1 - slowness * (1 - SLOW_ANSWER_GRADE);
	const bonus = signal.nextMs <= FAST_NEXT_MS ? FAST_NEXT_BONUS : 0;
	return Math.min(1, base + bonus);
}

/** Folds one attempt into the persisted stat: mastery is an EMA of grades, answer time a running mean. */
export function updateStat(
	prev: McqStat | undefined,
	itemId: string,
	signal: AttemptSignal,
	now: Date
): McqStat {
	const grade = gradeAttempt(signal);
	if (!prev) {
		return { itemId, attempts: 1, mastery: grade, avgAnswerMs: signal.answerMs, updatedAt: now };
	}
	const attempts = prev.attempts + 1;
	return {
		itemId,
		attempts,
		mastery: prev.mastery + EMA_ALPHA * (grade - prev.mastery),
		avgAnswerMs: Math.round(prev.avgAnswerMs + (signal.answerMs - prev.avgAnswerMs) / attempts),
		updatedAt: now
	};
}

/** Draw weight: unseen questions get a coverage boost; low mastery weighs up to 10x the floor. */
export function weightFor(stat: McqStat | undefined): number {
	if (!stat) return UNSEEN_WEIGHT;
	return MIN_WEIGHT + WEIGHT_SPAN * (1 - stat.mastery);
}

/** Weighted random draw from the pool, excluding the last up-to-10 shown questions. */
export function pickNext(
	pool: Mcq[],
	stats: Map<string, McqStat>,
	recentIds: readonly string[],
	rng: () => number = Math.random
): Mcq {
	if (pool.length === 0) throw new RangeError('pickNext requires a non-empty pool');
	const cooldown = Math.min(COOLDOWN_SIZE, pool.length - 1);
	const blocked = new Set(cooldown === 0 ? [] : recentIds.slice(-cooldown));
	const eligible = pool.filter((question) => !blocked.has(question.id));
	const candidates = eligible.length > 0 ? eligible : pool;
	const weights = candidates.map((question) => weightFor(stats.get(question.id)));
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	let roll = rng() * total;
	for (let i = 0; i < candidates.length; i += 1) {
		roll -= weights[i];
		if (roll <= 0) return candidates[i];
	}
	return candidates[candidates.length - 1];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project=server src/lib/study/adaptive.spec.ts`
Expected: PASS (all).

- [ ] **Step 5: Add the Dexie table (version 2)**

In `src/lib/engine/db.ts`:

Add the type import:

```ts
import type { McqStat } from '../study/adaptive';
```

Add the table declaration inside `TermikaDb` (after `mockResults!` on line 45):

```ts
	mcqStats!: Table<McqStat, string>;
```

Add after the existing `this.version(1).stores({...})` block in the constructor:

```ts
this.version(2).stores({
	mcqStats: 'itemId'
});
```

Do NOT change the `version(1)` block; Dexie carries earlier stores forward.

- [ ] **Step 6: Type-check and run the full unit suite**

Run: `npm run check && npm run test:unit`
Expected: 0 errors, all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/study/adaptive.ts src/lib/study/adaptive.spec.ts src/lib/engine/db.ts
git commit -m "feat: adaptive mastery engine with persisted per-question stats"
```

---

### Task 4: Endless `McqPractice` with stats strip + page wiring + i18n

**Files:**

- Modify: `src/lib/components/McqPractice.svelte` (full rewrite of script + template; styles partially reused)
- Create: `src/lib/components/McqPractice.svelte.spec.ts`
- Modify: `src/routes/study/external/+page.svelte`
- Modify: `messages/pl.json`, `messages/en.json`

**Interfaces:**

- Consumes from Task 3: `pickNext`, `updateStat`, `COOLDOWN_SIZE`, `McqStat`, `db.mcqStats`.
- Produces: `McqPractice` props become `{ questions: Mcq[]; locale?: ContentLocale; stats?: Map<string, McqStat>; pick?: () => number; now?: () => number; onAttempt?: (attempt: { itemId: string; correct: boolean; answerMs: number; nextMs: number }) => void }`. `onAttempt` fires when the learner clicks next (not on check), carrying both timings. `sessionSize` prop is REMOVED.

- [ ] **Step 1: Add i18n messages**

In `messages/pl.json`, after the `"quiz_done"` line:

```json
	"study_session_good": "Dobre: {n}",
	"study_session_bad": "Złe: {n}",
```

In `messages/en.json`, after the `"quiz_done"` line:

```json
	"study_session_good": "Correct: {n}",
	"study_session_bad": "Wrong: {n}",
```

Run: `npm run messages`
Expected: paraglide compiles without errors.

- [ ] **Step 2: Write the failing component test**

Create `src/lib/components/McqPractice.svelte.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Mcq } from '$lib/content/schema';
import { setLocale } from '$lib/paraglide/runtime';
import McqPractice from './McqPractice.svelte';

function mcq(id: string, stem: string): Mcq {
	return {
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['ulc'],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: stem },
		choices: [
			{ id: 'a', text: { pl: `Dobra ${id}` } },
			{ id: 'b', text: { pl: `Zła ${id}` } }
		],
		answer: 'a'
	};
}

const questions = [mcq('q1', 'Pytanie 1?'), mcq('q2', 'Pytanie 2?'), mcq('q3', 'Pytanie 3?')];

beforeEach(() => {
	setLocale('pl', { reload: false });
});

describe('McqPractice', () => {
	it('updates the session stats strip after a correct answer', async () => {
		const screen = render(McqPractice, { questions, locale: 'pl', pick: () => 0 });
		await screen.getByRole('radio', { name: 'Dobra q1' }).click();
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('Dobre: 1')).toBeVisible();
		await expect.element(screen.getByText('Złe: 0')).toBeVisible();
		await expect.element(screen.getByText('Skuteczność: 100%')).toBeVisible();
	});

	it('reports the attempt with timings when advancing', async () => {
		const attempts: { itemId: string; correct: boolean; answerMs: number; nextMs: number }[] = [];
		let clock = 0;
		const screen = render(McqPractice, {
			questions,
			locale: 'pl',
			pick: () => 0,
			now: () => (clock += 1000),
			onAttempt: (attempt) => attempts.push(attempt)
		});
		await screen.getByRole('radio', { name: 'Zła q1' }).click();
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await screen.getByRole('button', { name: 'Następne' }).click();
		expect(attempts).toEqual([{ itemId: 'q1', correct: false, answerMs: 1000, nextMs: 1000 }]);
	});

	it('runs past the pool size without finishing and never repeats back to back', async () => {
		const screen = render(McqPractice, { questions, locale: 'pl', pick: () => 0 });
		const seen: string[] = [];
		for (let i = 0; i < 5; i += 1) {
			const stem = screen.container.querySelector('legend')?.textContent ?? '';
			seen.push(stem);
			await screen.getByRole('radio', { name: /Dobra/ }).click();
			await screen.getByRole('button', { name: 'Sprawdź' }).click();
			await screen.getByRole('button', { name: 'Następne' }).click();
		}
		await expect.element(screen.getByRole('button', { name: 'Sprawdź' })).toBeVisible();
		for (let i = 1; i < seen.length; i += 1) {
			expect(seen[i]).not.toBe(seen[i - 1]);
		}
	});
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run --project=client src/lib/components/McqPractice.svelte.spec.ts`
Expected: FAIL - old component caps a deck, has no stats strip, `now`/`stats` props unknown.

- [ ] **Step 4: Rewrite `McqPractice.svelte`**

Replace the entire `<script>` and template of `src/lib/components/McqPractice.svelte` with (keep the existing `.action` styles; replace `.bar`/`.bar-fill`/`.counter`/`.summary`/`.award`/`.result`/`.result-pct` styles with the `.stats`/`.stat` styles below):

```svelte
<script lang="ts">
	import type { ContentLocale, Mcq } from '$lib/content/schema';
	import { m } from '$lib/paraglide/messages.js';
	import { COOLDOWN_SIZE, pickNext, type McqStat } from '$lib/study/adaptive';
	import McqQuestion from './McqQuestion.svelte';

	let {
		questions,
		locale = 'pl',
		stats = new Map<string, McqStat>(),
		pick = Math.random,
		now = () => Date.now(),
		onAttempt
	}: {
		questions: Mcq[];
		locale?: ContentLocale;
		stats?: Map<string, McqStat>;
		pick?: () => number;
		now?: () => number;
		onAttempt?: (attempt: {
			itemId: string;
			correct: boolean;
			answerMs: number;
			nextMs: number;
		}) => void;
	} = $props();

	let recentIds: string[] = [];
	let current = $state(pickNext(questions, stats, recentIds, pick));
	let selected = $state<string | null>(null);
	let phase = $state<'answering' | 'feedback'>('answering');
	let goodCount = $state(0);
	let badCount = $state(0);
	let shownAt = now();
	let feedbackAt = 0;
	let lastCorrect = false;

	const answeredCount = $derived(goodCount + badCount);
	const accuracyPct = $derived(
		answeredCount === 0 ? 0 : Math.round((goodCount / answeredCount) * 100)
	);

	function check() {
		if (phase !== 'answering' || selected === null) return;
		lastCorrect = selected === current.answer;
		if (lastCorrect) goodCount += 1;
		else badCount += 1;
		feedbackAt = now();
		phase = 'feedback';
	}

	function advance() {
		onAttempt?.({
			itemId: current.id,
			correct: lastCorrect,
			answerMs: feedbackAt - shownAt,
			nextMs: now() - feedbackAt
		});
		recentIds = [...recentIds, current.id].slice(-COOLDOWN_SIZE);
		current = pickNext(questions, stats, recentIds, pick);
		selected = null;
		phase = 'answering';
		shownAt = now();
	}
</script>

<form
	class="practice"
	onsubmit={(event) => {
		event.preventDefault();
		if (phase === 'answering') check();
		else advance();
	}}
>
	<div class="stats" role="status">
		<span class="stat stat--good">{m.study_session_good({ n: goodCount })}</span>
		<span class="stat stat--bad">{m.study_session_bad({ n: badCount })}</span>
		<span class="stat">{m.drill_accuracy({ pct: accuracyPct })}</span>
	</div>

	{#key current.id}
		<McqQuestion
			question={current}
			index={answeredCount + 1}
			{locale}
			bind:selected
			reveal={phase === 'feedback'}
		/>
	{/key}

	{#if phase === 'feedback'}
		<button type="submit" class="action">{m.drill_next()}</button>
	{:else}
		<button type="submit" class="action" disabled={selected === null}>{m.drill_check()}</button>
	{/if}
</form>
```

New styles (alongside the kept `.practice` and `.action` rules):

```css
.stats {
	display: flex;
	gap: var(--space-4);
	align-self: stretch;
	justify-content: center;
	padding: var(--space-3) var(--space-4);
	font-family: var(--font-mono);
	font-size: 0.9rem;
	background: var(--color-surface);
	border: var(--border-width-sm) solid var(--color-outline);
	border-radius: var(--radius-pill);
}

.stat {
	color: var(--color-ink-soft);
}

.stat--good {
	color: var(--color-lift);
}

.stat--bad {
	color: var(--color-sink);
}
```

Note: `index={answeredCount + 1}` numbers the question within the session. During feedback `answeredCount` has already advanced, so freeze the number by deriving it from history instead if flicker bothers you - simplest correct form: `index={goodCount + badCount + (phase === 'feedback' ? 0 : 1)}`. Use this expression, not the naive one:

```svelte
<McqQuestion
	question={current}
	index={goodCount + badCount + (phase === 'feedback' ? 0 : 1)}
	{locale}
	bind:selected
	reveal={phase === 'feedback'}
/>
```

- [ ] **Step 5: Run component tests**

Run: `npx vitest run --project=client src/lib/components/McqPractice.svelte.spec.ts`
Expected: PASS (all three).

- [ ] **Step 6: Wire stats persistence and back navigation in the study page**

Rewrite the `<script>` of `src/routes/study/external/+page.svelte` (template changes below):

```ts
import { onMount } from 'svelte';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import McqPractice from '$lib/components/McqPractice.svelte';
import type { ContentLocale, Mcq } from '$lib/content/schema';
import { resolveText } from '$lib/content/schema';
import { db } from '$lib/engine/db';
import { recordReview } from '$lib/engine/progress';
import { createScheduler } from '$lib/engine/scheduler';
import { dedupeExactMcqs } from '$lib/exam/exam';
import {
	EXAM_SOURCES,
	loadExternalCategories,
	loadExternalMcqs,
	type ExamCategory
} from '$lib/exam/sources';
import { m } from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime';
import { updateStat, type McqStat } from '$lib/study/adaptive';

const scheduler = createScheduler();
const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

const externalSources = EXAM_SOURCES.filter((s) => s.external);
const param = page.url.searchParams.get('source');
const source = externalSources.find((s) => s.id === param) ?? externalSources[0];

let phase = $state<'select' | 'practice'>('select');
let loadingCats = $state(true);
let loading = $state(false);
let error = $state(false);
let categories = $state<ExamCategory[]>([]);
let questions = $state<Mcq[]>([]);
let stats = $state(new Map<string, McqStat>());
let activeLabel = $state('');

onMount(async () => {
	if (!source.hasCategories) {
		loadingCats = false;
		return;
	}
	try {
		categories = await loadExternalCategories(source.id);
	} catch {
		error = true;
	} finally {
		loadingCats = false;
	}
});

async function start(category?: ExamCategory) {
	loading = true;
	error = false;
	try {
		const [pool, statRows] = await Promise.all([
			loadExternalMcqs(source.id, category?.id),
			db.mcqStats.toArray()
		]);
		questions = dedupeExactMcqs(pool);
		stats = new Map(statRows.map((row) => [row.itemId, row]));
		activeLabel = category
			? `${resolveText(source.label, locale())} · ${category.name}`
			: resolveText(source.label, locale());
		phase = 'practice';
	} catch {
		error = true;
	} finally {
		loading = false;
	}
}

function backToCategories() {
	phase = 'select';
	questions = [];
}

async function handleAttempt(attempt: {
	itemId: string;
	correct: boolean;
	answerMs: number;
	nextMs: number;
}) {
	await recordReview(db, scheduler, attempt.itemId, attempt.correct ? 'good' : 'again', new Date());
	const next = updateStat(stats.get(attempt.itemId), attempt.itemId, attempt, new Date());
	stats = new Map(stats).set(attempt.itemId, next);
	await db.mcqStats.put(next);
}
```

Template changes:

Header (replace the `<a class="back">` line):

```svelte
<header>
	{#if phase === 'practice'}
		<button type="button" class="back" onclick={backToCategories}>← {m.back()}</button>
	{:else}
		<a class="back" href={resolve('/study')}>← {m.back()}</a>
	{/if}
	<h1>{phase === 'practice' ? activeLabel : resolveText(source.label, locale())}</h1>
</header>
```

Practice branch (line 92) becomes:

```svelte
<McqPractice {questions} {stats} locale={locale()} onAttempt={handleAttempt} />
```

Style addition (the `.back` rules currently target the anchor; make the button match):

```css
button.back {
	padding: 0;
	background: none;
	border: none;
	cursor: pointer;
}

button.back:hover {
	text-decoration: underline;
}
```

- [ ] **Step 7: Type-check and run all unit + component tests**

Run: `npm run check && npm run test:unit && npm run test:component`
Expected: 0 errors, all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/McqPractice.svelte src/lib/components/McqPractice.svelte.spec.ts src/routes/study/external/+page.svelte messages/pl.json messages/en.json src/lib/paraglide
git commit -m "feat: endless adaptive ULC study with session stats strip"
```

(If `src/lib/paraglide` is gitignored, drop it from the add list.)

---

### Task 5: End-to-end verification

**Files:**

- Possibly modify: `e2e/study.e2e.ts` (only if a new flow assertion is added; existing tests don't touch `/study/external`)

**Interfaces:** none new.

- [ ] **Step 1: Add an e2e test for the endless study flow**

Append to `e2e/study.e2e.ts`:

```ts
test('ULC study runs endlessly with a stats strip', async ({ page }) => {
	await page.goto('./study/external?source=ulc');
	await page.getByRole('button', { name: /Wszystkie kategorie|All categories/ }).click();

	await expect(page.getByText(/Dobre: 0|Correct: 0/)).toBeVisible();

	await page.getByRole('radio').first().check();
	await page.getByRole('button', { name: /Sprawdź|Check/ }).click();
	await expect(page.getByText(/Dobre: 1|Złe: 1|Correct: 1|Wrong: 1/)).toBeVisible();

	await page.getByRole('button', { name: /Następne|Next/ }).click();
	await expect(page.getByRole('button', { name: /Sprawdź|Check/ })).toBeVisible();
});
```

Labels verified against `messages/*.json`: `exam_all_categories` = "Wszystkie kategorie" / "All categories", `drill_check` = "Sprawdź" / "Check", `drill_next` = "Następne" / "Next".

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: unit, component and e2e all PASS. If an e2e fails, fix the selector or the code - never skip.

- [ ] **Step 3: Manual smoke via dev server**

Run: `npm run dev`

- `/exam`: start a ULC exam; confirm choices are not in the bank order everywhere and the review after submit shows each question with the SAME choice order as while answering.
- `/study/external?source=ulc`: pick a category; answer more than 20 questions - session keeps going; stats strip counts; back button returns to categories; re-enter and confirm weighting still works (weak questions recur).

- [ ] **Step 4: Commit**

```bash
git add e2e/study.e2e.ts
git commit -m "test: e2e coverage for endless adaptive ULC study"
```
