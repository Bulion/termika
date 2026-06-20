import type { Mcq } from '../schema';

export const PPLKA_TRPC = 'https://www.pplka.pl/api/trpc/questionDatabase.getQuestions';
export const PPLKA_CATEGORY_IDS = [2, 6, 10, 14, 18, 22, 26, 30, 34];
const PAGE_LIMIT = 100;

export interface PplkaRaw {
	question: {
		id: string;
		externalId: string;
		question: string;
		answerCorrect: string;
		answerIncorrect1: string | null;
		answerIncorrect2: string | null;
		answerIncorrect3: string | null;
	};
	questionInstance: { categoryId: number };
}

const CHOICE_IDS = ['a', 'b', 'c', 'd'];

const NAMED_ENTITIES: Record<string, string> = {
	lt: '<',
	gt: '>',
	amp: '&',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	deg: '°',
	alpha: 'α',
	beta: 'β',
	gamma: 'γ',
	delta: 'δ',
	theta: 'θ',
	rho: 'ρ',
	sigma: 'σ',
	epsilon: 'ε',
	upsilon: 'υ',
	upsih: 'ϒ',
	omega: 'ω',
	fnof: 'ƒ',
	aring: 'Å',
	le: '≤',
	ge: '≥',
	times: '×',
	divide: '÷',
	minus: '−',
	plusmn: '±',
	sup2: '²',
	sup3: '³',
	frac12: '½',
	rarr: '→',
	larr: '←',
	hellip: '…',
	mdash: '—',
	ndash: '–'
};

/** Decodes the HTML entities pplka.pl stores in its question text (e.g. &alpha;, &lt;, &deg;). */
function decodeEntities(text: string): string {
	return text
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
		.replace(/&([a-z0-9]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function seededOrder(seed: string, count: number): number[] {
	// Deterministic per-question shuffle so the correct answer is not always first.
	let state = 0;
	for (const ch of seed) state = (state * 31 + ch.charCodeAt(0)) >>> 0;
	const indices = Array.from({ length: count }, (_, i) => i);
	for (let i = count - 1; i > 0; i -= 1) {
		state = (state * 1103515245 + 12345) >>> 0;
		const j = state % (i + 1);
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}
	return indices;
}

/** Converts one pplka.pl question into our MCQ schema with a deterministic choice order. */
export function pplkaToMcq(raw: PplkaRaw): Mcq | null {
	const q = raw.question;
	const options = [
		{ text: q.answerCorrect, correct: true },
		{ text: q.answerIncorrect1, correct: false },
		{ text: q.answerIncorrect2, correct: false },
		{ text: q.answerIncorrect3, correct: false }
	].filter((o): o is { text: string; correct: boolean } => Boolean(o.text));
	if (options.length < 2 || !q.question) return null;

	const order = seededOrder(q.id, options.length);
	const ordered = order.map((i) => options[i]);
	const choices = ordered.map((o, i) => ({
		id: CHOICE_IDS[i],
		text: { pl: decodeEntities(o.text) }
	}));
	const answer = CHOICE_IDS[ordered.findIndex((o) => o.correct)];

	return {
		id: `pplka-${q.externalId}`,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['pplka'],
		licenses: ['SPL'],
		tags: ['pplka', `cat-${raw.questionInstance.categoryId}`],
		stem: { pl: decodeEntities(q.question) },
		choices,
		answer,
		source: 'pplka.pl'
	};
}

function pageUrl(offset: number): string {
	const input = encodeURIComponent(
		JSON.stringify({
			'0': {
				json: {
					search: '',
					categoryIds: PPLKA_CATEGORY_IDS,
					knowledgeBaseId: null,
					limit: PAGE_LIMIT,
					offset
				}
			}
		})
	);
	return `${PPLKA_TRPC}?batch=1&input=${input}`;
}

/**
 * Fetches every SPL question from the pplka.pl tRPC API by paging. The browser cannot call it
 * directly (no CORS header), so this runs from the local ingest script.
 */
export async function fetchPplkaQuestions(fetchImpl: typeof fetch = fetch): Promise<PplkaRaw[]> {
	const all: PplkaRaw[] = [];
	for (let offset = 0; ; offset += PAGE_LIMIT) {
		const response = await fetchImpl(pageUrl(offset), { headers: { accept: 'application/json' } });
		if (!response.ok) throw new Error(`pplka fetch failed: ${response.status}`);
		const body = await response.json();
		const page = body?.[0]?.result?.data?.json;
		if (!Array.isArray(page) || page.length === 0) break;
		all.push(...(page as PplkaRaw[]));
		if (page.length < PAGE_LIMIT) break;
	}
	return all;
}

export function pplkaToMcqs(raws: PplkaRaw[]): Mcq[] {
	return raws.map(pplkaToMcq).filter((m): m is Mcq => m !== null);
}
