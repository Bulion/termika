<script lang="ts">
	import E6bComputer from '$lib/components/E6bComputer.svelte';
	import { e6b, openE6b, closeE6b } from '$lib/e6b/state.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape') closeE6b();
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- The computer is a fluid pane of the page: on a wide window it shares the row with the
     questions, on a narrow one it stacks below. Both reflow with the window size. -->
<div class="shell" class:split={e6b.open}>
	<div class="pane content-pane">
		{@render children()}
	</div>

	{#if e6b.open}
		<section class="pane computer-pane" aria-label={m.e6b_title()}>
			<header class="bar">
				<span class="bar-title">{m.e6b_title()}</span>
				<button type="button" class="close" onclick={closeE6b} aria-label={m.e6b_close()}>✕</button>
			</header>
			<E6bComputer />
		</section>
	{/if}
</div>

{#if !e6b.open}
	<button type="button" class="fab" onclick={openE6b} aria-label={m.e6b_card_title()}>
		<span aria-hidden="true">E6B</span>
	</button>
{/if}

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.pane {
		min-width: 0;
	}

	.computer-pane {
		display: flex;
		flex-direction: column;
		min-height: 0;
		border-top: var(--border-width) solid var(--color-outline);
		background: var(--color-bg);
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: none;
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg);
		border-bottom: var(--border-width-sm) solid var(--color-outline);
	}

	.bar-title {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.05rem;
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

	/* Wide window: questions and computer share the row, each scrolling independently. */
	@media (width >= 860px) {
		.shell.split {
			flex-direction: row;
			align-items: stretch;
			height: calc(100dvh - var(--header-height, 60px));
		}

		.shell.split .pane {
			flex: 1 1 0;
			overflow: auto;
		}

		.shell.split .computer-pane {
			overflow: hidden;
			border-top: none;
			border-left: var(--border-width) solid var(--color-outline);
		}
	}

	.fab {
		position: fixed;
		right: var(--space-4);
		bottom: var(--space-4);
		z-index: 40;
		display: grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.85rem;
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
		transition: transform 0.1s ease;
	}

	@media (hover: hover) {
		.fab:hover {
			transform: translateY(-2px);
		}
	}

	.fab:active {
		transform: translate(3px, 3px);
		box-shadow: none;
	}
</style>
