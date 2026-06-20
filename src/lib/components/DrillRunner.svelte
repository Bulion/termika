<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContentLocale } from '$lib/content/schema';
	import { generateProblem, isWithinTolerance, type DrillProblem } from '$lib/drills/generator';
	import type { Attempt } from '$lib/drills/fluency';
	import type { Drill } from '$lib/drills/schema';
	import { m } from '$lib/paraglide/messages.js';

	let {
		drills,
		locale = 'pl',
		pick = Math.random,
		now = () => performance.now(),
		onAttempt
	}: {
		drills: Drill[];
		locale?: ContentLocale;
		pick?: () => number;
		now?: () => number;
		onAttempt?: (attempt: Attempt & { drillId: string }) => void;
	} = $props();

	let problem = $state<DrillProblem>(nextProblem());
	let answer = $state('');
	let phase = $state<'answering' | 'feedback'>('answering');
	let lastCorrect = $state(false);
	let startedAt = 0;

	onMount(() => {
		startedAt = now();
	});

	function nextProblem(): DrillProblem {
		const drill: Drill = drills[Math.floor(pick() * drills.length)] ?? drills[0];
		return generateProblem(drill, locale, pick);
	}

	function advance() {
		problem = nextProblem();
		answer = '';
		phase = 'answering';
		startedAt = now();
	}

	function submit() {
		if (phase !== 'answering' || answer.trim() === '') return;
		const value = Number.parseFloat(answer.replace(',', '.'));
		lastCorrect = isWithinTolerance(problem.expected, value, problem.tolerancePct);
		phase = 'feedback';
		onAttempt?.({ drillId: problem.drillId, correct: lastCorrect, latencyMs: now() - startedAt });
	}

	const expectedLabel = $derived(problem.expected.toFixed(problem.round));
</script>

<form
	class="drill"
	onsubmit={(event) => {
		event.preventDefault();
		if (phase === 'answering') submit();
		else advance();
	}}
>
	<p class="prompt">{problem.prompt}</p>

	<input
		class="answer"
		type="text"
		inputmode="decimal"
		autocomplete="off"
		aria-label={m.drill_answer()}
		bind:value={answer}
		readonly={phase === 'feedback'}
	/>

	{#if phase === 'feedback'}
		<p class="feedback" class:correct={lastCorrect} class:wrong={!lastCorrect} role="status">
			{lastCorrect ? m.drill_correct() : m.drill_wrong({ expected: expectedLabel })}
		</p>
		<button type="submit" class="action">{m.drill_next()}</button>
	{:else}
		<button type="submit" class="action">{m.drill_check()}</button>
	{/if}
</form>

<style>
	.drill {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		max-width: 26rem;
		padding: var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.prompt {
		font-family: var(--font-mono);
		font-size: clamp(1.5rem, 5vw, 2rem);
		margin: 0;
	}

	.answer {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		padding: var(--space-3);
		color: var(--color-ink);
		background: var(--color-bg);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.feedback {
		font-family: var(--font-display);
		margin: 0;
	}

	.feedback.correct {
		color: color-mix(in srgb, var(--color-lift) 80%, var(--color-ink));
	}

	.feedback.wrong {
		color: color-mix(in srgb, var(--color-sink) 75%, var(--color-ink));
	}

	.action {
		align-self: flex-start;
		padding: var(--space-3) var(--space-6);
		font-size: 1rem;
		color: var(--color-ink);
		background: var(--color-sun);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
	}
</style>
