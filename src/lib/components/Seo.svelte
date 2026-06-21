<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { SITE_URL } from '$lib/seo';
	import { m } from '$lib/paraglide/messages.js';

	let { title, description }: { title: string; description: string } = $props();

	const origin = $derived(SITE_URL || page.url.origin);
	const canonical = $derived(origin + page.url.pathname);
	const image = $derived(`${origin}${base}/termika-hero.png`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={m.app_name()} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
