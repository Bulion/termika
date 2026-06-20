import { quizSetSchema, type QuizSet } from './schema';

const quizModules = import.meta.glob('./data/*.json', { eager: true, import: 'default' });

export class QuizValidationError extends Error {
	constructor(readonly issues: string[]) {
		super(`Quiz validation failed:\n${issues.join('\n')}`);
		this.name = 'QuizValidationError';
	}
}

/** Parses and validates all bundled quiz sets, failing fast on any invalid set. */
export function loadQuizSets(raws: readonly unknown[] = Object.values(quizModules)): QuizSet[] {
	const sets: QuizSet[] = [];
	const issues: string[] = [];
	raws.forEach((raw, index) => {
		const result = quizSetSchema.safeParse(raw);
		if (result.success) sets.push(result.data);
		else {
			for (const issue of result.error.issues) {
				issues.push(`quizSet[#${index}] ${issue.path.join('.') || '(root)'}: ${issue.message}`);
			}
		}
	});
	if (issues.length > 0) throw new QuizValidationError(issues);
	return sets;
}
