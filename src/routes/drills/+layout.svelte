<script lang="ts">
	import E6bDrawer from '$lib/components/E6bDrawer.svelte';
	import { e6b, openE6b } from '$lib/e6b/state.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();
</script>

<!-- On wide landscape the open computer docks on the right and pushes this content left;
     on narrow screens the drawer slides over from the right instead. -->
<div class="e6b-content" class:docked={e6b.open}>
	{@render children()}
</div>

{#if !e6b.open}
	<button type="button" class="fab" onclick={openE6b} aria-label={m.e6b_card_title()}>
		<span aria-hidden="true">E6B</span>
	</button>
{/if}

<E6bDrawer />

<style>
	.e6b-content {
		transition: padding-right 0.22s ease;
	}

	@media (orientation: landscape) and (width >= 900px) {
		.e6b-content.docked {
			padding-right: 440px;
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
