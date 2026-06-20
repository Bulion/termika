import { z } from 'zod';

export const SCHEMA_VERSION = 1;

export const LICENSES = ['SPL', 'BPL', 'LAPL_A', 'PPL_A', 'PPL_H', 'CPL', 'ATPL', 'MPL'] as const;
export const licenseSchema = z.enum(LICENSES);
export type License = z.infer<typeof licenseSchema>;

export const MICRO_SKILLS = [
	'abbreviation',
	'concept_number',
	'unit_conversion',
	'nav_rule',
	'regulation',
	'chart',
	'rtf',
	'general'
] as const;
export const microSkillSchema = z.enum(MICRO_SKILLS);
export type MicroSkill = z.infer<typeof microSkillSchema>;

export const CONTENT_LOCALES = ['pl', 'en'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

/** Polish text is the primary content language (ULC); English is filled in iteratively. */
export const localizedTextSchema = z.object({
	pl: z.string().min(1, 'pl text is required'),
	en: z.string().min(1).optional()
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export function resolveText(text: LocalizedText, locale: ContentLocale): string {
	const preferred = locale === 'en' ? text.en : text.pl;
	return preferred ?? text.pl ?? text.en ?? '';
}

const baseItemShape = {
	id: z.string().min(1),
	microSkill: microSkillSchema,
	loIds: z.array(z.string().min(1)).min(1, 'at least one learning objective id'),
	licenses: z.array(licenseSchema).min(1, 'at least one license'),
	tags: z.array(z.string()).default([]),
	media: z.string().min(1).optional(),
	source: z.string().min(1).optional()
};

export const flashcardSchema = z.object({
	...baseItemShape,
	type: z.literal('flashcard'),
	front: localizedTextSchema,
	back: localizedTextSchema,
	mnemonic: localizedTextSchema.optional(),
	confusableWith: z.array(z.string()).default([])
});

export const mcqChoiceSchema = z.object({
	id: z.string().min(1),
	text: localizedTextSchema
});

export const mcqSchema = z.object({
	...baseItemShape,
	type: z.literal('mcq'),
	stem: localizedTextSchema,
	choices: z.array(mcqChoiceSchema).min(2, 'an mcq needs at least two choices'),
	answer: z.string().min(1),
	explanation: localizedTextSchema.optional()
});

export const occlusionMaskSchema = z.object({
	id: z.string().min(1),
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	w: z.number().gt(0).max(1),
	h: z.number().gt(0).max(1),
	label: localizedTextSchema
});

export const imageOcclusionSchema = z.object({
	...baseItemShape,
	type: z.literal('image_occlusion'),
	image: z.string().min(1),
	masks: z.array(occlusionMaskSchema).min(1)
});

export const scenarioSchema = z.object({
	...baseItemShape,
	type: z.literal('scenario'),
	prompt: localizedTextSchema,
	modelChecklist: z.array(localizedTextSchema).min(1)
});

export const itemSchema = z
	.discriminatedUnion('type', [flashcardSchema, mcqSchema, imageOcclusionSchema, scenarioSchema])
	.superRefine((item, ctx) => {
		if (item.type === 'mcq') {
			const ids = item.choices.map((c) => c.id);
			if (new Set(ids).size !== ids.length) {
				ctx.addIssue({ code: 'custom', message: 'choice ids must be unique', path: ['choices'] });
			}
			if (!ids.includes(item.answer)) {
				ctx.addIssue({
					code: 'custom',
					message: 'answer must match a choice id',
					path: ['answer']
				});
			}
		}
	});
export type StudyItem = z.infer<typeof itemSchema>;
export type Flashcard = z.infer<typeof flashcardSchema>;
export type Mcq = z.infer<typeof mcqSchema>;
export type ScenarioItem = z.infer<typeof scenarioSchema>;
export type ImageOcclusionItem = z.infer<typeof imageOcclusionSchema>;

export const deckSchema = z.object({
	schemaVersion: z.literal(SCHEMA_VERSION),
	id: z.string().min(1),
	title: localizedTextSchema,
	subjectId: z.string().min(1),
	items: z.array(itemSchema).min(1)
});
export type Deck = z.infer<typeof deckSchema>;
