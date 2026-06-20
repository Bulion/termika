<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { theme } from '$lib/theme.svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();
		document.documentElement.lang = getLocale();
	});

	const links = [
		{ href: resolve('/study'), label: m.nav_study },
		{ href: resolve('/drills'), label: m.nav_drills },
		{ href: resolve('/exam'), label: m.nav_exam },
		{ href: resolve('/dashboard'), label: m.nav_dashboard }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<a class="skip-link" href="#main">{m.nav_home()}</a>

<header class="app-header">
	<a class="brand" href={resolve('/')}>{m.app_name()}</a>
	<nav class="nav" aria-label={m.app_name()}>
		{#each links as link (link.href)}
			<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
				{link.label()}
			</a>
		{/each}
	</nav>
	<div class="controls">
		<LangToggle />
		<ThemeToggle />
	</div>
</header>

<div id="main">
	{@render children()}
</div>

<style>
	.skip-link {
		position: absolute;
		left: -999px;
	}

	.skip-link:focus {
		left: var(--space-2);
		top: var(--space-2);
		z-index: 10;
		padding: var(--space-2);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-sm);
	}

	.app-header {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-bottom: 4px solid var(--color-outline);
		background: var(--color-surface);
	}

	.brand {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--color-primary);
		text-decoration: none;
	}

	.nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
		margin-right: auto;
	}

	.nav a {
		color: var(--color-ink-soft);
		font-family: var(--font-display);
		font-weight: 700;
		text-decoration: none;
		padding: var(--space-1) var(--space-3);
		border: var(--border-width-sm) solid transparent;
		border-radius: var(--radius-pill);
	}

	.nav a[aria-current='page'] {
		color: var(--color-on-accent);
		background: var(--color-sky);
		border-color: var(--color-outline);
	}

	.controls {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}
</style>
