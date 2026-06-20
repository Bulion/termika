import { base } from '$app/paths';
import { FiflyPplAdapter } from '../content/adapters/fifly';
import type { LocalizedText, Mcq } from '../content/schema';

export interface ExamCategory {
	id: number;
	name: string;
}

export interface ExamSource {
	id: string;
	label: LocalizedText;
	/** Internal sources read the bundled content; external sources fetch at runtime. */
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
		id: 'fifly',
		label: { pl: 'fifly PPL(A)', en: 'fifly PPL(A)' },
		external: true,
		hasCategories: false,
		questionCount: 20,
		timeLimitMin: 30,
		passPct: 75
	},
	{
		id: 'pplka',
		label: { pl: 'pplka.pl (SPL)', en: 'pplka.pl (SPL)' },
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

	let pool: ExternalPool;
	if (sourceId === 'fifly') {
		const adapter = new FiflyPplAdapter({
			deckId: 'fifly-ppl-a',
			title: { pl: 'fifly PPL(A)', en: 'fifly PPL(A)' },
			subjectId: 'fifly',
			loId: 'fifly',
			onInvalidBlock: () => {}
		});
		const decks = await adapter.load();
		const questions = decks
			.flatMap((deck) => deck.items)
			.filter((item): item is Mcq => item.type === 'mcq');
		pool = { categories: [], questions };
	} else if (sourceId === 'pplka') {
		// pplka.pl blocks cross-origin requests, so read the pool ingested into the build
		// (npm run ingest:pplka -> static/external/pplka-spl.json).
		const response = await fetch(`${base}/external/pplka-spl.json`);
		if (!response.ok) throw new Error(`pplka pool not available: ${response.status}`);
		pool = (await response.json()) as ExternalPool;
	} else {
		throw new Error(`Unknown external source: ${sourceId}`);
	}

	cache.set(sourceId, pool);
	return pool;
}

/** Categories offered by an external source, or an empty list if it has none. */
export async function loadExternalCategories(sourceId: string): Promise<ExamCategory[]> {
	return (await loadPool(sourceId)).categories;
}

/** MCQ pool for an external source, optionally filtered to a single category. */
export async function loadExternalMcqs(sourceId: string, categoryId?: number): Promise<Mcq[]> {
	const { questions } = await loadPool(sourceId);
	if (categoryId === undefined) return questions;
	return questions.filter((q) => q.tags.includes(`cat-${categoryId}`));
}
