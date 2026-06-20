import { describe, expect, it } from 'vitest';
import { FiflyPplAdapter, parseFiflyMarkdown, type FiflyParseOptions } from './fifly';

const options: FiflyParseOptions = {
	deckId: 'fifly-airlaw',
	title: { pl: 'Fifly: Prawo' },
	subjectId: 'AIRLAW',
	loId: 'AIRLAW.VFR_MINIMA'
};

const sample = `# Pytania
## Pytanie PL100-0126
\`Załoga ma obowiązek zapinania pasów:\`
* **Do startu i lądowania.**
* Tylko na polecenie dowódcy.
* Nigdy.

## Pytanie PL100-0131
\`Statek SAR jest oznakowany:\`
* **Napisem SAR**
* Napisem SOS
* Czerwonym krzyżem.
> **SAR** (Search and Rescue)
`;

describe('parseFiflyMarkdown', () => {
	it('parses each question block into an mcq item', () => {
		const deck = parseFiflyMarkdown(sample, options);
		expect(deck.items).toHaveLength(2);
		expect(deck.items[0].id).toBe('fifly-PL100-0126');
		expect(deck.items[0].type).toBe('mcq');
	});

	it('marks the bold choice as the correct answer', () => {
		const deck = parseFiflyMarkdown(sample, options);
		const first = deck.items[0];
		if (first.type !== 'mcq') throw new Error('expected mcq');
		const answer = first.choices.find((c) => c.id === first.answer);
		expect(answer?.text.pl).toBe('Do startu i lądowania.');
	});

	it('captures the explanation note', () => {
		const deck = parseFiflyMarkdown(sample, options);
		const second = deck.items[1];
		if (second.type !== 'mcq') throw new Error('expected mcq');
		expect(second.explanation?.pl).toContain('Search and Rescue');
	});

	it('tags items with the source license provenance', () => {
		const deck = parseFiflyMarkdown(sample, options);
		expect(deck.items[0].source).toContain('GPL');
		expect(deck.items[0].licenses).toContain('PPL_A');
	});

	it('throws when a block has no correct answer (negative)', () => {
		const broken = `## Pytanie X1\n\`Pytanie?\`\n* Odp 1\n* Odp 2\n`;
		expect(() => parseFiflyMarkdown(broken, options)).toThrow(/correct answer/);
	});

	it('throws when a block has too few choices (boundary)', () => {
		const broken = `## Pytanie X2\n\`Pytanie?\`\n* **Jedyna**\n`;
		expect(() => parseFiflyMarkdown(broken, options)).toThrow(/two choices/);
	});
});

describe('FiflyPplAdapter', () => {
	it('loads a deck from the injected source', async () => {
		const adapter = new FiflyPplAdapter(options, async () => sample);
		const decks = await adapter.load();
		expect(decks).toHaveLength(1);
		expect(decks[0].items).toHaveLength(2);
		expect(adapter.contentLicense).toBe('GPL-3.0-or-later');
	});
});
