import { describe, expect, it } from 'vitest';
import { ContentValidationError, type SourceAdapter } from './adapter';
import { loadContent } from './index';
import type { Deck } from './schema';

describe('loadContent (bundled seed)', () => {
	it('loads validated seed decks, items and taxonomy', async () => {
		const content = await loadContent();
		expect(content.items.length).toBeGreaterThan(0);
		expect(content.subjects.length).toBeGreaterThan(0);
		expect(content.licenses.some((l) => l.id === 'SPL')).toBe(true);
	});

	it('every seed item references a learning objective that exists', async () => {
		const content = await loadContent();
		for (const item of content.items) {
			for (const loId of item.loIds) {
				expect(content.learningObjectives.has(loId)).toBe(true);
			}
		}
	});

	it('throws when an item references an unknown learning objective', async () => {
		const danglingDeck: Deck = {
			schemaVersion: 1,
			id: 'dangling',
			title: { pl: 'X' },
			subjectId: 'MET',
			items: [
				{
					id: 'x1',
					type: 'flashcard',
					microSkill: 'abbreviation',
					loIds: ['MET.DOES_NOT_EXIST'],
					licenses: ['SPL'],
					tags: [],
					confusableWith: [],
					front: { pl: 'A' },
					back: { pl: 'B' }
				}
			]
		};
		const adapter: SourceAdapter = {
			id: 'fake',
			contentLicense: 'GPL-3.0-or-later',
			load: async () => [danglingDeck]
		};
		await expect(loadContent(adapter)).rejects.toBeInstanceOf(ContentValidationError);
	});
});
