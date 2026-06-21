<script lang="ts">
	import { resolve } from '$app/paths';
	import { resolveText, type ContentLocale } from '$lib/content/schema';
	import { EXAM_SOURCES } from '$lib/exam/sources';
	import Seo from '$lib/components/Seo.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	const exercises = [
		{ mode: 'all', title: m.mode_all, desc: m.mode_all_desc },
		{ mode: 'abbreviation', title: m.mode_abbreviations, desc: m.mode_abbreviations_desc },
		{ mode: 'concept_number', title: m.mode_numbers, desc: m.mode_numbers_desc },
		{ mode: 'scenario', title: m.mode_scenarios, desc: m.mode_scenarios_desc }
	];

	const externalSources = EXAM_SOURCES.filter((s) => s.external);
</script>

<Seo title={`${m.study_title()} · ${m.app_name()}`} description={m.seo_desc_study()} />

<main class="hub fade-in">
	<header>
		<h1>{m.study_title()}</h1>
		<p class="lead">{m.exercise_choose()}</p>
	</header>

	<ul class="cards">
		{#each exercises as ex (ex.mode)}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="card lift" href={`${resolve('/study/session')}?mode=${ex.mode}`}>
					<span class="card-title">{ex.title()}</span>
					<span class="card-desc">{ex.desc()}</span>
					<span class="go" aria-hidden="true">→</span>
				</a>
			</li>
		{/each}
		<li>
			<a class="card lift" href={resolve('/study/glossary')}>
				<span class="card-title">{m.glossary_title()}</span>
				<span class="card-desc">{m.glossary_card_desc()}</span>
				<span class="go" aria-hidden="true">→</span>
			</a>
		</li>
	</ul>

	<section class="external">
		<h2>{m.study_external_heading()}</h2>
		<p class="lead">{m.study_external_desc()}</p>
		<ul class="cards">
			{#each externalSources as src (src.id)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="card lift" href={`${resolve('/study/external')}?source=${src.id}`}>
						<span class="card-title">{resolveText(src.label, locale())}</span>
						<span class="card-desc">{m.study_external_card_desc()}</span>
						<span class="go" aria-hidden="true">→</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
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

	.external {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		border-top: var(--border-width-sm) solid var(--color-outline);
		padding-top: var(--space-6);
	}

	.external h2 {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.5rem;
		margin: 0;
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

	.card-title {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.35rem;
	}

	.card-desc {
		color: var(--color-ink-soft);
		max-width: 36rem;
	}

	.go {
		position: absolute;
		top: var(--space-6);
		right: var(--space-6);
		font-size: 1.5rem;
		color: var(--color-primary);
	}
</style>
