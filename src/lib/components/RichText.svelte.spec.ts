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
});
