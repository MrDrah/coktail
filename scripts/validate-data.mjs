// Cross-file validation for data/ingredients.json and data/cocktails.json.
// Implements the rules in data/schema/cocktail.schema.md §4. Exit code 1 on any error.
// Usage: node scripts/validate-data.mjs [cocktailsFile]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dict = JSON.parse(readFileSync(resolve(root, 'data/ingredients.json'), 'utf8'));
const cocktailsPath = resolve(root, process.argv[2] ?? 'data/cocktails.json');
const lib = JSON.parse(readFileSync(cocktailsPath, 'utf8'));
const cocktails = Array.isArray(lib) ? lib : lib.cocktails;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATEGORIES = new Set(['spirit', 'liqueur', 'aperitif', 'vermouth-fortified', 'wine', 'citrus', 'juice', 'fruit', 'syrup-sweetener', 'bitters', 'mixer', 'dairy-egg', 'herb-spice', 'savory', 'excluded']);
const METHODS = new Set(['shake', 'stir', 'build', 'blend', 'throw', 'swizzle', 'muddle-build']);
const UNITS = new Set(['ml', 'dash', 'drop', 'barspoon', 'piece', 'leaf', 'sprig', 'pinch', 'top', 'splash', null]);
const TAGS = new Set(['sour', 'highball', 'spirit-forward', 'fizz', 'collins', 'tiki', 'sparkling', 'creamy', 'coffee', 'hot', 'bitter', 'herbal', 'fruity', 'citrus', 'savory', 'classic', 'contemporary', 'iba',
  'aperitif', 'after-dinner', 'low-abv', 'refreshing', 'floral', 'spicy', 'sweet', 'dry', 'smoky', 'brunch', 'frozen', 'tropical', 'foamy', 'strong']);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// --- Dictionary ---
const byId = new Map();
const termOwner = new Map(); // normalised name/synonym -> id
for (const ing of dict.ingredients) {
  if (!ID_RE.test(ing.id)) err(`ingredient id not kebab-case: ${ing.id}`);
  if (byId.has(ing.id)) err(`duplicate ingredient id: ${ing.id}`);
  byId.set(ing.id, ing);
  if (!CATEGORIES.has(ing.category)) err(`${ing.id}: bad category ${ing.category}`);
  if (!['counted', 'excluded'].includes(ing.classification)) err(`${ing.id}: bad classification`);
  if (typeof ing.pairingWeight !== 'number' || ing.pairingWeight < 0 || ing.pairingWeight > 1) err(`${ing.id}: pairingWeight out of range`);
  for (const t of [ing.name, ...ing.synonyms]) {
    const k = norm(t);
    if (termOwner.has(k) && termOwner.get(k) !== ing.id) err(`term "${k}" maps to both ${termOwner.get(k)} and ${ing.id}`);
    termOwner.set(k, ing.id);
  }
}
const excluded = dict.ingredients.filter((i) => i.classification === 'excluded').map((i) => i.id).sort();
if (excluded.join() !== 'ice,water') err(`excluded set must be exactly ice,water; got ${excluded}`);
if (byId.get('soda-water')?.classification !== 'counted') err('soda-water must be counted (BR-03)');
for (const ing of dict.ingredients) for (const p of ing.provides ?? []) if (!byId.has(p)) err(`${ing.id}.provides unknown ${p}`);
for (const g of dict.ambiguityGroups) {
  if (termOwner.has(norm(g.term))) err(`ambiguity term "${g.term}" is also a name/synonym of ${termOwner.get(norm(g.term))}`);
  if (g.options.length < 2) err(`ambiguity group "${g.term}" needs 2+ options`);
  for (const o of g.options) if (!byId.has(o)) err(`ambiguity "${g.term}" unknown option ${o}`);
}

