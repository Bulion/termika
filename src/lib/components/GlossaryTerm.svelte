<script lang="ts">
	let { term, definition }: { term: string; definition: string } = $props();

	const tipId = `glossary-${Math.random().toString(36).slice(2, 9)}`;
	let open = $state(false);
	let hovered = $state(false);
	let focused = $state(false);

	const visible = $derived(open || hovered || focused);
</script>

<span class="glossary-wrap">
	<button
		type="button"
		class="glossary-term"
		aria-describedby={tipId}
		aria-expanded={visible}
		onclick={() => (open = !open)}
		onmouseenter={() => (hovered = true)}
		onmouseleave={() => (hovered = false)}
		onfocus={() => (focused = true)}
		onblur={() => {
			focused = false;
			open = false;
		}}
		onkeydown={(event) => {
			if (event.key === 'Escape') open = false;
		}}
	>
		{term}
	</button>
	<span id={tipId} role="tooltip" class="glossary-tip" class:visible aria-hidden={!visible}>
		{definition}
	</span>
</span>

<style>
	.glossary-wrap {
		position: relative;
		display: inline;
	}

	.glossary-term {
		padding: 0;
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		text-decoration: underline dashed;
		text-decoration-thickness: 2px;
		text-underline-offset: 2px;
		text-decoration-color: var(--color-primary);
		cursor: help;
	}

	.glossary-term:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
		border-radius: var(--radius-sm);
	}

	.glossary-tip {
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: 0;
		z-index: 20;
		display: none;
		width: max-content;
		max-width: min(18rem, 80vw);
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 400;
		line-height: 1.4;
		color: var(--color-ink);
		text-align: left;
		white-space: normal;
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-card-sm);
	}

	.glossary-tip.visible {
		display: block;
	}
</style>
