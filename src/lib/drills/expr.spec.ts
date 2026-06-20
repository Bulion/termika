import { describe, expect, it } from 'vitest';
import { evaluateExpr } from './expr';

describe('evaluateExpr', () => {
	it('evaluates arithmetic with precedence', () => {
		expect(evaluateExpr('2 + 3 * 4', {})).toBe(14);
		expect(evaluateExpr('(2 + 3) * 4', {})).toBe(20);
	});

	it('resolves variables from the scope', () => {
		expect(evaluateExpr('distance / speed * 60', { distance: 30, speed: 90 })).toBe(20);
		expect(evaluateExpr('offset / leg * 60', { offset: 8, leg: 120 })).toBe(4);
	});

	it('handles unary minus and division', () => {
		expect(evaluateExpr('-6 / 2', {})).toBe(-3);
		expect(evaluateExpr('10 - -5', {})).toBe(15);
	});

	it('supports modulo for compass wrap-around', () => {
		expect(evaluateExpr('(th + 360) % 360', { th: 5 })).toBe(5);
		expect(evaluateExpr('(357 + 8) % 360', {})).toBe(5);
	});

	it('evaluates whitelisted functions (trig in degrees)', () => {
		expect(evaluateExpr('sqrt(16)', {})).toBe(4);
		expect(evaluateExpr('1 / cos(60)', {})).toBeCloseTo(2, 6);
		expect(evaluateExpr('vs / sqrt(cos(bank))', { vs: 70, bank: 60 })).toBeCloseTo(98.99, 1);
	});

	it('throws on an unknown function (negative case)', () => {
		expect(() => evaluateExpr('foo(2)', {})).toThrow(/unknown function/);
	});

	it('throws on an unknown variable (negative case)', () => {
		expect(() => evaluateExpr('a + b', { a: 1 })).toThrow(/unknown variable/);
	});

	it('throws on malformed input', () => {
		expect(() => evaluateExpr('2 +', {})).toThrow();
		expect(() => evaluateExpr('(2 + 3', {})).toThrow();
	});
});
