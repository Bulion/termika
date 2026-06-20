<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head><title>{m.app_name()}</title></svelte:head>

<main class="home">
	<section class="hero">
		<div class="sky" aria-hidden="true">
			<div class="cloud cloud-1"></div>
			<div class="cloud cloud-2"></div>
			<div class="cloud cloud-3"></div>
			<svg class="glider" viewBox="0 0 96 48" width="120" height="60">
				<path
					d="M6 30 L86 20 L54 34 L26 34 Z M44 26 L50 44 L40 44 Z"
					fill="var(--color-surface)"
					stroke="var(--color-outline)"
					stroke-width="3"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
		<div class="copy">
			<h1>{m.app_name()}</h1>
			<p class="tagline">{m.tagline()}</p>
			<a class="cta" href={resolve('/study')}>{m.nav_study()}</a>
		</div>
	</section>
</main>

<style>
	.home {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.hero {
		display: grid;
		gap: var(--space-6);
	}

	.sky {
		position: relative;
		height: 16rem;
		overflow: hidden;
		background: linear-gradient(to bottom, var(--color-sky), var(--color-bg));
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
	}

	.cloud {
		position: absolute;
		width: 7rem;
		height: 2.5rem;
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: 999px;
		opacity: 0.95;
		animation: drift 28s linear infinite;
	}

	.cloud-1 {
		top: 18%;
		animation-duration: 32s;
	}

	.cloud-2 {
		top: 46%;
		width: 5rem;
		height: 2rem;
		animation-duration: 24s;
		animation-delay: -8s;
	}

	.cloud-3 {
		top: 70%;
		width: 9rem;
		animation-duration: 40s;
		animation-delay: -16s;
	}

	.glider {
		position: absolute;
		left: 50%;
		top: 38%;
		translate: -50% 0;
		animation: soar 6s ease-in-out infinite;
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: flex-start;
	}

	h1 {
		font-size: clamp(2.5rem, 9vw, 4.5rem);
		margin: 0;
	}

	.tagline {
		font-size: clamp(1.1rem, 3vw, 1.5rem);
		color: var(--color-ink-soft);
		margin: 0;
		max-width: 32rem;
	}

	.cta {
		padding: var(--space-3) var(--space-8);
		font-family: var(--font-display);
		font-size: 1.25rem;
		text-decoration: none;
		color: var(--color-ink);
		background: var(--color-sun);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	@keyframes drift {
		from {
			transform: translateX(-12rem);
		}

		to {
			transform: translateX(64rem);
		}
	}

	@keyframes soar {
		0%,
		100% {
			transform: translateY(0) rotate(-3deg);
		}

		50% {
			transform: translateY(-10px) rotate(2deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cloud,
		.glider {
			animation: none;
		}
	}
</style>
