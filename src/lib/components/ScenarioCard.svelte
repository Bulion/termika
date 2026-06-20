<script lang="ts">
	import { resolveText, type ContentLocale, type ScenarioItem } from '$lib/content/schema';
	import { GRADES, type Grade } from '$lib/engine/scheduler';
	import { m } from '$lib/paraglide/messages.js';
	import RichText from './RichText.svelte';

	let {
		item,
		locale = 'pl',
		onGrade
	}: {
		item: ScenarioItem;
		locale?: ContentLocale;
		onGrade: (grade: Grade) => void;
	} = $props();

	let revealed = $state(false);
	let checked = $state<Record<number, boolean>>({});

	const gradeLabel: Record<Grade, () => string> = {
		again: m.grade_again,
		hard: m.grade_hard,
		good: m.grade_good,
		easy: m.grade_easy
	};

	const coveredCount = $derived(item.modelChecklist.filter((_, i) => checked[i]).length);

	function reveal() {
		revealed = true;
	}
</script>

<div class="stack">
	<section class="panel prompt-panel">
		<span class="chip chip--scenario">{m.scenario_situation()}</span>
		<p class="prompt"><RichText text={resolveText(item.prompt, locale)} /></p>
	</section>

	{#if revealed}
		<section class="panel checklist-panel">
			<span class="chip chip--model">{m.scenario_model()}</span>
			<ul class="checklist">
				{#each item.modelChecklist as point, i (i)}
					<li>
						<label class="point" class:done={checked[i]}>
							<input type="checkbox" bind:checked={checked[i]} />
							<span><RichText text={resolveText(point, locale)} /></span>
						</label>
					</li>
				{/each}
			</ul>
			<p class="covered">
				{m.scenario_covered({ done: coveredCount, total: item.modelChecklist.length })}
			</p>
		</section>

		<div class="grades" role="group" aria-label={m.study_title()}>
			{#each GRADES as grade (grade)}
				<button class="grade grade--{grade}" type="button" onclick={() => onGrade(grade)}>
					{gradeLabel[grade]()}
				</button>
			{/each}
		</div>
	{:else}
		<button class="reveal" type="button" onclick={reveal}>{m.scenario_reveal()}</button>
	{/if}
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		width: 100%;
		max-width: 38rem;
		align-items: stretch;
	}

	.panel {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-8) var(--space-5) var(--space-5);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
	}

	.prompt-panel {
		background: var(--color-surface);
		box-shadow: var(--shadow-blue);
	}

	.checklist-panel {
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
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.chip--scenario {
		background: var(--color-sun);
	}

	.chip--model {
		background: var(--color-lift);
	}

	.prompt {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: clamp(1.25rem, 3.5vw, 1.75rem);
		margin: 0;
	}

	.checklist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.point {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		padding: var(--space-3);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.point input {
		margin-top: 0.2rem;
		flex: none;
		width: 1.1rem;
		height: 1.1rem;
		accent-color: var(--color-lift);
	}

	.point.done {
		background: color-mix(in srgb, var(--color-lift) 18%, var(--color-surface));
	}

	.covered {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-ink-soft);
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

	@media (hover: hover) {
		.reveal:hover,
		.grade:hover {
			transform: translateY(-2px);
		}
	}

	.reveal:active,
	.grade:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}

	.reveal {
		align-self: center;
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
