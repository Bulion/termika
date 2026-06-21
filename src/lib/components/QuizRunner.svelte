<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { resolveText, type ContentLocale } from '$lib/content/schema';
	import type { Attempt } from '$lib/drills/fluency';
	import { buildQuizDeck, isQuizAnswerCorrect, type QuizQuestion } from '$lib/quiz/generator';
	import type { QuizDirection, QuizSet } from '$lib/quiz/schema';
	import { m } from '$lib/paraglide/messages.js';

	let {
		set,
		locale = 'pl',
		pick = Math.random,
		now = () => performance.now(),
		onAttempt
	}: {
		set: QuizSet;
		locale?: ContentLocale;
		pick?: () => number;
		now?: () => number;
		onAttempt?: (attempt: Attempt & { questionId: string }) => void;
	} = $props();

	type DirectionMode = 'both' | QuizDirection;

	let directionMode = $state<DirectionMode>('both');
	let seed = $state(0);
	let index = $state(0);
	let answer = $state('');
	let phase = $state<'answering' | 'feedback'>('answering');
	let lastCorrect = $state(false);
	let correctCount = $state(0);
	let startedAt = 0;
	let remaining = $state(0);
	let ticker: ReturnType<typeof setInterval> | undefined;

	const directions = $derived(directionMode === 'both' ? set.directions : [directionMode]);
	const deck = $derived.by((): QuizQuestion[] => {
		void seed;
		return buildQuizDeck(set, directions, locale, pick);
	});
	const current = $derived(deck[index]);
	const finished = $derived(index >= deck.length);
	const labelA = $derived(resolveText(set.labelA, locale));
	const labelB = $derived(resolveText(set.labelB, locale));
	const accuracyPct = $derived(
		deck.length === 0 ? 0 : Math.round((correctCount / deck.length) * 100)
	);
	const timeLabel = $derived(
		`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
	);

	function startTimer() {
		clearInterval(ticker);
		remaining = set.timeLimitSec ?? 0;
		if (!set.timeLimitSec || finished) return;
		ticker = setInterval(() => {
			remaining -= 1;
			if (remaining <= 0) {
				remaining = 0;
				clearInterval(ticker);
				timeUp();
			}
		}, 1000);
	}

	function score(correct: boolean, latencyMs: number) {
		if (correct) correctCount += 1;
		lastCorrect = correct;
		phase = 'feedback';
		onAttempt?.({ questionId: current.id, correct, latencyMs });
	}

	function timeUp() {
		if (phase !== 'answering' || finished) return;
		score(false, (set.timeLimitSec ?? 0) * 1000);
	}

	onMount(() => {
		startedAt = now();
		startTimer();
	});

	onDestroy(() => clearInterval(ticker));

	function submit() {
		if (phase !== 'answering' || finished || answer.trim() === '') return;
		clearInterval(ticker);
		score(
			isQuizAnswerCorrect(answer, current.expected, current.accept, current.keywordGroups),
			now() - startedAt
		);
	}

	function reveal() {
		if (phase !== 'answering' || finished) return;
		clearInterval(ticker);
		score(false, now() - startedAt);
	}

	function advance() {
		index += 1;
		answer = '';
		phase = 'answering';
		startedAt = now();
		startTimer();
	}

	function reset() {
		index = 0;
		answer = '';
		correctCount = 0;
		phase = 'answering';
		startedAt = now();
		startTimer();
	}

	function restart() {
		seed += 1;
		reset();
	}

	function setMode(mode: DirectionMode) {
		directionMode = mode;
		seed += 1;
		reset();
	}
</script>

{#if set.directions.length > 1}
	<div class="dirs" role="group" aria-label={m.quiz_direction()}>
		<button
			type="button"
			class="dir"
			class:active={directionMode === 'both'}
			onclick={() => setMode('both')}>{m.quiz_both()}</button
		>
		<button
			type="button"
			class="dir"
			class:active={directionMode === 'a-to-b'}
			onclick={() => setMode('a-to-b')}>{labelA} → {labelB}</button
		>
		<button
			type="button"
			class="dir"
			class:active={directionMode === 'b-to-a'}
			onclick={() => setMode('b-to-a')}>{labelB} → {labelA}</button
		>
	</div>
{/if}

{#if finished}
	<div class="quiz done">
		<p class="result">{m.quiz_done({ correct: correctCount, total: deck.length })}</p>
		<p class="result-pct">{m.drill_accuracy({ pct: accuracyPct })}</p>
		<button type="button" class="action" onclick={() => restart()}>{m.start_again()}</button>
	</div>
{:else}
	<form
		class="quiz"
		onsubmit={(event) => {
			event.preventDefault();
			if (phase === 'answering') submit();
			else advance();
		}}
	>
		<div class="bar" aria-hidden="true">
			<div class="bar-fill" style:width={`${(index / deck.length) * 100}%`}></div>
		</div>
		<p class="counter">{m.quiz_progress({ n: index + 1, total: deck.length })}</p>

		{#if set.timeLimitSec}
			<div class="timer" class:low={remaining <= 3}>
				<span class="timer-value">{timeLabel}</span>
			</div>
		{/if}

		<span class="prompt-label">{current.promptLabel}</span>
		<p class="prompt">{current.prompt}</p>

		<input
			class="answer"
			type="text"
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck="false"
			aria-label={current.answerLabel}
			placeholder={current.answerLabel}
			bind:value={answer}
			readonly={phase === 'feedback'}
		/>

		{#if phase === 'feedback'}
			<p class="feedback" class:correct={lastCorrect} class:wrong={!lastCorrect} role="status">
				{lastCorrect ? m.drill_correct() : m.drill_wrong({ expected: current.expected })}
			</p>
			{#if lastCorrect}
				<p class="model-answer">{m.quiz_model_answer()}: {current.expected}</p>
			{/if}
			{#if current.hint}
				<p class="hint">{current.hint}</p>
			{/if}
			<button type="submit" class="action">{m.drill_next()}</button>
		{:else}
			<div class="actions">
				<button type="submit" class="action">{m.drill_check()}</button>
				<button type="button" class="ghost" onclick={reveal}>{m.quiz_reveal()}</button>
			</div>
		{/if}
	</form>
{/if}

<style>
	.dirs {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		justify-content: center;
	}

	.dir {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-ink);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.dir.active {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.quiz {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		text-align: center;
		width: 100%;
		max-width: 30rem;
		padding: var(--space-8) var(--space-6) var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-blue);
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

	.timer {
		display: grid;
		place-items: center;
		width: 4rem;
		height: 4rem;
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--color-ink);
		background: var(--color-surface-2);
		border: var(--border-width) solid var(--color-outline);
		border-radius: 50%;
		box-shadow: var(--shadow-card-sm);
	}

	.timer.low {
		color: var(--color-on-sink);
		background: var(--color-sink-bg);
	}

	.prompt-label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-soft);
	}

	.prompt {
		width: 100%;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: clamp(1.5rem, 5vw, 2.25rem);
		color: var(--color-primary);
		margin: 0;
		padding: var(--space-4) var(--space-3);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.answer {
		width: 100%;
		font-family: var(--font-mono);
		font-size: 1.35rem;
		text-align: center;
		padding: var(--space-3);
		color: var(--color-ink);
		background: var(--color-bg);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.feedback {
		font-family: var(--font-display);
		font-weight: 700;
		margin: 0;
	}

	.feedback.correct {
		color: color-mix(in srgb, var(--color-lift) 80%, var(--color-ink));
	}

	.feedback.wrong {
		color: var(--color-sink);
	}

	.hint {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-ink-soft);
	}

	.model-answer {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--color-ink);
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
		justify-content: center;
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

	.ghost {
		padding: var(--space-3) var(--space-6);
		font-size: 0.9rem;
		color: var(--color-ink);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	@media (hover: hover) {
		.action:hover {
			transform: translateY(-2px);
		}
	}

	.action:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}

	.done {
		gap: var(--space-5);
	}

	.result {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.5rem;
		margin: 0;
		color: var(--color-ink);
	}

	.result-pct {
		margin: 0;
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
	}
</style>
