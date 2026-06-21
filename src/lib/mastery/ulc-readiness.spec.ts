import { describe, expect, it } from 'vitest';
import { computeUlcReadiness, type ExamRow } from './ulc-readiness';

const cats = [
	{ id: '18', name: 'Meteorologia' },
	{ id: '22', name: 'Nawigacja' }
];
const at = (s: string): Date => new Date(`2026-06-${s}T10:00:00Z`);

describe('computeUlcReadiness', () => {
	it('returns 0% for every category and overall when there are no attempts', () => {
		const r = computeUlcReadiness([], cats);
		expect(r.overallPct).toBe(0);
		expect(r.categories.map((c) => c.readinessPct)).toEqual([0, 0]);
	});

	it('derives per-category readiness from a whole-bank attempt breakdown', () => {
		const rows: ExamRow[] = [
			{
				subjectId: 'ulc',
				scorePct: 75,
				finishedAt: at('01'),
				categories: [
					{ id: '18', correct: 8, total: 10 },
					{ id: '22', correct: 5, total: 10 }
				]
			}
		];
		const r = computeUlcReadiness(rows, cats);
		expect(r.categories.find((c) => c.id === '18')?.readinessPct).toBe(80);
		expect(r.categories.find((c) => c.id === '22')?.readinessPct).toBe(50);
		expect(r.overallPct).toBe(75);
	});

	it('uses scorePct for a legacy per-category attempt (subjectId ulc:<id>)', () => {
		const rows: ExamRow[] = [{ subjectId: 'ulc:18', scorePct: 70, finishedAt: at('02') }];
		expect(
			computeUlcReadiness(rows, cats).categories.find((c) => c.id === '18')?.readinessPct
		).toBe(70);
	});

	it('averages the recent attempts per category', () => {
		const rows: ExamRow[] = [
			{ subjectId: 'ulc:18', scorePct: 70, finishedAt: at('01') },
			{ subjectId: 'ulc:18', scorePct: 90, finishedAt: at('02') }
		];
		expect(
			computeUlcReadiness(rows, cats).categories.find((c) => c.id === '18')?.readinessPct
		).toBe(80);
	});

	it('only averages the most recent N attempts', () => {
		const rows: ExamRow[] = [
			{ subjectId: 'ulc:18', scorePct: 0, finishedAt: at('01') },
			{ subjectId: 'ulc:18', scorePct: 100, finishedAt: at('02') },
			{ subjectId: 'ulc:18', scorePct: 100, finishedAt: at('03') }
		];
		// recent=2 -> average of the two latest (100, 100) = 100
		expect(
			computeUlcReadiness(rows, cats, 2).categories.find((c) => c.id === '18')?.readinessPct
		).toBe(100);
	});

	it('ignores internal (non-ULC) exam rows', () => {
		const rows: ExamRow[] = [{ subjectId: 'met', scorePct: 90, finishedAt: at('01') }];
		const r = computeUlcReadiness(rows, cats);
		expect(r.overallPct).toBe(0);
		expect(r.categories.every((c) => c.readinessPct === 0)).toBe(true);
	});
});
