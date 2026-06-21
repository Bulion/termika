<script lang="ts">
	import { untrack } from 'svelte';
	import { setGlossaryEnabled } from '$lib/glossary/context';
	import RichText from './RichText.svelte';

	let { text, enabled }: { text: string; enabled: boolean } = $props();

	setGlossaryEnabled(untrack(() => enabled));
</script>

<RichText {text} />
