import { createMatcher, dictionary, library, matcher, resultCap } from '../../src/domain';
import type { Cocktail, CocktailLibrary, SearchResult } from '../../src/domain';

/** Minimal cocktail for fixture libraries (US story fixtures FX-*). */
function fx(id: string, req: string[], extra: Partial<Cocktail> & { optional?: string[]; excluded?: string[] } = {}): Cocktail {
  const { optional = [], excluded = ['ice'], ...rest } = extra;
  return {
    id,
    name: id.toUpperCase(),
    shortDescription: '',
    era: 'vintage',
    yearCreated: null,
    glass: 'Coupe',
    method: 'shake',
    ingredients: [
      ...req.map((i) => ({ id: i, amount: 30, unit: 'ml' as const, optional: false })),
      ...optional.map((i) => ({ id: i, amount: 10, unit: 'ml' as const, optional: true })),
      ...excluded.map((i) => ({ id: i, amount: null, unit: null, optional: false })),
    ],
    garnish: null,
    instructions: ['Mix.'],
    history: '',
    tasteProfile: '',
    tags: [],
    popularity: 50,
    sources: [],
    ...rest,
  };
}

const FX: CocktailLibrary = {
  version: 'test',
  cocktails: [
    fx('fx-sour', ['white-rum', 'lime-juice', 'simple-syrup']),
    fx('fx-highball', ['gin', 'soda-water', 'lemon-juice', 'simple-syrup']),
    fx('fx-stirred', ['rye-whiskey', 'sweet-vermouth', 'angostura-bitters']),
    fx('fx-oldfash', ['bourbon', 'sugar', 'angostura-bitters'], { excluded: ['water', 'ice'] }),
    fx('fx-optional', ['gin', 'lime-juice'], { optional: ['simple-syrup'] }),
    fx('fx-fruit', ['cachaca', 'lime', 'sugar']),
  ],
};
const fxMatcher = createMatcher(FX, dictionary);

function ok(r: SearchResult) {
  if (r.status !== 'ok') throw new Error(`expected ok, got ${r.status}`);
  return r;
}
const ids = (r: SearchResult) => ok(r).matches.map((m) => m.cocktail.id);
const nearIds = (r: SearchResult) => ok(r).nearMatches.map((m) => m.cocktail.id);

describe('US-E1-03 / US-E1-04 / US-E1-05 ingredient count', () => {
  it('rejects fewer than 2 counted ingredients', () => {
    expect(fxMatcher.search(['gin'])).toEqual({ status: 'too-few', count: 1 });
  });

  it('does not count water or ice', () => {
    expect(fxMatcher.search(['gin', 'ice', 'water'])).toEqual({ status: 'too-few', count: 1 });
    expect(fxMatcher.search(['ice', 'water'])).toEqual({ status: 'too-few', count: 0 });
  });

  it('de-duplicates repeated ids', () => {
    expect(fxMatcher.search(['gin', 'gin'])).toEqual({ status: 'too-few', count: 1 });
  });

  it('rejects more than 10, allows exactly 10 plus water and ice', () => {
    const eleven = ['gin', 'vodka', 'white-rum', 'tequila', 'bourbon', 'campari', 'aperol', 'lime-juice', 'lemon-juice', 'sugar', 'mint'];
    expect(fxMatcher.search(eleven)).toEqual({ status: 'too-many', count: 11 });
    expect(fxMatcher.search([...eleven.slice(0, 10), 'ice', 'water']).status).toBe('ok');
  });

  it('throws on unknown ids (normaliser must run first)', () => {
    expect(() => fxMatcher.search(['gin', 'unicorn-tears'])).toThrow(/Unknown ingredient/);
  });
});

