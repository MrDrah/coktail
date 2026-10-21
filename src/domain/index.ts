// Default engine instances bound to the shipped data files.
import ingredientsJson from '../../data/ingredients.json';
import cocktailsJson from '../../data/cocktails.json';
import { createMatcher } from './match';
import { createNormalizer } from './normalize';
import type { CocktailLibrary, IngredientDictionary } from './types';

export const dictionary = ingredientsJson as IngredientDictionary;
export const library = cocktailsJson as CocktailLibrary;
export const normalizer = createNormalizer(dictionary);
export const matcher = createMatcher(library, dictionary);

export * from './match';
export * from './normalize';
export * from './scale';
export type * from './types';
