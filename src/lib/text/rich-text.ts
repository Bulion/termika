/**
 * A small unifying parser for the inline "formula" markup that scraped question banks use:
 * HTML <sub>/<sup> tags (e.g. V<sub>NE</sub>, C<sub>x</sub>), tolerant of malformed spacing
 * like "<sub >". Other inline formatting tags (b/i/strong/em/br) are stripped, their content
 * kept. A literal "<" that is not a tag (e.g. "α<0") is preserved as text. Output is a token
 * list rendered with real <sub>/<sup> elements, so no raw HTML is injected.
 */
export type RichKind = 'normal' | 'sub' | 'sup';

export interface RichSegment {
	text: string;
	kind: RichKind;
}

const TAG = /<\s*(\/?)\s*(sub|sup|b|i|strong|em|br)\s*\/?\s*>/gi;

export function parseRichText(input: string): RichSegment[] {
	const segments: RichSegment[] = [];
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
	return segments;
}

/** True when the text contains inline formula markup worth parsing. */
export function hasRichMarkup(input: string): boolean {
	return /<\s*\/?\s*(sub|sup|b|i|strong|em|br)\s*\/?\s*>/i.test(input);
}
