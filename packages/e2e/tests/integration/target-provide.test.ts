import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFakeEngine, FAKE_APP, FAKE_APP_URL } from '../helpers/fake-engine.ts';
import { assertValidReport } from '../helpers/report-schema.ts';
import { runProject, runProjectWithConfigFile } from '../helpers/run-project.ts';

/** A suite that reads the target's values from a test body, a hook, and a fixture, and writes them to `outDir`. */
const suite = (outDir: string) => `import { appendFileSync } from 'node:fs';
import { inject, beforeAll, test as base } from 'e2e';

declare module 'e2e' {
  interface ProvidedContext {
    variant: 'A' | 'B';
    flags: { checkout: string };
  }
}

const test = base.extend<{ variant: string }>({
  variant: async ({}, use) => use(inject('variant')),
});

let fromHook: string | undefined;
beforeAll(() => {
  fromHook = inject('variant');
});

test('reads its own target', async ({ variant }) => {
  const seen = [inject('variant'), variant, fromHook, inject('flags').checkout, String(inject('missing' as never))];
  appendFileSync(${JSON.stringify(path.join(outDir, 'seen.txt'))}, seen.join(',') + '\\n');
});
`;

/** The lines the suite wrote, sorted. */
const seenLines = (outDir: string) => readFileSync(path.join(outDir, 'seen.txt'), 'utf8').trim().split('\n').toSorted();

const TARGETS = `[
    { name: 'variant-a', platform: 'fake', engine: createFakeEngine().engine, app: FAKE_APP, provide: { variant: 'A', flags: { checkout: 'classic' } } },
    { name: 'variant-b', platform: 'fake', engine: createFakeEngine().engine, app: FAKE_APP, provide: { variant: 'B', flags: { checkout: 'new' } } },
  ]`;

describe('target provide and inject()', () => {
  it(
    'gives each worker its own target values',
    async () => {
      const outDir = mkdtempSync(path.join(tmpdir(), 'e2e-provide-'));
      const { outcome, project } = await runProjectWithConfigFile(
        { 'tests/variant.e2e.ts': suite(outDir) },
        {
          configSource: `import type { E2EConfig } from 'e2e';
import { createFakeEngine, FAKE_APP } from '../../helpers/fake-engine.ts';

export default { targets: ${TARGETS}, workers: 2 } satisfies E2EConfig;
`,
        },
      );
      expect(outcome.results.map((result) => [result.target.name, result.status]).toSorted()).toEqual([
        ['variant-a', 'passed'],
        ['variant-b', 'passed'],
      ]);
      expect(outcome.exitCode).toBe(0);
      expect(seenLines(outDir)).toEqual(['A,A,A,classic,undefined', 'B,B,B,new,undefined']);
      assertValidReport(outcome.report);
      expect(JSON.stringify(outcome.report)).not.toContain('classic');
      project.cleanup();
    },
    120_000,
  );

  it(
    'gives the in-process worker the target it runs',
    async () => {
      const outDir = mkdtempSync(path.join(tmpdir(), 'e2e-provide-'));
      const engine = () => createFakeEngine().engine;
      const { outcome, project } = await runProject(
        { 'tests/variant.e2e.ts': suite(outDir) },
        {
          appUrl: FAKE_APP_URL,
          config: {
            targets: [
              { name: 'variant-a', platform: 'fake', engine: engine(), app: FAKE_APP, provide: { variant: 'A', flags: { checkout: 'classic' } } },
              { name: 'variant-b', platform: 'fake', engine: engine(), app: FAKE_APP, provide: { variant: 'B', flags: { checkout: 'new' } } },
            ],
          },
        },
      );
      expect(outcome.results.map((result) => result.status)).toEqual(['passed', 'passed']);
      expect(seenLines(outDir)).toEqual(['A,A,A,classic,undefined', 'B,B,B,new,undefined']);
      expect(outcome.exitCode).toBe(0);
      project.cleanup();
    },
    120_000,
  );

  it(
    'refuses inject() at a test file top level',
    async () => {
      const { outcome, project } = await runProject(
        { 'tests/top.e2e.ts': `import { inject, test } from 'e2e';\n\nif (inject('variant' as never) === 'B') test('never registered', async () => {});\n` },
        {
          appUrl: FAKE_APP_URL,
          config: { targets: [{ name: 'variant-b', platform: 'fake', engine: createFakeEngine().engine, app: FAKE_APP, provide: { variant: 'B' } }] },
        },
      );
      expect(outcome.exitCode).toBe(2);
      expect(outcome.report.run.errors.map((error) => error.code)).toEqual(['COLLECTION_ERROR']);
      expect(outcome.report.run.errors[0]?.message).toMatch(/inject\("variant"\) runs only while a target runs/);
      project.cleanup();
    },
    120_000,
  );

  it(
    'refuses a provide that is not JSON',
    async () => {
      const { outcome, project } = await runProject(
        { 'tests/any.e2e.ts': `import { test } from 'e2e';\n\ntest('any', async () => {});\n` },
        {
          appUrl: FAKE_APP_URL,
          config: {
            targets: [
              { name: 'bad', platform: 'fake', engine: createFakeEngine().engine, app: FAKE_APP, provide: { at: new Date(0) as never } },
            ],
          },
        },
      );
      expect(outcome.report.run.errors.map((error) => error.code)).toEqual(['INVALID_CONFIG']);
      expect(outcome.exitCode).toBe(2);
      expect(outcome.report.run.errors[0]?.message).toMatch(/provide\.at/);
      project.cleanup();
    },
    120_000,
  );
});
