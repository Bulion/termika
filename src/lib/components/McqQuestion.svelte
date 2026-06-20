<script lang="ts">
	import type { ContentLocale, Mcq } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';

	let {
		question,
		index,
		locale = 'pl',
		selected = $bindable(null),
		reveal = false
	}: {
		question: Mcq;
		index: number;
		locale?: ContentLocale;
		selected?: string | null;
		reveal?: boolean;
	} = $props();

	const name = $derived(`q-${question.id}`);

	function choiceState(choiceId: string): '' | 'correct' | 'wrong' {
		if (!reveal) return '';
		if (choiceId === question.answer) return 'correct';
		if (choiceId === selected) return 'wrong';
		return '';
	}
</script>

<fieldset class="question" disabled={reveal}>
	<legend><span class="num">{index}.</span> {resolveText(question.stem, locale)}</legend>

	{#each question.choices as choice (choice.id)}
		<label
			class="choice choice--{choiceState(choice.id)}"
			class:selected={!reveal && selected === choice.id}
		>
			<span class="choice-text">{resolveText(choice.text, locale)}</span>
			<input type="radio" {name} value={choice.id} bind:group={selected} />
		</label>
	{/each}

	{#if reveal && question.explanation}
		<p class="explanation">{resolveText(question.explanation, locale)}</p>
	{/if}
</fieldset>

<style>
	.question {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		margin: 0;
		padding: var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	legend {
		font-family: var(--font-display);
		font-weight: 800;
		padding: 0 var(--space-2);
		margin-bottom: var(--space-2);
	}

	.num {
		color: var(--color-ink-soft);
	}

	.choice {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-4);
		font-weight: 600;
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			background 0.15s ease;
	}

	.choice:focus-within {
		box-shadow: var(--focus-ring);
	}

	@media (hover: hover) {
		.choice:hover {
			transform: translateX(2px);
		}
	}

	.choice.selected {
		color: var(--color-on-accent);
		background: var(--color-sky);
		box-shadow: var(--shadow-card-sm);
	}

	.choice-text {
		flex: 1;
	}

	/* The native radio, restyled as the cockpit-style selection indicator on the right. */
	.choice input[type='radio'] {
		appearance: none;
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		margin: 0;
		flex-shrink: 0;
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: 50%;
		cursor: pointer;
	}

	.choice input[type='radio']::after {
		content: '';
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: transparent;
	}

	.choice input[type='radio']:checked {
		background: var(--color-sun);
	}

	.choice input[type='radio']:checked::after {
		background: var(--color-outline);
	}

	.choice--correct {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-lift) 30%, var(--color-surface));
		border-color: var(--color-lift);
	}

	.choice--wrong {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-sink) 22%, var(--color-surface));
		border-color: var(--color-sink);
	}

	.explanation {
		margin: var(--space-2) 0 0;
		padding: var(--space-3);
		color: var(--color-ink-soft);
		font-size: 0.95rem;
		background: var(--color-surface-2);
		border-left: 4px solid var(--color-sky);
		border-radius: var(--radius-sm);
	}
</style>