// --- Cocktails ---
const paragraphs = (s) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const words = (p) => p.split(/\s+/).length;
const seenIds = new Set();
const seenNames = new Set();
const used = new Set();
for (const c of cocktails) {
  const at = `cocktail ${c.id ?? '?'}`;
  if (!ID_RE.test(c.id ?? '')) err(`${at}: id not kebab-case`);
  if (seenIds.has(c.id)) err(`${at}: duplicate id`);
  if (seenNames.has(norm(c.name ?? ''))) err(`${at}: duplicate name`);
  seenIds.add(c.id); seenNames.add(norm(c.name ?? ''));
  if (!['vintage', 'modern'].includes(c.era)) err(`${at}: bad era`);
  if (c.yearCreated != null) {
    if (!Number.isInteger(c.yearCreated)) err(`${at}: yearCreated not integer`);
    else if ((c.yearCreated < 1960) !== (c.era === 'vintage')) err(`${at}: era ${c.era} inconsistent with year ${c.yearCreated}`);
  }
  if (!c.glass) err(`${at}: missing glass`);
  if (!METHODS.has(c.method)) err(`${at}: bad method ${c.method}`);
  if (!Array.isArray(c.instructions) || c.instructions.length < 1 || c.instructions.length > 8) err(`${at}: instructions must be 1–8 steps`);
  if (!('garnish' in c)) err(`${at}: missing garnish field`);

  let countedRequired = 0;
  for (const ri of c.ingredients ?? []) {
    const ing = byId.get(ri.id);
    if (!ing) { err(`${at}: unknown ingredient ${ri.id}`); continue; }
    used.add(ri.id);
    if (!UNITS.has(ri.unit)) err(`${at}: ${ri.id} bad unit ${ri.unit}`);
    // Sources sometimes give "a few dashes": keep it unquantified, but require the note that says so.
    const nullAmountOk = ri.unit === 'top' || ri.unit === 'splash' || ri.unit === null || Boolean(ri.note);
    if (ri.amount == null ? !nullAmountOk : !(ri.amount > 0)) err(`${at}: ${ri.id} bad amount ${ri.amount} ${ri.unit}`);
    if (typeof ri.optional !== 'boolean') err(`${at}: ${ri.id} optional must be boolean`);
    if (ing.classification === 'counted' && !ri.optional) countedRequired++;
  }
  if (countedRequired < 2) err(`${at}: needs 2+ counted required ingredients (has ${countedRequired})`);

  const hp = paragraphs(c.history ?? '');
  const tp = paragraphs(c.tasteProfile ?? '');
  if (hp.length < 1 || hp.length > 2) err(`${at}: history must be 1–2 paragraphs (has ${hp.length})`);
  if (tp.length !== 1) err(`${at}: tasteProfile must be 1 paragraph (has ${tp.length})`);
  for (const p of [...hp, ...tp]) {
    const w = words(p);
    if (w < 40 || w > 110) warnings.push(`${at}: paragraph of ${w} words (guideline 40–110)`);
  }
  for (const t of c.tags ?? []) if (!TAGS.has(t)) err(`${at}: unknown tag ${t}`);
  if (!Number.isInteger(c.popularity) || c.popularity < 0 || c.popularity > 100) err(`${at}: popularity must be 0–100 integer`);

  const src = c.sources ?? [];
  if (!src.some((s) => s.type === 'recipe')) err(`${at}: needs a recipe source`);
  if (!src.some((s) => s.type === 'history')) err(`${at}: needs a history source`);
  for (const s of src) {
    if (!/^https:\/\//.test(s.url ?? '')) err(`${at}: source url must be https`);
    if (!s.publisher || !s.title) err(`${at}: source missing publisher/title`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.accessed ?? '')) err(`${at}: source accessed date must be YYYY-MM-DD`);
  }
}
for (const id of byId.keys()) if (!used.has(id)) warnings.push(`dictionary ingredient unused by library: ${id}`);

console.log(`Dictionary: ${byId.size} ingredients, ${dict.ambiguityGroups.length} ambiguity groups`);
console.log(`Library: ${cocktails.length} cocktails`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ` + warnings.join('\n  '));
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\nOK: all validation rules pass.');
