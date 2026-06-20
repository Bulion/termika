import { describe, expect, it } from 'vitest';
import { itemSchema, resolveText, type LocalizedText } from './schema';

function flashcard(overrides: Record<string, unknown> = {}) {
	return {
		id: 'card-1',
		type: 'flashcard',
		microSkill: 'abbreviation',
		loIds: ['MET.METAR'],
		licenses: ['SPL'],
		front: { pl: 'CAVOK' },
		back: { pl: 'Ceiling and visibility OK' },
		...overrides
	};
}

function mcq(overrides: Record<string, unknown> = {}) {
	return {
		id: 'mcq-1',
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['AIRLAW.VFR_MINIMA'],
		licenses: ['SPL'],
		stem: { pl: 'Pytanie?' },
		choices: [
			{ id: 'a', text: { pl: 'A' } },
			{ id: 'b', text: { pl: 'B' } }
		],
		answer: 'a',
		...overrides
	};
}

describe('itemSchema', () => {
	it('parses a valid flashcard and applies array defaults', () => {
		const result = itemSchema.safeParse(flashcard());
		expect(result.success).toBe(true);
		if (result.success && result.data.type === 'flashcard') {
			expect(result.data.tags).toEqual([]);
			expect(result.data.confusableWith).toEqual([]);
		}
	});

	it('rejects an unknown item type', () => {
		const result = itemSchema.safeParse(flashcard({ type: 'mystery' }));
		expect(result.success).toBe(false);
	});

	it('rejects an unknown micro-skill', () => {
		expect(itemSchema.safeParse(flashcard({ microSkill: 'telepathy' })).success).toBe(false);
	});

	it('rejects an item with no learning objectives (boundary: empty array)', () => {
		expect(itemSchema.safeParse(flashcard({ loIds: [] })).success).toBe(false);
	});

	it('rejects an item with no licenses (boundary: empty array)', () => {
		expect(itemSchema.safeParse(flashcard({ licenses: [] })).success).toBe(false);
	});

	it('rejects localized text missing the primary (pl) language', () => {
		expect(itemSchema.safeParse(flashcard({ front: { en: 'only english' } })).success).toBe(false);
	});

	it('rejects empty localized text (boundary: empty string)', () => {
		expect(itemSchema.safeParse(flashcard({ back: { pl: '' } })).success).toBe(false);
	});

	it('accepts a valid mcq', () => {
		expect(itemSchema.safeParse(mcq()).success).toBe(true);
	});

	it('rejects an mcq whose answer matches no choice', () => {
		const result = itemSchema.safeParse(mcq({ answer: 'z' }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes('answer'))).toBe(true);
		}
	});

	it('rejects an mcq with duplicate choice ids', () => {
		const result = itemSchema.safeParse(
			mcq({
				choices: [
					{ id: 'a', text: { pl: 'A' } },
					{ id: 'a', text: { pl: 'A again' } }
				]
			})
		);
		expect(result.success).toBe(false);
	});

	it('rejects an mcq with fewer than two choices (boundary)', () => {
		expect(itemSchema.safeParse(mcq({ choices: [{ id: 'a', text: { pl: 'A' } }] })).success).toBe(
			false
		);
	});

	it('rejects an occlusion mask coordinate outside the 0..1 range (boundary)', () => {
		const occlusion = {
			id: 'occ-1',
			type: 'image_occlusion',
			microSkill: 'chart',
			loIds: ['NAV.ROD'],
			licenses: ['SPL'],
			image: 'panel.svg',
			masks: [{ id: 'm1', x: 1.2, y: 0.1, w: 0.1, h: 0.1, label: { pl: 'Vne' } }]
		};
		expect(itemSchema.safeParse(occlusion).success).toBe(false);
	});
});

describe('resolveText', () => {
	const text: LocalizedText = { pl: 'polski', en: 'english' };

	it('returns the requested locale when present', () => {
		expect(resolveText(text, 'en')).toBe('english');
		expect(resolveText(text, 'pl')).toBe('polski');
	});

	it('falls back to pl when the english text is missing', () => {
		expect(resolveText({ pl: 'tylko polski' }, 'en')).toBe('tylko polski');
	});
});
