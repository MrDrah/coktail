// Data types mirroring data/schema/cocktail.schema.md.

export type IngredientCategory =
  | 'spirit' | 'liqueur' | 'aperitif' | 'vermouth-fortified' | 'wine' | 'citrus' | 'juice' | 'fruit'
  | 'syrup-sweetener' | 'bitters' | 'mixer' | 'dairy-egg' | 'herb-spice' | 'savory' | 'excluded';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  classification: 'counted' | 'excluded';
  synonyms: string[];
  provides?: string[];
  pairingWeight: number;
}

export interface AmbiguityGroup {
  term: string;
  options: string[];
}

export interface IngredientDictionary {
  version: string;
  ingredients: Ingredient[];
  ambiguityGroups: AmbiguityGroup[];
  descriptorStopWords: string[];
}

export type Unit = 'ml' | 'dash' | 'drop' | 'barspoon' | 'piece' | 'leaf' | 'sprig' | 'pinch' | 'top' | 'splash' | null;

export interface RecipeIngredient {
  id: string;
  amount: number | null;
  unit: Unit;
  optional: boolean;
  note?: string | null;
}

export interface Source {
  type: 'recipe' | 'history';
  publisher: string;
  title: string;
  url: string;
  accessed: string;
}

export interface Cocktail {
  id: string;
  name: string;
  era: 'vintage' | 'modern';
  yearCreated: number | null;
  glass: string;
  method: 'shake' | 'stir' | 'build' | 'blend' | 'throw' | 'swizzle' | 'muddle-build';
  ingredients: RecipeIngredient[];
  garnish: string | null;
  instructions: string[];
  history: string;
  tasteProfile: string;
  tags: string[];
  popularity: number;
  sources: Source[];
}

export interface CocktailLibrary {
  version: string;
  cocktails: Cocktail[];
}

export interface IngredientRef {
  id: string;
  name: string;
}
