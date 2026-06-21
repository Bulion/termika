<script lang="ts">
	import { base, resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import { m } from '$lib/paraglide/messages.js';

	const features = [
		{ key: 'met', title: m.feat_met, desc: m.feat_met_desc, accent: false },
		{ key: 'aero', title: m.feat_aero, desc: m.feat_aero_desc, accent: true },
		{ key: 'nav', title: m.feat_nav, desc: m.feat_nav_desc, accent: false }
	];
</script>

<Seo title={`${m.app_name()} - ${m.tagline()}`} description={m.seo_desc_home()} />

<main class="home fade-in">
	<section class="hero">
		<div class="copy">
			<span class="eyebrow">{m.hero_eyebrow()}</span>
			<h1>{m.hero_title()} <span class="accent">{m.app_name()}</span></h1>
			<p class="tagline">{m.tagline()}</p>
			<div class="actions">
				<a class="btn btn--primary" href={resolve('/study')}>{m.hero_cta_primary()}</a>
				<a class="btn btn--ghost" href={resolve('/drills')}>{m.hero_cta_secondary()}</a>
			</div>
		</div>

		<picture class="art">
			<source srcset={`${base}/termika-hero.webp`} type="image/webp" />
			<img
				src={`${base}/termika-hero.jpg`}
				alt={m.hero_art_alt()}
				width="1200"
				height="1200"
				fetchpriority="high"
			/>
		</picture>
	</section>

	<section class="learn">
		<h2>{m.learn_heading()}</h2>
		<div class="cards">
			{#each features as feature (feature.key)}
				<article class="feature" class:feature--accent={feature.accent}>
					<span class="badge" aria-hidden="true"></span>
					<h3>{feature.title()}</h3>
					<p>{feature.desc()}</p>
				</article>
			{/each}
		</div>
	</section>
</main>

<style>
	.home {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.hero {
		display: grid;
		gap: var(--space-6);
		align-items: center;
	}

	@media (width >= 48rem) {
		.hero {
			grid-template-columns: 1.1fr 0.9fr;
			gap: var(--space-8);
		}
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: flex-start;
	}

	.eyebrow {
		padding: var(--space-1) var(--space-3);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-primary);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	h1 {
		font-size: clamp(2.25rem, 7vw, 3.75rem);
		margin: 0;
	}

	.accent {
		color: var(--color-primary);
	}

	.tagline {
		font-size: clamp(1.05rem, 2.5vw, 1.35rem);
		color: var(--color-ink-soft);
		margin: 0;
		max-width: 30rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.btn {
		padding: var(--space-3) var(--space-6);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.05rem;
		text-decoration: none;
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
		transition: transform 0.1s ease;
	}

	@media (hover: hover) {
		.btn:hover {
			transform: translateY(-2px);
		}
	}

	.btn:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}

	.btn--primary {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.btn--ghost {
		color: var(--color-ink);
		background: var(--color-surface);
	}

	.art {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.art img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.learn {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		align-items: center;
		text-align: center;
	}

	.cards {
		display: grid;
		gap: var(--space-4);
		width: 100%;
		grid-template-columns: 1fr;
	}

	@media (width >= 48rem) {
		.cards {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.feature {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		text-align: left;
		padding: var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.feature--accent {
		background: var(--color-sun);
		color: var(--color-on-accent);
	}

	.feature--accent p {
		color: var(--color-on-accent);
	}

	.badge {
		width: 3rem;
		height: 3rem;
		background: var(--color-sky);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.feature--accent .badge {
		background: var(--color-surface);
	}

	.feature h3 {
		margin: var(--space-2) 0 0;
		font-size: 1.25rem;
	}

	.feature p {
		margin: 0;
		color: var(--color-ink-soft);
	}
</style>
