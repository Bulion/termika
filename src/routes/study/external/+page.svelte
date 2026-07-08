<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import McqPractice from '$lib/components/McqPractice.svelte';
	import type { ContentLocale, Mcq } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import { db } from '$lib/engine/db';
	import { recordReview } from '$lib/engine/progress';
	import { createScheduler } from '$lib/engine/scheduler';
	import { dedupeExactMcqs } from '$lib/exam/exam';
	import {
		EXAM_SOURCES,
		loadExternalCategories,
		loadExternalMcqs,
		type ExamCategory
	} from '$lib/exam/sources';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const scheduler = createScheduler();
	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	const externalSources = EXAM_SOURCES.filter((s) => s.external);
	const param = page.url.searchParams.get('source');
	const source = externalSources.find((s) => s.id === param) ?? externalSources[0];

	let phase = $state<'select' | 'practice'>('select');
	let loadingCats = $state(true);
	let loading = $state(false);
	let error = $state(false);
	let categories = $state<ExamCategory[]>([]);
	let questions = $state<Mcq[]>([]);
	let activeLabel = $state('');

	onMount(async () => {
		if (!source.hasCategories) {
			loadingCats = false;
			return;
		}
		try {
			categories = await loadExternalCategories(source.id);
		} catch {
			error = true;
		} finally {
			loadingCats = false;
		}
	});

	async function start(category?: ExamCategory) {
		loading = true;
		error = false;
		try {
			questions = dedupeExactMcqs(await loadExternalMcqs(source.id, category?.id));
			activeLabel = category
				? `${resolveText(source.label, locale())} · ${category.name}`
				: resolveText(source.label, locale());
			phase = 'practice';
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}

	async function handleAttempt(attempt: { itemId: string; correct: boolean }) {
		await recordReview(
			db,
			scheduler,
			attempt.itemId,
			attempt.correct ? 'good' : 'again',
			new Date()
		);
	}
</script>

<svelte:head>
	<title>{resolveText(source.label, locale())} · {m.study_title()}</title>
</svelte:head>

<main class="external fade-in">
	<header>
		<a class="back" href={resolve('/study')}>← {m.back()}</a>
		<h1>{phase === 'practice' ? activeLabel : resolveText(source.label, locale())}</h1>
	</header>

	{#if error}
		<p class="status">{m.exam_source_error()}</p>
	{:else if phase === 'practice'}
		{#if questions.length === 0}
			<p class="status">{m.exam_no_questions()}</p>
		{:else}
			<McqPractice {questions} locale={locale()} onAttempt={handleAttempt} />
		{/if}
	{:else if loadingCats || loading}
		<p class="status">{m.exam_loading()}</p>
	{:else}
		<p class="lead">{m.study_external_hint()}</p>
		<ul class="cats">
			{#if categories.length > 0}
				<li>
					<button type="button" class="cat" onclick={() => start()}
						>{m.exam_all_categories()}</button
					>
				</li>
				{#each categories as category (category.id)}
					<li>
						<button type="button" class="cat" onclick={() => start(category)}
							>{category.name}</button
						>
					</li>
				{/each}
			{:else}
				<li>
					<button type="button" class="cat" onclick={() => start()}>{m.exam_start()}</button>
				</li>
			{/if}
		</ul>
	{/if}
</main>

<style>
	.external {
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

	.lead {
		align-self: stretch;
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}

	.status {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}

	.cats {
		align-self: stretch;
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.cat {
		padding: var(--space-3) var(--space-5);
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
		transition: transform 0.1s ease;
	}

	@media (hover: hover) {
		.cat:hover {
			transform: translateY(-2px);
		}
	}

	.cat:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}
</style>
