<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import { glossaryGroups, entryMatchesQuery } from '$lib/glossary/data';
	import type { ContentLocale } from '$lib/content/schema';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	let query = $state('');

	const groupLabel = {
		aero: m.glossary_group_aero,
		abbreviations: m.glossary_group_abbreviations,
		metar: m.glossary_group_metar
	};

	const filtered = $derived(
		glossaryGroups(locale()).map((group) => ({
			...group,
			entries: group.entries.filter((entry) => entryMatchesQuery(entry, query))
		}))
	);
	const totalResults = $derived(filtered.reduce((sum, group) => sum + group.entries.length, 0));
</script>

<Seo title={`${m.glossary_title()} · ${m.app_name()}`} description={m.glossary_desc()} />

<main class="glossary fade-in">
	<header>
		<a class="back" href={resolve('/study')}>← {m.back()}</a>
		<h1>{m.glossary_title()}</h1>
		<p class="lead">{m.glossary_desc()}</p>
	</header>

	<input
		type="search"
		class="search"
		bind:value={query}
		placeholder={m.glossary_search()}
		aria-label={m.glossary_search()}
		autocomplete="off"
	/>

	{#if totalResults === 0}
		<p class="empty" role="status">{m.glossary_empty()}</p>
	{:else}
		{#each filtered as group (group.id)}
			{#if group.entries.length > 0}
				<section>
					<h2>{groupLabel[group.id]()}</h2>
					<dl>
						{#each group.entries as entry (group.id + entry.term)}
							<div class="row">
								<dt>{entry.term}</dt>
								<dd>
									<span class="expansion">{entry.expansion}</span>
									{#if entry.explanation}
										<span class="explanation">{entry.explanation}</span>
									{/if}
								</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/if}
		{/each}
	{/if}
</main>

<style>
	.glossary {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.back {
		align-self: start;
		font-family: var(--font-mono);
		color: var(--color-primary);
		text-decoration: none;
	}

	h1 {
		font-family: var(--font-display);
		font-weight: 800;
		margin: var(--space-2) 0 0;
	}

	.lead {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: var(--space-2) 0 0;
	}

	.search {
		width: 100%;
		font-family: var(--font-mono);
		font-size: 1.1rem;
		padding: var(--space-3) var(--space-4);
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
	}

	.search:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	h2 {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.4rem;
		margin: 0;
	}

	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.row {
		display: grid;
		grid-template-columns: minmax(5rem, 8rem) 1fr;
		gap: var(--space-2) var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	dt {
		font-family: var(--font-mono);
		font-weight: 700;
		color: var(--color-primary);
		overflow-wrap: anywhere;
	}

	dd {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.expansion {
		color: var(--color-ink);
	}

	.explanation {
		font-size: 0.9rem;
		color: var(--color-ink-soft);
	}

	.empty {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
	}

	@media (width <= 30rem) {
		.row {
			grid-template-columns: 1fr;
			gap: var(--space-1);
		}
	}
</style>
