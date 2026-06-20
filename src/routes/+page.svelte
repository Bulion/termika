<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages.js';
</script>

<main class="home">
	<h1>{m.app_name()}</h1>
	<p class="tagline">{m.tagline()}</p>
	<nav class="links">
		<a class="cta" href={resolve('/study')}>{m.nav_study()}</a>
		<a class="cta cta--alt" href={resolve('/drills')}>{m.nav_drills()}</a>
		<a class="cta cta--alt" href={resolve('/exam')}>{m.nav_exam()}</a>
	</nav>
</main>

<style>
	.home {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: flex-start;
	}

	.tagline {
		font-size: 1.25rem;
		color: var(--color-ink-soft);
		margin: 0;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}

	.cta {
		display: inline-block;
		padding: var(--space-3) var(--space-6);
		font-family: var(--font-display);
		font-size: 1.125rem;
		text-decoration: none;
		color: var(--color-ink);
		background: var(--color-sun);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.cta--alt {
		background: var(--color-sky);
	}
</style>
