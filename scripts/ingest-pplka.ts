/**
 * Scrapes the SPL question bank from pplka.pl (tRPC API) and writes a normalized MCQ pool to
 * static/external/pplka-spl.json. That directory is git-ignored: pplka.pl content is
 * proprietary and is NOT redistributed in this repository - it is only built into a local
 * deployment for private study. Usage: npm run ingest:pplka
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	fetchPplkaCategories,
	fetchPplkaQuestions,
	pplkaToMcqs
} from '../src/lib/content/adapters/pplka.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, '..', 'static', 'external', 'pplka-spl.json');

const [raws, categories] = await Promise.all([fetchPplkaQuestions(), fetchPplkaCategories()]);
const questions = pplkaToMcqs(raws);

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify({ categories, questions })}\n`);
console.log(`Wrote ${questions.length} MCQs across ${categories.length} categories to ${outFile}`);
