<script lang="ts">
	import { parseRichText } from '$lib/text/rich-text';

	let { text }: { text: string } = $props();

	const segments = $derived(parseRichText(text));
</script>

{#each segments as seg, i (i)}{#if seg.kind === 'sub'}<sub>{seg.text}</sub
		>{:else if seg.kind === 'sup'}<sup>{seg.text}</sup>{:else}{seg.text}{/if}{/each}
