<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import RecallCard from '$lib/components/RecallCard.svelte';
	import ScenarioCard from '$lib/components/ScenarioCard.svelte';
	import { loadContent } from '$lib/content';
	import type {
		ContentLocale,
		Flashcard,
		MicroSkill,
		ScenarioItem,
		StudyItem
	} from '$lib/content/schema';
	import { db } from '$lib/engine/db';
	import { recordReview } from '$lib/engine/progress';
	import { createScheduler, type Grade } from '$lib/engine/scheduler';
	import { buildStudyQueue, selectItems } from '$lib/engine/session';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	type Mode = 'all' | 'abbreviation' | 'concept_number' | 'scenario';
	const MODES: Mode[] = ['all', 'abbreviation', 'concept_number', 'scenario'];

	const scheduler = createScheduler();
	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	const modeLabels: Record<Mode, () => string> = {
		all: m.mode_all,
		abbreviation: m.mode_abbreviations,
		concept_number: m.mode_numbers,
		scenario: m.mode_scenarios
	};

	const param = page.url.searchParams.get('mode');
	const mode: Mode = MODES.includes(param as Mode) ? (param as Mode) : 'all';

	let allItems: StudyItem[] = [];
	let queue = $state<StudyItem[]>([]);
	let index = $state(0);
	let loading = $state(true);
	let tally = $state<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });

	const tallyView: { grade: Grade; label: () => string }[] = [
		{ grade: 'again', label: m.grade_again },
		{ grade: 'hard', label: m.grade_hard },
		{ grade: 'good', label: m.grade_good },
		{ grade: 'easy', label: m.grade_easy }
	];

	async function rebuild() {
		const pool =
			mode === 'scenario'
				? selectItems(allItems, { license: 'SPL', types: ['scenario'] })
				: selectItems(allItems, {
						license: 'SPL',
						types: ['flashcard'],
						microSkills: mode === 'all' ? undefined : ([mode] as MicroSkill[])
					});
		const built = await buildStudyQueue(db, pool, new Date(), {
			shuffleSeed: Math.floor(Math.random() * 2 ** 32)
		});
		queue = built.all;
		index = 0;
		tally = { again: 0, hard: 0, good: 0, easy: 0 };
	}

	onMount(async () => {
		const content = await loadContent();
		allItems = content.items.filter((i) => i.type === 'flashcard' || i.type === 'scenario');
		await rebuild();
		loading = false;
	});

	async function restart() {
		loading = true;
		await rebuild();
		loading = false;
	}

	async function grade(g: Grade) {
		const item = queue[index];
		if (!item) return;
		await recordReview(db, scheduler, item.id, g, new Date());
		tally[g] += 1;
		index += 1;
	}

	const current = $derived(queue[index]);
	const remaining = $derived(Math.max(queue.length - index, 0));
</script>

<svelte:head><title>{modeLabels[mode]()} · {m.study_title()}</title></svelte:head>

<main class="study fade-in">
	<header>
		<a class="back" href={resolve('/study')}>← {m.back()}</a>
		<h1>{modeLabels[mode]()}</h1>
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
			{#if current.type === 'scenario'}
				<ScenarioCard item={current as ScenarioItem} locale={locale()} onGrade={grade} />
			{:else}
				<RecallCard item={current as Flashcard} locale={locale()} onGrade={grade} />
			{/if}
		{/key}
	{:else}
		<div class="summary">
			<span class="award bobbing" aria-hidden="true">🪂</span>
			<h2>{m.session_done()}</h2>
			<div class="tally">
				{#each tallyView as row (row.grade)}
					<div class="tally-cell tally--{row.grade}">
						<span class="count">{tally[row.grade]}</span>
						<span class="tally-label">{row.label()}</span>
					</div>
				{/each}
			</div>
			<div class="summary-actions">
				<button type="button" class="restart" onclick={restart}>{m.start_again()}</button>
				<a class="ghost" href={resolve('/study')}>{m.back()}</a>
			</div>
		</div>
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

	.back {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-primary);
		text-decoration: none;
	}

	.back:hover {
		text-decoration: underline;
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
		background-color: var(--color-sky);
		border-right: var(--border-width-sm) solid var(--color-outline);
		transition: width 0.5s ease;
	}

	.status {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}

	.summary {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		max-width: 34rem;
		margin: 0 auto;
		padding: var(--space-8) var(--space-6);
		text-align: center;
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.award {
		font-size: 3.5rem;
		line-height: 1;
	}

	.tally {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
		width: 100%;
	}

	@media (width >= 30rem) {
		.tally {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.tally-cell {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.count {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.5rem;
	}

	.tally-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-soft);
	}

	.tally--again {
		color: var(--color-on-sink);
		background: var(--color-sink-bg);
	}

	.tally--hard {
		background: var(--color-surface-2);
	}

	.tally--good {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.tally--easy {
		color: var(--color-on-accent);
		background: var(--color-sun);
	}

	.tally--good .tally-label,
	.tally--easy .tally-label {
		color: var(--color-on-accent);
	}

	.summary-actions {
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}

	.restart {
		padding: var(--space-3) var(--space-6);
		font-weight: 700;
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
		transition: transform 0.1s ease;
	}

	.restart:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}

	.ghost {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
		padding: var(--space-3) var(--space-4);
	}
</style>
