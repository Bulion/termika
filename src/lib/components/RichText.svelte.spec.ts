import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RichText from './RichText.svelte';

describe('RichText', () => {
	it('renders a subscript as a <sub> with no spurious whitespace', async () => {
		const screen = render(RichText, { text: 'V<sub>NE</sub>' });
		const sub = screen.container.querySelector('sub');
		expect(sub?.textContent).toBe('NE');
		expect(screen.container.textContent).toBe('VNE');
	});

	it('renders a superscript as a <sup>', async () => {
		const screen = render(RichText, { text: 'm/s<sup>2</sup>' });
		expect(screen.container.querySelector('sup')?.textContent).toBe('2');
	});

	it('leaves a non-tag "<" as plain text', async () => {
		const screen = render(RichText, { text: 'α<0' });
		expect(screen.container.querySelector('sub')).toBeNull();
		expect(screen.container.textContent).toBe('α<0');
	});

	it('renders a backtick formula as a KaTeX chip', async () => {
		const screen = render(RichText, { text: 'Wzór `C_{\\text{śr}}` tu.' });
		const formula = screen.container.querySelector('.formula');
		expect(formula).not.toBeNull();
		expect(formula?.querySelector('.katex')).not.toBeNull();
		expect(screen.container.textContent).toContain('Wzór');
		expect(screen.container.textContent).toContain('tu.');
	});
});
