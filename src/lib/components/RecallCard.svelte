<script lang="ts">
	import { resolveText, type ContentLocale, type Flashcard } from '$lib/content/schema';
	import { GRADES, type Grade } from '$lib/engine/scheduler';
	import { m } from '$lib/paraglide/messages.js';

	let {
		item,
		locale = 'pl',
		onGrade
	}: {
		item: Flashcard;
		locale?: ContentLocale;
		onGrade: (grade: Grade) => void;
	} = $props();

	let revealed = $state(false);

	const gradeLabel: Record<Grade, () => string> = {
		again: m.grade_again,
		hard: m.grade_hard,
		good: m.grade_good,
		easy: m.grade_easy
	};

	function reveal() {
		revealed = true;
	}

	function handleKey(event: KeyboardEvent) {
		if (event.target instanceof HTMLButtonElement) return;
		if (!revealed && (event.key === ' ' || event.key === 'Enter')) {
			event.preventDefault();
			reveal();
			return;
		}
		if (revealed && event.key >= '1' && event.key <= '4') {
			event.preventDefault();
			onGrade(GRADES[Number(event.key) - 1]);
		}
	}
</script>

<svelte:window onkeydown={handleKey} />

<div class="stack">
	<article class="recall-card" class:revealed aria-live="polite">
		<span class="chip" class:chip--answer={revealed}>
			{revealed ? m.chip_answer() : m.chip_question()}
		</span>
		<p class="prompt">{resolveText(item.front, locale)}</p>

		{#if revealed}
			<p class="answer">{resolveText(item.back, locale)}</p>
			{#if item.mnemonic}
				<p class="mnemonic">{resolveText(item.mnemonic, locale)}</p>
			{/if}
		{/if}
	</article>

	{#if revealed}
		<div class="grades" role="group" aria-label={m.study_title()}>
			{#each GRADES as grade (grade)}
				<button class="grade grade--{grade}" type="button" onclick={() => onGrade(grade)}>
					{gradeLabel[grade]()}
				</button>
			{/each}
		</div>
	{:else}
		<button class="reveal" type="button" onclick={reveal}>{m.show_answer()}</button>
	{/if}
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		width: 100%;
		max-width: 36rem;
		align-items: center;
	}

	.recall-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		padding: var(--space-8) var(--space-6) var(--space-6);
		text-align: center;
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-blue);
	}

	.recall-card.revealed {
		background: var(--color-answer);
		box-shadow: var(--shadow-yellow);
	}

	.chip {
		position: absolute;
		top: var(--space-4);
		left: var(--space-4);
		padding: var(--space-1) var(--space-3);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-on-accent);
		background: var(--color-sun);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.chip--answer {
		background: var(--color-lift);
	}

	.prompt {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		margin: var(--space-4) 0 0;
	}

	.answer {
		font-size: 1.125rem;
		margin: 0;
		padding: var(--space-4);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.mnemonic {
		font-style: italic;
		color: var(--color-ink-soft);
		margin: 0;
	}

	.reveal,
	.grade {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-ink);
		border: var(--border-width) solid var(--color-outline);
		box-shadow: var(--shadow-card);
		transition: transform 0.1s ease;
	}

	.reveal:active,
	.grade:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}

	.reveal {
		padding: var(--space-4) var(--space-8);
		font-size: 1.125rem;
		color: var(--color-on-accent);
		background: var(--color-sky);
		border-radius: var(--radius-pill);
	}

	.grades {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
		width: 100%;
	}

	.grade {
		padding: var(--space-3) var(--space-4);
		font-size: 1rem;
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	@media (width >= 30rem) {
		.grades {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.grade--again {
		color: var(--color-on-sink);
		background: var(--color-sink-bg);
	}

	.grade--hard {
		background: var(--color-surface-2);
	}

	.grade--good {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.grade--easy {
		color: var(--color-on-accent);
		background: var(--color-sun);
	}
</style>
