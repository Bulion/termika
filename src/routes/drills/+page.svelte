<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ContentLocale } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import { loadDrillSets } from '$lib/drills/index';
	import type { DrillSet } from '$lib/drills/schema';
	import { loadQuizSets } from '$lib/quiz/index';
	import type { QuizSet } from '$lib/quiz/schema';
	import { openE6b } from '$lib/e6b/state.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');
	const sets: DrillSet[] = loadDrillSets();
	const quizSets: QuizSet[] = loadQuizSets();
</script>

<svelte:head><title>{m.drills_title()} · {m.app_name()}</title></svelte:head>

<main class="hub fade-in">
	<header>
		<h1>{m.drills_title()}</h1>
		<p class="lead">{m.exercise_choose()}</p>
	</header>

	<ul class="cards">
		<li>
			<button type="button" class="card lift card--tool" onclick={openE6b}>
				<span class="card-title">{m.e6b_card_title()}</span>
				<span class="card-desc">{m.e6b_card_desc()}</span>
				<span class="go" aria-hidden="true">→</span>
			</button>
		</li>
		{#each sets as set (set.id)}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="card lift" href={`${resolve('/drills/run')}?set=${set.id}`}>
					<span class="card-title">{resolveText(set.title, locale())}</span>
					{#if set.description}
						<span class="card-desc">{resolveText(set.description, locale())}</span>
					{/if}
					<span class="count">{m.exercises_count({ count: set.drills.length })}</span>
					<span class="go" aria-hidden="true">→</span>
				</a>
			</li>
		{/each}
		{#each quizSets as set (set.id)}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="card lift" href={`${resolve('/drills/quiz')}?set=${set.id}`}>
					<span class="card-title">{resolveText(set.title, locale())}</span>
					{#if set.description}
						<span class="card-desc">{resolveText(set.description, locale())}</span>
					{/if}
					<span class="count">{m.exercises_count({ count: set.pairs.length })}</span>
					<span class="go" aria-hidden="true">→</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.hub {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.lead {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: var(--space-2) 0 0;
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-4);
	}

	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-6);
		text-decoration: none;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.card--tool {
		width: 100%;
		font: inherit;
		text-align: left;
		cursor: pointer;
		background: var(--color-surface-2);
		border-style: dashed;
	}

	.card-title {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.35rem;
	}

	.card-desc {
		color: var(--color-ink-soft);
		max-width: 36rem;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-ink-soft);
	}

	.go {
		position: absolute;
		top: var(--space-6);
		right: var(--space-6);
		font-size: 1.5rem;
		color: var(--color-primary);
	}
</style>
