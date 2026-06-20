/**
 * Maps Polish ULC question-code prefixes (e.g. PL010 in "PL010-0001") to theory subjects.
 * Derived from the pplka.pl dataset, which carries both the code and its category. Shared by
 * sources that only expose the ULC code (e.g. fifly) so they can offer per-category exams.
 */
export interface UlcSubject {
	id: string;
	name: string;
}

export const ULC_SUBJECTS: UlcSubject[] = [
	{ id: 'AIRLAW', name: 'Prawo lotnicze' },
	{ id: 'AGK', name: 'Ogólna wiedza o statku powietrznym' },
	{ id: 'PERF', name: 'Osiągi i planowanie lotu' },
	{ id: 'HPL', name: 'Człowiek - możliwości i ograniczenia' },
	{ id: 'MET', name: 'Meteorologia' },
	{ id: 'NAV', name: 'Nawigacja' },
	{ id: 'OPS', name: 'Procedury operacyjne' },
	{ id: 'POF', name: 'Zasady lotu' },
	{ id: 'COM', name: 'Łączność' }
];

const SUBJECT_BY_ID = new Map(ULC_SUBJECTS.map((s) => [s.id, s]));

const PREFIX_TO_SUBJECT: Record<string, string> = {
	PL010: 'AIRLAW',
	PL099: 'AIRLAW',
	PL100: 'AIRLAW',
	PL102: 'AIRLAW',
	PL020: 'AGK',
	PL025: 'AGK',
	PL030: 'PERF',
	PL040: 'HPL',
	PL050: 'MET',
	PL060: 'NAV',
	PL070: 'OPS',
	PL080: 'POF',
	PL090: 'COM'
};

/** Resolves the subject for a ULC question code such as "PL050-0123", or undefined if unknown. */
export function subjectForCode(code: string): UlcSubject | undefined {
	const match = code.match(/^([A-Za-z]+\d+)/);
	if (!match) return undefined;
	const id = PREFIX_TO_SUBJECT[match[1].toUpperCase()];
	return id ? SUBJECT_BY_ID.get(id) : undefined;
}

export function ulcSubjectName(id: string): string {
	return SUBJECT_BY_ID.get(id)?.name ?? id;
}
