<script lang="ts">
	import DrillRunner from '$lib/components/DrillRunner.svelte';
	import type { ContentLocale } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import type { Attempt } from '$lib/drills/fluency';
	import { loadDrillSets } from '$lib/drills/index';
	import { recordDrillAttempt } from '$lib/drills/progress';
	import type { DrillSet } from '$lib/drills/schema';
	import { db } from '$lib/engine/db';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');
	const sets: DrillSet[] = loadDrillSets();

	let activeId = $state(sets[0]?.id ?? '');
	const active = $derived(sets.find((s) => s.id === activeId) ?? sets[0]);

	let sessionTotal = $state(0);
	let sessionCorrect = $state(0);
	const accuracyPct = $derived(
		sessionTotal === 0 ? 0 : Math.round((sessionCorrect / sessionTotal) * 100)
	);

	async function handleAttempt(attempt: Attempt & { drillId: string }) {
		sessionTotal += 1;
		if (attempt.correct) sessionCorrect += 1;
		await recordDrillAttempt(db, attempt.drillId, {
			correct: attempt.correct,
			latencyMs: attempt.latencyMs
		});
	}

	function selectSet(id: string) {
		activeId = id;
		sessionTotal = 0;
		sessionCorrect = 0;
	}
</script>

<svelte:head><title>{m.drills_title()} · {m.app_name()}</title></svelte:head>

<main class="drills">
	<header>
		<h1>{m.drills_title()}</h1>
		<nav class="sets" aria-label={m.drills_title()}>
			{#each sets as set (set.id)}
				<button
					type="button"
					class="set"
					aria-pressed={activeId === set.id}
					onclick={() => selectSet(set.id)}
				>
					{resolveText(set.title, locale())}
				</button>
			{/each}
		</nav>
	</header>

	{#if active}
		{#key active.id}
			<DrillRunner drills={active.drills} locale={locale()} onAttempt={handleAttempt} />
		{/key}
		{#if sessionTotal > 0}
			<p class="score">{m.drill_accuracy({ pct: accuracyPct })}</p>
		{/if}
	{/if}
</main>

<style>
	.drills {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		align-items: flex-start;
	}

	.sets {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.set {
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface);
		color: var(--color-ink);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.set[aria-pressed='true'] {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.score {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}
</style>
