import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GlossaryTerm from './GlossaryTerm.svelte';

describe('GlossaryTerm', () => {
	it('renders the abbreviation as the visible text', async () => {
		const screen = render(GlossaryTerm, { term: 'METAR', definition: 'depesza pogodowa' });
		const term = screen.container.querySelector('.glossary-term');
		expect(term?.textContent).toContain('METAR');
	});

	it('exposes the definition as an accessible tooltip linked to the term', async () => {
		const screen = render(GlossaryTerm, { term: 'METAR', definition: 'depesza pogodowa' });
		const trigger = screen.container.querySelector('.glossary-term') as HTMLElement;
		const describedBy = trigger.getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
		const tip = screen.container.querySelector(`#${describedBy}`);
		expect(tip?.textContent).toContain('depesza pogodowa');
	});

	it('reveals the tooltip when the term receives focus', async () => {
		const screen = render(GlossaryTerm, { term: 'METAR', definition: 'depesza pogodowa' });
		const trigger = screen.container.querySelector('.glossary-term') as HTMLElement;
		trigger.focus();
		await tick();
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
	});
});
