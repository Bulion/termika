import { base } from '$app/paths';
import type { LocalizedText, Mcq } from '../content/schema';

export interface ExamCategory {
	id: string;
	name: string;
}

export interface ExamSource {
	id: string;
	label: LocalizedText;
	/** Internal sources read the bundled content decks; pool sources read a committed bank file. */
	external: boolean;
	/** Whether this source can split its bank into per-category exams. */
	hasCategories: boolean;
	/** Number of questions / time / pass mark used when this source drives a whole exam. */
	questionCount: number;
	timeLimitMin: number;
	passPct: number;
}

interface ExternalPool {
	categories: ExamCategory[];
	questions: Mcq[];
}

export const INTERNAL_SOURCE_ID = 'internal';

/** The nine ULC LKE exam categories (the official SPL exam structure). */
export const ULC_CATEGORIES: { id: string; name: LocalizedText }[] = [
	{ id: '2', name: { pl: 'Prawo lotnicze', en: 'Air law' } },
	{ id: '6', name: { pl: 'Ogólna wiedza o statku powietrznym', en: 'Aircraft general knowledge' } },
	{ id: '10', name: { pl: 'Osiągi i planowanie lotu', en: 'Performance and flight planning' } },
	{ id: '14', name: { pl: 'Człowiek - możliwości i ograniczenia', en: 'Human performance' } },
	{ id: '18', name: { pl: 'Meteorologia', en: 'Meteorology' } },
	{ id: '22', name: { pl: 'Nawigacja', en: 'Navigation' } },
	{ id: '26', name: { pl: 'Procedury operacyjne', en: 'Operational procedures' } },
	{ id: '30', name: { pl: 'Zasady lotu', en: 'Principles of flight' } },
	{ id: '34', name: { pl: 'Łączność', en: 'Communications' } }
];

export const EXAM_SOURCES: ExamSource[] = [
	{
		id: INTERNAL_SOURCE_ID,
		label: { pl: 'Wewnętrzne (SPL)', en: 'Internal (SPL)' },
		external: false,
		hasCategories: false,
		questionCount: 0,
		timeLimitMin: 0,
		passPct: 75
	},
	{
		id: 'ulc',
		label: { pl: 'ULC LKE (oficjalna baza SPL)', en: 'ULC official SPL bank' },
		external: true,
		hasCategories: true,
		questionCount: 20,
		timeLimitMin: 30,
		passPct: 75
	}
];

const cache = new Map<string, ExternalPool>();

async function loadPool(sourceId: string): Promise<ExternalPool> {
	const cached = cache.get(sourceId);
	if (cached) return cached;

	if (sourceId !== 'ulc') throw new Error(`Unknown question source: ${sourceId}`);
	// Official ULC LKE SPL bank with our own validated answer key, committed under
	// static/external and served same-origin (no third-party runtime dependency).
	const response = await fetch(`${base}/external/ulc-spl.json`);
	if (!response.ok) throw new Error(`ULC pool not available: ${response.status}`);
	const raw = (await response.json()) as {
		categories: { id: number | string; name: string }[];
		questions: Mcq[];
	};
	const pool: ExternalPool = {
		categories: raw.categories.map((c) => ({ id: String(c.id), name: c.name })),
		questions: raw.questions
	};
	cache.set(sourceId, pool);
	return pool;
}

/** Categories offered by an external source, or an empty list if it has none. */
export async function loadExternalCategories(sourceId: string): Promise<ExamCategory[]> {
	return (await loadPool(sourceId)).categories;
}

/** MCQ pool for an external source, optionally filtered to a single category. */
export async function loadExternalMcqs(sourceId: string, categoryId?: string): Promise<Mcq[]> {
	const { questions } = await loadPool(sourceId);
	if (categoryId === undefined) return questions;
	return questions.filter((q) => q.tags.includes(`cat-${categoryId}`));
}
