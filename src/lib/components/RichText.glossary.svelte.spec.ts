import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './RichTextGlossaryHarness.svelte';

describe('RichText glossary integration', () => {
	it('underlines the first abbreviation when glossary is enabled', async () => {
		const screen = render(Harness, { text: 'Odczytaj METAR przed startem.', enabled: true });
		const term = screen.container.querySelector('.glossary-term');
		expect(term?.textContent).toContain('METAR');
		expect(screen.container.textContent).toContain('Odczytaj');
		expect(screen.container.textContent).toContain('przed startem.');
	});

	it('does not underline anything when glossary is disabled', async () => {
		const screen = render(Harness, { text: 'Odczytaj METAR przed startem.', enabled: false });
		expect(screen.container.querySelector('.glossary-term')).toBeNull();
		expect(screen.container.textContent).toContain('METAR');
	});

	it('leaves formula segments untouched', async () => {
		const screen = render(Harness, { text: 'Wzór `C_x` i METAR', enabled: true });
		expect(screen.container.querySelector('.formula .katex')).not.toBeNull();
		expect(screen.container.querySelector('.glossary-term')?.textContent).toContain('METAR');
	});
});