describe('US-E3 subset matching (fixtures)', () => {
  it('US-E3-01 exact set', () => {
    expect(ids(fxMatcher.search(['white-rum', 'lime-juice', 'simple-syrup']))).toEqual(['fx-sour']);
  });

  it('US-E3-02 strict subset of a larger input', () => {
    expect(ids(fxMatcher.search(['white-rum', 'lime-juice', 'simple-syrup', 'mint', 'soda-water']))).toContain('fx-sour');
  });

  it('US-E3-03 missing one ingredient excludes it from primary results', () => {
    expect(ids(fxMatcher.search(['white-rum', 'lime-juice']))).not.toContain('fx-sour');
  });

  it('US-E3-04 water and ice in a recipe never block a match', () => {
    expect(ids(fxMatcher.search(['bourbon', 'sugar', 'angostura-bitters']))).toEqual(['fx-oldfash']);
  });

  it('US-E3-05 optional ingredients never block a match', () => {
    expect(ids(fxMatcher.search(['gin', 'lime-juice']))).toContain('fx-optional');
  });

  it('US-E3-06 whole fruit provides its juice, not the reverse', () => {
    expect(ids(fxMatcher.search(['lime', 'white-rum', 'simple-syrup']))).toContain('fx-sour');
    expect(ids(fxMatcher.search(['cachaca', 'lime-juice', 'sugar']))).not.toContain('fx-fruit');
  });

  it('Champagne and Prosecco satisfy a generic sparkling-wine recipe, but not each other', () => {
    const lib: CocktailLibrary = {
      version: 'test',
      cocktails: [
        fx('generic', ['gin', 'sparkling-wine']),
        fx('needs-champagne', ['gin', 'champagne']),
        fx('needs-prosecco', ['gin', 'prosecco']),
      ],
    };
    const m = createMatcher(lib, dictionary);
    expect(ids(m.search(['gin', 'champagne'])).sort()).toEqual(['generic', 'needs-champagne']);
    expect(ids(m.search(['gin', 'prosecco'])).sort()).toEqual(['generic', 'needs-prosecco']);
    expect(ids(m.search(['gin', 'sparkling-wine']))).toEqual(['generic']);
  });

  it('matchedIds lists the satisfied requirements', () => {
    const m = ok(fxMatcher.search(['lime', 'white-rum', 'simple-syrup'])).matches[0]!;
    expect(m.matchedIds.sort()).toEqual(['lime-juice', 'simple-syrup', 'white-rum']);
  });

  it('US-E3-07 soda water is required where the recipe uses it', () => {
    expect(ids(fxMatcher.search(['gin', 'lemon-juice', 'simple-syrup']))).not.toContain('fx-highball');
    expect(ids(fxMatcher.search(['gin', 'lemon-juice', 'simple-syrup', 'soda-water']))).toContain('fx-highball');
  });
});

describe('US-E4 result cap and ranking', () => {
  it.each([
    [2, 6],
    [4, 6],
    [5, 8],
    [10, 8],
  ])('resultCap(%i) = %i', (count, cap) => {
    expect(resultCap(count)).toBe(cap);
  });

  // 12 two-ingredient recipes all makeable from gin + campari (+ extras).
  const many: CocktailLibrary = {
    version: 'test',
    cocktails: Array.from({ length: 12 }, (_, i) => fx(`r${String(i).padStart(2, '0')}`, ['gin', 'campari'], { popularity: i })),
  };
  const manyMatcher = createMatcher(many, dictionary);

  it.each([
    [['gin', 'campari'], 6],
    [['gin', 'campari', 'mint', 'sugar'], 6],
    [['gin', 'campari', 'mint', 'sugar', 'salt'], 8],
    [['gin', 'campari', 'mint', 'sugar', 'salt', 'cola', 'cream', 'espresso', 'port', 'kir-nope'].slice(0, 9), 8],
  ])('US-E4-01 %j shows %i cards', (input, shown) => {
    const r = ok(manyMatcher.search(input));
    expect(r.matches).toHaveLength(shown);
    expect(r.cap).toBe(shown);
    expect(r.total).toBe(12);
  });

  it('US-E4-01 shows a single match', () => {
    expect(ok(fxMatcher.search(['bourbon', 'sugar', 'angostura-bitters'])).matches).toHaveLength(1);
  });

  it('US-E4-02 ranks by ingredients used, then popularity, then name', () => {
    const lib: CocktailLibrary = {
      version: 'test',
      cocktails: [
        fx('small-popular', ['gin', 'campari'], { popularity: 99, name: 'Small Popular' }),
        fx('big', ['gin', 'campari', 'sweet-vermouth'], { popularity: 10, name: 'Big' }),
        fx('b-tie', ['gin', 'sweet-vermouth'], { popularity: 50, name: 'B Tie' }),
        fx('a-tie', ['campari', 'sweet-vermouth'], { popularity: 50, name: 'A Tie' }),
      ],
    };
    expect(ids(createMatcher(lib, dictionary).search(['gin', 'campari', 'sweet-vermouth']))).toEqual([
      'big',
      'small-popular',
      'a-tie',
      'b-tie',
    ]);
  });

  it('US-E4-04 no near matches when there is at least one match', () => {
    expect(ok(fxMatcher.search(['bourbon', 'sugar', 'angostura-bitters'])).nearMatches).toEqual([]);
  });
});

