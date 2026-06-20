import type { License, Mcq, StudyItem } from '../content/schema';
import type { Subject } from '../content/taxonomy';

/** Maps every learning-objective id to the subject it belongs to. */
export function loIdToSubject(subjects: Subject[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const subject of subjects) {
		for (const lo of subject.los) map.set(lo.id, subject.id);
	}
	return map;
}

export function isMcq(item: StudyItem): item is Mcq {
	return item.type === 'mcq';
}

/** MCQ items for one license and subject, resolved through each item's learning objectives. */
export function mcqItemsForSubject(
	items: StudyItem[],
	license: License,
	subjectId: string,
	loSubject: Map<string, string>
): Mcq[] {
	return items.filter(
		(item): item is Mcq =>
			isMcq(item) &&
			item.licenses.includes(license) &&
			item.loIds.some((lo) => loSubject.get(lo) === subjectId)
	);
}

/** Fisher-Yates shuffle of a copy, using `rng` returning [0, 1). */
export function shuffle<T>(values: readonly T[], rng: () => number = Math.random): T[] {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rng() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/** Picks up to `count` questions from the pool. Fewer are returned if the pool is smaller. */
export function pickQuestions(pool: Mcq[], count: number, rng: () => number = Math.random): Mcq[] {
	if (count < 0) throw new RangeError(`count must be >= 0, got ${count}`);
	return shuffle(pool, rng).slice(0, count);
}

export interface ExamResult {
	total: number;
	answered: number;
	correct: number;
	scorePct: number;
	passed: boolean;
	correctItemIds: string[];
	wrongItemIds: string[];
}

/**
 * Scores an exam. Unanswered questions count as wrong. An exam with no questions scores 0
 * and does not pass.
 */
export function scoreExam(
	questions: Mcq[],
	answers: Map<string, string | null>,
	passPct: number
): ExamResult {
	const correctItemIds: string[] = [];
	const wrongItemIds: string[] = [];
	let answered = 0;

	for (const question of questions) {
		const choice = answers.get(question.id) ?? null;
		if (choice !== null) answered += 1;
		if (choice === question.answer) correctItemIds.push(question.id);
		else wrongItemIds.push(question.id);
	}

	const total = questions.length;
	const correct = correctItemIds.length;
	const scorePct = total === 0 ? 0 : Math.round((correct / total) * 100);

	return {
		total,
		answered,
		correct,
		scorePct,
		passed: total > 0 && scorePct >= passPct,
		correctItemIds,
		wrongItemIds
	};
}
