// C3: cocktail card. The near-match variant adds the "Missing" strip with the "+ Add" button (C6).
import { normalizer, type Cocktail, type Match, type NearMatch } from '../domain';
import { t, tp } from './copy';
import { ArrowRightIcon, CheckIcon, GlassIcon, PlusIcon } from './icons';

interface Props {
  match: Match | NearMatch;
  onOpen: (match: Match | NearMatch, opener: HTMLButtonElement) => void;
  /** Near matches only: null when the "+ Add" button is hidden (10 ingredients). */
  onAdd?: ((id: string) => void) | null;
  adding?: string | null;
}

export function eraLabel(c: Cocktail) {
  const era = t(c.era === 'vintage' ? 'card.era.vintage' : 'card.era.modern');
  return c.yearCreated ? t('card.eraYear', { era, year: c.yearCreated }) : era;
}

export function CocktailCard({ match, onOpen, onAdd, adding }: Props) {
  const { cocktail: c, matchedIds } = match;
  const missingId = 'missingId' in match ? match.missingId : null;
  const missingName = missingId ? normalizer.ingredient(missingId)!.name : '';
  const pills = c.ingredients.filter((i) => normalizer.ingredient(i.id)?.classification === 'counted');
  const testid = missingId ? `near-card-${c.id}` : `card-${c.id}`;

  return (
    <article className={missingId ? 'card card-near' : 'card'} aria-labelledby={`card-${c.id}-name`} data-testid={testid}>
      {missingId && (
        <div className="near-strip">
          <span className="overline overline-secondary">{t('nearMatches.missingLabel')}</span>
          {onAdd ? (
            <button
              type="button"
              className="add-button"
              aria-label={t('nearMatches.addButtonSr', { name: missingName })}
              aria-disabled={adding ? true : undefined}
              data-testid={`near-add-${missingId}-${c.id}`}
              onClick={() => !adding && onAdd(missingId)}
            >
              {t('nearMatches.addButton', { name: missingName })}
            </button>
          ) : (
            <span className="pill pill-missing" data-testid={`near-missing-${missingId}-${c.id}`}>
              <PlusIcon size={12} /> {t('nearMatches.missingName', { name: missingName })}
            </span>
          )}
        </div>
      )}
      <div className="card-top">
        <span className={`overline era-${c.era}`} data-testid={`card-era-${c.id}`}>
          {eraLabel(c)}
        </span>
        <span className="card-glass" data-testid={`card-glass-${c.id}`}>
          <GlassIcon glass={c.glass} /> {c.glass}
        </span>
      </div>
      <h3 className="card-name" id={`card-${c.id}-name`}>
        {c.name}
      </h3>
      <p className="card-desc" id={`card-${c.id}-desc`} data-testid={`card-desc-${c.id}`}>
        {c.shortDescription}
      </p>
      <p className="card-taste" aria-hidden="true" data-testid={`card-taste-${c.id}`}>
        {c.tasteProfile}
      </p>
      <div className="card-bottom">
        <ul className="pills" role="list">
          {pills.map((i) => {
            const name = normalizer.ingredient(i.id)!.name;
            const matched = matchedIds.includes(i.id);
            const missing = i.id === missingId;
            const cls = matched ? 'pill pill-matched' : missing ? 'pill pill-missing' : 'pill';
            return (
              <li key={i.id} className={cls} data-testid={`card-ingredient-${c.id}-${i.id}`} data-matched={matched}>
                {matched && <CheckIcon size={12} />}
                {missing && <PlusIcon size={12} />}
                {name}
                {i.optional && ' (opt.)'}
                {matched && <span className="sr-only">, {t('card.matchedSr')}</span>}
              </li>
            );
          })}
        </ul>
        <div className="card-meta">
          <span>{tp('card.uses', matchedIds.length)}</span>
          <span className="card-open-hint" aria-hidden="true">
            {t('card.openHint')} <ArrowRightIcon size={16} />
          </span>
        </div>
      </div>
      <button
        type="button"
        className="card-overlay"
        aria-haspopup="dialog"
        aria-label={c.name}
        aria-describedby={`card-${c.id}-desc`}
        title={t('card.open', { name: c.name })}
        data-testid={`card-open-${c.id}`}
        onClick={(e) => onOpen(match, e.currentTarget)}
      />
    </article>
  );
}
