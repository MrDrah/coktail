// Display formatting for recipe amounts (C4 scaling rules). ml only, no rounding beyond scaleAmount.
import { scaleAmount, type RecipeIngredient } from '../domain';
import { t, tp, type PluralKey } from './copy';

const num = (n: number) => String(Number(n.toFixed(1)));

export function formatAmount(ingredient: RecipeIngredient, servings: number): string {
  const { unit } = ingredient;
  if (unit === 'top') return t('detail.unit.top');
  if (unit === 'splash') return t('detail.unit.splash');
  const amount = scaleAmount(ingredient, servings);
  if (amount == null) return t('detail.unit.unknown');
  const shown = num(amount);
  switch (unit) {
    case 'ml':
      return t('detail.unit.ml', { amount: shown });
    case 'piece':
      return t('detail.unit.piece', { amount: shown });
    case null:
      return shown;
    default:
      return tp(`detail.unit.${unit}` as PluralKey, amount, { amount: shown });
  }
}
