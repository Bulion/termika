import {
	createEmptyCard,
	fsrs,
	generatorParameters,
	Rating,
	type Card,
	type Grade as FsrsGrade,
	type RecordLogItem
} from 'ts-fsrs';

export const GRADES = ['again', 'hard', 'good', 'easy'] as const;
export type Grade = (typeof GRADES)[number];

const RATING_BY_GRADE: Record<Grade, FsrsGrade> = {
	again: Rating.Again,
	hard: Rating.Hard,
	good: Rating.Good,
	easy: Rating.Easy
};

export interface SchedulerOptions {
	/** Target probability of recall at review time (FSRS desired retention). */
	requestRetention?: number;
	enableFuzz?: boolean;
}

export interface Scheduler {
	newCard(now?: Date): Card;
	review(card: Card, grade: Grade, now?: Date): RecordLogItem;
}

export function createScheduler(options: SchedulerOptions = {}): Scheduler {
	const retention = options.requestRetention ?? 0.9;
	if (retention <= 0 || retention >= 1) {
		throw new RangeError(`requestRetention must be in (0, 1), got ${retention}`);
	}
	const algorithm = fsrs(
		generatorParameters({ request_retention: retention, enable_fuzz: options.enableFuzz ?? false })
	);

	return {
		newCard(now = new Date()): Card {
			return createEmptyCard(now);
		},
		review(card: Card, grade: Grade, now = new Date()): RecordLogItem {
			const rating = RATING_BY_GRADE[grade];
			if (rating === undefined) throw new TypeError(`unknown grade "${grade}"`);
			return algorithm.next(card, now, rating);
		}
	};
}
