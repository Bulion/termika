import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MicroSkill, StudyItem } from '../content/schema';
import { TermikaDb } from './db';
import { buildStudyQueue, selectItems } from './session';

const NOW = new Date('2026-01-01T12:00:00Z');

function card(id: string, microSkill: MicroSkill, loId: string, license = 'SPL'): StudyItem {
	return {
		id,
		type: 'flashcard',
		microSkill,
		loIds: [loId],
		licenses: [license as StudyItem['licenses'][number]],
		tags: [],
		confusableWith: [],
		front: { pl: id },
		back: { pl: id }
	};
}

const items: StudyItem[] = [
	card('a', 'abbreviation', 'MET.METAR'),
	card('b', 'concept_number', 'MET.ISA'),
	card('c', 'regulation', 'AIRLAW.VFR_MINIMA', 'PPL_A')
];

describe('selectItems', () => {
	it('filters by license', () => {
		expect(selectItems(items, { license: 'SPL' }).map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('filters by micro-skill', () => {
		expect(selectItems(items, { microSkills: ['abbreviation'] }).map((i) => i.id)).toEqual(['a']);
	});

	it('filters by learning objective', () => {
		expect(selectItems(items, { loIds: ['AIRLAW.VFR_MINIMA'] }).map((i) => i.id)).toEqual(['c']);
	});

	it('returns everything when no criteria are given', () => {
		expect(selectItems(items)).toHaveLength(3);
	});
});

describe('buildStudyQueue', () => {
	let db: TermikaDb;
	let dbName = 0;

	beforeEach(() => {
		db = new TermikaDb(`termika-session-${dbName++}`);
	});

	afterEach(async () => {
		await db.delete();
	});

	it('treats items with no card state as fresh', async () => {
		const queue = await buildStudyQueue(db, items, NOW);
		expect(queue.due).toHaveLength(0);
		expect(queue.fresh.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('keeps deck order for fresh items without a seed, shuffles with one', async () => {
		const noSeed = await buildStudyQueue(db, items, NOW);
		expect(noSeed.fresh.map((i) => i.id)).toEqual(['a', 'b', 'c']);

		const seeded = await buildStudyQueue(db, items, NOW, { shuffleSeed: 3 });
		expect([...seeded.fresh.map((i) => i.id)].sort()).toEqual(['a', 'b', 'c']);
		const again = await buildStudyQueue(db, items, NOW, { shuffleSeed: 3 });
		expect(seeded.fresh.map((i) => i.id)).toEqual(again.fresh.map((i) => i.id));
	});

	it('separates due cards (most overdue first) from fresh items', async () => {
		await db.cardState.put({
			itemId: 'b',
			due: new Date('2025-12-31T00:00:00Z'),
			state: 2,
			card: {} as never
		});
		await db.cardState.put({
			itemId: 'a',
			due: new Date('2025-12-30T00:00:00Z'),
			state: 2,
			card: {} as never
		});
		await db.cardState.put({
			itemId: 'c',
			due: new Date('2026-03-01T00:00:00Z'),
			state: 2,
			card: {} as never
		});

		const queue = await buildStudyQueue(db, items, NOW);
		expect(queue.due.map((i) => i.id)).toEqual(['a', 'b']);
		expect(queue.fresh).toHaveLength(0);
		expect(queue.all.map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('caps fresh items at newLimit (boundary: 0 yields none)', async () => {
		expect((await buildStudyQueue(db, items, NOW, { newLimit: 0 })).fresh).toHaveLength(0);
		expect((await buildStudyQueue(db, items, NOW, { newLimit: 2 })).fresh).toHaveLength(2);
	});

	it('rejects a negative newLimit', async () => {
		await expect(buildStudyQueue(db, items, NOW, { newLimit: -1 })).rejects.toBeInstanceOf(
			RangeError
		);
	});
});
