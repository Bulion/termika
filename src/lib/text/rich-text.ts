/**
 * A small unifying parser for the inline markup that question banks use:
 *  - Backtick-delimited formulas (e.g. `L = C_L`, `C_{śr}`): the content is raw TeX source,
 *    emitted verbatim as a 'formula' segment for KaTeX to render. Escape a literal backtick
 *    as "\`"; an unpaired backtick is treated as an ordinary character.
 *  - HTML <sub>/<sup> tags (e.g. V<sub>NE</sub>), tolerant of malformed spacing like "<sub >".
 *    Other inline formatting tags (b/i/strong/em/br) are stripped, their content kept.
 * A literal "<" that is not a tag (e.g. "α<0") is preserved as text. Output is a token list
 * rendered with real <sub>/<sup> elements (no raw HTML) plus formula segments.
 */
export type RichKind = 'normal' | 'sub' | 'sup' | 'formula';

export interface RichSegment {
	text: string;
	kind: RichKind;
}

const TAG = /<\s*(\/?)\s*(sub|sup|b|i|strong|em|br)\s*\/?\s*>/gi;

interface Chunk {
	formula: boolean;
	text: string;
}

function tokenizeBackticks(input: string): Chunk[] {
	const chunks: Chunk[] = [];
	let buffer = '';
	let inFormula = false;

	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		if (char === '\\' && input[i + 1] === '`') {
			buffer += '`';
			i++;
			continue;
		}
		if (char === '`') {
			chunks.push({ formula: inFormula, text: buffer });
			buffer = '';
			inFormula = !inFormula;
			continue;
		}
		buffer += char;
	}

	if (inFormula) {
		const openedText = chunks.pop()?.text ?? '';
		chunks.push({ formula: false, text: openedText + '`' + buffer });
	} else {
		chunks.push({ formula: false, text: buffer });
	}
	return chunks;
}

function appendTextSegments(input: string, segments: RichSegment[]): void {
	let kind: RichKind = 'normal';
	let last = 0;
	let match: RegExpExecArray | null;

	const push = (text: string) => {
		if (text) segments.push({ text, kind });
	};

	TAG.lastIndex = 0;
	while ((match = TAG.exec(input)) !== null) {
		push(input.slice(last, match.index));
		last = TAG.lastIndex;
		const closing = match[1] === '/';
		const tag = match[2].toLowerCase();
		if (tag === 'sub' || tag === 'sup') kind = closing ? 'normal' : tag;
		// b/i/strong/em/br carry no semantics here: drop the tag, keep surrounding text.
	}
	push(input.slice(last));
}

export function parseRichText(input: string): RichSegment[] {
	const segments: RichSegment[] = [];
	for (const chunk of tokenizeBackticks(input)) {
		if (chunk.formula) {
			if (chunk.text) segments.push({ text: chunk.text, kind: 'formula' });
		} else {
			appendTextSegments(chunk.text, segments);
		}
	}
	return segments;
}

/** True when the text contains inline formula markup worth parsing. */
export function hasRichMarkup(input: string): boolean {
	return input.includes('`') || /<\s*\/?\s*(sub|sup|b|i|strong|em|br)\s*\/?\s*>/i.test(input);
}
