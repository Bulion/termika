<script lang="ts">
	let {
		pct,
		label
	}: {
		pct: number;
		label: string;
	} = $props();

	const clamped = $derived(Math.min(Math.max(pct, 0), 100));
</script>

<figure class="gauge">
	<div class="track" role="img" aria-label={`${label}: ${clamped}%`}>
		<div class="fill" style:height={`${clamped}%`}></div>
		<div class="glider" style:bottom={`calc(${clamped}% - 0.9rem)`} aria-hidden="true">
			<svg viewBox="0 0 48 24" width="40" height="20">
				<path
					d="M3 14 L42 9 L27 16 L13 16 Z M23 12 L26 21 L21 21 Z"
					fill="var(--color-surface)"
					stroke="var(--color-outline)"
					stroke-width="2"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
	</div>
	<figcaption>
		<span class="value">{clamped}%</span>
		<span class="label">{label}</span>
	</figcaption>
</figure>

<style>
	.gauge {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		margin: 0;
	}

	.track {
		position: relative;
		width: 3.5rem;
		height: 16rem;
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.fill {
		position: absolute;
		inset: auto 0 0;
		background: linear-gradient(to top, var(--color-lift), var(--color-sky));
		transition: height 600ms ease;
	}

	.glider {
		position: absolute;
		left: 50%;
		translate: -50% 0;
		transition: bottom 600ms ease;
	}

	figcaption {
		display: flex;
		flex-direction: column;
	}

	.value {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 8vw, 3.5rem);
		line-height: 1;
	}

	.label {
		color: var(--color-ink-soft);
	}
</style>
