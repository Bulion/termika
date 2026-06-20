import { describe, expect, it } from 'vitest';
import { ContentValidationError, LocalJsonAdapter } from './adapter';

const validDeck = {
	schemaVersion: 1,
	id: 'deck-ok',
	title: { pl: 'Talia', en: 'Deck' },
	subjectId: 'MET',
	items: [
		{
			id: 'c1',
			type: 'flashcard',
			microSkill: 'abbreviation',
			loIds: ['MET.METAR'],
			licenses: ['SPL'],
			front: { pl: 'CAVOK' },
			back: { pl: 'Ceiling and visibility OK' }
		}
	]
};

describe('LocalJsonAdapter', () => {
	it('loads and returns valid decks', async () => {
		const decks = await new LocalJsonAdapter([validDeck]).load();
		expect(decks).toHaveLength(1);
		expect(decks[0].items[0].id).toBe('c1');
	});

	it('throws ContentValidationError on an invalid deck instead of dropping it', async () => {
		const broken = { ...validDeck, items: [] };
		await expect(new LocalJsonAdapter([broken]).load()).rejects.toBeInstanceOf(
			ContentValidationError
		);
	});

	it('reports every issue across multiple bad decks', async () => {
		const adapter = new LocalJsonAdapter([
			{ ...validDeck, id: 'bad-1', schemaVersion: 2 },
			{ ...validDeck, id: 'bad-2', subjectId: '' }
		]);
		await expect(adapter.load()).rejects.toThrow(/bad-1[\s\S]*bad-2|bad-2[\s\S]*bad-1/);
	});

	it('does not silently accept a non-object deck', async () => {
		await expect(new LocalJsonAdapter([42]).load()).rejects.toBeInstanceOf(ContentValidationError);
	});
});
