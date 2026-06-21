import type { ContentLocale } from '$lib/content/schema';
import abbreviations from '$lib/quiz/data/abbreviations.json';
import metarCodes from '$lib/quiz/data/metar-codes.json';
import aeroTerms from './aero-terms.json';

interface Localized {
	pl: string;
	en?: string;
}
interface Pair {
	a: Localized;
	b: Localized;
	hint?: Localized;
}

const pick = (text: Localized | undefined, locale: ContentLocale): string | undefined =>
	text ? (locale === 'en' ? (text.en ?? text.pl) : text.pl) : undefined;

const glossaryByLocale = new Map<ContentLocale, Map<string, string>>();

/** Token (the abbreviation) to its plain-language definition for a locale. */
export function buildGlossary(locale: ContentLocale): Map<string, string> {
	const cached = glossaryByLocale.get(locale);
	if (cached) return cached;

	const map = new Map<string, string>();
	for (const pair of (abbreviations as { pairs: Pair[] }).pairs) {
		const token = pick(pair.a, locale);
		const definition = pick(pair.hint, locale) ?? pick(pair.b, locale);
		if (token && definition) map.set(token, definition);
	}
	glossaryByLocale.set(locale, map);
	return map;
}

const matcherByLocale = new Map<ContentLocale, RegExp>();

function matcher(locale: ContentLocale): RegExp {
	const cached = matcherByLocale.get(locale);
	if (cached) return cached;

	const tokens = [...buildGlossary(locale).keys()]
		.sort((a, b) => b.length - a.length)
		.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${tokens.join('|')})(?![\\p{L}\\p{N}])`, 'gu');
	matcherByLocale.set(locale, re);
	return re;
}

export type GlossaryPart = string | { term: string; definition: string };

/**
 * Splits text into plain runs and glossary terms, wrapping only the FIRST occurrence of each
 * distinct abbreviation (whole word, case sensitive, longest match first).
 */
export function findGlossaryMatches(
	text: string,
	locale: ContentLocale,
	used: Set<string> = new Set<string>()
): GlossaryPart[] {
	const map = buildGlossary(locale);
	const re = matcher(locale);
	const parts: GlossaryPart[] = [];
	let last = 0;
	let match: RegExpExecArray | null;

	re.lastIndex = 0;
	while ((match = re.exec(text)) !== null) {
		const term = match[0];
		if (used.has(term)) continue;
		used.add(term);
		if (match.index > last) parts.push(text.slice(last, match.index));
		parts.push({ term, definition: map.get(term) as string });
		last = match.index + term.length;
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts;
}

export interface GlossaryEntry {
	term: string;
	expansion: string;
	explanation?: string;
}
export interface GlossaryGroup {
	id: 'aero' | 'abbreviations' | 'metar';
	entries: GlossaryEntry[];
}

function entriesFrom(set: { pairs: Pair[] }, locale: ContentLocale): GlossaryEntry[] {
	const entries: GlossaryEntry[] = [];
	for (const pair of set.pairs) {
		const term = pick(pair.a, locale);
		const expansion = pick(pair.b, locale);
		if (!term || !expansion) continue;
		const explanation = pick(pair.hint, locale);
		entries.push({ term, expansion, ...(explanation ? { explanation } : {}) });
	}
	return entries;
}

/** Both glossary sources as display groups for the browsable glossary page. */
export function glossaryGroups(locale: ContentLocale): GlossaryGroup[] {
	return [
		{ id: 'aero', entries: entriesFrom(aeroTerms as { pairs: Pair[] }, locale) },
		{ id: 'abbreviations', entries: entriesFrom(abbreviations as { pairs: Pair[] }, locale) },
		{ id: 'metar', entries: entriesFrom(metarCodes as { pairs: Pair[] }, locale) }
	];
}

const COMBINING_MARKS = /[̀-ͯ]/g;
const stripDiacritics = (s: string): string =>
	s.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();

/** True when the query (case- and diacritics-insensitive) appears in the entry's text. */
export function entryMatchesQuery(entry: GlossaryEntry, query: string): boolean {
	const q = stripDiacritics(query.trim());
	if (!q) return true;
	const haystack = stripDiacritics(`${entry.term} ${entry.expansion} ${entry.explanation ?? ''}`);
	return haystack.includes(q);
}
