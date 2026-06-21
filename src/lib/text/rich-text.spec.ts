import { describe, expect, it } from 'vitest';
import { hasRichMarkup, parseRichText } from './rich-text';

describe('parseRichText', () => {
	it('returns a single normal segment for plain text', () => {
		expect(parseRichText('Prędkość przeciągnięcia')).toEqual([
			{ text: 'Prędkość przeciągnięcia', kind: 'normal' }
		]);
	});

	it('parses a subscript formula symbol', () => {
		expect(parseRichText('V<sub>NE</sub>')).toEqual([
			{ text: 'V', kind: 'normal' },
			{ text: 'NE', kind: 'sub' }
		]);
	});

	it('parses a superscript', () => {
		expect(parseRichText('m/s<sup>2</sup>')).toEqual([
			{ text: 'm/s', kind: 'normal' },
			{ text: '2', kind: 'sup' }
		]);
	});

	it('tolerates malformed spacing in tags', () => {
		expect(parseRichText('V<sub > RA</sub >')).toEqual([
			{ text: 'V', kind: 'normal' },
			{ text: ' RA', kind: 'sub' }
		]);
	});

	it('keeps a literal "<" that is not a tag', () => {
		expect(parseRichText('dla α<0 oraz α>0')).toEqual([
			{ text: 'dla α<0 oraz α>0', kind: 'normal' }
		]);
	});

	it('strips formatting tags but keeps their content', () => {
		expect(parseRichText('a<b>bold</b>c')).toEqual([
			{ text: 'a', kind: 'normal' },
			{ text: 'bold', kind: 'normal' },
			{ text: 'c', kind: 'normal' }
		]);
	});

	it('handles consecutive subscripts', () => {
		expect(parseRichText('C<sub>x</sub> i C<sub>z</sub>')).toEqual([
			{ text: 'C', kind: 'normal' },
			{ text: 'x', kind: 'sub' },
			{ text: ' i C', kind: 'normal' },
			{ text: 'z', kind: 'sub' }
		]);
	});

	it('extracts a formula delimited by backticks', () => {
		expect(parseRichText('Wzór `L = C_L`.')).toEqual([
			{ text: 'Wzór ', kind: 'normal' },
			{ text: 'L = C_L', kind: 'formula' },
			{ text: '.', kind: 'normal' }
		]);
	});

	it('keeps formula content raw and does not tag-parse it', () => {
		expect(parseRichText('`C_{śr}`')).toEqual([{ text: 'C_{śr}', kind: 'formula' }]);
	});

	it('treats an unpaired backtick as a literal character', () => {
		expect(parseRichText('koszt 5 ` netto')).toEqual([{ text: 'koszt 5 ` netto', kind: 'normal' }]);
	});

	it('renders an escaped backtick as a literal backtick in text', () => {
		expect(parseRichText('a \\` b')).toEqual([{ text: 'a ` b', kind: 'normal' }]);
	});
});

describe('hasRichMarkup', () => {
	it('detects sub/sup markup and ignores plain text', () => {
		expect(hasRichMarkup('V<sub>A</sub>')).toBe(true);
		expect(hasRichMarkup('zwykły tekst α<0')).toBe(false);
	});
});
