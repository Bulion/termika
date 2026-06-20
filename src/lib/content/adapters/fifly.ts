import type { SourceAdapter } from '../adapter';
import { deckSchema, type Deck, type License, type LocalizedText, type Mcq } from '../schema';
import { subjectForCode } from './ulc-subjects';

export const FIFLY_RAW_URL = 'https://raw.githubusercontent.com/fifly/PPL-A/master/pytania.md';

export interface FiflyParseOptions {
	deckId: string;
	title: LocalizedText;
	subjectId: string;
	loId: string;
	license?: License;
	source?: string;
	/** Called per invalid block. When provided, the block is skipped instead of throwing. */
	onInvalidBlock?: (issue: string) => void;
}

const CHOICE_IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

interface RawBlock {
	code: string;
	stem?: string;
	choices: { text: string; correct: boolean }[];
	explanation?: string;
}

function stripBold(text: string): { text: string; bold: boolean } {
	const match = text.match(/^\*\*(.*)\*\*$/);
	return match ? { text: match[1].trim(), bold: true } : { text: text.trim(), bold: false };
}

function parseBlocks(markdown: string): RawBlock[] {
	const blocks: RawBlock[] = [];
	let current: RawBlock | null = null;
	let stemLines: string[] | null = null;

	const finishStem = () => {
		if (current && stemLines && !current.stem) {
			current.stem = stemLines.join(' ').replace(/^`/, '').replace(/`$/, '').trim();
		}
		stemLines = null;
	};

	for (const line of markdown.split('\n')) {
		const trimmed = line.trim();
		const header = trimmed.match(/^##\s+Pytanie\s+(.+)$/);
		if (header) {
			finishStem();
			if (current) blocks.push(current);
			current = { code: header[1].trim(), choices: [] };
			continue;
		}
		if (!current) continue;

		if (stemLines) {
			stemLines.push(trimmed);
			if (trimmed.endsWith('`')) finishStem();
			continue;
		}

		if (trimmed.startsWith('`') && !current.stem) {
			if (trimmed.length > 1 && trimmed.endsWith('`'))
				current.stem = trimmed.replace(/^`|`$/g, '').trim();
			else stemLines = [trimmed];
		} else if (trimmed.startsWith('* ')) {
			const { text, bold } = stripBold(trimmed.slice(2).trim());
			current.choices.push({ text, correct: bold });
		} else if (trimmed.startsWith('> ')) {
			current.explanation = trimmed.slice(2).replace(/\*\*/g, '').trim();
		}
	}
	finishStem();
	if (current) blocks.push(current);
	return blocks;
}

/**
 * Parses fifly/PPL-A question Markdown into a validated MCQ {@link Deck}. The bold choice is
 * the correct answer. Throws if any block lacks a stem or a single correct answer, so broken
 * source content is never silently imported.
 */
export function parseFiflyMarkdown(markdown: string, options: FiflyParseOptions): Deck {
	const license = options.license ?? 'PPL_A';
	const source = options.source ?? 'fifly/PPL-A (GPL-3.0)';
	const issues: string[] = [];
	const items: Mcq[] = [];

	const fail = (issue: string) => {
		issues.push(issue);
		options.onInvalidBlock?.(issue);
	};

	for (const block of parseBlocks(markdown)) {
		const correctCount = block.choices.filter((c) => c.correct).length;
		if (!block.stem) {
			fail(`${block.code}: missing question text`);
			continue;
		}
		if (block.choices.length < 2) {
			fail(`${block.code}: needs at least two choices`);
			continue;
		}
		if (correctCount !== 1) {
			fail(`${block.code}: expected exactly one correct answer, found ${correctCount}`);
			continue;
		}
		const choices = block.choices.map((choice, index) => ({
			id: CHOICE_IDS[index] ?? `c${index}`,
			text: { pl: choice.text }
		}));
		const answer = choices[block.choices.findIndex((c) => c.correct)].id;
		const subject = subjectForCode(block.code);
		items.push({
			id: `fifly-${block.code}`,
			type: 'mcq',
			microSkill: 'regulation',
			loIds: [options.loId],
			licenses: [license],
			tags: ['fifly', block.code, ...(subject ? [`cat-${subject.id}`] : [])],
			stem: { pl: block.stem },
			choices,
			answer,
			...(block.explanation ? { explanation: { pl: block.explanation } } : {}),
			source
		});
	}

	if (issues.length > 0 && !options.onInvalidBlock) {
		throw new Error(`fifly parse failed for ${issues.length} block(s):\n${issues.join('\n')}`);
	}

	return deckSchema.parse({
		schemaVersion: 1,
		id: options.deckId,
		title: options.title,
		subjectId: options.subjectId,
		items
	});
}

export async function fetchFiflyMarkdown(url: string = FIFLY_RAW_URL): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to fetch fifly source: ${response.status}`);
	return response.text();
}

/** SourceAdapter that pulls PPL(A) questions straight from the fifly/PPL-A GPL source. */
export class FiflyPplAdapter implements SourceAdapter {
	readonly id = 'fifly-ppl-a';
	readonly contentLicense = 'GPL-3.0-or-later';
	private readonly options: FiflyParseOptions;
	private readonly fetchMarkdown: () => Promise<string>;

	constructor(
		options: FiflyParseOptions,
		fetchMarkdown: () => Promise<string> = fetchFiflyMarkdown
	) {
		this.options = options;
		this.fetchMarkdown = fetchMarkdown;
	}

	async load(): Promise<Deck[]> {
		return [parseFiflyMarkdown(await this.fetchMarkdown(), this.options)];
	}
}
