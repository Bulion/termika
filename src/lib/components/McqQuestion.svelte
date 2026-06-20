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
		<label class="choice choice--{choiceState(choice.id)}">
			<input type="radio" {name} value={choice.id} bind:group={selected} />
			<span>{resolveText(choice.text, locale)}</span>
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
		gap: var(--space-2);
		width: 100%;
		margin: 0;
		padding: var(--space-4);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	legend {
		font-family: var(--font-display);
		padding: 0 var(--space-2);
	}

	.num {
		color: var(--color-ink-soft);
	}

	.choice {
		display: flex;
		gap: var(--space-2);
		align-items: baseline;
		padding: var(--space-2) var(--space-3);
		border: var(--border-width) solid transparent;
		border-radius: var(--radius-sm);
	}

	.choice--correct {
		border-color: var(--color-lift);
		background: color-mix(in srgb, var(--color-lift) 18%, var(--color-surface));
	}

	.choice--wrong {
		border-color: var(--color-sink);
		background: color-mix(in srgb, var(--color-sink) 18%, var(--color-surface));
	}

	.explanation {
		margin: var(--space-2) 0 0;
		color: var(--color-ink-soft);
		font-size: 0.95rem;
	}
</style>
