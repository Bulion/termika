<script lang="ts">
	let {
		pct,
		label
	}: {
		pct: number;
		label: string;
	} = $props();

	const clamped = $derived(Math.min(Math.max(pct, 0), 100));
	// Map 0..100% to a -90deg..+90deg needle sweep; starts at -90 then animates to target.
	const target = $derived(-90 + (clamped / 100) * 180);
	// Intentionally not a writable $derived: the needle renders at -90 first, then the
	// effect drives it to the target so the CSS transition sweeps the dial on load.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let rotation = $state(-90);

	$effect(() => {
		rotation = target;
	});
</script>

<figure class="vario">
	<div class="dial" role="img" aria-label={`${label}: ${clamped}%`}>
		<div class="ticks" aria-hidden="true"></div>
		<div class="placard">
			<span class="placard-label">{label}</span>
			<span class="placard-value">{clamped}%</span>
		</div>
		<div class="needle variometer-needle" style:transform={`rotate(${rotation}deg)`}></div>
	</div>
</figure>

<style>
	.vario {
		display: flex;
		justify-content: center;
		margin: 0;
	}

	.dial {
		position: relative;
		width: min(16rem, 72vw);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		background: var(--color-surface-2);
		border: 6px solid var(--color-outline);
		border-radius: 50%;
		box-shadow: inset 0 4px 12px rgb(0 0 0 / 12%);
	}

	.ticks {
		position: absolute;
		inset: 0.5rem;
		border: 12px dashed var(--color-outline);
		border-radius: 50%;
		opacity: 0.2;
	}

	.placard {
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card-sm);
	}

	.placard-label {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
	}

	.placard-value {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 2rem;
		color: var(--color-primary);
	}

	.needle {
		position: absolute;
		bottom: 50%;
		left: 50%;
		z-index: 1;
		width: 0.6rem;
		height: 38%;
		margin-left: -0.3rem;
		background: var(--color-sink);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: 0.3rem 0.3rem 0 0;
	}
</style>
