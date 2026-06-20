import Dexie, { type Table } from 'dexie';
import type { Card, ReviewLog } from 'ts-fsrs';
import type { FluencyState } from '../drills/fluency';
import type { Grade } from './scheduler';

export interface CardStateRow {
	itemId: string;
	due: Date;
	state: number;
	card: Card;
}

export interface ReviewLogRow {
	id?: number;
	itemId: string;
	grade: Grade;
	review: Date;
	elapsedMs: number;
	log: ReviewLog;
}

export interface SettingRow {
	key: string;
	value: unknown;
}

export type DrillFluencyRow = { drillId: string } & FluencyState;

export interface MockResultRow {
	id?: number;
	licenseId: string;
	subjectId: string | null;
	scorePct: number;
	passed: boolean;
	finishedAt: Date;
}

export class TermikaDb extends Dexie {
	cardState!: Table<CardStateRow, string>;
	reviewLogs!: Table<ReviewLogRow, number>;
	settings!: Table<SettingRow, string>;
	drillFluency!: Table<DrillFluencyRow, string>;
	mockResults!: Table<MockResultRow, number>;

	constructor(name = 'termika') {
		super(name);
		this.version(1).stores({
			cardState: 'itemId, due, state',
			reviewLogs: '++id, itemId, review',
			settings: 'key',
			drillFluency: 'drillId, graduated',
			mockResults: '++id, licenseId, finishedAt'
		});
	}
}

export const db = new TermikaDb();
