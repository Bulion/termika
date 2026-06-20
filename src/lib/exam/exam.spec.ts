import { describe, expect, it } from 'vitest';
import type { Mcq, StudyItem } from '../content/schema';
import type { Subject } from '../content/taxonomy';
import { loIdToSubject, mcqItemsForSubject, pickQuestions, scoreExam, shuffle } from './exam';

function mcq(id: string, loId: string, answer = 'a'): Mcq {
	return {
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: [loId],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: id },
		choices: [
			{ id: 'a', text: { pl: 'A' } },
			{ id: 'b', text: { pl: 'B' } }
		],
		answer
	};
}

const subjects: Subject[] = [
	{
		id: 'AIRLAW',
		name: { pl: 'Prawo' },
		los: [{ id: 'AIRLAW.1', text: { pl: 'x' }, licenses: ['SPL'] }]
	},
	{ id: 'MET', name: { pl: 'Meteo' }, los: [{ id: 'MET.1', text: { pl: 'x' }, licenses: ['SPL'] }] }
];

const loSubject = loIdToSubject(subjects);

const items: StudyItem[] = [
	mcq('q-law-1', 'AIRLAW.1'),
	mcq('q-law-2', 'AIRLAW.1'),
	mcq('q-met-1', 'MET.1'),
	{
		id: 'card',
		type: 'flashcard',
		microSkill: 'abbreviation',
		loIds: ['AIRLAW.1'],
		licenses: ['SPL'],
		tags: [],
		confusableWith: [],
		front: { pl: 'x' },
		back: { pl: 'y' }
	}
];

describe('mcqItemsForSubject', () => {
	it('returns only mcq items mapped to the subject via learning objectives', () => {
		const law = mcqItemsForSubject(items, 'SPL', 'AIRLAW', loSubject);
		expect(law.map((q) => q.id)).toEqual(['q-law-1', 'q-law-2']);
	});

	it('excludes items of other licenses', () => {
		expect(mcqItemsForSubject(items, 'ATPL', 'AIRLAW', loSubject)).toHaveLength(0);
	});
});

describe('shuffle / pickQuestions', () => {
	it('keeps all elements when shuffling', () => {
		const ids = shuffle(['a', 'b', 'c'], () => 0).sort();
		expect(ids).toEqual(['a', 'b', 'c']);
	});

	it('caps the number of questions at the pool size', () => {
		const pool = [mcq('1', 'AIRLAW.1'), mcq('2', 'AIRLAW.1')];
		expect(pickQuestions(pool, 16)).toHaveLength(2);
	});

	it('returns none when count is 0 (boundary)', () => {
		expect(pickQuestions([mcq('1', 'AIRLAW.1')], 0)).toHaveLength(0);
	});

	it('rejects a negative count', () => {
		expect(() => pickQuestions([], -1)).toThrow(RangeError);
	});
});

describe('scoreExam', () => {
	const questions = [mcq('q1', 'AIRLAW.1', 'a'), mcq('q2', 'AIRLAW.1', 'b')];

	it('scores correct, wrong and unanswered questions', () => {
		const result = scoreExam(
			questions,
			new Map([
				['q1', 'a'],
				['q2', null]
			]),
			75
		);
		expect(result.correct).toBe(1);
		expect(result.answered).toBe(1);
		expect(result.scorePct).toBe(50);
		expect(result.passed).toBe(false);
		expect(result.wrongItemIds).toContain('q2');
	});

	it('passes at exactly the pass mark (boundary)', () => {
		const result = scoreExam(
			questions,
			new Map([
				['q1', 'a'],
				['q2', 'b']
			]),
			100
		);
		expect(result.scorePct).toBe(100);
		expect(result.passed).toBe(true);
	});

	it('does not pass an empty exam', () => {
		const result = scoreExam([], new Map(), 0);
		expect(result.total).toBe(0);
		expect(result.passed).toBe(false);
	});
});
