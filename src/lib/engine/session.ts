import type { License, MicroSkill, StudyItem } from '../content/schema';
import type { TermikaDb } from './db';
import { seededShuffle } from './shuffle';

export interface ItemCriteria {
	license?: License;
	loIds?: string[];
	microSkills?: MicroSkill[];
	types?: StudyItem['type'][];
}

/** Filters items by the data-driven tagging contract (license / loId / microSkill / type). */
export function selectItems(items: StudyItem[], criteria: ItemCriteria = {}): StudyItem[] {
	const loIds = criteria.loIds ? new Set(criteria.loIds) : undefined;
	const microSkills = criteria.microSkills ? new Set(criteria.microSkills) : undefined;
	const types = criteria.types ? new Set(criteria.types) : undefined;
	return items.filter((item) => {
		if (criteria.license && !item.licenses.includes(criteria.license)) return false;
		if (loIds && !item.loIds.some((id) => loIds.has(id))) return false;
		if (microSkills && !microSkills.has(item.microSkill)) return false;
		if (types && !types.has(item.type)) return false;
		return true;
	});
}

export interface StudyQueueOptions {
	newLimit?: number;
	/** When set, fresh (never-seen) items are shuffled by this seed for a per-session order. */
	shuffleSeed?: number;
}

export interface StudyQueue {
	due: StudyItem[];
	fresh: StudyItem[];
	all: StudyItem[];
}

/**
 * Splits a pool of items into a study queue: cards already due (most overdue first) followed
 * by not-yet-seen items, capped by `newLimit`.
 */
export async function buildStudyQueue(
	db: TermikaDb,
	items: StudyItem[],
	now: Date = new Date(),
	options: StudyQueueOptions = {}
): Promise<StudyQueue> {
	const newLimit = options.newLimit ?? Infinity;
	if (newLimit < 0) throw new RangeError(`newLimit must be >= 0, got ${newLimit}`);

	const states = await db.cardState.bulkGet(items.map((i) => i.id));
	const stateByItem = new Map(items.map((item, index) => [item.id, states[index]]));

	const due = items
		.filter((item) => {
			const state = stateByItem.get(item.id);
			return state !== undefined && state.due.getTime() <= now.getTime();
		})
		.sort((a, b) => {
			const da = stateByItem.get(a.id)!.due.getTime();
			const db2 = stateByItem.get(b.id)!.due.getTime();
			return da - db2;
		});

	const freshPool = items.filter((item) => stateByItem.get(item.id) === undefined);
	const freshOrdered =
		options.shuffleSeed === undefined ? freshPool : seededShuffle(freshPool, options.shuffleSeed);
	const fresh = freshOrdered.slice(0, newLimit);

	return { due, fresh, all: [...due, ...fresh] };
}
