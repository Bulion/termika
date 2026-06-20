import type { TermikaDb } from '../engine/db';
import {
	DEFAULT_FLUENCY_CONFIG,
	emptyFluency,
	updateFluency,
	type Attempt,
	type FluencyConfig,
	type FluencyState
} from './fluency';

export async function getFluency(db: TermikaDb, drillId: string): Promise<FluencyState> {
	const row = await db.drillFluency.get(drillId);
	if (!row) return emptyFluency();
	const { drillId: _drillId, ...state } = row;
	return state;
}

/** Records a drill attempt, advances the fluency state machine and persists it. */
export async function recordDrillAttempt(
	db: TermikaDb,
	drillId: string,
	attempt: Attempt,
	config: FluencyConfig = DEFAULT_FLUENCY_CONFIG
): Promise<FluencyState> {
	const next = updateFluency(await getFluency(db, drillId), attempt, config);
	await db.drillFluency.put({ drillId, ...next });
	return next;
}
