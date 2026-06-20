import { z } from 'zod';
import { SCHEMA_VERSION, licenseSchema, localizedTextSchema } from './schema';

export const learningObjectiveSchema = z.object({
	id: z.string().min(1),
	text: localizedTextSchema,
	licenses: z.array(licenseSchema).min(1)
});
export type LearningObjective = z.infer<typeof learningObjectiveSchema>;

export const subjectSchema = z.object({
	id: z.string().min(1),
	name: localizedTextSchema,
	los: z.array(learningObjectiveSchema).min(1)
});
export type Subject = z.infer<typeof subjectSchema>;

export const learningObjectivesSchema = z.object({
	schemaVersion: z.literal(SCHEMA_VERSION),
	subjects: z.array(subjectSchema).min(1)
});
export type LearningObjectives = z.infer<typeof learningObjectivesSchema>;

export const examSubjectSchema = z.object({
	subjectId: z.string().min(1),
	questionCount: z.number().int().positive(),
	timeLimitMin: z.number().int().positive(),
	passPct: z.number().min(0).max(100)
});
export type ExamSubject = z.infer<typeof examSubjectSchema>;

export const licenseDefinitionSchema = z.object({
	id: licenseSchema,
	name: localizedTextSchema,
	examBlueprint: z.object({
		subjects: z.array(examSubjectSchema).min(1)
	})
});
export type LicenseDefinition = z.infer<typeof licenseDefinitionSchema>;

export const licensesSchema = z.object({
	schemaVersion: z.literal(SCHEMA_VERSION),
	licenses: z.array(licenseDefinitionSchema).min(1)
});
export type Licenses = z.infer<typeof licensesSchema>;
