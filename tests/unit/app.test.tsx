// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/ui/App';
import { formatAmount } from '../../src/ui/format';

beforeAll(() => {
  // jsdom has no <dialog> modal support or scrolling.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  Element.prototype.scrollIntoView ??= () => {};
});

beforeEach(() => window.history.replaceState(null, '', '/'));
afterEach(cleanup);

const input = () => screen.getByTestId('ingredient-input');
const cta = () => screen.getByTestId('search-button');

async function setup(text: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.type(input(), `${text}{Enter}`);
  return user;
}

describe('ingredient input', () => {
  it('US-E1-01 turns comma-separated text into canonical chips', async () => {
    await setup('Fresh Lemon, cointreau, gin');
    expect(screen.getByTestId('chip-lemon-juice')).toHaveTextContent('Lemon Juice');
    expect(screen.getByTestId('chip-orange-liqueur')).toBeTruthy();
    expect(screen.getByTestId('ingredient-counter')).toHaveTextContent('3 / 10 ingredients');
  });

  it('US-E1-03 blocks search below 2 ingredients', async () => {
    await setup('gin');
    expect(cta()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('search-helper')).toHaveTextContent('Add 1 more ingredient to search.');
  });

  it('US-E1-05 drops ice and water with a hint', async () => {
    await setup('ice, water');
    expect(screen.getByTestId('hint-excluded')).toHaveTextContent('Ice & water are always assumed.');
    expect(screen.getByTestId('ingredient-counter')).toHaveTextContent('0 / 10');
    expect(screen.getByTestId('search-helper')).toHaveTextContent('Ice and water don’t count');
  });

  it('US-E1-07 collapses duplicates', async () => {
    await setup('lemon juice, fresh lemon');
    expect(screen.getAllByTestId(/^chip-lemon-juice$/)).toHaveLength(1);
  });

  it('US-E2-02 / US-E2-05 typo shows suggestions, blocks search, and resolves in place', async () => {
    const user = await setup('gin, campary');
    expect(screen.getByTestId('chip-error-1')).toHaveTextContent('campary');
    expect(cta()).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByTestId('suggestion-campari'));
    expect(screen.getByTestId('chip-campari')).toBeTruthy();
    expect(cta()).not.toHaveAttribute('aria-disabled');
  });

  it('US-E2-03 ambiguous term opens the chooser', async () => {
    const user = await setup('orange');
    const chooser = screen.getByTestId('ambiguity-chooser');
    expect(chooser).toHaveTextContent('Which “orange” do you mean?');
    await user.click(within(chooser).getByTestId('ambiguity-option-orange-liqueur'));
    expect(screen.getByTestId('chip-orange-liqueur')).toBeTruthy();
    expect(screen.queryByTestId('ambiguity-chooser')).toBeNull();
  });

  it('US-E2-04 renders markup as inert text', async () => {
    await setup('<b>bold</b>');
    expect(screen.getByTestId('chip-error-0').querySelector('b')).toBeNull();
  });
});

describe('search', () => {
  it('US-E3-02 shows Mojito first and Daiquiri for five ingredients, and syncs the URL', async () => {
    const user = await setup('white rum, lime, sugar, mint, club soda');
    await user.click(cta());
    const grid = screen.getByTestId('results-grid');
    const names = within(grid).getAllByRole('heading').map((h) => h.textContent);
    expect(names.slice(0, 2)).toEqual(['Mojito', 'Daiquiri']);
    expect(screen.getByTestId('results-status')).toHaveTextContent('2 cocktails found');
    expect(window.location.search).toContain('i=white-rum%2Clime-juice%2Csugar%2Cmint%2Csoda-water');
  });

  it('US-E5 opens the recipe, scales servings in ml and shows ice as assumed', async () => {
    const user = await setup('white rum, lime, sugar, mint, soda');
    await user.click(cta());
    await user.click(screen.getByTestId('card-open-mojito'));
    const dialog = screen.getByTestId('detail-dialog');
    expect(within(dialog).getByTestId('detail-amount-white-rum')).toHaveTextContent('45 ml');
    expect(within(dialog).getByTestId('detail-ingredient-ice')).toHaveAttribute('data-assumed', 'true');
    expect(within(dialog).getByTestId('servings-decrease')).toBeDisabled();
    await user.click(within(dialog).getByTestId('servings-increase'));
    expect(within(dialog).getByTestId('detail-amount-white-rum')).toHaveTextContent('90 ml');
    expect(within(dialog).getByTestId('detail-amount-soda-water')).toHaveTextContent('Top up');
    await user.click(within(dialog).getByTestId('detail-close'));
    expect(screen.queryByTestId('detail-dialog')).toBeNull();
  });

  it('US-E6 zero match → best addition → one tap re-search', async () => {
    const user = await setup('gin, campari, cointreau');
    await user.click(cta());
    expect(screen.getByTestId('fallback-title')).toHaveTextContent('No direct matches found');
    expect(screen.getByTestId('best-addition')).toHaveTextContent('Add Lemon Juice to unlock 1 cocktail');
    await user.click(screen.getByTestId('best-addition-add'));
    expect(screen.getByTestId('chip-lemon-juice')).toBeTruthy();
    expect(within(screen.getByTestId('results-grid')).getByText('White Lady')).toBeTruthy();
  });

  it('US-E6-04 hides "+ Add" at 10 ingredients and restores it at 9', async () => {
    window.history.replaceState(null, '', '/?i=gin,vodka,mint,salt,cola,cream,espresso,port,galliano,tonic-water');
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId('fallback')).toBeTruthy();
    expect(document.querySelectorAll('.add-button')).toHaveLength(0);
    expect(screen.getByTestId('fallback-tip')).toBeTruthy();
    expect(document.querySelectorAll('[data-testid^="near-missing-"]').length).toBeGreaterThan(0);
    await user.click(screen.getByTestId('chip-remove-tonic-water'));
    expect(document.querySelectorAll('.add-button').length).toBeGreaterThan(0);
    expect(screen.getByTestId('best-addition')).toBeTruthy();
  });

  it('US-E6-05 empty state resets', async () => {
    const user = await setup('port, galliano');
    await user.click(cta());
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Nothing to pour… yet');
    await user.click(screen.getByTestId('empty-reset'));
    expect(screen.queryByTestId('chip-port')).toBeNull();
  });
});

describe('formatAmount', () => {
  it.each([
    [{ id: 'x', amount: 52.5, unit: 'ml' as const, optional: false }, 2, '105 ml'],
    [{ id: 'x', amount: 52.5, unit: 'ml' as const, optional: false }, 3, '157.5 ml'],
    [{ id: 'x', amount: 1, unit: 'dash' as const, optional: false }, 1, '1 dash'],
    [{ id: 'x', amount: 2, unit: 'dash' as const, optional: false }, 3, '6 dashes'],
    [{ id: 'x', amount: 1, unit: 'piece' as const, optional: false }, 2, '2 ×'],
    [{ id: 'x', amount: null, unit: 'dash' as const, optional: false }, 2, 'To taste'],
    [{ id: 'x', amount: null, unit: 'splash' as const, optional: false }, 2, 'A splash'],
    [{ id: 'x', amount: 1, unit: null, optional: false }, 3, '3'],
  ])('%j × %i → %s', (ingredient, servings, expected) => {
    expect(formatAmount(ingredient, servings)).toBe(expected);
  });
});
