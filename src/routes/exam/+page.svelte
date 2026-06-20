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
		loIdToSubject,
		mcqItemsForSubject,
		pickQuestions,
		scoreExam,
		type ExamResult
	} from '$lib/exam/exam';
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

	onMount(async () => {
		const content = await loadContent();
		items = content.items.filter((i): i is Mcq => i.type === 'mcq');
		subjects = content.subjects;
		loSubject = loIdToSubject(content.subjects);
		blueprint = content.licenses.find((l) => l.id === 'SPL')?.examBlueprint.subjects ?? [];
	});

	onDestroy(() => clearInterval(timer));

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

	function start(subjectId: string) {
		const config = blueprint.find((s) => s.subjectId === subjectId);
		if (!config) return;
		const pool = mcqItemsForSubject(items, 'SPL', subjectId, loSubject);
		activeSubjectId = subjectId;
		questions = pickQuestions(pool, config.questionCount);
		answers = Object.fromEntries(questions.map((q) => [q.id, null]));
		result = null;
		if (questions.length === 0) {
			phase = 'result';
			return;
		}
		secondsLeft = config.timeLimitMin * 60;
		phase = 'running';
		clearInterval(timer);
		timer = setInterval(() => {
			secondsLeft -= 1;
			if (secondsLeft <= 0) submit();
		}, 1000);
	}

	async function submit() {
		clearInterval(timer);
		const config = blueprint.find((s) => s.subjectId === activeSubjectId);
		const scored = scoreExam(questions, new Map(Object.entries(answers)), config?.passPct ?? 75);
		result = scored;
		phase = 'result';
		await db.mockResults.add({
			licenseId: 'SPL',
			subjectId: activeSubjectId,
			scorePct: scored.scorePct,
			passed: scored.passed,
			finishedAt: new Date()
		});
		for (const itemId of scored.wrongItemIds) {
			await recordReview(db, scheduler, itemId, 'again', new Date());
		}
	}
</script>

<svelte:head><title>{m.exam_title()} · {m.app_name()}</title></svelte:head>

<main class="exam">
	<h1>{m.exam_title()}</h1>

	{#if phase === 'select'}
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
	{:else if phase === 'running'}
		<div class="bar">
			<strong>{subjectName(activeSubjectId)}</strong>
			<span class="timer" aria-live="off"
				>{m.exam_time_left({ time: formatTime(secondsLeft) })}</span
			>
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
		top: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3);
		background: var(--color-bg);
		border-bottom: var(--border-width) solid var(--color-outline);
	}

	.timer {
		font-family: var(--font-mono);
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
		padding: var(--space-3) var(--space-6);
		font-size: 1rem;
		color: var(--color-on-accent);
		background: var(--color-sun);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}
</style>
