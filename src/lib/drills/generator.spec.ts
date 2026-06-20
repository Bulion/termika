import { describe, expect, it } from 'vitest';
import type { Drill } from './schema';
import { computeExpected, generateProblem, generateValue, isWithinTolerance } from './generator';

const ktDrill: Drill = {
	id: 'kt-kmh',
	microSkill: 'unit_conversion',
	prompt: { pl: '{value} kt → km/h?' },
	generate: { min: 60, max: 320, step: 5 },
	op: { kind: 'convert', from: 'knot', to: 'km/h' },
	tolerancePct: 3,
	round: 0,
	tags: []
};

const linearDrill: Drill = {
	id: 'rod',
	microSkill: 'nav_rule',
	prompt: { pl: 'GS {value} kt → ROD?' },
	generate: { min: 70, max: 160, step: 10 },
	op: { kind: 'linear', factor: 5, offset: 0 },
	tolerancePct: 5,
	round: 0,
	tags: []
};

describe('generateValue', () => {
	it('returns the minimum at pick 0 and the maximum near pick 1', () => {
		expect(generateValue(ktDrill, () => 0)).toBe(60);
		expect(generateValue(ktDrill, () => 0.999999)).toBe(320);
	});

	it('snaps to the configured step', () => {
		expect(generateValue(ktDrill, () => 0.5)).toBe(190);
	});

	it('clamps out-of-range pick values', () => {
		expect(generateValue(ktDrill, () => -5)).toBe(60);
		expect(generateValue(ktDrill, () => 5)).toBe(320);
	});
});

describe('computeExpected', () => {
	it('converts units via convert-units', () => {
		expect(computeExpected(ktDrill.op, 100)).toBeCloseTo(185.2, 1);
	});

	it('applies a linear rule of thumb', () => {
		expect(computeExpected(linearDrill.op, 120)).toBe(600);
		expect(computeExpected({ kind: 'linear', factor: 1.8, offset: 32 }, 100)).toBe(212);
	});
});

describe('generateProblem', () => {
	it('substitutes the value into the prompt and computes the answer', () => {
		const problem = generateProblem(linearDrill, 'pl', () => 0);
		expect(problem.value).toBe(70);
		expect(problem.prompt).toBe('GS 70 kt → ROD?');
		expect(problem.expected).toBe(350);
	});
});

describe('isWithinTolerance', () => {
	it('accepts answers inside the band and rejects those outside', () => {
		expect(isWithinTolerance(200, 205, 3)).toBe(true);
		expect(isWithinTolerance(200, 220, 3)).toBe(false);
	});

	it('treats the band edge as inclusive (boundary)', () => {
		expect(isWithinTolerance(200, 206, 3)).toBe(true);
		expect(isWithinTolerance(200, 206.01, 3)).toBe(false);
	});

	it('requires an exact answer when the expected value is zero', () => {
		expect(isWithinTolerance(0, 0, 5)).toBe(true);
		expect(isWithinTolerance(0, 0.5, 5)).toBe(false);
	});

	it('rejects a non-finite answer (negative case)', () => {
		expect(isWithinTolerance(200, Number.NaN, 3)).toBe(false);
	});
});
