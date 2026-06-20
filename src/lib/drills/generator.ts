import convert from 'convert-units';
import { resolveText, type ContentLocale } from '../content/schema';
import type { Drill, DrillOp } from './schema';

export interface DrillProblem {
	drillId: string;
	value: number;
	expected: number;
	prompt: string;
	rule?: string;
	round: number;
	tolerancePct: number;
	timeLimitSec?: number;
}

export function computeExpected(op: DrillOp, value: number): number {
	if (op.kind === 'convert') {
		return convert(value)
			.from(op.from as convert.Unit)
			.to(op.to as convert.Unit);
	}
	return value * op.factor + op.offset;
}

/** Picks a value on the drill's `min..max` grid using `pick`, an rng returning [0, 1). */
export function generateValue(drill: Drill, pick: () => number = Math.random): number {
	const { min, max, step } = drill.generate;
	const steps = Math.floor((max - min) / step);
	const clamped = Math.min(Math.max(pick(), 0), 0.999999);
	const index = Math.round(clamped * steps);
	return min + index * step;
}

export function generateProblem(
	drill: Drill,
	locale: ContentLocale,
	pick: () => number = Math.random
): DrillProblem {
	const value = generateValue(drill, pick);
	const expected = computeExpected(drill.op, value);
	const prompt = resolveText(drill.prompt, locale).replaceAll('{value}', String(value));
	return {
		drillId: drill.id,
		value,
		expected,
		prompt,
		rule: drill.rule ? resolveText(drill.rule, locale) : undefined,
		round: drill.round,
		tolerancePct: drill.tolerancePct,
		timeLimitSec: drill.timeLimitSec
	};
}

/**
 * Whether `answer` is within the drill's tolerance band around `expected`. When the exact
 * answer is zero the band collapses, so an exact (epsilon-tolerant) match is required.
 */
export function isWithinTolerance(expected: number, answer: number, tolerancePct: number): boolean {
	if (!Number.isFinite(answer)) return false;
	const band = Math.abs(expected) * (tolerancePct / 100);
	return Math.abs(answer - expected) <= band + 1e-9;
}
