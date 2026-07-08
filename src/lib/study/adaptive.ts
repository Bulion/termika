import type { Mcq } from '../content/schema';

export interface McqStat {
	itemId: string;
	attempts: number;
	mastery: number;
	avgAnswerMs: number;
	updatedAt: Date;
}

export interface AttemptSignal {
	correct: boolean;
	answerMs: number;
	nextMs: number;
}

const EMA_ALPHA = 0.3;
const FAST_ANSWER_MS = 15_000;
const SLOW_ANSWER_MS = 60_000;
const SLOW_ANSWER_GRADE = 0.6;
const FAST_NEXT_MS = 3_000;
const FAST_NEXT_BONUS = 0.1;
const UNSEEN_WEIGHT = 1.5;
const MIN_WEIGHT = 0.25;
const WEIGHT_SPAN = 2.25;

export const COOLDOWN_SIZE = 10;

/** Grade of one attempt in [0, 1]: wrong is 0; correct scales down with slowness, plus a quick-next bonus. */
export function gradeAttempt(signal: AttemptSignal): number {
	if (!signal.correct) return 0;
	const clamped = Math.min(Math.max(signal.answerMs, FAST_ANSWER_MS), SLOW_ANSWER_MS);
	const slowness = (clamped - FAST_ANSWER_MS) / (SLOW_ANSWER_MS - FAST_ANSWER_MS);
	const base = 1 - slowness * (1 - SLOW_ANSWER_GRADE);
	const bonus = signal.nextMs <= FAST_NEXT_MS ? FAST_NEXT_BONUS : 0;
	return Math.min(1, base + bonus);
}

/** Folds one attempt into the persisted stat: mastery is an EMA of grades, answer time a running mean. */
export function updateStat(
	prev: McqStat | undefined,
	itemId: string,
	signal: AttemptSignal,
	now: Date
): McqStat {
	const grade = gradeAttempt(signal);
	if (!prev) {
		return { itemId, attempts: 1, mastery: grade, avgAnswerMs: signal.answerMs, updatedAt: now };
	}
	const attempts = prev.attempts + 1;
	return {
		itemId,
		attempts,
		mastery: prev.mastery + EMA_ALPHA * (grade - prev.mastery),
		avgAnswerMs: Math.round(prev.avgAnswerMs + (signal.answerMs - prev.avgAnswerMs) / attempts),
		updatedAt: now
	};
}

/** Draw weight: unseen questions get a coverage boost; low mastery weighs up to 10x the floor. */
export function weightFor(stat: McqStat | undefined): number {
	if (!stat) return UNSEEN_WEIGHT;
	return MIN_WEIGHT + WEIGHT_SPAN * (1 - stat.mastery);
}

/** Weighted random draw from the pool, excluding the last up-to-10 shown questions. */
export function pickNext(
	pool: Mcq[],
	stats: Map<string, McqStat>,
	recentIds: readonly string[],
	rng: () => number = Math.random
): Mcq {
	if (pool.length === 0) throw new RangeError('pickNext requires a non-empty pool');
	const cooldown = Math.min(COOLDOWN_SIZE, pool.length - 1);
	const blocked = new Set(cooldown === 0 ? [] : recentIds.slice(-cooldown));
	const eligible = pool.filter((question) => !blocked.has(question.id));
	const candidates = eligible.length > 0 ? eligible : pool;
	const weights = candidates.map((question) => weightFor(stats.get(question.id)));
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	let roll = rng() * total;
	for (let i = 0; i < candidates.length; i += 1) {
		roll -= weights[i];
		if (roll <= 0) return candidates[i];
	}
	return candidates[candidates.length - 1];
}
