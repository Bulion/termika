export interface CategoryBreakdown {
	id: string;
	correct: number;
	total: number;
}
export interface ExamRow {
	subjectId: string | null;
	scorePct: number;
	finishedAt: Date;
	categories?: CategoryBreakdown[];
}
export interface UlcCategory {
	id: string;
	name: string;
}
export interface CategoryReadiness {
	id: string;
	name: string;
	readinessPct: number;
	attempts: number;
}
export interface UlcReadiness {
	categories: CategoryReadiness[];
	overallPct: number;
}

const isUlc = (row: ExamRow): boolean => (row.subjectId ?? '').startsWith('ulc');

/** The percentage a row contributes to a category, or null if it does not cover it. */
function pctForCategory(row: ExamRow, categoryId: string): number | null {
	const entry = row.categories?.find((c) => c.id === categoryId);
	if (entry) return entry.total > 0 ? (entry.correct / entry.total) * 100 : null;
	if (row.subjectId === `ulc:${categoryId}`) return row.scorePct;
	return null;
}

function recentMean(values: { at: number; pct: number }[], recent: number): number | null {
	if (values.length === 0) return null;
	const picked = [...values].sort((a, b) => b.at - a.at).slice(0, recent);
	return picked.reduce((sum, v) => sum + v.pct, 0) / picked.length;
}

/**
 * Readiness from ULC exam results: each category averaged over its most recent attempts,
 * overall averaged over recent whole ULC attempts. Non-ULC (internal) rows are ignored.
 */
export function computeUlcReadiness(
	rows: ExamRow[],
	categories: UlcCategory[],
	recent = 5
): UlcReadiness {
	const ulcRows = rows.filter(isUlc);

	const categoryReadiness = categories.map((cat) => {
		const samples: { at: number; pct: number }[] = [];
		for (const row of ulcRows) {
			const pct = pctForCategory(row, cat.id);
			if (pct !== null) samples.push({ at: row.finishedAt.getTime(), pct });
		}
		const mean = recentMean(samples, recent);
		return {
			id: cat.id,
			name: cat.name,
			readinessPct: mean === null ? 0 : Math.round(mean),
			attempts: samples.length
		};
	});

	const overallSamples = ulcRows.map((row) => ({
		at: row.finishedAt.getTime(),
		pct: row.scorePct
	}));
	const overall = recentMean(overallSamples, recent);

	return { categories: categoryReadiness, overallPct: overall === null ? 0 : Math.round(overall) };
}
