/**
 * `inject()`: the values a target provides to the code that runs on it, its
 * static `provide` and what its `bootstrap` provided, the way Vitest's
 * `provide`/`inject` hand config and globalSetup values to tests. A worker
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

/** Adds one provided value to this process's values. */
export function addProvidedValue(key: string, value: JsonValue): void {
  const holder = globalThis as Holder;
  holder[STORE] = { ...holder[STORE], [key]: value };
}

/**
 * A value the current target provides: its `provide`, then what its
 * `bootstrap` provided. `undefined` for a key nobody provided, as in Vitest.
 * Throws outside a target's worker, such as while the runner collects tests.
 */
export function inject<K extends keyof ProvidedContext & string>(key: K): ProvidedContext[K] {
  const values = (globalThis as Holder)[STORE];
  if (values === undefined) {
    throw new TestError(
      'INVALID_ARGUMENT',
      `inject("${key}") runs only while a target runs: in a test, a hook, a fixture, or bootstrap, never at a test file's top level`,
    );
  }
  return values[key] as ProvidedContext[K];
}
