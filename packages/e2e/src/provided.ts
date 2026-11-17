/**
 * `inject()`: the values a target's `provide` hands to the code that runs on
 * it, the way Vitest's `provide`/`inject` hand config values to tests. A worker
 * runs one target, so the values live in the worker process; the runner's
 * own process holds none, and a test file read there while collecting gets
 * an error instead of a value that differs from the worker's.
 */

import type { JsonValue } from '@e2e-dev/core/lib/types';
import { TestError } from '@e2e-dev/core/lib/internal/errors';

/** The values `inject()` returns, by key; widen it with `declare module 'e2e' { interface ProvidedContext { ... } }`. */
// oxlint-disable-next-line no-empty-interface
export interface ProvidedContext {}

const STORE = Symbol.for('e2e.provided');

type Holder = { [STORE]?: Record<string, JsonValue> };

/** Replaces this process's provided values; the worker calls it once its target is known. */
export function setProvidedValues(values: Readonly<Record<string, JsonValue>>): void {
  (globalThis as Holder)[STORE] = { ...values };
}

/** Drops this process's provided values once the in-process worker that set them ended. */
export function clearProvidedValues(): void {
  delete (globalThis as Holder)[STORE];
}

/**
 * A value the current target provides. `undefined` for a key nobody provided, as in Vitest.
 * Throws outside a target's worker, such as while the runner collects tests.
 */
export function inject<K extends keyof ProvidedContext & string>(key: K): ProvidedContext[K] {
  const values = (globalThis as Holder)[STORE];
  if (values === undefined) {
    throw new TestError(
      'INVALID_ARGUMENT',
      `inject("${key}") runs only while a target runs: in a test, a hook, or a fixture, never at a test file's top level`,
    );
  }
  return values[key] as ProvidedContext[K];
}
