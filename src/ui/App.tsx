// App shell: ingredient form, search, results / fallback, detail dialog, URL state (US-NF-04) and theme.
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { matcher, MIN_INGREDIENTS, normalizer, type Match, type NearMatch, type SearchResult } from '../domain';
import { addIngredient, chipsFromIds, countedIds, problemChips, type Chip } from './chips';
import { t, tp } from './copy';
import { DetailDialog } from './DetailDialog';
import { MoonIcon, SearchIcon, SunIcon } from './icons';
import { IngredientInput } from './IngredientInput';
import { Results } from './Results';

type Ok = Extract<SearchResult, { status: 'ok' }>;
interface Searched {
  ids: string[];
  result: Ok;
}

const readUrlIds = () =>
  (new URLSearchParams(window.location.search).get('i') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

function writeUrlIds(ids: string[]) {
  const url = new URL(window.location.href);
  url.searchParams.set('i', ids.join(','));
  if (url.href !== window.location.href) window.history.pushState({ ids }, '', url);
}

function initialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage may be unavailable (private mode); fall back to the system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App() {
  const [chips, setChips] = useState<Chip[]>([]);
  const [searched, setSearched] = useState<Searched | null>(null);
  const [sawExcluded, setSawExcluded] = useState(false);
  const [detail, setDetail] = useState<Match | NearMatch | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [politeMsg, setPoliteMsg] = useState('');
  const [theme, setTheme] = useState(initialTheme);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const focusResults = useRef(false);

  const ids = countedIds(chips);
  const problems = problemChips(chips);
  const canSearch = problems.length === 0 && ids.length >= MIN_INGREDIENTS;
  const stale = searched !== null && searched.ids.join() !== [...ids].join();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Not persisted; the toggle still works for this visit.
    }
  }, [theme]);

  const runSearch = useCallback((searchIds: string[], pushUrl = true) => {
    const result = matcher.search(searchIds);
    if (result.status !== 'ok') return;
    setSearched({ ids: searchIds, result });
    if (pushUrl) writeUrlIds(searchIds);
    focusResults.current = true;
    if (result.matches.length) setStatus(tp('results.countSr', result.matches.length));
    else if (result.nearMatches.length) {
      const best = result.bestAddition;
      const extra = best
        ? ' ' + tp('bestAddition.liveSr', best.unlocks, { name: normalizer.ingredient(best.id)!.name })
        : '';
      setStatus(t('fallback.liveSr', { count: result.nearMatches.length }) + extra);
    } else setStatus(t('empty.liveSr'));
  }, []);

  // Restore from the URL on load and on back/forward.
  useEffect(() => {
    const restore = () => {
      const restored = chipsFromIds(readUrlIds(), normalizer);
      setChips(restored);
      const restoredIds = countedIds(restored);
      if (restoredIds.length >= MIN_INGREDIENTS) runSearch(restoredIds, false);
      else setSearched(null);
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [runSearch]);

  // Move focus to the results heading after a search renders.
  useEffect(() => {
    if (!focusResults.current || !headingRef.current) return;
    focusResults.current = false;
    const heading = headingRef.current;
    heading.focus({ preventScroll: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Next frame, so the click that triggered the search can't cancel the smooth scroll.
    requestAnimationFrame(() => heading.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
  }, [searched]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSearch) {
      runSearch(ids);
      return;
    }
    // aria-disabled CTA: move focus to the first problem (C2).
    const first = problems[0];
    const target = first
      ? document.querySelector<HTMLElement>(`[data-testid="chip-list"] li:nth-child(${chips.indexOf(first) + 1}) button`)
      : document.getElementById('ingredient-input');
    target?.focus();
  }

  function addAndSearch(id: string) {
    const ing = normalizer.ingredient(id)!;
    const result = addIngredient(chips, { id, name: ing.name });
    if (result.event.type !== 'added') return;
    setAdding(id);
    setChips(result.chips);
    setDetail(null);
    setPoliteMsg(t('nearMatches.addedSr', { name: ing.name }));
    runSearch(countedIds(result.chips));
    setAdding(null);
  }

  function reset() {
    setChips([]);
    setSearched(null);
    writeUrlIds([]);
    document.getElementById('ingredient-input')?.focus();
  }

  const helper =
    problems.length > 0
      ? tp('hint.fixChips', problems.length)
      : ids.length === 0
        ? sawExcluded
          ? t('hint.onlyExcluded')
          : t('hint.min')
        : ids.length === 1
          ? t('hint.minOne')
          : '';

  return (
    <>
      <a className="skip-link" href="#results-anchor">
        {t('app.skipLink')}
      </a>
      <header className="topbar">
        <span className="wordmark">
          <span className="wordmark-cube" aria-hidden="true" />
          {t('app.title')}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={theme === 'dark' ? t('app.themeToggle.light') : t('app.themeToggle.dark')}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="main">
        <section className="hero">
          <h1>{t('app.heading')}</h1>
          <p className="tagline">{t('app.tagline')}</p>
          <form role="search" aria-label="Find cocktails by ingredient" className="search-form" onSubmit={onSubmit} noValidate>
            <IngredientInput
              chips={chips}
              onChange={setChips}
              announce={setPoliteMsg}
              onExcluded={() => setSawExcluded(true)}
            />
            <div className="cta-row">
              <button
                type="submit"
                className="cta"
                aria-disabled={!canSearch || undefined}
                aria-describedby="cta-helper"
                data-testid="search-button"
              >
                <SearchIcon />
                {searched && stale ? t('cta.searchAgain') : t('cta.search')}
              </button>
              <p id="cta-helper" className="helper" data-testid="search-helper">
                {helper}
              </p>
            </div>
          </form>
        </section>

        <div id="results-anchor" />
        {searched && (
          <Results
            ref={headingRef}
            result={searched.result}
            stale={stale}
            onOpen={(m, button) => {
              opener.current = button;
              setDetail(m);
            }}
            onAdd={addAndSearch}
            onReset={reset}
            ingredientCount={ids.length}
            adding={adding}
          />
        )}
      </main>

      <footer className="footer">{t('app.footer')}</footer>

      {detail && (
        <DetailDialog
          match={detail}
          onAdd={ids.length < 10 ? addAndSearch : null}
          onClose={() => {
            setDetail(null);
            // After the dialog unmounts; focusing while it's still modal would be swallowed.
            requestAnimationFrame(() => opener.current?.focus());
          }}
        />
      )}

      <div className="sr-only" aria-live="polite" id="results-status" data-testid="results-status">
        {status}
      </div>
      <div className="sr-only" aria-live="polite">
        {politeMsg}
      </div>
    </>
  );
}
