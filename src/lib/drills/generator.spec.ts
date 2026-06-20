import { describe, expect, it } from 'vitest';
import type { Drill } from './schema';
import {
	computeExpected,
	generateProblem,
	generateScope,
	isAnswerAccepted,
	isWithinTolerance,
	type DrillProblem
} from './generator';

const tsdDrill: Drill = {
	id: 'tsd',
	microSkill: 'nav_rule',
	prompt: { pl: '{distance} NM przy {speed} kt → min?' },
	inputs: [
		{ name: 'distance', min: 10, max: 100, step: 10 },
		{ name: 'speed', min: 60, max: 120, step: 10 }
	],
	op: { kind: 'formula', expr: 'distance / speed * 60' },
	tolerancePct: 5,
	round: 0,
	tags: []
};

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

describe('generateScope', () => {
	it('returns the minimum at pick 0 and the maximum near pick 1', () => {
		expect(generateScope(ktDrill, () => 0)).toEqual({ value: 60 });
		expect(generateScope(ktDrill, () => 0.999999)).toEqual({ value: 320 });
	});

	it('snaps to the configured step', () => {
		expect(generateScope(ktDrill, () => 0.5)).toEqual({ value: 190 });
	});

	it('generates one value per named input', () => {
		expect(generateScope(tsdDrill, () => 0)).toEqual({ distance: 10, speed: 60 });
	});
});

describe('computeExpected', () => {
	it('converts units via convert-units', () => {
		expect(computeExpected(ktDrill.op, { value: 100 })).toBeCloseTo(185.2, 1);
	});

	it('applies a linear rule of thumb', () => {
		expect(computeExpected(linearDrill.op, { value: 120 })).toBe(600);
		expect(computeExpected({ kind: 'linear', factor: 1.8, offset: 32 }, { value: 100 })).toBe(212);
	});

	it('evaluates a multi-input formula', () => {
		expect(computeExpected(tsdDrill.op, { distance: 30, speed: 90 })).toBe(20);
	});

	it('solves the wind triangle for ground speed', () => {
		const gs = computeExpected({ kind: 'wind', solve: 'gs' }, { tas: 100, tc: 90, wd: 90, ws: 20 });
		expect(gs).toBeCloseTo(80, 1);
	});
});

describe('isAnswerAccepted', () => {
	const base: DrillProblem = {
		drillId: 'd',
		scope: {},
		expected: 0,
		prompt: '',
		round: 0
	};

	it('uses an absolute band when set', () => {
		const problem = { ...base, expected: 120, toleranceAbs: 2 };
		expect(isAnswerAccepted(problem, 122)).toBe(true);
		expect(isAnswerAccepted(problem, 123)).toBe(false);
	});

	it('compares bearings the short way around when circular', () => {
		const problem = { ...base, expected: 2, toleranceAbs: 3, circular: true };
		expect(isAnswerAccepted(problem, 359)).toBe(true);
		expect(isAnswerAccepted(problem, 350)).toBe(false);
	});

	it('falls back to a percentage band', () => {
		const problem = { ...base, expected: 200, tolerancePct: 5 };
		expect(isAnswerAccepted(problem, 209)).toBe(true);
		expect(isAnswerAccepted(problem, 211)).toBe(false);
	});

	it('rejects a non-finite answer (negative case)', () => {
		expect(isAnswerAccepted({ ...base, expected: 100, toleranceAbs: 1 }, Number.NaN)).toBe(false);
	});
});

describe('generateProblem', () => {
	it('substitutes the value into the prompt and computes the answer', () => {
		const problem = generateProblem(linearDrill, 'pl', () => 0);
		expect(problem.scope).toEqual({ value: 70 });
		expect(problem.prompt).toBe('GS 70 kt → ROD?');
		expect(problem.expected).toBe(350);
	});

	it('substitutes multiple named inputs and evaluates the formula', () => {
		const problem = generateProblem(tsdDrill, 'pl', () => 0);
		expect(problem.prompt).toBe('10 NM przy 60 kt → min?');
		expect(problem.expected).toBeCloseTo(10, 5);
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
