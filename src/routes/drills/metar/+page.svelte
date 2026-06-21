<script lang="ts">
	import { resolve } from '$app/paths';
	import MetarDecoder from '$lib/components/MetarDecoder.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<Seo title={`${m.metar_title()} · ${m.app_name()}`} description={m.metar_card_desc()} />

<main class="page fade-in">
	<a class="back" href={resolve('/drills')}>← {m.back()}</a>
	<h1>{m.metar_title()}</h1>
	<p class="lead">{m.metar_lead()}</p>
	<MetarDecoder />
</main>

<style>
	.page {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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
		margin: 0;
	}
</style>
