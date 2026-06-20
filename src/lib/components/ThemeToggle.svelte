<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { theme, type ThemePreference } from '$lib/theme.svelte';

	const order: ThemePreference[] = ['system', 'light', 'dark'];
	const labels: Record<ThemePreference, () => string> = {
		system: m.theme_system,
		light: m.theme_light,
		dark: m.theme_dark
	};

	function cycle() {
		const next = order[(order.indexOf(theme.preference) + 1) % order.length];
		theme.set(next);
	}
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={cycle}
	aria-label={m.theme_label()}
	data-theme-pref={theme.preference}
>
	<span aria-hidden="true">{theme.resolved === 'dark' ? '🌙' : '☀️'}</span>
	<span>{labels[theme.preference]()}</span>
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-2) var(--space-3);
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-primary);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
		transition: transform 0.1s ease;
	}

	.theme-toggle:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}
</style>
