import type { StudyItem } from '../content/schema';
import type { Subject } from '../content/taxonomy';
import { loIdToSubject } from '../exam/exam';

/** FSRS card states; an item counts as mastered once its card reaches Review. */
const REVIEW_STATE = 2;

export interface ItemState {
	state: number;
}

export interface SubjectMastery {
	subjectId: string;
	total: number;
	mastered: number;
	readinessPct: number;
}

export interface MasterySummary {
	subjects: SubjectMastery[];
	overallReadinessPct: number;
}

function subjectsOfItem(item: StudyItem, loSubject: Map<string, string>): Set<string> {
	const result = new Set<string>();
	for (const lo of item.loIds) {
		const subjectId = loSubject.get(lo);
		if (subjectId) result.add(subjectId);
	}
	return result;
}

/**
 * Readiness per subject: the share of its items whose card has reached the Review state.
 * Overall readiness is the mean of all items' mastery, so larger subjects weigh more.
 */
export function computeMastery(
	items: StudyItem[],
	stateByItem: Map<string, ItemState>,
	subjects: Subject[]
): MasterySummary {
	const loSubject = loIdToSubject(subjects);
	const totals = new Map<string, { total: number; mastered: number }>();
	for (const subject of subjects) totals.set(subject.id, { total: 0, mastered: 0 });

	let overallTotal = 0;
	let overallMastered = 0;

	for (const item of items) {
		const mastered = (stateByItem.get(item.id)?.state ?? -1) === REVIEW_STATE;
		for (const subjectId of subjectsOfItem(item, loSubject)) {
			const bucket = totals.get(subjectId);
			if (!bucket) continue;
			bucket.total += 1;
			if (mastered) bucket.mastered += 1;
			overallTotal += 1;
			if (mastered) overallMastered += 1;
		}
	}

	const subjectMastery: SubjectMastery[] = subjects.map((subject) => {
		const bucket = totals.get(subject.id) ?? { total: 0, mastered: 0 };
		return {
			subjectId: subject.id,
			total: bucket.total,
			mastered: bucket.mastered,
			readinessPct: bucket.total === 0 ? 0 : Math.round((bucket.mastered / bucket.total) * 100)
		};
	});

	return {
		subjects: subjectMastery,
		overallReadinessPct: overallTotal === 0 ? 0 : Math.round((overallMastered / overallTotal) * 100)
	};
}

/** Convenience wrapper that builds the lookup from a flat list of persisted card states. */
export function computeMasteryFromStates(
	items: StudyItem[],
	states: ReadonlyArray<{ itemId: string; state: number }>,
	subjects: Subject[]
): MasterySummary {
	const map = new Map<string, ItemState>(states.map((s) => [s.itemId, { state: s.state }]));
	return computeMastery(items, map, subjects);
}
