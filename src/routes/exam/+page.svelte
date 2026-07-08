<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import McqQuestion from '$lib/components/McqQuestion.svelte';
	import { loadContent } from '$lib/content';
	import type { ContentLocale, Mcq } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import type { ExamSubject, Subject } from '$lib/content/taxonomy';
	import { db } from '$lib/engine/db';
	import { recordReview } from '$lib/engine/progress';
	import { createScheduler } from '$lib/engine/scheduler';
	import {
		dedupeExactMcqs,
		loIdToSubject,
		mcqItemsForSubject,
		pickQuestions,
		scoreByCategory,
		scoreExam,
		type ExamResult
	} from '$lib/exam/exam';
	import {
		EXAM_SOURCES,
		loadExternalCategories,
		loadExternalMcqs,
		type ExamCategory
	} from '$lib/exam/sources';
	import Seo from '$lib/components/Seo.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const scheduler = createScheduler();
	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	let items: Mcq[] = [];
	let loSubject = new Map<string, string>();
	let subjects = $state<Subject[]>([]);
	let blueprint = $state<ExamSubject[]>([]);

	let phase = $state<'select' | 'running' | 'result'>('select');
	let activeSubjectId = $state('');
	let questions = $state<Mcq[]>([]);
	let answers = $state<Record<string, string | null>>({});
	let secondsLeft = $state(0);
	let result = $state<ExamResult | null>(null);
	let timer: ReturnType<typeof setInterval> | undefined;

	let sourceId = $state('ulc');
	let loadingExternal = $state(false);
	let loadingCats = $state(false);
	let sourceError = $state(false);
	let extCategories = $state<ExamCategory[]>([]);
	let activeExternal = false;
	let activePassPct = 75;
	let activeExtLabel = $state('');
	const externalSources = EXAM_SOURCES.filter((s) => s.external);
	const activeSource = $derived(EXAM_SOURCES.find((s) => s.id === sourceId) ?? EXAM_SOURCES[0]);

	async function selectSource(id: string) {
		sourceId = id;
		sourceError = false;
		extCategories = [];
		const source = EXAM_SOURCES.find((s) => s.id === id);
		if (source?.external && source.hasCategories) {
			loadingCats = true;
			try {
				extCategories = await loadExternalCategories(id);
			} catch {
				sourceError = true;
			} finally {
				loadingCats = false;
			}
		}
	}

	onMount(async () => {
		const content = await loadContent();
		items = content.items.filter((i): i is Mcq => i.type === 'mcq');
		subjects = content.subjects;
		loSubject = loIdToSubject(content.subjects);
		blueprint = content.licenses.find((l) => l.id === 'SPL')?.examBlueprint.subjects ?? [];
		await selectSource(sourceId);
	});

	onDestroy(() => clearInterval(timer));

	const answeredCount = $derived(Object.values(answers).filter((value) => value !== null).length);

	function subjectName(subjectId: string): string {
		const subject = subjects.find((s) => s.id === subjectId);
		return subject ? resolveText(subject.name, locale()) : subjectId;
	}

	function formatTime(total: number): string {
		const mm = Math.floor(total / 60)
			.toString()
			.padStart(2, '0');
		const ss = (total % 60).toString().padStart(2, '0');
		return `${mm}:${ss}`;
	}

	function begin(
		qs: Mcq[],
		passPct: number,
		timeLimitMin: number,
		subjectId: string,
		external: boolean
	) {
		questions = qs;
		answers = Object.fromEntries(qs.map((q) => [q.id, null]));
		activeSubjectId = subjectId;
		activeExternal = external;
		activePassPct = passPct;
		result = null;
		if (qs.length === 0) {
			phase = 'result';
			return;
		}
		secondsLeft = timeLimitMin * 60;
		phase = 'running';
		clearInterval(timer);
		timer = setInterval(() => {
			secondsLeft -= 1;
			if (secondsLeft <= 0) submit();
		}, 1000);
	}

	function start(subjectId: string) {
		const config = blueprint.find((s) => s.subjectId === subjectId);
		if (!config) return;
		const pool = mcqItemsForSubject(items, 'SPL', subjectId, loSubject);
		begin(
			pickQuestions(pool, config.questionCount),
			config.passPct,
			config.timeLimitMin,
			subjectId,
			false
		);
	}

	async function startExternal(category?: ExamCategory) {
		sourceError = false;
		loadingExternal = true;
		try {
			const pool = dedupeExactMcqs(await loadExternalMcqs(sourceId, category?.id));
			activeExtLabel = category
				? `${resolveText(activeSource.label, locale())} · ${category.name}`
				: resolveText(activeSource.label, locale());
			begin(
				pickQuestions(pool, activeSource.questionCount),
				activeSource.passPct,
				activeSource.timeLimitMin,
				category ? `${sourceId}:${category.id}` : sourceId,
				true
			);
		} catch {
			sourceError = true;
		} finally {
			loadingExternal = false;
		}
	}

	const activeLabel = $derived(activeExternal ? activeExtLabel : subjectName(activeSubjectId));

	async function submit() {
		clearInterval(timer);
		const answerMap = new Map(Object.entries(answers));
		const scored = scoreExam(questions, answerMap, activePassPct);
		result = scored;
		phase = 'result';
		await db.mockResults.add({
			licenseId: activeExternal ? 'PPL_A' : 'SPL',
			subjectId: activeSubjectId,
			scorePct: scored.scorePct,
			passed: scored.passed,
			finishedAt: new Date(),
			...(activeExternal ? { categories: scoreByCategory(questions, answerMap) } : {})
		});
		if (!activeExternal) {
			for (const itemId of scored.wrongItemIds) {
				await recordReview(db, scheduler, itemId, 'again', new Date());
			}
		}
	}
