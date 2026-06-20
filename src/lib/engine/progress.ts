import type { CardStateRow, TermikaDb } from './db';
import type { Grade, Scheduler } from './scheduler';

export async function getCardState(
	db: TermikaDb,
	itemId: string
): Promise<CardStateRow | undefined> {
	return db.cardState.get(itemId);
}

export async function ensureCard(
	db: TermikaDb,
	scheduler: Scheduler,
	itemId: string,
	now: Date = new Date()
): Promise<CardStateRow> {
	const existing = await db.cardState.get(itemId);
	if (existing) return existing;
	const card = scheduler.newCard(now);
	const row: CardStateRow = { itemId, due: card.due, state: card.state, card };
	await db.cardState.put(row);
	return row;
}

/**
 * Grades an item, advances its FSRS schedule, persists the new card state and appends an
 * immutable review log. Returns the updated card state.
 */
export async function recordReview(
	db: TermikaDb,
	scheduler: Scheduler,
	itemId: string,
	grade: Grade,
	now: Date = new Date(),
	elapsedMs = 0
): Promise<CardStateRow> {
	if (elapsedMs < 0) throw new RangeError(`elapsedMs must be >= 0, got ${elapsedMs}`);
	const current = await ensureCard(db, scheduler, itemId, now);
	const { card, log } = scheduler.review(current.card, grade, now);
	const row: CardStateRow = { itemId, due: card.due, state: card.state, card };
	await db.transaction('rw', db.cardState, db.reviewLogs, async () => {
		await db.cardState.put(row);
		await db.reviewLogs.add({ itemId, grade, review: now, elapsedMs, log });
	});
	return row;
}

/** Item ids whose card is due at or before `now`, most overdue first. */
export async function dueItemIds(db: TermikaDb, now: Date = new Date()): Promise<string[]> {
	const rows = await db.cardState.where('due').belowOrEqual(now).toArray();
	return rows.sort((a, b) => a.due.getTime() - b.due.getTime()).map((r) => r.itemId);
}
