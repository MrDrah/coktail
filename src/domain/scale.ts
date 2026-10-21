// Serving-size scaling for the detail view (US-E5-02).
import type { RecipeIngredient } from './types';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 4;

/** Scaled amount for `servings`, or null when the source gives no quantity ("top up", "a few dashes", ice). */
export function scaleAmount(ingredient: RecipeIngredient, servings: number): number | null {
  if (!Number.isInteger(servings) || servings < MIN_SERVINGS || servings > MAX_SERVINGS) {
    throw new RangeError(`servings must be an integer from ${MIN_SERVINGS} to ${MAX_SERVINGS}`);
  }
  if (ingredient.amount == null) return null;
  const scaled = ingredient.amount * servings;
  // ml keeps one decimal place; countable units (dash, piece, barspoon…) round to the nearest half.
  return ingredient.unit === 'ml' ? Math.round(scaled * 10) / 10 : Math.round(scaled * 2) / 2;
}
