import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TermikaDb } from '../engine/db';
import { DEFAULT_FLUENCY_CONFIG } from './fluency';
import { getFluency, recordDrillAttempt } from './progress';

let db: TermikaDb;
let dbName = 0;

beforeEach(() => {
	db = new TermikaDb(`termika-drill-${dbName++}`);
});

afterEach(async () => {
	await db.delete();
});

describe('drill fluency persistence', () => {
	it('returns an empty fluency state for an unseen drill', async () => {
		const state = await getFluency(db, 'kt-kmh');
		expect(state.attempts).toBe(0);
		expect(state.graduated).toBe(false);
	});

	it('accumulates attempts across calls', async () => {
		await recordDrillAttempt(db, 'kt-kmh', { correct: true, latencyMs: 1500 });
		const state = await recordDrillAttempt(db, 'kt-kmh', { correct: false, latencyMs: 2500 });
		expect(state.attempts).toBe(2);
		expect(state.correct).toBe(1);
		expect(await db.drillFluency.count()).toBe(1);
	});

	it('persists graduation once fast and accurate', async () => {
		let last;
		for (let i = 0; i < DEFAULT_FLUENCY_CONFIG.minAttempts; i += 1) {
			last = await recordDrillAttempt(db, 'rod-3deg', { correct: true, latencyMs: 1200 });
		}
		expect(last?.graduated).toBe(true);
		expect((await getFluency(db, 'rod-3deg')).graduated).toBe(true);
	});
});