</script>

<Seo title={`${m.exam_title()} · ${m.app_name()}`} description={m.seo_desc_exam()} />

<main class="exam fade-in">
	<h1>{m.exam_title()}</h1>

	{#if phase === 'select'}
		{#if externalSources.length > 1}
			<div class="sources" role="group" aria-label={m.exam_source()}>
				{#each externalSources as src (src.id)}
					<button
						type="button"
						class="src"
						aria-pressed={sourceId === src.id}
						onclick={() => selectSource(src.id)}
					>
						{resolveText(src.label, locale())}
					</button>
				{/each}
			</div>
		{/if}

		{#if activeSource.external && activeSource.hasCategories}
			{#if loadingCats}
				<p class="status">{m.exam_loading()}</p>
			{:else if sourceError}
				<p class="error" role="alert">{m.exam_source_error()}</p>
			{:else}
				<p>{m.exam_pick_category()}</p>
				<ul class="subjects">
					<li>
						<button type="button" class="subject" onclick={() => startExternal()}>
							{m.exam_all_categories()}
						</button>
					</li>
					{#each extCategories as cat (cat.id)}
						<li>
							<button type="button" class="subject" onclick={() => startExternal(cat)}>
								{cat.name}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		{:else if activeSource.external}
			<button
				type="button"
				class="primary lift"
				onclick={() => startExternal()}
				disabled={loadingExternal}
			>
				{loadingExternal ? m.exam_loading() : m.exam_start()}
			</button>
			{#if sourceError}<p class="error" role="alert">{m.exam_source_error()}</p>{/if}
		{:else}
			<p>{m.exam_pick_subject()}</p>
			<ul class="subjects">
				{#each blueprint as subject (subject.subjectId)}
					<li>
						<button type="button" class="subject" onclick={() => start(subject.subjectId)}>
							{subjectName(subject.subjectId)}
							<span class="meta"
								>{subject.questionCount} · {subject.timeLimitMin}′ · {subject.passPct}%</span
							>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if phase === 'running'}
		<div class="bar">
			<div class="bar-top">
				<strong>{activeLabel}</strong>
				<span class="timer" class:low={secondsLeft <= 30} aria-live="off">
					⏱ {formatTime(secondsLeft)}
				</span>
			</div>
			<div class="progress" aria-hidden="true">
				<div
					class="progress-fill wind-streak"
					style:width={`${questions.length ? (answeredCount / questions.length) * 100 : 0}%`}
				></div>
			</div>
			<span class="count">{answeredCount} / {questions.length}</span>
		</div>
		<form
			class="questions"
			onsubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			{#each questions as question, i (question.id)}
				<McqQuestion
					{question}
					index={i + 1}
					locale={locale()}
					bind:selected={answers[question.id]}
				/>
			{/each}
			<button type="submit" class="primary">{m.exam_submit()}</button>
		</form>
	{:else if result}
		<p class="verdict" class:pass={result.passed}>
			{result.passed ? m.exam_passed() : m.exam_failed()} · {m.exam_score({ pct: result.scorePct })}
		</p>
		<div class="questions">
			{#each questions as question, i (question.id)}
				<McqQuestion
					{question}
					index={i + 1}
					locale={locale()}
					selected={answers[question.id] ?? null}
					reveal
				/>
			{/each}
		</div>
		<button type="button" class="primary" onclick={() => (phase = 'select')}
			>{m.exam_retry()}</button
		>
	{:else}
		<p>{m.exam_no_questions()}</p>
		<button type="button" class="primary" onclick={() => (phase = 'select')}
			>{m.exam_retry()}</button
		>
	{/if}
</main>

<style>
	.exam {
		max-width: 44rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.src {
		padding: var(--space-2) var(--space-4);
		font-weight: 700;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
		transition: transform 0.1s ease;
	}

	.src:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}

	.src[aria-pressed='true'] {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.subjects {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
	}

	.subject {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: 100%;
		text-align: left;
		padding: var(--space-4);
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.meta {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-ink-soft);
	}

	.bar {
		position: sticky;
		top: var(--header-height, 4rem);
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		margin: 0 calc(-1 * var(--space-4));
		background: var(--color-bg);
		border-bottom: var(--border-width-sm) solid var(--color-outline);
	}

	.bar-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		font-family: var(--font-display);
		font-weight: 700;
	}

	.timer {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-3);
		font-family: var(--font-mono);
		font-weight: 700;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.timer.low {
		color: var(--color-on-sink);
		background: var(--color-sink-bg);
	}

	.progress {
		width: 100%;
		height: 1rem;
		background: var(--color-track);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: var(--color-sky);
		border-right: var(--border-width-sm) solid var(--color-outline);
		transition: width 0.3s ease;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-ink-soft);
		align-self: flex-end;
	}

	.questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.verdict {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: color-mix(in srgb, var(--color-sink) 70%, var(--color-ink));
		margin: 0;
	}

	.verdict.pass {
		color: color-mix(in srgb, var(--color-lift) 75%, var(--color-ink));
	}

	.primary {
		align-self: flex-start;
		padding: var(--space-3) var(--space-8);
		font-size: 1rem;
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
		transition: transform 0.1s ease;
	}

	@media (hover: hover) {
		.primary:hover {
			transform: translateY(-2px);
		}
	}

	.primary:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}
</style>
