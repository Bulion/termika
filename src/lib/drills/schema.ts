import { z } from 'zod';
import { localizedTextSchema, microSkillSchema } from '../content/schema';

export const SCHEMA_VERSION = 1;

/** Convert via the convert-units library (e.g. knot -> km/h). */
const convertOpSchema = z.object({
	kind: z.literal('convert'),
	from: z.string().min(1),
	to: z.string().min(1)
});

/** Linear rule of thumb on the single input `value`: value * factor + offset (e.g. ROD = GS * 5). */
const linearOpSchema = z.object({
	kind: z.literal('linear'),
	factor: z.number(),
	offset: z.number().default(0)
});

/** Arithmetic formula over named inputs, e.g. "distance / speed * 60" for time-speed-distance. */
const formulaOpSchema = z.object({
	kind: z.literal('formula'),
	expr: z.string().min(1)
});

export const drillOpSchema = z.discriminatedUnion('kind', [
	convertOpSchema,
	linearOpSchema,
	formulaOpSchema
]);
export type DrillOp = z.infer<typeof drillOpSchema>;

const rangeSchema = z
	.object({ min: z.number(), max: z.number(), step: z.number().positive() })
	.refine((g) => g.max > g.min, { message: 'max must be greater than min', path: ['max'] });

const inputSchema = rangeSchema.and(z.object({ name: z.string().min(1) }));

export const drillSchema = z
	.object({
		id: z.string().min(1),
		microSkill: microSkillSchema,
		/** Localized template; `{value}` (single input) or `{name}` (named inputs) is substituted. */
		prompt: localizedTextSchema,
		/** Single generated input named `value` (used by convert/linear ops). */
		generate: rangeSchema.optional(),
		/** Named generated inputs (used by formula ops), e.g. distance + speed. */
		inputs: z.array(inputSchema).min(1).optional(),
		op: drillOpSchema,
		/** Short rule-of-thumb hint shown to the learner, e.g. "× 1,85". */
		rule: localizedTextSchema.optional(),
		/** Accepted error band as a percentage of the expected (rule-of-thumb) answer. */
		tolerancePct: z.number().min(0).max(100),
		timeLimitSec: z.number().positive().optional(),
		/** Decimal places the learner is expected to answer to. */
		round: z.number().int().min(0).max(6).default(0),
		tags: z.array(z.string()).default([])
	})
	.refine((d) => Boolean(d.generate) !== Boolean(d.inputs), {
		message: 'a drill needs exactly one of `generate` or `inputs`',
		path: ['inputs']
	});
export type Drill = z.infer<typeof drillSchema>;

export const drillSetSchema = z.object({
	schemaVersion: z.literal(SCHEMA_VERSION),
	id: z.string().min(1),
	title: localizedTextSchema,
	description: localizedTextSchema.optional(),
	drills: z.array(drillSchema).min(1)
});
export type DrillSet = z.infer<typeof drillSetSchema>;
