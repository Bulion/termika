<script lang="ts">
	import { untrack } from 'svelte';
	import { generateMetar, type LocalizedText } from '$lib/metar/generator';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { seed }: { seed?: number } = $props();

	const randomSeed = (): number => Math.floor(Math.random() * 2 ** 32);
	let currentSeed = $state(untrack(() => seed) ?? randomSeed());
	let step = $state(0);
	let choices = $state<number[]>([]);

	const metar = $derived(generateMetar(currentSeed));
	const done = $derived(step >= metar.tokens.length);
	const score = $derived(
		metar.tokens.reduce((sum, token, i) => sum + (choices[i] === token.answerIndex ? 1 : 0), 0)
	);

	const t = (text: LocalizedText): string => (getLocale() === 'pl' ? text.pl : text.en);

	function choose(optionIndex: number) {
		choices = [...choices, optionIndex];
		step += 1;
	}
	function restart() {
		currentSeed = randomSeed();
		step = 0;
		choices = [];
	}
</script>

<div class="decoder">
	<p class="metar" aria-label="METAR">
		<span class="ctx">{metar.context}</span>{#each metar.tokens as token, i (i)}
			<span class="tok" class:current={i === step && !done} class:answered={i < step}
				>{token.raw}</span
			>{/each}
	</p>

	{#if !done}
		{#if choices.length > 0}
			<p class="sentence">
				<span class="label">{m.metar_your_sentence()}</span>
				{metar.tokens
					.slice(0, step)
					.map((token, i) => t(token.options[choices[i]]))
					.join('; ')}
			</p>
		{/if}
		<p class="ask">{m.metar_pick()}</p>
		<ul class="options">
			{#each metar.tokens[step].options as option, oi (oi)}
				<li>
					<button type="button" class="option lift" onclick={() => choose(oi)}>{t(option)}</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="result" role="status">
			{m.metar_result({ correct: score, total: metar.tokens.length })}
		</p>
		<p class="verdict">{score === metar.tokens.length ? m.metar_perfect() : m.metar_almost()}</p>
		<ul class="review">
			{#each metar.tokens as token, i (i)}
				<li class="row" class:ok={choices[i] === token.answerIndex}>
					<code>{token.raw}</code>
					<span class="yours">{t(token.options[choices[i]])}</span>
					{#if choices[i] !== token.answerIndex}
						<span class="right">{m.metar_correct_answer()} {t(token.correct)}</span>
					{/if}
				</li>
			{/each}
		</ul>
		<button type="button" class="new lift" onclick={restart}>{m.metar_new()}</button>
	{/if}
</div>

<style>
	.decoder {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.metar {
		margin: 0;
		padding: var(--space-4);
		font-family: var(--font-mono);
		font-size: 1.15rem;
		line-height: 1.8;
		color: #d8d6cc;
		word-spacing: 0.1em;
		background: #16160f;
		border: var(--border-width-sm) solid #efece2;
		border-radius: var(--radius-md);
		overflow-wrap: anywhere;
	}

	.ctx {
		color: #8a8a80;
	}

	.tok {
		margin-left: 0.5ch;
		padding: 0 0.15em;
		border-radius: var(--radius-sm);
	}

	.tok.answered {
		color: #9fd6b4;
	}

	.tok.current {
		color: #16160f;
		background: var(--color-sun);
		font-weight: 700;
	}

	.sentence,
	.ask {
		margin: 0;
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
	}

	.sentence .label {
		font-weight: 700;
		color: var(--color-ink);
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.option {
		width: 100%;
		text-align: left;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-body);
		font-weight: 400;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card-sm);
	}

	.result {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.3rem;
	}

	.verdict {
		margin: 0;
		color: var(--color-ink-soft);
	}

	.review {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
		align-items: baseline;
		padding: var(--space-3) var(--space-4);
		background: var(--color-sink-bg);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	.row.ok {
		background: var(--color-answer);
	}

	.row code {
		font-family: var(--font-mono);
		font-weight: 700;
	}

	.right {
		width: 100%;
		font-size: 0.9rem;
		color: var(--color-ink-soft);
	}

	.new {
		align-self: start;
		padding: var(--space-3) var(--space-5);
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
	}
</style>
