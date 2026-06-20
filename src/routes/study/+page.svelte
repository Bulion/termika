<script lang="ts">
	import { onMount } from 'svelte';
	import RecallCard from '$lib/components/RecallCard.svelte';
	import { loadContent } from '$lib/content';
	import type { ContentLocale, Flashcard, MicroSkill } from '$lib/content/schema';
	import { db } from '$lib/engine/db';
	import { recordReview } from '$lib/engine/progress';
	import { createScheduler, type Grade } from '$lib/engine/scheduler';
	import { buildStudyQueue, selectItems } from '$lib/engine/session';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	type Mode = 'all' | 'abbreviation' | 'concept_number';

	const scheduler = createScheduler();
	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	let allFlashcards: Flashcard[] = [];
	let mode = $state<Mode>('all');
	let queue = $state<Flashcard[]>([]);
	let index = $state(0);
	let loading = $state(true);

	const modes: { id: Mode; label: () => string }[] = [
		{ id: 'all', label: m.mode_all },
		{ id: 'abbreviation', label: m.mode_abbreviations },
		{ id: 'concept_number', label: m.mode_numbers }
	];

	async function rebuild() {
		const microSkills: MicroSkill[] | undefined = mode === 'all' ? undefined : [mode];
		const pool = selectItems(allFlashcards, { license: 'SPL', microSkills }) as Flashcard[];
		const built = await buildStudyQueue(db, pool, new Date());
		queue = built.all as Flashcard[];
		index = 0;
	}

	onMount(async () => {
		const content = await loadContent();
		allFlashcards = content.items.filter((i): i is Flashcard => i.type === 'flashcard');
		await rebuild();
		loading = false;
	});

	async function setMode(next: Mode) {
		mode = next;
		loading = true;
		await rebuild();
		loading = false;
	}

	async function grade(g: Grade) {
		const item = queue[index];
		if (!item) return;
		await recordReview(db, scheduler, item.id, g, new Date());
		index += 1;
	}

	const current = $derived(queue[index]);
	const remaining = $derived(Math.max(queue.length - index, 0));
</script>

<svelte:head><title>{m.study_title()} · {m.app_name()}</title></svelte:head>

<main class="study">
	<header>
		<h1>{m.study_title()}</h1>
		<nav class="modes" aria-label={m.study_title()}>
			{#each modes as item (item.id)}
				<button
					type="button"
					class="mode"
					aria-pressed={mode === item.id}
					onclick={() => setMode(item.id)}
				>
					{item.label()}
				</button>
			{/each}
		</nav>
	</header>

	{#if loading}
		<p class="status">…</p>
	{:else if queue.length === 0}
		<p class="status">{m.session_empty()}</p>
	{:else if current}
		<div class="progress" aria-hidden="true">
			<div
				class="progress-fill wind-streak"
				style:width={`${queue.length ? (index / queue.length) * 100 : 0}%`}
			></div>
		</div>
		<p class="status">{m.cards_left({ count: remaining })}</p>
		{#key current.id}
			<RecallCard item={current} locale={locale()} onGrade={grade} />
		{/key}
	{:else}
		<p class="status">{m.session_done()}</p>
		<button type="button" class="mode" onclick={() => setMode(mode)}>{m.start_again()}</button>
	{/if}
</main>

<style>
	.study {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		align-items: flex-start;
	}

	.modes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.mode {
		padding: var(--space-2) var(--space-4);
		font-weight: 700;
		background: var(--color-surface);
		color: var(--color-ink);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
		transition: transform 0.1s ease;
	}

	.mode:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}

	.mode[aria-pressed='true'] {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.progress {
		width: 100%;
		height: 1.5rem;
		background: var(--color-track);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-sky);
		border-right: var(--border-width-sm) solid var(--color-outline);
		transition: width 0.5s ease;
	}

	.status {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}
</style>
