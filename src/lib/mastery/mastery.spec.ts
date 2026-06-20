import { describe, expect, it } from 'vitest';
import type { StudyItem } from '../content/schema';
import type { Subject } from '../content/taxonomy';
import { computeMastery, type ItemState } from './mastery';

const subjects: Subject[] = [
	{
		id: 'MET',
		name: { pl: 'Meteo' },
		los: [{ id: 'MET.1', text: { pl: 'x' }, licenses: ['SPL'] }]
	},
	{
		id: 'AIRLAW',
		name: { pl: 'Prawo' },
		los: [{ id: 'AIRLAW.1', text: { pl: 'x' }, licenses: ['SPL'] }]
	}
];

function card(id: string, loId: string): StudyItem {
	return {
		id,
		type: 'flashcard',
		microSkill: 'abbreviation',
		loIds: [loId],
		licenses: ['SPL'],
		tags: [],
		confusableWith: [],
		front: { pl: id },
		back: { pl: id }
	};
}

const items: StudyItem[] = [card('m1', 'MET.1'), card('m2', 'MET.1'), card('l1', 'AIRLAW.1')];

describe('computeMastery', () => {
	it('counts items whose card reached the Review state per subject', () => {
		const states = new Map<string, ItemState>([
			['m1', { state: 2 }],
			['m2', { state: 1 }],
			['l1', { state: 2 }]
		]);
		const summary = computeMastery(items, states, subjects);
		const met = summary.subjects.find((s) => s.subjectId === 'MET')!;
		const law = summary.subjects.find((s) => s.subjectId === 'AIRLAW')!;
		expect(met.readinessPct).toBe(50);
		expect(law.readinessPct).toBe(100);
	});

	it('computes an item-weighted overall readiness', () => {
		const states = new Map<string, ItemState>([['m1', { state: 2 }]]);
		const summary = computeMastery(items, states, subjects);
		expect(summary.overallReadinessPct).toBe(33);
	});

	it('returns zero readiness when nothing has been studied', () => {
		const summary = computeMastery(items, new Map(), subjects);
		expect(summary.overallReadinessPct).toBe(0);
		expect(summary.subjects.every((s) => s.readinessPct === 0)).toBe(true);
	});

	it('handles an empty item set (boundary)', () => {
		const summary = computeMastery([], new Map(), subjects);
		expect(summary.overallReadinessPct).toBe(0);
	});
});
