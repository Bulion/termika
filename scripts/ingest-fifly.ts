import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchFiflyMarkdown, parseFiflyMarkdown } from '../src/lib/content/adapters/fifly.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, '..', 'content-generated', 'fifly-ppl-a.json');

const markdown = await fetchFiflyMarkdown();
let skipped = 0;
const deck = parseFiflyMarkdown(markdown, {
	deckId: 'fifly-ppl-a',
	title: { pl: 'fifly PPL(A)', en: 'fifly PPL(A)' },
	subjectId: 'AIRLAW',
	loId: 'AIRLAW.VFR_MINIMA',
	onInvalidBlock: (issue) => {
		skipped += 1;
		console.warn(`skipped ${issue}`);
	}
});

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(deck, null, 2)}\n`);
console.log(`Wrote ${deck.items.length} questions (${skipped} skipped) to ${outFile}`);
