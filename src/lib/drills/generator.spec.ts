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

describe('rule-of-thumb tolerance (aviation mental math)', () => {
	it('accepts both the rule-of-thumb and the precise conversion', () => {
		// kt -> km/h: rule x1.85, precise x1.852
		const ruleKmh = 100 * 1.85;
		expect(isWithinTolerance(ruleKmh, 100 * 1.852, 5)).toBe(true);
		// ft -> m: rule x0.3, precise x0.3048
		const ruleM = 35000 * 0.3;
		expect(isWithinTolerance(ruleM, 35000 * 0.3048, 5)).toBe(true);
	});

	it('accepts a rounded mental answer near the rule-of-thumb value', () => {
		// 120 kt -> rule 222 km/h; a pilot answering 220 should pass.
		expect(isWithinTolerance(120 * 1.85, 220, 5)).toBe(true);
	});

	it('still rejects an answer that ignores the conversion', () => {
		expect(isWithinTolerance(120 * 1.85, 120, 5)).toBe(false);
	});
});
