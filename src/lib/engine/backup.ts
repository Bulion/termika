import type {
	CardStateRow,
	DrillFluencyRow,
	MockResultRow,
	ReviewLogRow,
	SettingRow,
	TermikaDb
} from './db';

export const BACKUP_VERSION = 1;

export interface BackupData {
	version: number;
	exportedAt: string;
	cardState: CardStateRow[];
	reviewLogs: ReviewLogRow[];
	drillFluency: DrillFluencyRow[];
	mockResults: MockResultRow[];
	settings: SettingRow[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Recursively revives ISO date strings back into Date objects after JSON parsing. */
export function reviveDates<T>(value: T): T {
	if (typeof value === 'string') {
		return (ISO_DATE.test(value) ? new Date(value) : value) as T;
	}
	if (Array.isArray(value)) return value.map((entry) => reviveDates(entry)) as T;
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) out[key] = reviveDates(entry);
		return out as T;
	}
	return value;
}

export async function exportState(
	db: TermikaDb,
	exportedAt: Date = new Date()
): Promise<BackupData> {
	const [cardState, reviewLogs, drillFluency, mockResults, settings] = await Promise.all([
		db.cardState.toArray(),
		db.reviewLogs.toArray(),
		db.drillFluency.toArray(),
		db.mockResults.toArray(),
		db.settings.toArray()
	]);
	return {
		version: BACKUP_VERSION,
		exportedAt: exportedAt.toISOString(),
		cardState,
		reviewLogs,
		drillFluency,
		mockResults,
		settings
	};
}

export function parseBackup(json: string): BackupData {
	const raw = reviveDates(JSON.parse(json)) as Partial<BackupData>;
	if (raw.version !== BACKUP_VERSION) {
		throw new Error(`Unsupported backup version: ${String(raw.version)}`);
	}
	const tables: (keyof BackupData)[] = [
		'cardState',
		'reviewLogs',
		'drillFluency',
		'mockResults',
		'settings'
	];
	for (const table of tables) {
		if (!Array.isArray(raw[table])) throw new Error(`Backup is missing the "${table}" table`);
	}
	return raw as BackupData;
}

/** Replaces all local user state with the backup. Existing progress is overwritten. */
export async function importState(db: TermikaDb, data: BackupData): Promise<void> {
	await db.transaction(
		'rw',
		[db.cardState, db.reviewLogs, db.drillFluency, db.mockResults, db.settings],
		async () => {
			await Promise.all([
				db.cardState.clear(),
				db.reviewLogs.clear(),
				db.drillFluency.clear(),
				db.mockResults.clear(),
				db.settings.clear()
			]);
			await db.cardState.bulkPut(data.cardState);
			await db.reviewLogs.bulkPut(data.reviewLogs);
			await db.drillFluency.bulkPut(data.drillFluency);
			await db.mockResults.bulkPut(data.mockResults);
			await db.settings.bulkPut(data.settings);
		}
	);
}
