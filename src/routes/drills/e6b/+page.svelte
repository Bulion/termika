<script lang="ts">
	import { resolve } from '$app/paths';
	import { magneticToCompass, trueToMagnetic } from '$lib/nav/headings';
	import { solveWindTriangle } from '$lib/nav/wind';
	import { m } from '$lib/paraglide/messages.js';

	type Sign = 'E' | 'W';
	const signed = (magnitude: number, sign: Sign): number => (sign === 'W' ? magnitude : -magnitude);
	const round = (value: number): number => Math.round(value);

	let trueHeading = $state(120);
	let variation = $state(5);
	let variationSign = $state<Sign>('E');
	let deviation = $state(2);
	let deviationSign = $state<Sign>('W');

	const magneticHeading = $derived(trueToMagnetic(trueHeading, signed(variation, variationSign)));
	const compassHeading = $derived(
		magneticToCompass(magneticHeading, signed(deviation, deviationSign))
	);

	let tas = $state(95);
	let trueCourse = $state(90);
	let windDirection = $state(180);
	let windSpeed = $state(15);

	const wind = $derived.by(() => {
		try {
			return solveWindTriangle(tas, trueCourse, windDirection, windSpeed);
		} catch {
			return null;
		}
	});
</script>

<svelte:head><title>{m.e6b_title()} · {m.app_name()}</title></svelte:head>

<main class="e6b fade-in">
	<header>
		<a class="back" href={resolve('/drills')}>← {m.back()}</a>
		<h1>{m.e6b_title()}</h1>
		<p class="lead">{m.e6b_lead()}</p>
	</header>

	<section class="tool">
		<h2>{m.e6b_headings()}</h2>
		<div class="inputs">
			<label class="field">
				<span>{m.e6b_true_heading()}</span>
				<input type="number" min="0" max="359" bind:value={trueHeading} />
			</label>
			<label class="field">
				<span>{m.e6b_variation()}</span>
				<div class="combo">
					<input type="number" min="0" max="30" bind:value={variation} />
					<select bind:value={variationSign}>
						<option value="E">E</option>
						<option value="W">W</option>
					</select>
				</div>
			</label>
			<label class="field">
				<span>{m.e6b_deviation()}</span>
				<div class="combo">
					<input type="number" min="0" max="30" bind:value={deviation} />
					<select bind:value={deviationSign}>
						<option value="E">E</option>
						<option value="W">W</option>
					</select>
				</div>
			</label>
		</div>
		<div class="outputs">
			<div class="readout">
				<span class="readout-label">{m.e6b_magnetic_heading()}</span>
				<span class="readout-value">{round(magneticHeading)}°</span>
			</div>
			<div class="readout">
				<span class="readout-label">{m.e6b_compass_heading()}</span>
				<span class="readout-value">{round(compassHeading)}°</span>
			</div>
		</div>
		<p class="note">{m.e6b_headings_note()}</p>
	</section>

	<section class="tool">
		<h2>{m.e6b_wind()}</h2>
		<div class="inputs">
			<label class="field">
				<span>{m.e6b_tas()}</span>
				<input type="number" min="1" max="500" bind:value={tas} />
			</label>
			<label class="field">
				<span>{m.e6b_course()}</span>
				<input type="number" min="0" max="359" bind:value={trueCourse} />
			</label>
			<label class="field">
				<span>{m.e6b_wind_dir()}</span>
				<input type="number" min="0" max="359" bind:value={windDirection} />
			</label>
			<label class="field">
				<span>{m.e6b_wind_speed()}</span>
				<input type="number" min="0" max="200" bind:value={windSpeed} />
			</label>
		</div>
		{#if wind}
			<div class="outputs">
				<div class="readout">
					<span class="readout-label">{m.e6b_wca()}</span>
					<span class="readout-value"
						>{wind.windCorrectionAngle >= 0 ? '+' : ''}{round(wind.windCorrectionAngle)}°</span
					>
				</div>
				<div class="readout">
					<span class="readout-label">{m.e6b_heading_to_fly()}</span>
					<span class="readout-value">{round(wind.trueHeading)}°</span>
				</div>
				<div class="readout">
					<span class="readout-label">{m.e6b_ground_speed()}</span>
					<span class="readout-value">{round(wind.groundSpeed)} kt</span>
				</div>
			</div>
		{:else}
			<p class="note error">{m.e6b_wind_error()}</p>
		{/if}
	</section>
</main>

<style>
	.e6b {
		max-width: 44rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
	}

	.back {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-primary);
		text-decoration: none;
	}

	.back:hover {
		text-decoration: underline;
	}

	.lead {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		margin: 0;
	}

	.tool {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.tool h2 {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.35rem;
		margin: 0;
	}

	.inputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-ink-soft);
	}

	.combo {
		display: flex;
		gap: var(--space-2);
	}

	.field input,
	.field select {
		font-family: var(--font-mono);
		font-size: 1.1rem;
		padding: var(--space-2) var(--space-3);
		color: var(--color-ink);
		background: var(--color-bg);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.field input {
		width: 100%;
	}

	.field select {
		flex: none;
	}

	.outputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: var(--space-3);
	}

	.readout {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4);
		text-align: center;
		background: var(--color-surface-2);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.readout-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-soft);
	}

	.readout-value {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 1.6rem;
		color: var(--color-primary);
	}

	.note {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-ink-soft);
	}

	.note.error {
		color: var(--color-sink);
	}
</style>
