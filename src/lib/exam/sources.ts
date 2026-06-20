import { base } from '$app/paths';
import { FiflyPplAdapter } from '../content/adapters/fifly';
import { ulcSubjectName } from '../content/adapters/ulc-subjects';
import type { LocalizedText, Mcq } from '../content/schema';

export interface ExamCategory {
	id: string;
	name: string;
}

/** Builds the category list from the `cat-<id>` tags present on a question pool. */
function categoriesFromTags(questions: Mcq[], nameOf: (id: string) => string): ExamCategory[] {
	const ids: string[] = [];
	for (const q of questions) {
		const tag = q.tags.find((t) => t.startsWith('cat-'));
		const id = tag?.slice(4);
		if (id && !ids.includes(id)) ids.push(id);
	}
	return ids.map((id) => ({ id, name: nameOf(id) }));
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
		hasCategories: true,
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
		pool = { categories: categoriesFromTags(questions, ulcSubjectName), questions };
	} else if (sourceId === 'pplka') {
		// pplka.pl blocks cross-origin requests, so read the pool ingested into the build
		// (npm run ingest:pplka -> static/external/pplka-spl.json).
		const response = await fetch(`${base}/external/pplka-spl.json`);
		if (!response.ok) throw new Error(`pplka pool not available: ${response.status}`);
		const raw = (await response.json()) as {
			categories: { id: number | string; name: string }[];
			questions: Mcq[];
		};
		pool = {
			categories: raw.categories.map((c) => ({ id: String(c.id), name: c.name })),
			questions: raw.questions
		};
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
export async function loadExternalMcqs(sourceId: string, categoryId?: string): Promise<Mcq[]> {
	const { questions } = await loadPool(sourceId);
	if (categoryId === undefined) return questions;
	return questions.filter((q) => q.tags.includes(`cat-${categoryId}`));
}
