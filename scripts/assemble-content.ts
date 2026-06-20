/**
 * Assembles generated SPL content (from the spl-content-generation workflow output) into the
 * data-driven taxonomy and deck JSON the app loads. Usage:
 *   tsx scripts/assemble-content.ts <workflow-output.json>
 * Replaces taxonomy/learning-objectives.json, taxonomy/licenses.json and content/decks/*.json.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Loc {
	pl: string;
	en?: string;
}
interface GenSubject {
	subjectId: string;
	name: Loc;
	los: { id: string; text: Loc }[];
	flashcards: {
		id: string;
		microSkill: string;
		loId: string;
		front: Loc;
		back: Loc;
		mnemonic?: Loc;
		tags?: string[];
	}[];
	mcqs: {
		id: string;
		microSkill: string;
		loId: string;
		stem: Loc;
		choices: { id: string; text: Loc }[];
		answer: string;
		explanation?: Loc;
		tags?: string[];
	}[];
}

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'src', 'lib', 'content');
const decksDir = join(contentDir, 'decks');
const taxonomyDir = join(contentDir, 'taxonomy');

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Pass the workflow output JSON path as the first argument.');

const raw = JSON.parse(await readFile(inputPath, 'utf8'));
const subjects: GenSubject[] = raw.result?.subjects ?? raw.subjects ?? [];
if (!subjects.length) throw new Error('No subjects found in the workflow output.');

/** Drop an empty english string so the schema treats it as absent. */
function loc(value: Loc): Loc {
	return value.en && value.en.trim() ? { pl: value.pl, en: value.en } : { pl: value.pl };
}

let totalItems = 0;
let dropped = 0;
const seenIds = new Set<string>();
const taxonomySubjects: unknown[] = [];
const blueprint: unknown[] = [];
const deckFiles: { name: string; deck: unknown }[] = [];

for (const subject of subjects) {
	const loIds = new Set(subject.los.map((lo) => lo.id));
	const items: unknown[] = [];

	const keepId = (id: string) => {
		if (seenIds.has(id)) return false;
		seenIds.add(id);
		return true;
	};

	for (const card of subject.flashcards ?? []) {
		if (!loIds.has(card.loId) || !keepId(card.id)) {
			dropped++;
			continue;
		}
		items.push({
			id: card.id,
			type: 'flashcard',
			microSkill: card.microSkill,
			loIds: [card.loId],
			licenses: ['SPL'],
			tags: card.tags ?? [],
			...(card.mnemonic ? { mnemonic: loc(card.mnemonic) } : {}),
			front: loc(card.front),
			back: loc(card.back),
			source: 'authored:spl'
		});
	}

	let mcqCount = 0;
	for (const q of subject.mcqs ?? []) {
		const choiceIds = q.choices.map((c) => c.id);
		if (
			!loIds.has(q.loId) ||
			!choiceIds.includes(q.answer) ||
			q.choices.length < 2 ||
			!keepId(q.id)
		) {
			dropped++;
			continue;
		}
		mcqCount++;
		items.push({
			id: q.id,
			type: 'mcq',
			microSkill: q.microSkill,
			loIds: [q.loId],
			licenses: ['SPL'],
			tags: q.tags ?? [],
			stem: loc(q.stem),
			choices: q.choices.map((c) => ({ id: c.id, text: loc(c.text) })),
			answer: q.answer,
			...(q.explanation ? { explanation: loc(q.explanation) } : {}),
			source: 'authored:spl'
		});
	}

	if (!items.length) continue;
	totalItems += items.length;

	taxonomySubjects.push({
		id: subject.subjectId,
		name: loc(subject.name),
		los: subject.los.map((lo) => ({ id: lo.id, text: loc(lo.text), licenses: ['SPL'] }))
	});

	if (mcqCount > 0) {
		blueprint.push({
			subjectId: subject.subjectId,
			questionCount: Math.min(mcqCount, 16),
			timeLimitMin: 30,
			passPct: 75
		});
	}

	deckFiles.push({
		name: `spl-${subject.subjectId.toLowerCase()}.json`,
		deck: {
			schemaVersion: 1,
			id: `spl-${subject.subjectId.toLowerCase()}`,
			title: loc(subject.name),
			subjectId: subject.subjectId,
			items
		}
	});
}

await mkdir(decksDir, { recursive: true });
for (const file of await readdir(decksDir)) {
	if (file.endsWith('.json')) await rm(join(decksDir, file));
}
for (const { name, deck } of deckFiles) {
	await writeFile(join(decksDir, name), `${JSON.stringify(deck, null, 2)}\n`);
}

await writeFile(
	join(taxonomyDir, 'learning-objectives.json'),
	`${JSON.stringify({ schemaVersion: 1, subjects: taxonomySubjects }, null, 2)}\n`
);
await writeFile(
	join(taxonomyDir, 'licenses.json'),
	`${JSON.stringify(
		{
			schemaVersion: 1,
			licenses: [
				{
					id: 'SPL',
					name: { pl: 'SPL (szybowce)', en: 'SPL (sailplanes)' },
					examBlueprint: { subjects: blueprint }
				}
			]
		},
		null,
		2
	)}\n`
);

console.log(
	`Wrote ${deckFiles.length} decks, ${totalItems} items, ${blueprint.length} exam subjects (${dropped} dropped).`
);
