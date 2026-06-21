<script lang="ts">
	import { parseRichText } from '$lib/text/rich-text';
	import { renderFormula } from '$lib/text/katex';

	let { text }: { text: string } = $props();

	const segments = $derived(parseRichText(text));
</script>

{#each segments as seg, i (i)}{#if seg.kind === 'sub'}<sub>{seg.text}</sub
		>{:else if seg.kind === 'sup'}<sup>{seg.text}</sup>{:else if seg.kind === 'formula'}<span
			class="formula">{@html renderFormula(seg.text)}</span
		>{:else}{seg.text}{/if}{/each}

<style>
	.formula {
		display: inline-block;
		max-width: 100%;
		overflow-x: auto;
		vertical-align: bottom;
		padding: 0.1em var(--space-1);
		border: var(--border-width-sm) solid var(--color-formula-border);
		border-radius: var(--radius-sm);
		background: var(--color-formula-bg);
		color: var(--color-formula-ink);
		white-space: nowrap;
	}
</style>
