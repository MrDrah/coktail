// QA brief Step 3: library verification matrix. Runs checks C1, C3–C9 on every recipe in the library
// (the 50-recipe seed is the whole library today). C2 authenticity is checked manually against sources:
// see tests/reports/mvp-test-report.md.
// Set WRITE_MATRIX=1 to also write tests/library/verification-matrix.csv.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dictionary, library, matcher, normalizer, type Cocktail, type SearchResult } from '../../../src/domain';

type Ok = Extract<SearchResult, { status: 'ok' }>;
const ok = (r: SearchResult) => {
  if (r.status !== 'ok') throw new Error(`search returned ${r.status}`);
  return r as Ok;
};
const byId = new Map(dictionary.ingredients.map((i) => [i.id, i]));
const req = (c: Cocktail) => [...matcher.required(c.id)!];
const inPrimary = (r: Ok, id: string) => r.matches.some((m) => m.cocktail.id === id);
// Two counted ingredients no seed recipe uses, to pad inputs without creating new matches.
const FILLERS = ['galliano', 'port', 'amaretto', 'calvados'];

type Status = 'PASS' | 'FAIL' | 'N/A';
const matrix = new Map<string, Record<string, Status>>();
const record = (id: string, check: string, status: Status) => {
  matrix.set(id, { ...(matrix.get(id) ?? {}), [check]: status });
};

/** Runs an assertion block and records PASS/FAIL in the matrix (still failing the test on error). */
function check(c: Cocktail, name: string, fn: () => void) {
  try {
    fn();
    record(c.id, name, 'PASS');
  } catch (e) {
    record(c.id, name, 'FAIL');
    throw e;
  }
}

describe.each(library.cocktails.map((c) => [c.name, c] as const))('%s', (_name, c) => {
  const r = req(c);

  it('C1 data integrity: ingredients resolve, recipe + history sources present', () => {
    check(c, 'C1', () => {
      for (const i of c.ingredients) expect(byId.has(i.id)).toBe(true);
      expect(c.sources.some((s) => s.type === 'recipe' && s.url.startsWith('https://'))).toBe(true);
      expect(c.sources.some((s) => s.type === 'history' && s.url.startsWith('https://'))).toBe(true);
    });
  });

  it('C3 exact set: the recipe matches its own ingredients', () => {
    check(c, 'C3', () => expect(inPrimary(ok(matcher.search(r)), c.id)).toBe(true));
  });

  it('C4 superset: still matches with 2 unrelated extra ingredients', () => {
    if (r.length + 2 > 10) return record(c.id, 'C4', 'N/A');
    const extra = FILLERS.filter((f) => !r.includes(f)).slice(0, 2);
    check(c, 'C4', () => expect(inPrimary(ok(matcher.search([...r, ...extra])), c.id)).toBe(true));
  });

  it('C5 missing one: never a primary match; a near match naming the missing ingredient when shown', () => {
    if (r.length < 3) return record(c.id, 'C5', 'N/A'); // removing one would leave < 2 ingredients
    check(c, 'C5', () => {
      for (const missing of r) {
        const result = ok(matcher.search(r.filter((id) => id !== missing)));
        expect(inPrimary(result, c.id)).toBe(false);
        if (result.matches.length === 0) {
          const near = result.nearMatches.find((m) => m.cocktail.id === c.id);
          // Present unless pushed below the cap by higher-ranked near matches.
          if (near) expect(near.missingId).toBe(missing);
          else expect(result.total).toBeGreaterThan(result.nearMatches.length);
        }
      }
    });
  });

  it('C6 water/ice: not required, and entering them changes nothing', () => {
    check(c, 'C6', () => {
      expect(r).not.toContain('ice');
      expect(r).not.toContain('water');
      const plain = ok(matcher.search(r));
      const withIce = ok(matcher.search([...r, 'ice', 'water']));
      expect(withIce.count).toBe(plain.count);
      expect(withIce.matches.map((m) => m.cocktail.id)).toEqual(plain.matches.map((m) => m.cocktail.id));
    });
  });

  it('C7 soda water: required when the recipe uses it; every synonym unlocks it', () => {
    if (!r.includes('soda-water')) return record(c.id, 'C7', 'N/A');
    check(c, 'C7', () => {
      const withoutSoda = r.filter((id) => id !== 'soda-water');
      expect(inPrimary(ok(matcher.search(withoutSoda)), c.id)).toBe(false);
      for (const term of ['soda water', 'club soda', 'sparkling water', 'soda', 'seltzer']) {
        const n = normalizer.normalize(term);
        expect(n.status === 'ok' && n.id).toBe('soda-water');
        expect(inPrimary(ok(matcher.search([...withoutSoda, 'soda-water'])), c.id)).toBe(true);
      }
    });
  });

  it('C8 synonyms: two spellings per ingredient resolve to the same id and the same match', () => {
    check(c, 'C8', () => {
      const viaSynonyms = r.map((id) => {
        const ing = byId.get(id)!;
        const spellings = [ing.name.toUpperCase(), `  ${ing.name.toLowerCase()}  `, ...ing.synonyms.slice(0, 2)];
        for (const s of spellings) {
          const n = normalizer.normalize(s);
          expect(n.status === 'ok' && n.id, `"${s}" → ${id}`).toBe(id);
        }
        return id;
      });
      expect(inPrimary(ok(matcher.search(viaSynonyms)), c.id)).toBe(true);
    });
  });

  it('C9 detail content: method, glass, 1–2 history paragraphs and 1 taste paragraph', () => {
    check(c, 'C9', () => {
      expect(c.instructions.length).toBeGreaterThan(0);
      expect(c.glass).toBeTruthy();
      expect(c.shortDescription.length).toBeGreaterThan(0);
      const paras = (s: string) => s.split(/\n\s*\n/).filter((p) => p.trim()).length;
      expect(paras(c.history)).toBeGreaterThanOrEqual(1);
      expect(paras(c.history)).toBeLessThanOrEqual(2);
      expect(paras(c.tasteProfile)).toBe(1);
    });
  });
});

afterAll(() => {
  if (!process.env.WRITE_MATRIX) return;
  const checks = ['C1', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'];
  const rows = library.cocktails.map((c) => [c.id, c.name, ...checks.map((k) => matrix.get(c.id)?.[k] ?? 'NOT RUN')].join(','));
  writeFileSync(
    resolve(process.cwd(), 'tests/library/verification-matrix.csv'),
    ['id,name,' + checks.join(','), ...rows].join('\n') + '\n',
  );
});
