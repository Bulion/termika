<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import QuizRunner from '$lib/components/QuizRunner.svelte';
	import type { ContentLocale } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import type { Attempt } from '$lib/drills/fluency';
	import { recordDrillAttempt } from '$lib/drills/progress';
	import { loadQuizSets } from '$lib/quiz/index';
	import type { QuizSet } from '$lib/quiz/schema';
	import { db } from '$lib/engine/db';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');
	const sets: QuizSet[] = loadQuizSets();
	const setId = page.url.searchParams.get('set');
	const active = sets.find((s) => s.id === setId) ?? sets[0];

	async function handleAttempt(attempt: Attempt & { questionId: string }) {
		await recordDrillAttempt(db, `quiz:${attempt.questionId}`, {
			correct: attempt.correct,
			latencyMs: attempt.latencyMs
		});
	}
</script>

<svelte:head>
	<title>{active ? resolveText(active.title, locale()) : m.drills_title()} · {m.app_name()}</title>
</svelte:head>

<main class="quiz-page fade-in">
	<header>
		<a class="back" href={resolve('/drills')}>← {m.back()}</a>
		{#if active}<h1>{resolveText(active.title, locale())}</h1>{/if}
	</header>

	{#if active}
		{#key active.id}
			<QuizRunner set={active} locale={locale()} onAttempt={handleAttempt} />
		{/key}
	{/if}
</main>

<style>
	.quiz-page {
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
</style>
