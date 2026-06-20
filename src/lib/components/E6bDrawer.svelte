<script lang="ts">
	import { createE6b, type E6bInstance } from '$lib/e6b/computer';
	import { e6b, closeE6b } from '$lib/e6b/state.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let container = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!e6b.open || !container) return;
		const instance: E6bInstance = createE6b(container, {
			locale: getLocale() === 'pl' ? 'pl' : 'en'
		});
		document.body.style.overflow = 'hidden';
		return () => {
			instance.destroy();
			document.body.style.overflow = '';
		};
	});

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape') closeE6b();
	}
</script>

<svelte:window onkeydown={onKey} />

{#if e6b.open}
	<div
		class="backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeE6b();
		}}
	>
		<div class="drawer" role="dialog" aria-modal="true" aria-label={m.e6b_title()}>
			<header class="head">
				<span class="title">{m.e6b_title()}</span>
				<button type="button" class="close" onclick={closeE6b} aria-label={m.e6b_close()}>✕</button>
			</header>
			<div class="e6b-root" bind:this={container}></div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		justify-content: center;
		align-items: stretch;
		padding: var(--space-3);
		background: color-mix(in srgb, var(--color-ink) 55%, transparent);
		backdrop-filter: blur(2px);
	}

	.drawer {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 920px;
		margin: 0 auto;
		background: var(--color-bg);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: none;
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--border-width-sm) solid var(--color-outline);
	}

	.title {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.1rem;
	}

	.close {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.1rem;
		color: var(--color-ink);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.e6b-root {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: var(--space-4);
		-webkit-overflow-scrolling: touch;
	}

	/* Imperatively-built widget DOM: styled globally but scoped under .e6b-root. */
	.e6b-root :global(.e6b-toolbar) {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-2);
	}

	.e6b-root :global(.e6b-toolbar button) {
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		font-size: 0.85rem;
		color: var(--color-ink);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.e6b-root :global(.e6b-toolbar button.active) {
		color: var(--color-on-accent);
		background: var(--color-lift);
		border-color: var(--color-lift);
	}

	.e6b-root :global(.e6b-toolbar button.warn) {
		background: var(--color-sink-bg);
		color: var(--color-on-sink);
	}

	.e6b-root :global(.e6b-modebar) {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-3);
	}

	.e6b-root :global(.e6b-modebar label) {
		display: inline-flex;
		gap: var(--space-2);
		align-items: center;
		min-height: 40px;
		padding: var(--space-1) var(--space-3);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-ink-soft);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.e6b-root :global(.e6b-modebar input) {
		accent-color: var(--color-lift);
	}

	.e6b-root :global(.e6b-sub) {
		margin: 0 0 var(--space-4);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-align: center;
		color: var(--color-ink-soft);
	}

	.e6b-root :global(.e6b-view-toggle) {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		margin-bottom: var(--space-4);
	}

	.e6b-root :global(.e6b-view-toggle button) {
		min-height: 44px;
		padding: var(--space-2) var(--space-5);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--color-ink);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.e6b-root :global(.e6b-view-toggle button.active) {
		color: var(--color-on-accent);
		background: var(--color-sky);
		border-color: var(--color-sky);
	}

	.e6b-root :global(.e6b-layout) {
		display: flex;
		gap: var(--space-5);
		flex-wrap: wrap;
		justify-content: center;
		align-items: flex-start;
	}

	.e6b-root :global(.e6b-stage) {
		position: relative;
		width: 100%;
		max-width: 560px;
		margin: 0 auto;
		aspect-ratio: 520 / 760;
		flex: 1 1 320px;
		touch-action: none;
	}

	.e6b-root :global(.e6b-face) {
		position: absolute;
		inset: 0;
		display: none;
	}

	.e6b-root :global(.e6b-face.show) {
		display: block;
	}

	.e6b-root :global(.e6b-face svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.e6b-root :global(.e6b-grab) {
		cursor: grab;
	}

	.e6b-root :global(.e6b-panel) {
		flex: 1 1 260px;
		min-width: 240px;
		max-width: 340px;
	}

	.e6b-root :global(.e6b-card) {
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-3);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.e6b-root :global(.e6b-card h3) {
		margin: 0 0 var(--space-3);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-ink);
	}

	.e6b-root :global(.e6b-inrow) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		font-size: 0.85rem;
		color: var(--color-ink-soft);
	}

	.e6b-root :global(.e6b-inrow input),
	.e6b-root :global(.e6b-select) {
		min-height: 40px;
		width: 5.5rem;
		padding: var(--space-2);
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--color-ink);
		background: var(--color-bg);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-sm);
	}

	.e6b-root :global(.e6b-select) {
		flex: 1;
		width: auto;
	}

	.e6b-root :global(.e6b-results b) {
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--color-primary);
	}

	.e6b-root :global(.e6b-step) {
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-3);
		font-size: 0.8rem;
		line-height: 1.55;
		color: var(--color-ink-soft);
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.e6b-root :global(.e6b-step b) {
		color: var(--color-ink);
	}

	.e6b-root :global(.e6b-step ol) {
		margin: var(--space-2) 0 0;
		padding-left: var(--space-5);
	}

	.e6b-root :global(.e6b-step li) {
		margin-bottom: var(--space-1);
	}

	.e6b-root :global(.e6b-auto) {
		margin-top: var(--space-2);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-lift);
	}

	.e6b-root :global(.e6b-ok) {
		color: var(--color-lift);
	}

	.e6b-root :global(.e6b-warn-text) {
		color: var(--color-sink);
	}

	.e6b-root :global(.e6b-solve-btn) {
		width: 100%;
		min-height: 44px;
		margin-top: var(--space-2);
		font-weight: 700;
		color: var(--color-on-accent);
		background: var(--color-lift);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.e6b-root :global(.e6b-mathout) {
		font-size: 0.85rem;
		color: var(--color-ink-soft);
		line-height: 1.6;
	}

	/* Narrow screens: one pane at a time, switched by the toggle. */
	@media (width < 1000px) {
		.e6b-root :global(.e6b-layout[data-view='computer'] .e6b-panel) {
			display: none;
		}

		.e6b-root :global(.e6b-layout[data-view='results'] .e6b-stage) {
			display: none;
		}

		.e6b-root :global(.e6b-layout[data-view='results'] .e6b-panel) {
			flex: 1 1 100%;
			max-width: 460px;
		}
	}

	/* Landscape with one pane: size the instrument to the height so it fits without scrolling. */
	@media (width < 1000px) and (orientation: landscape) {
		.e6b-root :global(.e6b-layout[data-view='computer'] .e6b-stage) {
			width: auto;
			max-width: none;
			height: min(82dvh, 720px);
		}
	}

	/* Wide screens: show both panes side by side; the toggle is unnecessary. */
	@media (width >= 1000px) {
		.e6b-root :global(.e6b-view-toggle) {
			display: none;
		}

		.e6b-root :global(.e6b-layout) {
			flex-wrap: nowrap;
			align-items: flex-start;
		}

		.e6b-root :global(.e6b-stage) {
			flex: 0 0 auto;
			width: auto;
			max-width: none;
			height: min(82dvh, 760px);
		}
	}
</style>
