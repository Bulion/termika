import { describe, expect, it } from 'vitest';
import type { Mcq, StudyItem } from '../content/schema';
import type { Subject } from '../content/taxonomy';
import {
	choiceOrder,
	dedupeExactMcqs,
	loIdToSubject,
	mcqItemsForSubject,
	pickQuestions,
	scoreByCategory,
	scoreExam,
	shuffle
} from './exam';

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

describe('scoreByCategory', () => {
	const tagged = (id: string, cat: string, answer = 'a'): Mcq => ({
		...mcq(id, 'lo', answer),
		tags: ['ulc', `cat-${cat}`]
	});

	it('groups correct/total by the cat tag', () => {
		const qs = [tagged('q1', '18'), tagged('q2', '18'), tagged('q3', '22')];
		const answers = new Map([
			['q1', 'a'],
			['q2', 'b'],
			['q3', 'a']
		]);
		const breakdown = scoreByCategory(qs, answers);
		expect(breakdown.find((c) => c.id === '18')).toEqual({ id: '18', correct: 1, total: 2 });
		expect(breakdown.find((c) => c.id === '22')).toEqual({ id: '22', correct: 1, total: 1 });
	});

	it('ignores questions without a category tag', () => {
		expect(scoreByCategory([mcq('x', 'lo')], new Map([['x', 'a']]))).toEqual([]);
	});
});

describe('dedupeExactMcqs', () => {
	const build = (id: string, stem: string, choiceTexts: string[], answer = 'a'): Mcq => ({
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['ulc'],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: stem },
		choices: choiceTexts.map((text, i) => ({ id: 'abcd'[i], text: { pl: text } })),
		answer
	});

	it('drops later byte-identical questions and keeps the first', () => {
		const original = build('q1', 'Kto podlega badaniom?', ['Pilot', 'Nikt']);
		const copy = build('q2', 'Kto podlega badaniom?', ['Pilot', 'Nikt'], 'b');
		expect(dedupeExactMcqs([original, copy]).map((q) => q.id)).toEqual(['q1']);
	});

	it('keeps same-stem variants with different choice texts', () => {
		const a = build('q1', 'Komu licencja?', ['Osobie A', 'Osobie B']);
		const b = build('q2', 'Komu licencja?', ['Osobie C', 'Osobie D']);
		expect(dedupeExactMcqs([a, b])).toHaveLength(2);
	});

	it('ignores whitespace, letter case and choice order', () => {
		const a = build('q1', 'Kto  podlega\nbadaniom?', ['Pilot', 'Nikt']);
		const b = build('q2', 'kto podlega badaniom?', ['nikt', 'PILOT']);
		expect(dedupeExactMcqs([a, b])).toHaveLength(1);
	});

	it('treats questions with different stems as distinct', () => {
		const a = build('q1', 'Pytanie pierwsze?', ['Pilot', 'Nikt']);
		const b = build('q2', 'Pytanie drugie?', ['Pilot', 'Nikt']);
		expect(dedupeExactMcqs([a, b])).toHaveLength(2);
	});
});

describe('choiceOrder', () => {
	const question: Mcq = {
		...mcq('q-order', 'AIRLAW.1'),
		choices: [
			{ id: 'a', text: { pl: 'A' } },
			{ id: 'b', text: { pl: 'B' } },
			{ id: 'c', text: { pl: 'C' } },
			{ id: 'd', text: { pl: 'D' } }
		]
	};

	it('keeps every choice exactly once', () => {
		const ids = choiceOrder(question, 7)
			.map((c) => c.id)
			.sort();
		expect(ids).toEqual(['a', 'b', 'c', 'd']);
	});

	it('is stable for the same question and seed', () => {
		expect(choiceOrder(question, 7)).toEqual(choiceOrder(question, 7));
	});

	it('produces a different order for at least one seed', () => {
		const original = question.choices.map((c) => c.id).join('');
		const seeds = Array.from({ length: 30 }, (_, i) => i);
		const orders = seeds.map((seed) =>
			choiceOrder(question, seed)
				.map((c) => c.id)
				.join('')
		);
		expect(orders.some((order) => order !== original)).toBe(true);
	});

	it('orders different questions differently under the same seed', () => {
		const other: Mcq = { ...question, id: 'q-other' };
		const seeds = Array.from({ length: 30 }, (_, i) => i);
		const differs = seeds.some(
			(seed) =>
				choiceOrder(question, seed)
					.map((c) => c.id)
					.join('') !==
				choiceOrder(other, seed)
					.map((c) => c.id)
					.join('')
		);
		expect(differs).toBe(true);
	});
});
