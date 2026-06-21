import { describe, expect, it, vi } from 'vitest';
import { normalizeTex, renderFormula } from './katex';

describe('normalizeTex', () => {
	it('converts unicode superscripts to TeX exponents', () => {
		expect(normalizeTex('V²')).toBe('V^{2}');
		expect(normalizeTex('a³')).toBe('a^{3}');
	});

	it('converts vulgar fractions and leaves operators and Greek letters native', () => {
		expect(normalizeTex('½ρ')).toBe('\\frac{1}{2}ρ');
		expect(normalizeTex('¼')).toBe('\\frac{1}{4}');
		expect(normalizeTex('¾')).toBe('\\frac{3}{4}');
		expect(normalizeTex('a · b')).toBe('a · b');
	});

	it('leaves explicit TeX untouched', () => {
		expect(normalizeTex('C_{śr} = \\sqrt{n}')).toBe('C_{śr} = \\sqrt{n}');
	});
});

describe('renderFormula', () => {
	it('renders a subscript as a KaTeX span with a subscript group', () => {
		const html = renderFormula('C_{\\text{śr}}');
		expect(html).toContain('class="katex"');
		expect(html).toContain('msupsub');
	});

	it('renders a formula that uses unicode operators and powers', () => {
		const html = renderFormula('L = C_L · ½ρV² · S');
		expect(html).toContain('class="katex"');
	});

	it('falls back to the raw text and reports the error on invalid TeX', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const html = renderFormula('\\frac{1}{');
		expect(html).not.toContain('class="katex"');
		expect(html).toContain('\\frac{1}{');
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('escapes HTML in the fallback so raw text cannot inject markup', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const html = renderFormula('<img> \\frac{1}{');
		expect(html).not.toContain('<img>');
		expect(html).toContain('&lt;img&gt;');
		spy.mockRestore();
	});
});
