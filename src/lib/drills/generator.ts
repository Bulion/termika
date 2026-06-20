import convert from 'convert-units';
import { resolveText, type ContentLocale } from '../content/schema';
import { evaluateExpr } from './expr';
import type { Drill, DrillOp } from './schema';

export type DrillScope = Record<string, number>;

export interface DrillProblem {
	drillId: string;
	scope: DrillScope;
	expected: number;
	prompt: string;
	rule?: string;
	round: number;
	tolerancePct: number;
	timeLimitSec?: number;
}

function snap(min: number, max: number, step: number, pick: () => number): number {
	const steps = Math.floor((max - min) / step);
	const clamped = Math.min(Math.max(pick(), 0), 0.999999);
	return min + Math.round(clamped * steps) * step;
}

/** Generates the named input values for a drill (single `value`, or named `inputs`). */
export function generateScope(drill: Drill, pick: () => number = Math.random): DrillScope {
	if (drill.inputs) {
		const scope: DrillScope = {};
		for (const input of drill.inputs)
			scope[input.name] = snap(input.min, input.max, input.step, pick);
		return scope;
	}
	const { min, max, step } = drill.generate!;
	return { value: snap(min, max, step, pick) };
}

export function computeExpected(op: DrillOp, scope: DrillScope): number {
	if (op.kind === 'convert') {
		return convert(scope.value)
			.from(op.from as convert.Unit)
			.to(op.to as convert.Unit);
	}
	if (op.kind === 'linear') return scope.value * op.factor + op.offset;
	return evaluateExpr(op.expr, scope);
}

export function generateProblem(
	drill: Drill,
	locale: ContentLocale,
	pick: () => number = Math.random
): DrillProblem {
	const scope = generateScope(drill, pick);
	const expected = computeExpected(drill.op, scope);
	let prompt = resolveText(drill.prompt, locale);
	for (const [name, value] of Object.entries(scope)) {
		prompt = prompt.replaceAll(`{${name}}`, String(value));
	}
	return {
		drillId: drill.id,
		scope,
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
