<script lang="ts">
	let {
		pct,
		label
	}: {
		pct: number;
		label: string;
	} = $props();

	const clamped = $derived(Math.min(Math.max(pct, 0), 100));
	const radius = 52;
	const circumference = 2 * Math.PI * radius;
	const dashOffset = $derived(circumference * (1 - clamped / 100));
</script>

<figure class="gauge">
	<div class="dial" role="img" aria-label={`${label}: ${clamped}%`}>
		<svg viewBox="0 0 120 120" width="180" height="180">
			<circle
				class="track"
				cx="60"
				cy="60"
				r={radius}
				fill="none"
				stroke="var(--color-track)"
				stroke-width="14"
			/>
			<circle
				class="value"
				cx="60"
				cy="60"
				r={radius}
				fill="none"
				stroke="var(--color-lift)"
				stroke-width="14"
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={dashOffset}
				transform="rotate(-90 60 60)"
			/>
		</svg>
		<div class="readout">
			<span class="value-text">{clamped}%</span>
		</div>
	</div>
	<figcaption>{label}</figcaption>
</figure>

<style>
	.gauge {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: center;
		margin: 0;
	}

	.dial {
		position: relative;
		display: grid;
		place-items: center;
	}

	.value {
		transition: stroke-dashoffset 700ms ease;
	}

	.readout {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}

	.value-text {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 2.5rem;
		color: var(--color-ink);
	}

	figcaption {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-soft);
		text-align: center;
	}
</style>
