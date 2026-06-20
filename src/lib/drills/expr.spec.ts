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

	it('throws on an unknown variable (negative case)', () => {
		expect(() => evaluateExpr('a + b', { a: 1 })).toThrow(/unknown variable/);
	});

	it('throws on malformed input', () => {
		expect(() => evaluateExpr('2 +', {})).toThrow();
		expect(() => evaluateExpr('(2 + 3', {})).toThrow();
	});
});
