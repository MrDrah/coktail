// US-NF-05 / BR-11: every recipe the detail view can show links to at least one reputable source.
// The detail view renders `sources` as links (checked in tests/e2e/journey.spec.ts, US-E5-01); this
// checks the data behind every one of those views.
import { library } from '../../../src/domain';

const REPUTABLE = /(^|\.)(iba-world\.com|diffordsguide\.com|punchdrink\.com|imbibemagazine\.com|wikipedia\.org|liquor\.com)$/;
const host = (url: string) => new URL(url).hostname;

describe('US-NF-05 every recipe links to at least one reputable source', () => {
  it.each(library.cocktails.map((c) => [c.id, c] as const))('US-NF-05 %s has a reputable https recipe source and a history source', (_id, c) => {
    const recipe = c.sources.filter((s) => s.type === 'recipe');
    expect(recipe.length).toBeGreaterThanOrEqual(1);
    expect(c.sources.some((s) => s.type === 'history')).toBe(true);
    for (const s of c.sources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.publisher.trim()).not.toBe('');
      expect(s.title.trim()).not.toBe('');
    }
    expect(recipe.some((s) => REPUTABLE.test(host(s.url)))).toBe(true);
  });
});
