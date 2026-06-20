<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { openE6b } from '$lib/e6b/state.svelte';
	import { m } from '$lib/paraglide/messages.js';

	onMount(openE6b);
</script>

<svelte:head><title>{m.e6b_title()} · {m.app_name()}</title></svelte:head>

<main class="page fade-in">
	<a class="back" href={resolve('/drills')}>← {m.back()}</a>
	<h1>{m.e6b_title()}</h1>
	<p class="lead">{m.e6b_lead()}</p>
	<button type="button" class="open" onclick={openE6b}>{m.e6b_open()}</button>
</main>

<style>
	.page {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}

	.open {
		padding: var(--space-3) var(--space-8);
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
	}
</style>
