import { drillSetSchema, type Drill, type DrillSet } from './schema';

const drillModules = import.meta.glob('./data/*.json', { eager: true, import: 'default' });

export class DrillValidationError extends Error {
	constructor(readonly issues: string[]) {
		super(`Drill validation failed:\n${issues.join('\n')}`);
		this.name = 'DrillValidationError';
	}
}

/** Parses and validates all bundled drill sets, failing fast on any invalid set. */
export function loadDrillSets(raws: readonly unknown[] = Object.values(drillModules)): DrillSet[] {
	const sets: DrillSet[] = [];
	const issues: string[] = [];
	raws.forEach((raw, index) => {
		const result = drillSetSchema.safeParse(raw);
		if (result.success) sets.push(result.data);
		else {
			for (const issue of result.error.issues) {
				issues.push(`drillSet[#${index}] ${issue.path.join('.') || '(root)'}: ${issue.message}`);
			}
		}
	});
	if (issues.length > 0) throw new DrillValidationError(issues);
	return sets;
}

export function allDrills(sets: DrillSet[] = loadDrillSets()): Drill[] {
	return sets.flatMap((set) => set.drills);
}
