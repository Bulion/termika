<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
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
	const setId = page.url.searchParams.get('set');
	const active = sets.find((s) => s.id === setId) ?? sets[0];

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
</script>

<svelte:head>
	<title>{active ? resolveText(active.title, locale()) : m.drills_title()} · {m.app_name()}</title>
</svelte:head>

<main class="drills fade-in">
	<header>
		<a class="back" href={resolve('/drills')}>← {m.back()}</a>
		{#if active}<h1>{resolveText(active.title, locale())}</h1>{/if}
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
		align-items: center;
	}

	header {
		align-self: stretch;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
	}

	.back {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-primary);
		text-decoration: none;
	}

	.back:hover {
		text-decoration: underline;
	}

	.score {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}
</style>
