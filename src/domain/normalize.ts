// Maps free-text user input to canonical ingredient IDs (BR-04, BR-08).
// Contract: data/schema/cocktail.schema.md §1 "Normalisation contract".
import type { Ingredient, IngredientDictionary, IngredientRef } from './types';

export type NormalizeResult =
  | { status: 'ok'; raw: string; id: string; name: string }
  | { status: 'excluded'; raw: string; kind: 'water' | 'ice' }
  | { status: 'ambiguous'; raw: string; options: IngredientRef[] }
  | { status: 'invalid'; raw: string; suggestions: IngredientRef[] };

export interface Normalizer {
  normalize(raw: string): NormalizeResult;
  /** Type-ahead suggestions for the input field: prefix matches first, then substring matches. */
  autocomplete(query: string, limit?: number): IngredientRef[];
  ingredient(id: string): Ingredient | undefined;
}

const MAX_SUGGESTIONS = 3;

/** Lowercase, strip diacritics and punctuation, treat hyphens as spaces, collapse whitespace. */
export function cleanTerm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Optimal-string-alignment distance (Damerau-Levenshtein with adjacent transpositions). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0]![j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

/** Typo tolerance grows with term length; very short terms must match exactly. */
function maxDistance(len: number): number {
  if (len < 3) return 0;
  if (len <= 4) return 1;
  return 2;
}

/** Candidate spellings to try: as typed, then with the last word singularised. */
function variants(term: string): string[] {
  const out = [term];
  if (term.endsWith('ies')) out.push(term.slice(0, -3) + 'y');
  if (term.endsWith('es')) out.push(term.slice(0, -2));
  if (term.endsWith('s') && !term.endsWith('ss')) out.push(term.slice(0, -1));
  return out;
}

export function createNormalizer(dict: IngredientDictionary): Normalizer {
  const byId = new Map(dict.ingredients.map((i) => [i.id, i]));
  const termToId = new Map<string, string>();
  for (const ing of dict.ingredients) {
    for (const t of [ing.name, ...ing.synonyms]) termToId.set(cleanTerm(t), ing.id);
  }
  const ambiguity = new Map(dict.ambiguityGroups.map((g) => [cleanTerm(g.term), g.options]));
  const stopWords = new Set(dict.descriptorStopWords.map(cleanTerm));
  const allTerms = [...termToId.keys(), ...ambiguity.keys()];

  const ref = (id: string): IngredientRef => ({ id, name: byId.get(id)!.name });

  function lookup(raw: string, term: string): NormalizeResult | null {
    for (const v of variants(term)) {
      const id = termToId.get(v);
      if (id) {
        const ing = byId.get(id)!;
        if (ing.classification === 'excluded') return { status: 'excluded', raw, kind: id === 'ice' ? 'ice' : 'water' };
        return { status: 'ok', raw, id, name: ing.name };
      }
      const options = ambiguity.get(v);
      if (options) return { status: 'ambiguous', raw, options: options.map(ref) };
    }
    return null;
  }

  function fuzzySuggestions(term: string): IngredientRef[] {
    const limit = maxDistance(term.length);
    if (limit === 0) return [];
    const best = new Map<string, number>(); // ingredient id -> best distance
    for (const t of allTerms) {
      if (Math.abs(t.length - term.length) > limit) continue;
      const dist = editDistance(term, t);
      if (dist > limit) continue;
      const ids = termToId.has(t) ? [termToId.get(t)!] : ambiguity.get(t)!;
      for (const id of ids) {
        if (byId.get(id)!.classification === 'excluded') continue;
        if (!best.has(id) || dist < best.get(id)!) best.set(id, dist);
      }
    }
    return [...best.entries()]
      .sort((a, b) => a[1] - b[1] || ref(a[0]).name.localeCompare(ref(b[0]).name))
      .slice(0, MAX_SUGGESTIONS)
      .map(([id]) => ref(id));
  }

  function normalize(raw: string): NormalizeResult {
    const term = cleanTerm(raw);
    if (!term) return { status: 'invalid', raw, suggestions: [] };

    const direct = lookup(raw, term);
    if (direct) return direct;

    const stripped = term.split(' ').filter((w) => !stopWords.has(w)).join(' ');
    if (stripped && stripped !== term) {
      const retried = lookup(raw, stripped);
      if (retried) return retried;
    }

    // Fuzzy matches are only ever suggestions; the user must confirm them (US-E2-02).
    return { status: 'invalid', raw, suggestions: fuzzySuggestions(stripped || term) };
  }

  function autocomplete(query: string, limit = 8): IngredientRef[] {
    const q = cleanTerm(query);
    if (!q) return [];
    const scored = new Map<string, number>(); // id -> rank (0 = name prefix, 1 = synonym prefix, 2 = substring)
    for (const ing of dict.ingredients) {
      if (ing.classification === 'excluded') continue;
      const name = cleanTerm(ing.name);
      let rank = name.startsWith(q) ? 0 : Infinity;
      for (const s of ing.synonyms.map(cleanTerm)) {
        if (s.startsWith(q)) rank = Math.min(rank, 1);
        else if (s.includes(q)) rank = Math.min(rank, 2);
      }
      if (rank === Infinity && name.includes(q)) rank = 2;
      if (rank !== Infinity) scored.set(ing.id, rank);
    }
    return [...scored.entries()]
      .sort((a, b) => a[1] - b[1] || ref(a[0]).name.localeCompare(ref(b[0]).name))
      .slice(0, limit)
      .map(([id]) => ref(id));
  }

  return { normalize, autocomplete, ingredient: (id) => byId.get(id) };
}
