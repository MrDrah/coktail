// Chip list state for the ingredient input (C1 commit rules). Pure functions so they're unit-testable.
import { MAX_INGREDIENTS, type IngredientRef, type Normalizer } from '../domain';

export type Chip =
  | { kind: 'ok'; key: string; id: string; name: string }
  | { kind: 'error'; key: string; text: string; suggestions: IngredientRef[] }
  | { kind: 'ambiguous'; key: string; term: string; options: IngredientRef[] };

export type CommitEvent =
  | { type: 'added'; key: string; name: string }
  | { type: 'duplicate'; key: string; name: string }
  | { type: 'excluded' }
  | { type: 'too-many'; name: string }
  | { type: 'ambiguous'; key: string }
  | { type: 'invalid'; key: string };

export interface CommitResult {
  chips: Chip[];
  events: CommitEvent[];
  /** Text left in the input: segments rejected by the 10-ingredient limit. */
  leftover: string;
}

let seq = 0;
const newKey = () => `c${++seq}`;

export const countedIds = (chips: Chip[]) => chips.flatMap((c) => (c.kind === 'ok' ? [c.id] : []));
export const problemChips = (chips: Chip[]) => chips.filter((c) => c.kind !== 'ok');

/** Adds a resolved ingredient, applying the duplicate and limit rules. */
export function addIngredient(chips: Chip[], ref: IngredientRef): { chips: Chip[]; event: CommitEvent } {
  const existing = chips.find((c) => c.kind === 'ok' && c.id === ref.id);
  if (existing) return { chips, event: { type: 'duplicate', key: existing.key, name: ref.name } };
  if (countedIds(chips).length >= MAX_INGREDIENTS) return { chips, event: { type: 'too-many', name: ref.name } };
  const key = newKey();
  return { chips: [...chips, { kind: 'ok', key, id: ref.id, name: ref.name }], event: { type: 'added', key, name: ref.name } };
}

/** Commits typed text. Commas split it into several ingredients, committed in order. */
export function commitText(chips: Chip[], text: string, normalizer: Normalizer): CommitResult {
  const events: CommitEvent[] = [];
  const rejected: string[] = [];
  for (const segment of text.split(',').map((s) => s.trim()).filter(Boolean)) {
    const r = normalizer.normalize(segment);
    if (r.status === 'excluded') {
      events.push({ type: 'excluded' });
    } else if (r.status === 'ok') {
      const added = addIngredient(chips, { id: r.id, name: r.name });
      chips = added.chips;
      events.push(added.event);
      if (added.event.type === 'too-many') rejected.push(segment);
    } else if (r.status === 'ambiguous') {
      const key = newKey();
      chips = [...chips, { kind: 'ambiguous', key, term: segment, options: r.options }];
      events.push({ type: 'ambiguous', key });
    } else {
      const key = newKey();
      chips = [...chips, { kind: 'error', key, text: segment, suggestions: r.suggestions }];
      events.push({ type: 'invalid', key });
    }
  }
  return { chips, events, leftover: rejected.join(', ') };
}

/** Replaces an error or ambiguous chip with a chosen ingredient (or drops it if that's a duplicate). */
export function resolveChip(chips: Chip[], key: string, ref: IngredientRef): { chips: Chip[]; event: CommitEvent } {
  const without = chips.filter((c) => c.key !== key);
  const index = chips.findIndex((c) => c.key === key);
  const result = addIngredient(without, ref);
  if (result.event.type !== 'added') return result;
  // Keep the resolved chip where the pending one was.
  const added = result.chips[result.chips.length - 1]!;
  const next = [...without];
  next.splice(index, 0, added);
  return { chips: next, event: result.event };
}

export const removeChip = (chips: Chip[], key: string) => chips.filter((c) => c.key !== key);

/** Rebuilds chips from canonical IDs (URL state). Unknown IDs are dropped. */
export function chipsFromIds(ids: string[], normalizer: Normalizer): Chip[] {
  let chips: Chip[] = [];
  for (const id of ids) {
    const ing = normalizer.ingredient(id);
    if (ing && ing.classification === 'counted') chips = addIngredient(chips, { id, name: ing.name }).chips;
  }
  return chips;
}

export const chipLabel = (c: Chip) => (c.kind === 'ok' ? c.name : c.kind === 'error' ? c.text : c.term);
