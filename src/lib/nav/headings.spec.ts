import { describe, expect, it } from 'vitest';
import {
	angularDiff,
	compassToTrue,
	magneticToTrue,
	normalizeDeg,
	trueToCompass,
	trueToMagnetic
} from './headings';

describe('normalizeDeg', () => {
	it('wraps into [0, 360)', () => {
		expect(normalizeDeg(365)).toBe(5);
		expect(normalizeDeg(-10)).toBe(350);
		expect(normalizeDeg(0)).toBe(0);
		expect(normalizeDeg(360)).toBe(0);
	});
});

describe('angularDiff', () => {
	it('takes the short way around the compass', () => {
		expect(angularDiff(350, 10)).toBe(20);
		expect(angularDiff(10, 350)).toBe(20);
		expect(angularDiff(90, 270)).toBe(180);
	});
});

describe('variation (true <-> magnetic)', () => {
	it('east variation makes magnetic least', () => {
		expect(trueToMagnetic(100, -6)).toBe(94);
	});

	it('west variation makes magnetic best', () => {
		expect(trueToMagnetic(100, 6)).toBe(106);
	});

	it('wraps across north', () => {
		expect(trueToMagnetic(357, 8)).toBe(5);
		expect(magneticToTrue(2, 8)).toBe(354);
	});
});

describe('full chain (true <-> compass)', () => {
	it('adds west variation and deviation going to compass', () => {
		expect(trueToCompass(120, 5, 3)).toBe(128);
	});

	it('subtracts them coming back to true', () => {
		expect(compassToTrue(128, 5, 3)).toBe(120);
	});

	it('handles east values as negatives', () => {
		expect(trueToCompass(120, -5, -3)).toBe(112);
	});
});
