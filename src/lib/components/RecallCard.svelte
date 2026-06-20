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

<article class="recall-card" aria-live="polite">
	<p class="prompt">{resolveText(item.front, locale)}</p>

	{#if revealed}
		<hr />
		<p class="answer">{resolveText(item.back, locale)}</p>
		{#if item.mnemonic}
			<p class="mnemonic">{resolveText(item.mnemonic, locale)}</p>
		{/if}
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
</article>

<style>
	.recall-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		max-width: 32rem;
		padding: var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.prompt {
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		margin: 0;
	}

	hr {
		width: 100%;
		border: none;
		border-top: var(--border-width) dashed var(--color-ink-soft);
		margin: 0;
	}

	.answer {
		font-size: 1.125rem;
		margin: 0;
	}

	.mnemonic {
		font-style: italic;
		color: var(--color-ink-soft);
		margin: 0;
	}

	.reveal,
	.grade {
		padding: var(--space-3) var(--space-4);
		font-size: 1rem;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.reveal {
		color: var(--color-on-accent);
		background: var(--color-sun);
		align-self: flex-start;
	}

	.grades {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-2);
	}

	@media (width >= 30rem) {
		.grades {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.grade--again {
		background: color-mix(in srgb, var(--color-sink) 30%, var(--color-surface));
	}

	.grade--good,
	.grade--easy {
		background: color-mix(in srgb, var(--color-lift) 30%, var(--color-surface));
	}
</style>
