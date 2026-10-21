// C5 results grid and C6 fallback / near matches / empty state.
import { forwardRef } from 'react';
import { MAX_INGREDIENTS, normalizer, type Match, type NearMatch, type SearchResult } from '../domain';
import { CocktailCard } from './CocktailCard';
import { t, tp } from './copy';
import { CoupeIllustration } from './icons';

type Ok = Extract<SearchResult, { status: 'ok' }>;

interface Props {
  result: Ok;
  stale: boolean;
  onOpen: (match: Match | NearMatch, opener: HTMLButtonElement) => void;
  onAdd: (id: string) => void;
  onReset: () => void;
  ingredientCount: number;
  adding: string | null;
}

/** Grid modifier so small counts look intentional (C5 table). */
const gridClass = (n: number) => `grid grid-n${Math.min(n, 9)}`;

export const Results = forwardRef<HTMLHeadingElement, Props>(function Results(
  { result, stale, onOpen, onAdd, onReset, ingredientCount, adding },
  headingRef,
) {
  const canAdd = ingredientCount < MAX_INGREDIENTS;

  if (result.matches.length > 0) {
    const n = result.matches.length;
    return (
      <section className={stale ? 'results results-stale' : 'results'} aria-labelledby="results-title" data-testid="results">
        <h2 id="results-title" className="section-title" tabIndex={-1} ref={headingRef} data-testid="results-title">
          {t('results.title')}
        </h2>
        <p className="results-count" data-testid="results-count">
          {tp('results.count', n)}
        </p>
        {result.total > n && (
          <p className="results-sub" data-testid="results-capped">
            {t('results.capped', { shown: n, total: result.total })}
          </p>
        )}
        {n === 1 && <p className="results-sub">{t('results.single')}</p>}
        {stale && <p className="stale-note">{t('results.stale')}</p>}
        <ul className={gridClass(n)} role="list" data-testid="results-grid">
          {result.matches.map((m) => (
            <li key={m.cocktail.id}>
              <CocktailCard match={m} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (result.nearMatches.length === 0) {
    return (
      <section className="notice" aria-labelledby="fallback-title" data-testid="empty-state">
        <CoupeIllustration withIce={false} />
        <h2 id="fallback-title" className="notice-title" tabIndex={-1} ref={headingRef}>
          {t('empty.title')}
        </h2>
        <p>{t('empty.body')}</p>
        <p className="notice-tip">{t('empty.tip')}</p>
        <button type="button" className="outline-button" data-testid="empty-reset" onClick={onReset}>
          {t('empty.action')}
        </button>
      </section>
    );
  }

  const best = result.bestAddition;
  const bestName = best ? normalizer.ingredient(best.id)!.name : '';
  return (
    <>
      <section className="notice" aria-labelledby="fallback-title" data-testid="fallback">
        <CoupeIllustration />
        <h2 id="fallback-title" className="notice-title" tabIndex={-1} ref={headingRef} data-testid="fallback-title">
          {t('fallback.title')}
        </h2>
        <p>{t('fallback.body')}</p>
        {best && canAdd ? (
          <div className="best-addition" role="group" aria-labelledby="best-addition-label" data-testid="best-addition">
            <div>
              <span className="overline overline-secondary" id="best-addition-label">
                {t('bestAddition.label')}
              </span>
              <p className="best-text">{tp('bestAddition.text', best.unlocks, { name: bestName })}</p>
            </div>
            <button
              type="button"
              className="add-button"
              aria-label={t('bestAddition.buttonSr', { name: bestName })}
              aria-disabled={adding ? true : undefined}
              data-testid="best-addition-add"
              onClick={() => !adding && onAdd(best.id)}
            >
              {t('bestAddition.button', { name: bestName })}
            </button>
          </div>
        ) : (
          <p className="message message-info" data-testid="fallback-tip">
            {t('fallback.tip')}
          </p>
        )}
      </section>
      <section className="results" aria-labelledby="near-title" data-testid="near-matches">
        <h2 id="near-title" className="section-title section-title-near" data-testid="near-matches-title">
          {t('nearMatches.title')}
        </h2>
        <p className="results-sub">{t('nearMatches.subtitle')}</p>
        <ul className={gridClass(result.nearMatches.length)} role="list">
          {result.nearMatches.map((m) => (
            <li key={m.cocktail.id}>
              <CocktailCard match={m} onOpen={onOpen} onAdd={canAdd ? onAdd : null} adding={adding} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
});