describe('US-E6 zero match and near matches', () => {
  it('US-E6-02 lists recipes missing exactly one ingredient', () => {
    const r = ok(fxMatcher.search(['white-rum', 'lime-juice']));
    expect(r.matches).toEqual([]);
    // Simple Syrup (weight 0.95) outranks Gin (0.4) as the missing ingredient.
    expect(r.nearMatches.map((m) => [m.cocktail.id, m.missingId])).toEqual([
      ['fx-sour', 'simple-syrup'],
      ['fx-optional', 'gin'],
    ]);
  });

  it('US-E6-02 requires at least one shared ingredient', () => {
    const lib: CocktailLibrary = { version: 'test', cocktails: [fx('two', ['vodka', 'cola'])] };
    // vodka is shared and cola missing → near; with no overlap → nothing.
    expect(nearIds(createMatcher(lib, dictionary).search(['vodka', 'mint']))).toEqual(['two']);
    expect(nearIds(createMatcher(lib, dictionary).search(['gin', 'mint']))).toEqual([]);
  });

  it('US-E6-03 ranks by missing ingredient pairing weight first', () => {
    const lib: CocktailLibrary = {
      version: 'test',
      cocktails: [
        fx('needs-falernum', ['white-rum', 'lime-juice', 'falernum'], { popularity: 99 }),
        fx('needs-syrup', ['white-rum', 'lime-juice', 'simple-syrup'], { popularity: 1 }),
        fx('needs-cola', ['white-rum', 'cola'], { popularity: 99 }),
      ],
    };
    expect(nearIds(createMatcher(lib, dictionary).search(['white-rum', 'lime-juice']))).toEqual([
      'needs-syrup',
      'needs-cola',
      'needs-falernum',
    ]);
  });

  it('US-E6-03 ties on weight break by overlap, then popularity, then name', () => {
    const lib: CocktailLibrary = {
      version: 'test',
      cocktails: [
        fx('one-overlap', ['white-rum', 'sugar'], { popularity: 99, name: 'One Overlap' }),
        fx('two-overlap', ['white-rum', 'lime-juice', 'sugar'], { popularity: 1, name: 'Two Overlap' }),
        fx('z-pop', ['white-rum', 'lime-juice', 'sugar', 'mint'].slice(0, 3), { popularity: 1, name: 'Z Pop' }),
      ],
    };
    expect(nearIds(createMatcher(lib, dictionary).search(['white-rum', 'lime-juice']))).toEqual([
      'two-overlap',
      'z-pop',
      'one-overlap',
    ]);
  });

  it('US-E6-05 nothing at all', () => {
    const r = ok(fxMatcher.search(['port', 'galliano']));
    expect(r.matches).toEqual([]);
    expect(r.nearMatches).toEqual([]);
    expect(r.bestAddition).toBeNull();
  });

  describe('US-E6-06 best addition tip', () => {
    const lib: CocktailLibrary = {
      version: 'test',
      cocktails: [
        fx('a', ['vodka', 'cola']),
        fx('b', ['vodka', 'ginger-beer']),
        fx('c', ['vodka', 'mint', 'ginger-beer']),
        fx('d', ['vodka', 'cranberry-juice']),
        fx('e', ['vodka', 'tomato-juice']),
      ],
    };
    const m = createMatcher(lib, dictionary);

    it('picks the missing ingredient that unlocks the most recipes', () => {
      expect(ok(m.search(['vodka', 'mint'])).bestAddition).toEqual({ id: 'ginger-beer', unlocks: 2 });
    });

    it('counts all near matches, not just the capped list', () => {
      const many: CocktailLibrary = {
        version: 'test',
        cocktails: [
          ...Array.from({ length: 7 }, (_, i) => fx(`f${i}`, ['gin', 'falernum'], { popularity: 1 })),
          ...Array.from({ length: 6 }, (_, i) => fx(`s${i}`, ['gin', 'simple-syrup'], { popularity: 99 })),
        ],
      };
      const r = ok(createMatcher(many, dictionary).search(['gin', 'mint']));
      expect(r.nearMatches.every((x) => x.missingId === 'simple-syrup')).toBe(true); // weight ranks syrup first
      expect(r.bestAddition).toEqual({ id: 'falernum', unlocks: 7 }); // but falernum unlocks more
    });

    it('breaks count ties by pairing weight', () => {
      // One recipe each: cola (0.8) beats cranberry juice (0.75) and tomato juice (0.6).
      const ties: CocktailLibrary = { version: 'test', cocktails: lib.cocktails.filter((c) => ['a', 'd', 'e'].includes(c.id)) };
      expect(ok(createMatcher(ties, dictionary).search(['vodka', 'mint'])).bestAddition).toEqual({ id: 'cola', unlocks: 1 });
    });

    it('is null when there are direct matches', () => {
      expect(ok(m.search(['vodka', 'cola'])).bestAddition).toBeNull();
    });
  });

  it('caps near matches like primary results', () => {
    const lib: CocktailLibrary = {
      version: 'test',
      cocktails: Array.from({ length: 10 }, (_, i) => fx(`n${i}`, ['gin', 'campari', 'sweet-vermouth'])),
    };
    expect(ok(createMatcher(lib, dictionary).search(['gin', 'campari'])).nearMatches).toHaveLength(6);
  });

  it('required() exposes the derived requirement set', () => {
    expect([...fxMatcher.required('fx-optional')!]).toEqual(['gin', 'lime-juice']);
    expect([...fxMatcher.required('fx-oldfash')!]).toEqual(['bourbon', 'sugar', 'angostura-bitters']);
    expect(fxMatcher.required('nope')).toBeUndefined();
  });
});

