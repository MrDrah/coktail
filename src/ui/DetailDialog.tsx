// C4: recipe detail dialog with the servings stepper (US-E5-*).
import { useEffect, useRef, useState } from 'react';
import { MAX_SERVINGS, MIN_SERVINGS, normalizer, type Match, type NearMatch } from '../domain';
import { eraLabel } from './CocktailCard';
import { t, tp } from './copy';
import { formatAmount } from './format';
import { CheckIcon, ExternalIcon, GlassIcon, MinusIcon, PlusIcon, SnowflakeIcon, XIcon } from './icons';

interface Props {
  match: Match | NearMatch;
  onClose: () => void;
  onAdd?: ((id: string) => void) | null;
}

export function DetailDialog({ match, onClose, onAdd }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [servings, setServings] = useState(1);
  const { cocktail: c, matchedIds } = match;
  const missingId = 'missingId' in match ? match.missingId : null;

  useEffect(() => {
    const dialog = ref.current!;
    if (!dialog.open) dialog.showModal();
    titleRef.current?.focus();
    document.body.classList.add('scroll-locked');
    return () => document.body.classList.remove('scroll-locked');
  }, []);

  const paragraphs = c.history.split(/\n\s*\n/);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="detail-title"
      aria-describedby="detail-desc"
      data-testid="detail-dialog"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="dialog-panel">
        <header className="dialog-header">
          <div>
            <span className="overline">
              {eraLabel(c)} · {t(`detail.technique.${c.method}`)}
            </span>
            <h2 id="detail-title" className="dialog-title" tabIndex={-1} ref={titleRef} data-testid="detail-title">
              {c.name}
            </h2>
            <p id="detail-desc" className="dialog-desc">
              {c.shortDescription}
            </p>
          </div>
          <button type="button" className="icon-button" aria-label={t('detail.close')} data-testid="detail-close" onClick={onClose}>
            <XIcon size={24} />
          </button>
        </header>

        <div className="dialog-body">
          <section>
            <div className="section-head">
              <h3>{t('detail.ingredients')}</h3>
              <div className="stepper" role="group" aria-labelledby="servings-label">
                <span id="servings-label" className="stepper-label">
                  {t('detail.servings')}
                </span>
                <button
                  type="button"
                  className="stepper-button"
                  aria-label={t('detail.servingsDecrease')}
                  disabled={servings <= MIN_SERVINGS}
                  data-testid="servings-decrease"
                  onClick={() => setServings((s) => s - 1)}
                >
                  <MinusIcon size={18} />
                </button>
                <output className="stepper-value" data-testid="servings-value" aria-live="polite">
                  <span aria-hidden="true">{servings}</span>
                  <span className="sr-only">{t('detail.servingsSr', { count: servings })}</span>
                </output>
                <button
                  type="button"
                  className="stepper-button"
                  aria-label={t('detail.servingsIncrease')}
                  disabled={servings >= MAX_SERVINGS}
                  data-testid="servings-increase"
                  onClick={() => setServings((s) => s + 1)}
                >
                  <PlusIcon size={18} />
                </button>
              </div>
            </div>
            <ul className="ingredient-rows" role="list">
              {c.ingredients.map((i) => {
                const ing = normalizer.ingredient(i.id)!;
                if (ing.classification === 'excluded') {
                  return (
                    <li key={i.id} className="row row-assumed" data-testid={`detail-ingredient-${i.id}`} data-assumed="true">
                      <SnowflakeIcon size={18} />
                      <span className="row-amount" aria-hidden="true">
                        {t('detail.assumedAmount')}
                      </span>
                      <span className="row-name">
                        <span aria-hidden="true">{ing.name}</span>
                        <span className="tag" aria-hidden="true">
                          {t('detail.assumed')}
                        </span>
                        <span className="sr-only">{t('detail.assumedSr', { name: ing.name })}</span>
                      </span>
                      <span className="row-note">{i.note}</span>
                    </li>
                  );
                }
                const matched = matchedIds.includes(i.id);
                const missing = i.id === missingId;
                return (
                  <li key={i.id} className={missing ? 'row row-missing' : 'row'} data-testid={`detail-ingredient-${i.id}`}>
                    {matched ? <CheckIcon size={18} className="row-check" /> : missing ? <PlusIcon size={18} /> : <span />}
                    <span className="row-amount" data-testid={`detail-amount-${i.id}`}>
                      {formatAmount(i, servings)}
                    </span>
                    <span className="row-name">
                      {ing.name}
                      {i.optional && <span className="tag">{t('chip.optional')}</span>}
                      {matched && <span className="sr-only">, {t('detail.youHave')}</span>}
                      {missing && <span className="tag tag-missing">{t('detail.youNeed')}</span>}
                    </span>
                    <span className="row-note">{i.note}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="facts">
              <div>
                <dt>{t('detail.glass')}</dt>
                <dd data-testid="detail-glass">
                  <GlassIcon glass={c.glass} size={20} /> {c.glass}
                </dd>
              </div>
              <div>
                <dt>{t('detail.garnish')}</dt>
                <dd data-testid="detail-garnish">{c.garnish ?? t('detail.garnishNone')}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>{t('detail.method')}</h3>
            <ol className="method" data-testid="detail-method">
              {c.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <h3>{t('detail.taste')}</h3>
            <p className="prose" data-testid="detail-taste">
              {c.tasteProfile}
            </p>
          </section>

          <section data-testid="detail-history">
            <h3>{t('detail.history')}</h3>
            {paragraphs.map((p) => (
              <p className="prose" key={p.slice(0, 32)}>
                {p}
              </p>
            ))}
          </section>

          <section>
            <h3>{t('detail.sources')}</h3>
            <ul className="sources" role="list">
              {c.sources.map((s, index) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" data-testid={`detail-source-${index}`}>
                    {t('detail.sourceLink', { publisher: s.publisher, title: s.title })} <ExternalIcon size={14} />
                    <span className="sr-only"> {t('detail.sourceNewTabSr')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {missingId && onAdd && (
          <footer className="dialog-footer">
            <button type="button" className="add-button add-button-lg" data-testid="detail-add-missing" onClick={() => onAdd(missingId)}>
              {t('nearMatches.addButton', { name: normalizer.ingredient(missingId)!.name })}
            </button>
          </footer>
        )}
      </div>
    </dialog>
  );
}
