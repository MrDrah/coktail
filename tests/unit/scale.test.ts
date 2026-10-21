import { scaleAmount } from '../../src/domain';
import type { RecipeIngredient } from '../../src/domain';

const ri = (amount: number | null, unit: RecipeIngredient['unit']): RecipeIngredient => ({ id: 'x', amount, unit, optional: false });

describe('US-E5-02 serving scaling', () => {
  it.each([
    [1, 45],
    [2, 90],
    [4, 180],
  ])('45 ml × %i = %i ml', (servings, expected) => {
    expect(scaleAmount(ri(45, 'ml'), servings)).toBe(expected);
  });

  it('keeps one decimal for ml', () => {
    expect(scaleAmount(ri(22.5, 'ml'), 3)).toBe(67.5);
  });

  it('scales count units and rounds to the nearest half', () => {
    expect(scaleAmount(ri(2, 'dash'), 3)).toBe(6);
    expect(scaleAmount(ri(0.5, 'barspoon'), 3)).toBe(1.5);
    expect(scaleAmount(ri(0.3, 'barspoon'), 3)).toBe(1);
  });

  it('leaves unquantified amounts unscaled', () => {
    expect(scaleAmount(ri(null, 'top'), 4)).toBeNull();
    expect(scaleAmount(ri(null, 'dash'), 2)).toBeNull();
  });

  it.each([0, 5, 1.5])('rejects %s servings', (servings) => {
    expect(() => scaleAmount(ri(45, 'ml'), servings)).toThrow(RangeError);
  });
});
