import { z } from 'zod';
import { localizedTextSchema } from '../content/schema';

export const QUIZ_SCHEMA_VERSION = 1;

/** A term pair the learner recalls in either direction (short side `a`, long side `b`). */
const quizPairSchema = z.object({
	id: z.string().min(1),
	/** Short side: an abbreviation, a letter or a digit. */
	a: localizedTextSchema,
	/** Long side: the expansion, the ICAO word or the value. */
	b: localizedTextSchema,
	/** Extra spellings accepted when `a` is the expected answer. */
	acceptA: z.array(z.string()).default([]),
	/** Extra spellings accepted when `b` is the expected answer. */
	acceptB: z.array(z.string()).default([]),
	/** Optional meaning/translation shown after answering. */
	hint: localizedTextSchema.optional()
});
export type QuizPair = z.infer<typeof quizPairSchema>;

export const QUIZ_DIRECTIONS = ['a-to-b', 'b-to-a'] as const;
export const quizDirectionSchema = z.enum(QUIZ_DIRECTIONS);
export type QuizDirection = z.infer<typeof quizDirectionSchema>;

export const quizSetSchema = z.object({
	schemaVersion: z.literal(QUIZ_SCHEMA_VERSION),
	id: z.string().min(1),
	title: localizedTextSchema,
	description: localizedTextSchema.optional(),
	/** Heading for the short side, e.g. "Abbreviation". */
	labelA: localizedTextSchema,
	/** Heading for the long side, e.g. "Expansion". */
	labelB: localizedTextSchema,
	/** Directions this set may be quizzed in; both means a bidirectional drill. */
	directions: z.array(quizDirectionSchema).min(1).default(['a-to-b', 'b-to-a']),
	timeLimitSec: z.number().positive().optional(),
	pairs: z.array(quizPairSchema).min(1)
});
export type QuizSet = z.infer<typeof quizSetSchema>;
