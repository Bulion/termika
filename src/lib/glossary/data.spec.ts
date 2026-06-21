import { describe, expect, it } from 'vitest';
import { buildGlossary, entryMatchesQuery, findGlossaryMatches, glossaryGroups } from './data';

describe('buildGlossary', () => {
	it('maps an abbreviation to its plain-language explanation (hint)', () => {
		expect(buildGlossary('pl').get('METAR')).toBe('rutynowa depesza pogodowa lotniska');
	});

	it('gives every token a non-empty definition (hint or expansion fallback)', () => {
		for (const [token, def] of buildGlossary('pl')) {
			expect(token.length, token).toBeGreaterThan(0);
			expect(def.length, token).toBeGreaterThan(0);
		}
	});

	it('resolves English definitions for the en locale', () => {
		expect(buildGlossary('en').get('METAR')).toBe('routine aerodrome weather report');
	});
});

describe('findGlossaryMatches', () => {
	it('splits text around recognised abbreviations', () => {
		const parts = findGlossaryMatches('Odczytaj METAR, potem leć VFR.', 'pl');
		expect(parts).toEqual([
			'Odczytaj ',
			{ term: 'METAR', definition: 'rutynowa depesza pogodowa lotniska' },
			', potem leć ',
			{ term: 'VFR', definition: expect.any(String) },
			'.'
		]);
	});

	it('matches whole words only, not abbreviations embedded in a word', () => {
		expect(findGlossaryMatches('METARowy zapis', 'pl')).toEqual(['METARowy zapis']);
	});

	it('is case sensitive', () => {
		expect(findGlossaryMatches('lot vfr nocą', 'pl')).toEqual(['lot vfr nocą']);
	});

	it('underlines only the first occurrence of a term', () => {
		const parts = findGlossaryMatches('METAR i jeszcze raz METAR', 'pl');
		expect(parts).toEqual([
			{ term: 'METAR', definition: 'rutynowa depesza pogodowa lotniska' },
			' i jeszcze raz METAR'
		]);
	});

	it('returns plain text untouched when there is no term', () => {
		expect(findGlossaryMatches('zwykłe zdanie bez skrótów', 'pl')).toEqual([
			'zwykłe zdanie bez skrótów'
		]);
	});
});

describe('glossaryGroups', () => {
	it('returns abbreviation and METAR groups with non-empty entries', () => {
		const groups = glossaryGroups('pl');
		const abbr = groups.find((g) => g.id === 'abbreviations');
		const metar = groups.find((g) => g.id === 'metar');
		expect(abbr?.entries.length).toBeGreaterThan(0);
		expect(metar?.entries.length).toBeGreaterThan(0);
		expect(abbr?.entries.every((e) => e.term && e.expansion)).toBe(true);
	});
});

describe('entryMatchesQuery', () => {
	const entry = {
		term: 'METAR',
		expansion: 'Meteorological Aerodrome Report',
		explanation: 'depesza pogodowa'
	};

	it('matches the term', () => {
		expect(entryMatchesQuery(entry, 'met')).toBe(true);
	});

	it('matches the meaning, ignoring case and diacritics', () => {
		expect(entryMatchesQuery({ term: 'X', expansion: 'ciśnienie' }, 'CISNIENIE')).toBe(true);
	});

	it('returns false for a non-match and true for empty query', () => {
		expect(entryMatchesQuery(entry, 'zzz')).toBe(false);
		expect(entryMatchesQuery(entry, '  ')).toBe(true);
	});
});
