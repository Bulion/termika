import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportState, importState, parseBackup, reviveDates } from './backup';
import { TermikaDb } from './db';

let db: TermikaDb;
let dbName = 0;

beforeEach(() => {
	db = new TermikaDb(`termika-backup-${dbName++}`);
});

afterEach(async () => {
	await db.delete();
});

describe('reviveDates', () => {
	it('converts ISO date strings to Date and leaves other strings alone', () => {
		const revived = reviveDates({ when: '2026-01-01T12:00:00.000Z', label: 'CAVOK' });
		expect(revived.when).toBeInstanceOf(Date);
		expect(revived.label).toBe('CAVOK');
	});
});

describe('export/import round-trip', () => {
	it('restores state through a JSON serialize/parse cycle', async () => {
		const due = new Date('2026-02-01T08:00:00.000Z');
		await db.cardState.put({ itemId: 'c1', due, state: 2, card: { due } as never });
		await db.mockResults.add({
			licenseId: 'SPL',
			subjectId: 'MET',
			scorePct: 80,
			passed: true,
			finishedAt: due
		});

		const json = JSON.stringify(await exportState(db));
		const restored = parseBackup(json);

		const fresh = new TermikaDb(`termika-backup-restore-${dbName++}`);
		await importState(fresh, restored);
		const card = await fresh.cardState.get('c1');
		expect(card?.state).toBe(2);
		expect(card?.due).toBeInstanceOf(Date);
		expect(card?.due.getTime()).toBe(due.getTime());
		expect(await fresh.mockResults.count()).toBe(1);
		await fresh.delete();
	});

	it('overwrites existing state on import', async () => {
		await db.cardState.put({
			itemId: 'old',
			due: new Date('2026-01-01T00:00:00.000Z'),
			state: 1,
			card: {} as never
		});
		const empty = parseBackup(
			JSON.stringify({
				version: 1,
				exportedAt: '2026-01-01T00:00:00.000Z',
				cardState: [],
				reviewLogs: [],
				drillFluency: [],
				mockResults: [],
				settings: []
			})
		);
		await importState(db, empty);
		expect(await db.cardState.count()).toBe(0);
	});
});

describe('parseBackup validation', () => {
	it('rejects an unsupported version', () => {
		expect(() => parseBackup(JSON.stringify({ version: 99 }))).toThrow(/version/);
	});

	it('rejects a backup missing a table', () => {
		expect(() =>
			parseBackup(JSON.stringify({ version: 1, exportedAt: 'x', cardState: [] }))
		).toThrow(/reviewLogs/);
	});
});
