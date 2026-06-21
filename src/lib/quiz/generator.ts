import { resolveText, type ContentLocale } from '../content/schema';
import type { QuizDirection, QuizPair, QuizSet } from './schema';

export interface QuizQuestion {
	/** Stable per-direction id, e.g. "phonetic-a:a-to-b", used as a fluency key. */
	id: string;
	prompt: string;
	promptLabel: string;
	answerLabel: string;
	expected: string;
	accept: string[];
	/** Required concept groups; the answer must contain a variant from each group. */
	keywordGroups: string[][];
	hint?: string;
}

/** Folds away case, diacritics, punctuation and spacing so lenient text answers match. */
export function normalizeAnswer(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[.,/\\()-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function isQuizAnswerCorrect(
	input: string,
	expected: string,
	accept: string[] = [],
	keywordGroups: string[][] = []
): boolean {
	const normalized = normalizeAnswer(input);
	if (normalized === '') return false;
	if ([expected, ...accept].some((candidate) => normalizeAnswer(candidate) === normalized)) {
		return true;
	}
	if (keywordGroups.length === 0) return false;
	return keywordGroups.every((group) =>
		group.some((keyword) => {
			const needle = normalizeAnswer(keyword);
			return needle !== '' && normalized.includes(needle);
		})
	);
}

export function buildQuestion(
	set: QuizSet,
	pair: QuizPair,
	direction: QuizDirection,
	locale: ContentLocale
): QuizQuestion {
	const aText = resolveText(pair.a, locale);
	const bText = resolveText(pair.b, locale);
	const labelA = resolveText(set.labelA, locale);
	const labelB = resolveText(set.labelB, locale);
	const hint = pair.hint ? resolveText(pair.hint, locale) : undefined;
	if (direction === 'a-to-b') {
		return {
			id: `${pair.id}:a-to-b`,
			prompt: aText,
			promptLabel: labelA,
			answerLabel: labelB,
			expected: bText,
			accept: pair.acceptB,
			keywordGroups: pair.keywordsB,
			hint
		};
	}
	return {
		id: `${pair.id}:b-to-a`,
		prompt: bText,
		promptLabel: labelB,
		answerLabel: labelA,
		expected: aText,
		accept: pair.acceptA,
		keywordGroups: pair.keywordsA,
		hint
	};
}

/** Fisher-Yates shuffle driven by the injected `pick` (deterministic in tests). */
function shuffle<T>(items: T[], pick: () => number): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(pick() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/**
 * Builds an ordered deck of questions: one per pair per requested direction, shuffled.
 * Directions not offered by the set are ignored so callers can pass a user toggle freely.
 */
export function buildQuizDeck(
	set: QuizSet,
	directions: QuizDirection[],
	locale: ContentLocale,
	pick: () => number = Math.random
): QuizQuestion[] {
	const active = directions.filter((d) => set.directions.includes(d));
	const used = active.length > 0 ? active : set.directions;
	const questions = set.pairs.flatMap((pair) =>
		used.map((direction) => buildQuestion(set, pair, direction, locale))
	);
	return shuffle(questions, pick);
}
