<script lang="ts">
	import { setGlossaryEnabled } from '$lib/glossary/context';

	let { children } = $props();

	setGlossaryEnabled(true);
</script>

{@render children()}
