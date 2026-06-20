import { describe, expect, it } from 'vitest';
import { computeExpected, isWithinTolerance } from './generator';
import { allDrills, DrillValidationError, loadDrillSets } from './index';

describe('loadDrillSets (bundled data)', () => {
	it('loads the bundled drill sets and exposes drills', () => {
		const sets = loadDrillSets();
		expect(sets.length).toBeGreaterThan(0);
		expect(allDrills(sets).length).toBeGreaterThan(0);
	});

	it('every bundled drill produces a finite expected answer at its range edges', () => {
		for (const drill of allDrills()) {
			expect(Number.isFinite(computeExpected(drill.op, drill.generate.min))).toBe(true);
			expect(Number.isFinite(computeExpected(drill.op, drill.generate.max))).toBe(true);
		}
	});

	it('throws on an invalid drill set instead of dropping it', () => {
		const broken = {
			schemaVersion: 1,
			id: 'bad',
			title: { pl: 'X' },
			drills: [
				{
					id: 'd',
					microSkill: 'unit_conversion',
					prompt: { pl: '{value}?' },
					generate: { min: 1, max: 10, step: 1 },
					op: { kind: 'mystery' },
					tolerancePct: 5
				}
			]
		};
		expect(() => loadDrillSets([broken])).toThrow(DrillValidationError);
	});

	it('rejects a generate range where max is not greater than min', () => {
		const broken = {
			schemaVersion: 1,
			id: 'bad-range',
			title: { pl: 'X' },
			drills: [
				{
					id: 'd',
					microSkill: 'unit_conversion',
					prompt: { pl: '{value}?' },
					generate: { min: 10, max: 10, step: 1 },
					op: { kind: 'linear', factor: 1 },
					tolerancePct: 5
				}
			]
		};
		expect(() => loadDrillSets([broken])).toThrow(DrillValidationError);
	});

	it('sanity-checks a known conversion against the tolerance band', () => {
		expect(
			isWithinTolerance(computeExpected({ kind: 'convert', from: 'knot', to: 'km/h' }, 100), 185, 3)
		).toBe(true);
	});
});
