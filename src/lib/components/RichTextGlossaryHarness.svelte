<script lang="ts">
	import { untrack } from 'svelte';
	import { setGlossaryEnabled } from '$lib/glossary/context';
	import RichText from './RichText.svelte';

	let { text, enabled, glossary }: { text: string; enabled: boolean; glossary?: boolean } =
		$props();

	setGlossaryEnabled(untrack(() => enabled));
</script>

<RichText {text} {glossary} />
