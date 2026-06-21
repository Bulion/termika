<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/paraglide/runtime';

	const next = getLocale() === 'pl' ? 'en' : 'pl';

	function switchLanguage() {
		setLocale(next);
	}
</script>

<button
	type="button"
	class="lang-toggle"
	onclick={switchLanguage}
	aria-label={`${m.lang_label()}: ${next.toUpperCase()}`}
>
	{next.toUpperCase()}
</button>

<style>
	.lang-toggle {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color-primary);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
		transition: transform 0.1s ease;
	}

	.lang-toggle:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}
</style>
