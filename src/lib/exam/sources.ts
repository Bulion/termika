import { FiflyPplAdapter } from '../content/adapters/fifly';
import type { LocalizedText, Mcq } from '../content/schema';

export interface ExamSource {
	id: string;
	label: LocalizedText;
	/** Internal sources read the bundled content; external sources fetch at runtime. */
	external: boolean;
	/** Number of questions / time / pass mark used when this source drives a whole exam. */
	questionCount: number;
	timeLimitMin: number;
	passPct: number;
}

export const INTERNAL_SOURCE_ID = 'internal';

export const EXAM_SOURCES: ExamSource[] = [
	{
		id: INTERNAL_SOURCE_ID,
		label: { pl: 'Wewnętrzne (SPL)', en: 'Internal (SPL)' },
		external: false,
		questionCount: 0,
		timeLimitMin: 0,
		passPct: 75
	},
	{
		id: 'fifly',
		label: { pl: 'fifly PPL(A)', en: 'fifly PPL(A)' },
		external: true,
		questionCount: 20,
		timeLimitMin: 30,
		passPct: 75
	}
];

const cache = new Map<string, Mcq[]>();

/** Loads (and caches) the MCQ pool for an external source. Network is required. */
export async function loadExternalMcqs(sourceId: string): Promise<Mcq[]> {
	const cached = cache.get(sourceId);
	if (cached) return cached;

	let mcqs: Mcq[];
	if (sourceId === 'fifly') {
		const adapter = new FiflyPplAdapter({
			deckId: 'fifly-ppl-a',
			title: { pl: 'fifly PPL(A)', en: 'fifly PPL(A)' },
			subjectId: 'fifly',
			loId: 'fifly',
			onInvalidBlock: () => {}
		});
		const decks = await adapter.load();
		mcqs = decks.flatMap((deck) => deck.items).filter((item): item is Mcq => item.type === 'mcq');
	} else {
		throw new Error(`Unknown external source: ${sourceId}`);
	}

	cache.set(sourceId, mcqs);
	return mcqs;
}
