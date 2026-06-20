import { ContentValidationError, LocalJsonAdapter, type SourceAdapter } from './adapter';
import { type Deck, type StudyItem } from './schema';
import {
	learningObjectivesSchema,
	licensesSchema,
	type LearningObjective,
	type LicenseDefinition,
	type Subject
} from './taxonomy';
import rawLearningObjectives from './taxonomy/learning-objectives.json';
import rawLicenses from './taxonomy/licenses.json';

const deckModules = import.meta.glob('./decks/*.json', { eager: true, import: 'default' });

export interface LoadedContent {
	decks: Deck[];
	items: StudyItem[];
	subjects: Subject[];
	learningObjectives: Map<string, LearningObjective>;
	licenses: LicenseDefinition[];
}

export function localDeckAdapter(): SourceAdapter {
	return new LocalJsonAdapter(Object.values(deckModules));
}

function checkReferences(
	decks: Deck[],
	subjects: Subject[],
	loIds: Set<string>,
	licenseIds: Set<string>
): string[] {
	const subjectIds = new Set(subjects.map((s) => s.id));
	const issues: string[] = [];
	for (const deck of decks) {
		if (!subjectIds.has(deck.subjectId)) {
			issues.push(`deck[${deck.id}]: unknown subjectId "${deck.subjectId}"`);
		}
		for (const item of deck.items) {
			for (const loId of item.loIds) {
				if (!loIds.has(loId)) issues.push(`item[${item.id}]: unknown loId "${loId}"`);
			}
			for (const license of item.licenses) {
				if (!licenseIds.has(license)) {
					issues.push(`item[${item.id}]: license "${license}" has no definition`);
				}
			}
		}
	}
	return issues;
}

/**
 * Loads and validates all bundled content and taxonomy, then checks referential integrity
 * between items and the taxonomy. Any problem throws a {@link ContentValidationError}.
 */
export async function loadContent(
	adapter: SourceAdapter = localDeckAdapter()
): Promise<LoadedContent> {
	const learningObjectives = learningObjectivesSchema.parse(rawLearningObjectives);
	const licenses = licensesSchema.parse(rawLicenses);

	const loEntries = learningObjectives.subjects.flatMap((s) =>
		s.los.map((lo) => [lo.id, lo] as const)
	);
	const loMap = new Map<string, LearningObjective>(loEntries);
	const licenseIds = new Set(licenses.licenses.map((l) => l.id));

	const decks = await adapter.load();
	const issues = checkReferences(
		decks,
		learningObjectives.subjects,
		new Set(loMap.keys()),
		licenseIds
	);
	if (issues.length > 0) throw new ContentValidationError(issues);

	return {
		decks,
		items: decks.flatMap((d) => d.items),
		subjects: learningObjectives.subjects,
		learningObjectives: loMap,
		licenses: licenses.licenses
	};
}
