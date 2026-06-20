<script lang="ts">
	import { createE6b, type E6bInstance } from '$lib/e6b/computer';
	import { e6b } from '$lib/e6b/state.svelte';
	import { getLocale } from '$lib/paraglide/runtime';

	let container = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!e6b.open || !container) return;
		const instance: E6bInstance = createE6b(container, {
			locale: getLocale() === 'pl' ? 'pl' : 'en'
		});
		return () => instance.destroy();
	});
</script>

<div class="e6b-root" bind:this={container}></div>

<style>
	.e6b-root {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: var(--space-4);
		container-type: inline-size;
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

	.e6b-root :global(.e6b-computer-col) {
		flex: 1 1 300px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.e6b-root :global(.e6b-stage) {
		position: relative;
		width: 100%;
		max-width: 540px;
		margin: 0 auto;
		aspect-ratio: 520 / 760;
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
		max-width: 360px;
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

	/* Narrow pane: the Computer/Results toggle shows one column at a time. The instrument
	   and its usage instructions live together in the computer column. */
	@container (width < 600px) {
		.e6b-root :global(.e6b-layout[data-view='computer'] .e6b-panel) {
			display: none;
		}

		.e6b-root :global(.e6b-layout[data-view='results'] .e6b-computer-col) {
			display: none;
		}

		.e6b-root :global(.e6b-layout[data-view='results'] .e6b-panel) {
			flex: 1 1 100%;
			max-width: none;
		}
	}

	/* Wide pane: instrument (with instructions) and the readout sit side by side. */
	@container (width >= 600px) {
		.e6b-root :global(.e6b-view-toggle) {
			display: none;
		}

		.e6b-root :global(.e6b-layout) {
			flex-wrap: nowrap;
		}

		.e6b-root :global(.e6b-panel) {
			flex: 1 1 240px;
		}
	}
</style>
