import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MetarDecoder from './MetarDecoder.svelte';
import { generateMetar } from '$lib/metar/generator';

describe('MetarDecoder', () => {
	it('highlights the first token and renders options for it', async () => {
		const seed = 123;
		const metar = generateMetar(seed);
		const screen = render(MetarDecoder, { seed });
		const current = screen.container.querySelector('.tok.current');
		expect(current?.textContent).toBe(metar.tokens[0].raw);
		expect(screen.container.querySelectorAll('.option').length).toBe(
			metar.tokens[0].options.length
		);
	});

	it('scores all correct when every right option is chosen', async () => {
		const seed = 123;
		const metar = generateMetar(seed);
		const screen = render(MetarDecoder, { seed });
		for (const token of metar.tokens) {
			const options = [...screen.container.querySelectorAll<HTMLButtonElement>('.option')];
			options[token.answerIndex].click();
			await tick();
		}
		const result = screen.container.querySelector('.result');
		expect(result?.textContent).toContain(`${metar.tokens.length}/${metar.tokens.length}`);
		expect(screen.container.querySelector('.review')).not.toBeNull();
	});

	it('shows the correct answer for a wrong pick', async () => {
		const seed = 123;
		const metar = generateMetar(seed);
		const screen = render(MetarDecoder, { seed });
		for (const token of metar.tokens) {
			const wrong = token.answerIndex === 0 ? 1 : 0;
			const options = [...screen.container.querySelectorAll<HTMLButtonElement>('.option')];
			options[wrong].click();
			await tick();
		}
		expect(screen.container.querySelector('.row .right')).not.toBeNull();
	});
});
