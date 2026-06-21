import katex from 'katex';

const SUPERSCRIPTS: Record<string, string> = { '²': '^{2}', '³': '^{3}', '¹': '^{1}' };
const FRACTIONS: Record<string, string> = {
	'½': '\\frac{1}{2}',
	'¼': '\\frac{1}{4}',
	'¾': '\\frac{3}{4}',
	'⅓': '\\frac{1}{3}',
	'⅔': '\\frac{2}{3}'
};

/**
 * Map the handful of Unicode characters our question banks use that KaTeX cannot render on its
 * own (superscript digits and vulgar fractions lack glyph metrics; a bare √ would not span its
 * argument) onto TeX. Operators like ·, ×, ÷, −, ° and Greek letters render natively, so they
 * pass through untouched. Explicit TeX in the source is left as-is.
 */
export function normalizeTex(input: string): string {
	let out = '';
	for (const char of input) {
		out += SUPERSCRIPTS[char] ?? FRACTIONS[char] ?? char;
	}
	return out;
}

function escapeHtml(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Render a formula's TeX source to a KaTeX HTML string. The source comes from our own validated
 * JSON content, never from users. On a TeX parse error we report it and fall back to the raw text
 * (HTML-escaped) so the surrounding UI never breaks.
 */
export function renderFormula(tex: string): string {
	try {
		return katex.renderToString(normalizeTex(tex), {
			throwOnError: true,
			displayMode: false,
			strict: false,
			output: 'html'
		});
	} catch (error) {
		console.error(`Failed to render formula ${JSON.stringify(tex)}:`, error);
		return escapeHtml(tex);
	}
}
