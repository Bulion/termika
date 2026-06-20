import { z } from 'zod';
import { localizedTextSchema, microSkillSchema } from '../content/schema';

export const SCHEMA_VERSION = 1;

/** Convert via the convert-units library (e.g. knot -> km/h). */
const convertOpSchema = z.object({
	kind: z.literal('convert'),
	from: z.string().min(1),
	to: z.string().min(1)
});

/** Linear rule of thumb: result = value * factor + offset (e.g. ROD = GS * 5; °C -> °F). */
const linearOpSchema = z.object({
	kind: z.literal('linear'),
	factor: z.number(),
	offset: z.number().default(0)
});

export const drillOpSchema = z.discriminatedUnion('kind', [convertOpSchema, linearOpSchema]);
export type DrillOp = z.infer<typeof drillOpSchema>;

export const drillSchema = z.object({
	id: z.string().min(1),
	microSkill: microSkillSchema,
	/** Localized template, with `{value}` replaced by the generated input. */
	prompt: localizedTextSchema,
	generate: z
		.object({
			min: z.number(),
			max: z.number(),
			step: z.number().positive()
		})
		.refine((g) => g.max > g.min, { message: 'max must be greater than min', path: ['max'] }),
	op: drillOpSchema,
	/** Accepted error band as a percentage of the exact answer. */
	tolerancePct: z.number().min(0).max(100),
	timeLimitSec: z.number().positive().optional(),
	/** Decimal places the learner is expected to answer to. */
	round: z.number().int().min(0).max(6).default(0),
	tags: z.array(z.string()).default([])
});
export type Drill = z.infer<typeof drillSchema>;

export const drillSetSchema = z.object({
	schemaVersion: z.literal(SCHEMA_VERSION),
	id: z.string().min(1),
	title: localizedTextSchema,
	drills: z.array(drillSchema).min(1)
});
export type DrillSet = z.infer<typeof drillSetSchema>;
