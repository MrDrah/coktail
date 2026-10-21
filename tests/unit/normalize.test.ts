import { cleanTerm, createNormalizer, dictionary, editDistance, normalizer } from '../../src/domain';
import type { IngredientDictionary } from '../../src/domain';

const n = normalizer.normalize;
const okId = (raw: string) => {
  const r = n(raw);
  return r.status === 'ok' ? r.id : r.status;
};

describe('US-E2-01 exact and synonym matches resolve to canonical names', () => {
  it.each([
    ['Gin', 'gin'],
    ['GIN', 'gin'],
    ['  gin  ', 'gin'],
    ['Fresh Lemon Juice', 'lemon-juice'],
    ['freshly squeezed orange juice', 'orange-juice'],
    ['lemon', 'lemon-juice'],
    ['lime wedges', 'lime'],
    ['limes', 'lime'],
    ['Cointreau', 'orange-liqueur'],
    ['triple sec', 'orange-liqueur'],
    ['bourbon whiskey', 'bourbon'],
    ['prosecco', 'prosecco'],
    ['Champagne', 'champagne'],
    ['cava', 'sparkling-wine'],
    ['merlot', 'red-wine'],
    ['Pernod', 'pastis'],
    ['coconut milk', 'coconut-milk'],
    ['raspberries', 'raspberry'],
    ['oranges', 'orange-fruit'],
    ['gomme', 'simple-syrup'],
    ['Cachaça', 'cachaca'],
    ['cachaca', 'cachaca'],
    ["Peychaud's", 'peychauds-bitters'],
    ['St-Germain', 'elderflower-liqueur'],
    ['fresh mint leaves', 'mint'],
    ['chilled gin', 'gin'],
    ['egg whites', 'egg-white'],
  ])('"%s" → %s', (raw, id) => {
    expect(okId(raw)).toBe(id);
  });

  it('returns the canonical display name', () => {
    expect(n('fresh lime')).toEqual({ status: 'ok', raw: 'fresh lime', id: 'lime-juice', name: 'Lime Juice' });
    expect(n('lime wedges')).toMatchObject({ name: 'Whole Lime' });
  });
});

describe('US-E1-05 water and ice are excluded', () => {
  it.each([
    ['ice', 'ice'],
    ['crushed ice', 'ice'],
    ['Ice Cubes', 'ice'],
    ['water', 'water'],
    ['tap water', 'water'],
    ['still water', 'water'],
  ])('"%s" → excluded %s', (raw, kind) => {
    expect(n(raw)).toEqual({ status: 'excluded', raw, kind });
  });
});

describe('US-E1-06 sparkling water is counted soda water', () => {
  it.each(['soda water', 'club soda', 'sparkling water', 'seltzer', 'soda'])('"%s" → soda-water', (raw) => {
    expect(okId(raw)).toBe('soda-water');
  });
});

describe('US-E2-02 typos get suggestions, never auto-accepted', () => {
  it('suggests Campari for "campary"', () => {
    const r = n('campary');
    expect(r.status).toBe('invalid');
    expect(r.status === 'invalid' && r.suggestions.map((s) => s.id)).toContain('campari');
  });

  it('suggests Lime Juice for "limme juce"', () => {
    const r = n('limme juce');
    expect(r.status === 'invalid' && r.suggestions[0]?.id).toBe('lime-juice');
  });

  it('caps suggestions at 3', () => {
    const r = n('rumm');
    expect(r.status === 'invalid' && r.suggestions.length).toBeLessThanOrEqual(3);
  });

  it('never suggests excluded ingredients', () => {
    const r = n('icee');
    expect(r.status === 'invalid' && r.suggestions.map((s) => s.id)).not.toContain('ice');
  });
});

describe('US-E2-03 ambiguous terms ask the user to choose', () => {
  it('"orange" offers juice, fruit, liqueur and bitters in dictionary order', () => {
    expect(n('orange')).toEqual({
      status: 'ambiguous',
      raw: 'orange',
      options: [
        { id: 'orange-juice', name: 'Orange Juice' },
        { id: 'orange-fruit', name: 'Whole Orange' },
        { id: 'orange-liqueur', name: 'Orange Liqueur' },
        { id: 'orange-bitters', name: 'Orange Bitters' },
      ],
    });
  });

  it.each(['vermouth', 'Rum', 'whisky', 'whiskey', 'bitters', 'sherry', 'wine', 'sparkling', 'fresh orange'])('"%s" is ambiguous', (raw) => {
    expect(n(raw).status).toBe('ambiguous');
  });
});

describe('US-E2-04 unparseable input', () => {
  it.each(['asdfgh', '', '   ', '!!!', 'xy'])('"%s" is invalid with no suggestions', (raw) => {
    expect(n(raw)).toEqual({ status: 'invalid', raw, suggestions: [] });
  });

  it('treats markup as plain text', () => {
    const raw = '<script>alert(1)</script>';
    const r = n(raw);
    expect(r.status).toBe('invalid');
    expect(r.raw).toBe(raw);
  });
});

describe('autocomplete', () => {
  it('ranks name prefixes first and includes vermouths for "verm"', () => {
    const ids = normalizer.autocomplete('verm').map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['sweet-vermouth', 'dry-vermouth']));
  });

  it('puts name-prefix matches before synonym matches', () => {
    const ids = normalizer.autocomplete('lim').map((r) => r.id);
    expect(ids.slice(0, 3)).toEqual(['lime-cordial', 'lime-juice', 'limoncello']);
    expect(ids.indexOf('lime')).toBeGreaterThan(2); // "Whole Lime" only matches through its synonym "limes"
  });

  it('finds by synonym and substring, skipping excluded items', () => {
    expect(normalizer.autocomplete('cointreau').map((r) => r.id)).toEqual(['orange-liqueur']);
    expect(normalizer.autocomplete('juice').length).toBeGreaterThan(3);
    expect(normalizer.autocomplete('ice').map((r) => r.id)).not.toContain('ice');
  });

  it('respects the limit and ignores blank queries', () => {
    expect(normalizer.autocomplete('a', 5)).toHaveLength(5);
    expect(normalizer.autocomplete('  ')).toEqual([]);
  });
});

describe('helpers', () => {
  it('cleanTerm strips diacritics, punctuation and hyphens', () => {
    expect(cleanTerm('  Crème-de  Mûre! ')).toBe('creme de mure');
  });

  it('editDistance counts adjacent transpositions as 1', () => {
    expect(editDistance('gin', 'gin')).toBe(0);
    expect(editDistance('gni', 'gin')).toBe(1);
    expect(editDistance('campary', 'campari')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('ingredient() looks up by id', () => {
    expect(normalizer.ingredient('gin')?.name).toBe('Gin');
    expect(normalizer.ingredient('nope')).toBeUndefined();
  });

  it('works with a custom dictionary', () => {
    const dict: IngredientDictionary = {
      ...dictionary,
      ingredients: [{ id: 'x', name: 'Xylo', category: 'spirit', classification: 'counted', synonyms: [], pairingWeight: 0.5 }],
      ambiguityGroups: [],
    };
    expect(createNormalizer(dict).normalize('xylo')).toMatchObject({ status: 'ok', id: 'x' });
  });
});
