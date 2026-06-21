<script lang="ts">
	const URL = 'https://buymeacoffee.com/dawidsliwas';
</script>

<a
	class="bmc-link"
	href={URL}
	target="_blank"
	rel="noopener noreferrer"
	aria-label="Buy me a coffee"
	title="Buy me a coffee"
>
	<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
		<path
			fill="currentColor"
			d="M4 3h13a1 1 0 0 1 1 1v1h1.5a3.5 3.5 0 0 1 0 7H18v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V3Zm14 7h1.5a1.5 1.5 0 0 0 0-3H18v3ZM3 20h16a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2Z"
		/>
	</svg>
</a>

<style>
	.bmc-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		color: var(--color-primary);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card-sm);
		transition: transform 0.1s ease;
	}

	.bmc-link:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}
</style>
