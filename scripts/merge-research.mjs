// Merges BA research batches (data/_research/*.json) into data/cocktails.json.
// Research-only fields (researchNotes) stay in the batch files for traceability.
// Usage: node scripts/merge-research.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'data/_research');
const FIELDS = ['id', 'name', 'era', 'yearCreated', 'glass', 'method', 'ingredients', 'garnish', 'instructions', 'history', 'tasteProfile', 'tags', 'popularity', 'sources'];

const cocktails = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .flatMap((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')))
  .map((c) => Object.fromEntries(FIELDS.map((k) => [k, c[k] ?? null])))
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(resolve(root, 'data/cocktails.json'), JSON.stringify({ version: '1.0.0', cocktails }, null, 2) + '\n');
console.log(`Wrote ${cocktails.length} cocktails to data/cocktails.json`);
