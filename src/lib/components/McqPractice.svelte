<script lang="ts">
	import { untrack } from 'svelte';
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
	let current = $state(untrack(() => pickNext(questions, stats, recentIds, pick)));
	let selected = $state<string | null>(null);
	let phase = $state<'answering' | 'feedback'>('answering');
	let goodCount = $state(0);
	let badCount = $state(0);
	let shownAt = untrack(() => now());
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
			index={goodCount + badCount + (phase === 'feedback' ? 0 : 1)}
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

<style>
	.practice {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		width: 100%;
		max-width: 40rem;
	}

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

	.action {
		padding: var(--space-3) var(--space-8);
		font-size: 1rem;
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
		transition: transform 0.1s ease;
	}

	.action:disabled {
		opacity: 0.5;
		box-shadow: none;
	}

	@media (hover: hover) {
		.action:not(:disabled):hover {
			transform: translateY(-2px);
		}
	}

	.action:not(:disabled):active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}
</style>
