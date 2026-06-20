<script lang="ts">
	import type { ContentLocale, Mcq } from '$lib/content/schema';
	import { m } from '$lib/paraglide/messages.js';
	import McqQuestion from './McqQuestion.svelte';

	let {
		questions,
		locale = 'pl',
		sessionSize = 20,
		pick = Math.random,
		onAttempt
	}: {
		questions: Mcq[];
		locale?: ContentLocale;
		sessionSize?: number;
		pick?: () => number;
		onAttempt?: (attempt: { itemId: string; correct: boolean }) => void;
	} = $props();

	function shuffle<T>(items: T[]): T[] {
		const result = [...items];
		for (let i = result.length - 1; i > 0; i -= 1) {
			const j = Math.floor(pick() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	let seed = $state(0);
	let index = $state(0);
	let selected = $state<string | null>(null);
	let phase = $state<'answering' | 'feedback'>('answering');
	let correctCount = $state(0);

	const deck = $derived.by((): Mcq[] => {
		void seed;
		return shuffle(questions).slice(0, sessionSize);
	});
	const current = $derived(deck[index]);
	const finished = $derived(index >= deck.length);
	const accuracyPct = $derived(
		deck.length === 0 ? 0 : Math.round((correctCount / deck.length) * 100)
	);

	function check() {
		if (phase !== 'answering' || finished || selected === null) return;
		const correct = selected === current.answer;
		if (correct) correctCount += 1;
		phase = 'feedback';
		onAttempt?.({ itemId: current.id, correct });
	}

	function advance() {
		index += 1;
		selected = null;
		phase = 'answering';
	}

	function restart() {
		seed += 1;
		index = 0;
		selected = null;
		correctCount = 0;
		phase = 'answering';
	}
</script>

{#if finished}
	<div class="summary">
		<span class="award bobbing" aria-hidden="true">🪂</span>
		<p class="result">{m.quiz_done({ correct: correctCount, total: deck.length })}</p>
		<p class="result-pct">{m.drill_accuracy({ pct: accuracyPct })}</p>
		<button type="button" class="action" onclick={restart}>{m.start_again()}</button>
	</div>
{:else if current}
	<form
		class="practice"
		onsubmit={(event) => {
			event.preventDefault();
			if (phase === 'answering') check();
			else advance();
		}}
	>
		<div class="bar" aria-hidden="true">
			<div class="bar-fill" style:width={`${(index / deck.length) * 100}%`}></div>
		</div>
		<p class="counter">{m.quiz_progress({ n: index + 1, total: deck.length })}</p>

		{#key current.id}
			<McqQuestion
				question={current}
				index={index + 1}
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
{/if}

<style>
	.practice {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		width: 100%;
		max-width: 40rem;
	}

	.bar {
		width: 100%;
		height: 0.6rem;
		background: var(--color-track);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--color-lift);
		transition: width 0.3s ease;
	}

	.counter {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-ink-soft);
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

	.summary {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		max-width: 34rem;
		padding: var(--space-8) var(--space-6);
		text-align: center;
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.award {
		font-size: 3.5rem;
		line-height: 1;
	}

	.result {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.5rem;
		color: var(--color-ink);
	}

	.result-pct {
		margin: 0;
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
	}
</style>
