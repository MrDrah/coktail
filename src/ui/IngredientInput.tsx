// C1: ingredient multi-select combobox with chips, error chips and the ambiguity chooser.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { cleanTerm, MAX_INGREDIENTS, normalizer, type IngredientRef } from '../domain';
import { addIngredient, chipLabel, commitText, countedIds, removeChip, resolveChip, type Chip, type CommitEvent } from './chips';
import { t, tp } from './copy';
import { AlertIcon, ChevronDownIcon, InfoIcon, XIcon } from './icons';

interface Props {
  chips: Chip[];
  onChange: (chips: Chip[]) => void;
  announce: (message: string) => void;
  onExcluded: () => void;
}

const HINT_MS = 4000;
const categoryOf = (id: string) => normalizer.ingredient(id)?.category ?? 'excluded';

export function IngredientInput({ chips, onChange, announce, onExcluded }: Props) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [chooserKey, setChooserKey] = useState<string | null>(null);
  const [limitName, setLimitName] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintTimer = useRef<number>();
  const id = useId();
  const listboxId = 'ingredient-listbox';

  const counted = countedIds(chips);
  const full = counted.length >= MAX_INGREDIENTS;
  const options = open ? normalizer.autocomplete(text, 8) : [];
  const errorChips = chips.filter((c): c is Extract<Chip, { kind: 'error' }> => c.kind === 'error');
  const chooserChip = chips.find((c) => c.key === chooserKey && c.kind === 'ambiguous') as Extract<Chip, { kind: 'ambiguous' }> | undefined;

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);
  useEffect(() => {
    if (!flashKey) return;
    const timer = window.setTimeout(() => setFlashKey(null), 1000);
    return () => window.clearTimeout(timer);
  }, [flashKey]);

  function flashHint() {
    setShowHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setShowHint(false), HINT_MS);
  }

  function handleEvents(events: CommitEvent[]) {
    setLimitName(null);
    for (const e of events) {
      if (e.type === 'added') announce(t('chip.addedSr', { name: e.name }));
      else if (e.type === 'duplicate') {
        setFlashKey(e.key);
        announce(t('chip.duplicate', { name: e.name }));
      } else if (e.type === 'excluded') {
        onExcluded();
        flashHint();
      } else if (e.type === 'too-many') setLimitName(e.name);
      else if (e.type === 'ambiguous') setChooserKey(e.key);
    }
  }

  function commit(value: string) {
    const result = commitText(chips, value, normalizer);
    onChange(result.chips);
    handleEvents(result.events);
    setText(result.leftover);
    setOpen(false);
    setActive(-1);
  }

  function pick(ref: IngredientRef) {
    const result = addIngredient(chips, ref);
    onChange(result.chips);
    handleEvents([result.event]);
    if (result.event.type !== 'too-many') setText('');
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  }

  function remove(chip: Chip) {
    onChange(removeChip(chips, chip.key));
    announce(t('chip.removedSr', { name: chipLabel(chip) }));
    setArmedKey(null);
    setLimitName(null);
    if (chooserKey === chip.key) setChooserKey(null);
    inputRef.current?.focus();
  }

  function resolve(chip: Chip, ref: IngredientRef) {
    const result = resolveChip(chips, chip.key, ref);
    onChange(result.chips);
    if (result.event.type === 'added') {
      announce(
        chip.kind === 'ambiguous'
          ? t('ambiguity.resolvedSr', { term: chip.term, name: ref.name })
          : t('error.replacedSr', { text: chipLabel(chip), name: ref.name }),
      );
    } else handleEvents([result.event]);
    setChooserKey(null);
    inputRef.current?.focus();
  }

  function editErrorChip(chip: Chip) {
    onChange(removeChip(chips, chip.key));
    setText(chipLabel(chip));
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Backspace') setArmedKey(null);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!open) setOpen(true);
      const n = options.length;
      if (n) setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = active >= 0 ? options[active] : undefined;
      if (option) pick(option);
      else if (text.trim()) commit(text);
    } else if (e.key === ',') {
      e.preventDefault();
      if (text.trim()) commit(text);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Backspace' && text === '' && chips.length) {
      const last = chips[chips.length - 1]!;
      if (armedKey === last.key) remove(last);
      else {
        setArmedKey(last.key);
        announce(t('chip.backspaceArmedSr', { name: chipLabel(last) }));
      }
    }
  }

  const placeholder = full ? t('input.placeholderFull') : chips.length ? t('input.placeholderMore') : t('input.placeholder');
  const activeId = active >= 0 && options[active] ? `${id}-opt-${options[active]!.id}` : undefined;

  return (
    <div className="ingredient-input">
      <div className="field-header">
        <label htmlFor="ingredient-input" className="field-label">
          {t('input.label')}
        </label>
        <span className={full ? 'counter counter-full' : 'counter'} id="ingredient-counter" data-testid="ingredient-counter">
          {t('input.counter', { count: counted.length })}
        </span>
        {chips.length > 0 && (
          <button
            type="button"
            className="text-button"
            aria-label={t('cta.clearAllSr')}
            data-testid="ingredient-clear-all"
            onClick={() => {
              onChange([]);
              setChooserKey(null);
              setLimitName(null);
              inputRef.current?.focus();
            }}
          >
            {t('cta.clearAll')}
          </button>
        )}
      </div>

      <div className="field" data-testid="ingredient-field" onClick={() => inputRef.current?.focus()}>
        <ul className="chip-list" aria-label={t('input.listLabel')} data-testid="chip-list">
          {chips.map((chip, index) => (
            <ChipView
              key={chip.key}
              chip={chip}
              index={index}
              armed={armedKey === chip.key}
              flashing={flashKey === chip.key}
              chooserOpen={chooserKey === chip.key}
              onRemove={() => remove(chip)}
              onEdit={() => editErrorChip(chip)}
              onOpenChooser={() => setChooserKey(chooserKey === chip.key ? null : chip.key)}
            />
          ))}
        </ul>
        <input
          ref={inputRef}
          id="ingredient-input"
          data-testid="ingredient-input"
          className="field-input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open && options.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-describedby="ingredient-helper ingredient-error ingredient-counter"
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            const value = e.target.value;
            if (value.includes(',')) {
              const lastComma = value.lastIndexOf(',');
              commit(value.slice(0, lastComma));
              setText(value.slice(lastComma + 1).trimStart());
              return;
            }
            setText(value);
            setOpen(value.trim().length > 0);
            setActive(-1);
            setLimitName(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        />
        {open && text.trim() && (
          <ul className="listbox" id={listboxId} role="listbox" aria-label={t('listbox.label')} data-testid="ingredient-listbox">
            {options.length === 0 && <li className="listbox-empty">{t('listbox.noResults')}</li>}
            {options.map((o, i) => {
              const added = counted.includes(o.id);
              const viaSynonym = !cleanTerm(o.name).includes(cleanTerm(text));
              return (
                <li
                  key={o.id}
                  id={`${id}-opt-${o.id}`}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={added || undefined}
                  className={i === active ? 'option option-active' : 'option'}
                  data-testid={`ingredient-option-${o.id}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => !added && pick(o)}
                >
                  <span className="cat-dot" style={{ background: `var(--cat-${categoryOf(o.id)})` }} aria-hidden="true" />
                  <span className="option-name">
                    {viaSynonym ? (
                      <>
                        <span className="option-typed">{text.trim()}</span> <span aria-hidden="true">→</span> {o.name}
                      </>
                    ) : (
                      o.name
                    )}
                    {added && <span className="option-added"> · {t('listbox.alreadyAdded')}</span>}
                  </span>
                  <span className="option-cat">{categoryOf(o.id).replace('-', ' ')}</span>
                </li>
              );
            })}
          </ul>
        )}
        {chooserChip && (
          <div className="chooser" role="dialog" aria-labelledby={`${id}-chooser-title`} data-testid="ambiguity-chooser">
            <p className="chooser-title" id={`${id}-chooser-title`}>
              {t('ambiguity.prompt', { term: chooserChip.term })}
            </p>
            <p className="chooser-help">{t('ambiguity.help')}</p>
            <div role="group" aria-label={t('ambiguity.prompt', { term: chooserChip.term })} className="chooser-options">
              {chooserChip.options.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  className="chooser-option"
                  data-testid={`ambiguity-option-${o.id}`}
                  autoFocus={i === 0}
                  onClick={() => resolve(chooserChip, o)}
                  onKeyDown={(e) => e.key === 'Escape' && setChooserKey(null)}
                >
                  <span className="cat-dot" style={{ background: `var(--cat-${categoryOf(o.id)})` }} aria-hidden="true" />
                  <span>{o.name}</span>
                  <span className="option-cat">{categoryOf(o.id).replace('-', ' ')}</span>
                </button>
              ))}
            </div>
            <button type="button" className="text-button chooser-remove" data-testid="ambiguity-remove" onClick={() => remove(chooserChip)}>
              {t('ambiguity.cancel', { term: chooserChip.term })}
            </button>
          </div>
        )}
      </div>

      <div id="ingredient-error" data-testid="ingredient-error">
        {limitName && (
          <p className="message message-error" role="alert" data-testid="hint-limit">
            <AlertIcon size={16} /> {t('error.tooMany', { name: limitName })}
          </p>
        )}
        {errorChips.map((chip, i) => (
          <div className="message message-error" key={chip.key}>
            <AlertIcon size={16} />
            <div>
              {chip.suggestions.length ? t('error.didYouMean', { text: chip.text }) : t('error.unrecognised', { text: chip.text })}
              {chip.suggestions.length > 0 && (
                <span className="suggestions">
                  {chip.suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="suggestion"
                      aria-label={t('error.suggestionSr', { text: chip.text, name: s.name })}
                      data-testid={`suggestion-${s.id}`}
                      data-error-index={i}
                      onClick={() => resolve(chip, s)}
                    >
                      <span className="cat-dot" style={{ background: `var(--cat-${categoryOf(s.id)})` }} aria-hidden="true" />
                      {s.name}
                    </button>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showHint && (
        <p className="message message-info" role="status" data-testid="hint-excluded">
          <InfoIcon size={16} /> {t('hint.excluded')}
        </p>
      )}
      <p className="helper" id="ingredient-helper">
        {t('input.helper')}
      </p>
      <span className="sr-only" aria-live="polite">
        {t('input.counterSr', { count: counted.length })}
      </span>
      <span className="sr-only" aria-live="polite">
        {open && text.trim() ? tp('listbox.countSr', options.length) : ''}
      </span>
    </div>
  );
}

interface ChipViewProps {
  chip: Chip;
  index: number;
  armed: boolean;
  flashing: boolean;
  chooserOpen: boolean;
  onRemove: () => void;
  onEdit: () => void;
  onOpenChooser: () => void;
}

function ChipView({ chip, index, armed, flashing, chooserOpen, onRemove, onEdit, onOpenChooser }: ChipViewProps) {
  const classes = ['chip', `chip-${chip.kind}`, armed && 'chip-armed', flashing && 'chip-flash'].filter(Boolean).join(' ');
  if (chip.kind === 'ambiguous') {
    return (
      <li className={classes} data-testid={`chip-ambiguous-${chip.term}`}>
        <button
          type="button"
          className="chip-choose"
          aria-haspopup="dialog"
          aria-expanded={chooserOpen}
          onClick={(e) => {
            e.stopPropagation();
            onOpenChooser();
          }}
        >
          {/* Accessible name keeps the visible text: "orange, needs a choice Choose". */}
          <span aria-hidden="true">?</span> {chip.term}
          <span className="sr-only">{t('ambiguity.chipSr', { term: '' })}</span>
          <span className="chip-badge">
            {t('ambiguity.chipBadge')} <ChevronDownIcon size={14} />
          </span>
        </button>
        <RemoveButton label={chip.term} onRemove={onRemove} testid={`chip-remove-ambiguous-${chip.term}`} />
      </li>
    );
  }
  if (chip.kind === 'error') {
    return (
      <li className={classes} data-testid={`chip-error-${index}`}>
        <AlertIcon size={14} />
        <button
          type="button"
          className="chip-text-button"
          aria-label={`${t('error.chipSr', { text: chip.text })}. ${t('chip.edit', { text: chip.text })}`}
          data-testid={`chip-edit-error-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          {chip.text}
        </button>
        <RemoveButton label={chip.text} onRemove={onRemove} testid={`chip-remove-error-${index}`} />
      </li>
    );
  }
  return (
    <li className={classes} data-testid={`chip-${chip.id}`}>
      <span className="cat-dot" style={{ background: `var(--cat-${categoryOf(chip.id)})` }} aria-hidden="true" />
      {chip.name}
      <RemoveButton label={chip.name} onRemove={onRemove} testid={`chip-remove-${chip.id}`} />
    </li>
  );
}

function RemoveButton({ label, onRemove, testid }: { label: string; onRemove: () => void; testid: string }) {
  return (
    <button
      type="button"
      className="chip-remove"
      aria-label={t('chip.remove', { name: label })}
      data-testid={testid}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
    >
      <XIcon size={14} />
    </button>
  );
}