describe('real 50-recipe seed', () => {
  it('US-E3-02 five inputs return both the Mojito and the 3-ingredient Daiquiri', () => {
    const r = ids(matcher.search(['white-rum', 'lime-juice', 'sugar', 'mint', 'soda-water']));
    expect(r).toEqual(expect.arrayContaining(['mojito', 'daiquiri']));
    expect(r[0]).toBe('mojito'); // uses all 5
  });

  it('US-E3-04 Old Fashioned matches without entering water or ice', () => {
    expect(ids(matcher.search(['bourbon', 'sugar', 'angostura-bitters']))).toContain('old-fashioned');
  });

  it('US-E3-05 Whiskey Sour matches without its optional egg white', () => {
    expect(ids(matcher.search(['bourbon', 'lemon-juice', 'simple-syrup']))).toContain('whiskey-sour');
  });

  it('US-E3-06 whole lime makes a Daiquiri; lime juice does not make a Caipirinha', () => {
    expect(ids(matcher.search(['lime', 'white-rum', 'sugar']))).toContain('daiquiri');
    const r = ok(matcher.search(['cachaca', 'lime-juice', 'sugar']));
    expect(r.matches.map((m) => m.cocktail.id)).not.toContain('caipirinha');
    expect(r.nearMatches.find((m) => m.cocktail.id === 'caipirinha')?.missingId).toBe('lime');
  });

  it('US-E3-07 collins drinks need soda water', () => {
    const without = ids(matcher.search(['gin', 'lemon-juice', 'simple-syrup']));
    expect(without).not.toContain('gin-fizz');
    expect(without).not.toContain('john-collins');
    const withSoda = ids(matcher.search(['gin', 'lemon-juice', 'simple-syrup', 'soda-water']));
    expect(withSoda).toEqual(expect.arrayContaining(['gin-fizz', 'john-collins']));
  });

  it('US-E6-02 rum + lime: no direct match, Daiquiri (needs sugar) before Cuba Libre (needs cola)', () => {
    const r = ok(matcher.search(['white-rum', 'lime-juice']));
    expect(r.matches).toEqual([]);
    const near = r.nearMatches.map((m) => `${m.cocktail.id}+${m.missingId}`);
    expect(near.indexOf('daiquiri+sugar')).toBeLessThan(near.indexOf('cuba-libre+cola'));
    expect(near.indexOf('daiquiri+sugar')).toBeGreaterThanOrEqual(0);
  });

  it('Negroni and Boulevardier both found from their combined ingredients', () => {
    expect(ids(matcher.search(['gin', 'bourbon', 'campari', 'sweet-vermouth']))).toEqual(
      expect.arrayContaining(['negroni', 'boulevardier']),
    );
  });
});

