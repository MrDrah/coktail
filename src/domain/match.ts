// Subset matching (BR-05/06) and the one-missing-ingredient fallback (BR-07).
// Definitions: data/schema/cocktail.schema.md §3.
import type { Cocktail, CocktailLibrary, IngredientDictionary } from './types';

export const MIN_INGREDIENTS = 2;
export const MAX_INGREDIENTS = 10;

export interface Match {
  cocktail: Cocktail;
  /** Required ingredient IDs the user has (directly or via `provides`), for highlighting. */
  matchedIds: string[];
}

export interface NearMatch extends Match {
  missingId: string;
}

export type SearchResult =
  | { status: 'too-few' | 'too-many'; count: number }
  | { status: 'ok'; count: number; cap: number; matches: Match[]; nearMatches: NearMatch[] };

export interface Matcher {
  search(userIds: Iterable<string>): SearchResult;
  /** Counted, non-optional ingredient IDs of a recipe: what it takes to make it. */
  required(cocktailId: string): ReadonlySet<string> | undefined;
}

/** BR-06: 2–4 ingredients show up to 6 results, 5–10 show up to 8. */
export function resultCap(ingredientCount: number): number {
  return ingredientCount <= 4 ? 6 : 8;
}

interface Indexed {
  cocktail: Cocktail;
  req: string[];
}

export function createMatcher(library: CocktailLibrary, dict: IngredientDictionary): Matcher {
  const byId = new Map(dict.ingredients.map((i) => [i.id, i]));
  const isCounted = (id: string) => byId.get(id)?.classification === 'counted';

  const indexed: Indexed[] = library.cocktails.map((cocktail) => ({
    cocktail,
    req: [...new Set(cocktail.ingredients.filter((i) => !i.optional && isCounted(i.id)).map((i) => i.id))],
  }));
  const reqById = new Map(indexed.map((x) => [x.cocktail.id, new Set(x.req)]));

  const byName = (a: Match, b: Match) => a.cocktail.name.localeCompare(b.cocktail.name);

  function search(userIds: Iterable<string>): SearchResult {
    const user = new Set<string>();
    for (const id of userIds) {
      if (!byId.has(id)) throw new Error(`Unknown ingredient id: ${id}`);
      if (isCounted(id)) user.add(id); // BR-02: water and ice never count
    }
    if (user.size < MIN_INGREDIENTS) return { status: 'too-few', count: user.size };
    if (user.size > MAX_INGREDIENTS) return { status: 'too-many', count: user.size };

    const available = new Set(user);
    for (const id of user) for (const p of byId.get(id)!.provides ?? []) available.add(p);

    const cap = resultCap(user.size);
    const matches: Match[] = [];
    const near: NearMatch[] = [];
    for (const { cocktail, req } of indexed) {
      const matchedIds = req.filter((id) => available.has(id));
      const missing = req.length - matchedIds.length;
      if (missing === 0) matches.push({ cocktail, matchedIds });
      else if (missing === 1 && matchedIds.length >= 1) {
        near.push({ cocktail, matchedIds, missingId: req.find((id) => !available.has(id))! });
      }
    }

    // US-E4-02: most of the user's ingredients used, then popularity, then name.
    matches.sort((a, b) => b.matchedIds.length - a.matchedIds.length || b.cocktail.popularity - a.cocktail.popularity || byName(a, b));
    if (matches.length > 0) return { status: 'ok', count: user.size, cap, matches: matches.slice(0, cap), nearMatches: [] };

    // US-E6-03: easiest missing ingredient first, then overlap, popularity, name.
    const weight = (m: NearMatch) => byId.get(m.missingId)!.pairingWeight;
    near.sort(
      (a, b) =>
        weight(b) - weight(a) ||
        b.matchedIds.length - a.matchedIds.length ||
        b.cocktail.popularity - a.cocktail.popularity ||
        byName(a, b),
    );
    return { status: 'ok', count: user.size, cap, matches: [], nearMatches: near.slice(0, cap) };
  }

  return { search, required: (id) => reqById.get(id) };
}
