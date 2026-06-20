import { describe, expect, it } from 'vitest';
import { solveWindTriangle } from './wind';

describe('solveWindTriangle', () => {
	it('a pure headwind only slows ground speed', () => {
		const sol = solveWindTriangle(100, 90, 90, 20);
		expect(sol.windCorrectionAngle).toBeCloseTo(0, 5);
		expect(sol.trueHeading).toBeCloseTo(90, 5);
		expect(sol.groundSpeed).toBeCloseTo(80, 5);
	});

	it('a pure tailwind only speeds ground speed', () => {
		const sol = solveWindTriangle(100, 90, 270, 20);
		expect(sol.windCorrectionAngle).toBeCloseTo(0, 5);
		expect(sol.groundSpeed).toBeCloseTo(120, 5);
	});

	it('a crosswind from the right needs a right correction', () => {
		const sol = solveWindTriangle(100, 90, 180, 20);
		expect(sol.windCorrectionAngle).toBeCloseTo(11.54, 1);
		expect(sol.trueHeading).toBeCloseTo(101.54, 1);
		expect(sol.groundSpeed).toBeCloseTo(97.98, 1);
	});

	it('throws when the crosswind exceeds the airspeed (negative case)', () => {
		expect(() => solveWindTriangle(15, 90, 180, 40)).toThrow(/exceeds TAS/);
	});

	it('rejects a non-positive airspeed', () => {
		expect(() => solveWindTriangle(0, 90, 180, 10)).toThrow(/tas must be/);
	});
});