describe('naive oracle vs engine on random inputs (seeded)', () => {
  // Deterministic PRNG so failures are reproducible.
  let seed = 42;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const counted = dictionary.ingredients.filter((i) => i.classification === 'counted').map((i) => i.id);
  const byId = new Map(dictionary.ingredients.map((i) => [i.id, i]));
  // Bias inputs toward ingredients the library uses, so matches actually happen.
  const used = [...new Set(library.cocktails.flatMap((c) => c.ingredients.map((i) => i.id)))].filter((id) => counted.includes(id));

  it('primary results are exactly the top-N of all makeable recipes; near matches miss exactly one', () => {
    for (let run = 0; run < 1000; run++) {
      const size = 2 + Math.floor(rand() * 9);
      const user = new Set<string>();
      while (user.size < size) user.add(used[Math.floor(rand() * used.length)]!);
      const have = new Set(user);
      for (const id of user) for (const p of byId.get(id)!.provides ?? []) have.add(p);

      const reqOf = (c: Cocktail) =>
        c.ingredients.filter((i) => !i.optional && byId.get(i.id)!.classification === 'counted').map((i) => i.id);
      const makeable = library.cocktails.filter((c) => reqOf(c).every((id) => have.has(id))).map((c) => c.id);

      const r = ok(matcher.search(user));
      const got = r.matches.map((m) => m.cocktail.id);
      expect(got.length).toBe(Math.min(makeable.length, resultCap(size)));
      for (const id of got) expect(makeable).toContain(id);
      if (makeable.length > 0) expect(r.nearMatches).toEqual([]);
      for (const m of r.nearMatches) {
        const missing = reqOf(m.cocktail).filter((id) => !have.has(id));
        expect(missing).toEqual([m.missingId]);
      }
    }
  });
});

describe('US-NF-03 performance', () => {
  it('searches a 500-recipe library in under 5 ms on average', () => {
    const big: CocktailLibrary = {
      version: 'bench',
      cocktails: Array.from({ length: 10 }, (_, k) => library.cocktails.map((c) => ({ ...c, id: `${c.id}-${k}` }))).flat(),
    };
    expect(big.cocktails).toHaveLength(500);
    const m = createMatcher(big, dictionary);
    const inputs = [
      ['white-rum', 'lime-juice'],
      ['gin', 'campari', 'sweet-vermouth', 'lemon-juice', 'simple-syrup', 'soda-water'],
      ['vodka', 'coffee-liqueur', 'espresso', 'simple-syrup', 'cream', 'sugar', 'bourbon', 'mint', 'lime', 'tequila'],
    ];
    for (let i = 0; i < 50; i++) for (const input of inputs) m.search(input); // warm-up
    const runs = 300;
    const start = performance.now();
    for (let i = 0; i < runs; i++) m.search(inputs[i % inputs.length]!);
    const avg = (performance.now() - start) / runs;
    expect(avg).toBeLessThan(5);
  });
});
