import { deckSchema, type Deck } from './schema';

/**
 * A source of study content. Each external source (local JSON, fifly/PPL-A, ULC PDFs, ...)
 * implements this interface and normalizes its data into validated {@link Deck}s, so the
 * study engine stays agnostic about where content comes from.
 */
export interface SourceAdapter {
	readonly id: string;
	/** SPDX-style license of the content this adapter yields. */
	readonly contentLicense: string;
	load(): Promise<Deck[]>;
}

export class ContentValidationError extends Error {
	constructor(readonly issues: string[]) {
		super(`Content validation failed:\n${issues.join('\n')}`);
		this.name = 'ContentValidationError';
	}
}

function describeIssues(label: string, raw: unknown): string[] {
	const result = deckSchema.safeParse(raw);
	if (result.success) return [];
	return result.error.issues.map((issue) => {
		const path = issue.path.length ? issue.path.join('.') : '(root)';
		return `${label} ${path}: ${issue.message}`;
	});
}

/**
 * Validates raw decks and fails fast with a {@link ContentValidationError} listing every
 * problem. Invalid content is never silently dropped.
 */
export class LocalJsonAdapter implements SourceAdapter {
	readonly id = 'local-json';
	readonly contentLicense = 'GPL-3.0-or-later';

	constructor(private readonly rawDecks: readonly unknown[]) {}

	async load(): Promise<Deck[]> {
		const decks: Deck[] = [];
		const issues: string[] = [];
		this.rawDecks.forEach((raw, index) => {
			const id =
				typeof raw === 'object' && raw !== null && 'id' in raw
					? String((raw as { id: unknown }).id)
					: `#${index}`;
			const result = deckSchema.safeParse(raw);
			if (result.success) decks.push(result.data);
			else issues.push(...describeIssues(`deck[${id}]`, raw));
		});
		if (issues.length > 0) throw new ContentValidationError(issues);
		return decks;
	}
}
