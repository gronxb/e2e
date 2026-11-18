import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runProjectWithConfigFile } from '../helpers/run-project.ts';

/**
 * A worker-path config whose targets log every bootstrap and teardown to
 * `log`. `failing` throws before providing; `afterProvide` provides, then
 * fails as a sign-in would (`throw`, every time) or kills its worker
 * (`crash`, the first time only). `step` taps Submit, then fails every
 * time; `step-once` does the same on the first try only.
 */
const config = (log: string, failing: string, afterProvide: { target: string; how: 'throw' | 'crash' | 'step' | 'step-once' } | undefined = undefined) => `import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import type { App, BootstrapContext, E2EConfig, Screen, Target } from 'e2e';
import { createFakeEngine, FAKE_APP } from '../../helpers/fake-engine.ts';

const log = (line: string) => appendFileSync(${JSON.stringify(log)}, line + '\\n');

const role = (name: string): Target => ({
  name,
  platform: 'fake',
  engine: createFakeEngine().engine,
  app: FAKE_APP,
  provide: { role: name },
  bootstrap: async ({ target, inject, provide, app, screen }: BootstrapContext & { app: App; screen: Screen }) => {
    const known = inject('account') as string | undefined;
    const fixtures = typeof app.open === 'function' && typeof screen.getByText === 'function' ? 'fixtures' : 'none';
    log('bootstrap ' + target.name + '#' + String(target.slot) + ' known=' + String(known) + ' ' + fixtures + ' pid=' + String(process.pid));
    if (target.name === ${JSON.stringify(failing)}) throw new Error('backend refused');
    provide('account', known ?? target.name + '-account');
    if (target.name === ${JSON.stringify(afterProvide?.target ?? '')}) {
      if (${JSON.stringify(afterProvide?.how)} === 'throw') throw new Error('sign-in failed');
      if (${JSON.stringify(afterProvide?.how)} === 'step' || ${JSON.stringify(afterProvide?.how)} === 'step-once') {
        await screen.getByRole('button', 'Submit').tap();
        const once = ${JSON.stringify(log)} + '.failed-once';
        if (${JSON.stringify(afterProvide?.how)} === 'step' || !existsSync(once)) {
          writeFileSync(once, '');
          throw new Error('sign-in did not reach home');
        }
        return;
      }
      const marker = ${JSON.stringify(log)} + '.crashed';
      if (!existsSync(marker)) {
        writeFileSync(marker, '');
        process.exit(1);
      }
    }
  },
  teardown: async ({ target, inject }) => {
    log('teardown ' + target.name + '#' + String(target.slot) + ' account=' + String(inject('account')) + ' pid=' + String(process.pid));
  },
});

export default { targets: [role('admin'), role('member')], workers: 1 } satisfies E2EConfig;
`;

const SUITE = {
  'tests/a-fails.e2e.ts': `import { test } from 'e2e';

test('fails once to replace the worker', async () => {
  throw new Error('on purpose');
});
`,
  'tests/b-reads.e2e.ts': `import { inject, test } from 'e2e';

test('reads what bootstrap provided', async () => {
  if (inject('account' as never) !== inject('role' as never) + '-account') throw new Error('wrong account');
});
`,
};

/** The log's lines with the pid replaced by who wrote it. */
const lines = (log: string) =>
  readFileSync(log, 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.replace(/ pid=(\d+)$/u, (_, pid: string) => (pid === String(process.pid) ? ' runner' : ' worker')));

const newLog = () => path.join(mkdtempSync(path.join(tmpdir(), 'e2e-bootstrap-')), 'log.txt');

describe('target bootstrap and teardown', () => {
  it(
    'runs bootstrap per worker, shows a replacement worker what its slot provided, and tears down in the runner',
    async () => {
      const log = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-bootstrap-')), 'log.txt');
      const { outcome, project } = await runProjectWithConfigFile(SUITE, { configSource: config(log, 'none') });
      const statuses = outcome.results.map((result) => `${result.target.name} ${result.test.title} ${result.status}`).toSorted();
      expect(statuses).toEqual([
        'admin fails once to replace the worker failed',
        'admin reads what bootstrap provided passed',
        'member fails once to replace the worker failed',
        'member reads what bootstrap provided passed',
      ]);
      const admin = lines(log).filter((line) => line.includes('admin'));
      expect(admin).toEqual([
        'bootstrap admin#0 known=undefined fixtures worker',
        'bootstrap admin#0 known=admin-account fixtures worker',
        'teardown admin#0 account=admin-account runner',
      ]);
      project.cleanup();
    },
    120_000,
  );

  it(
    'skips the target whose bootstrap keeps failing and tears nothing down for it',
    async () => {
      const log = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-bootstrap-')), 'log.txt');
      const { outcome, project } = await runProjectWithConfigFile(SUITE, { configSource: config(log, 'member') });
      const member = outcome.results.filter((result) => result.target.name === 'member');
      expect(member.map((result) => result.status)).toEqual(['skipped', 'skipped']);
      const admin = outcome.results.filter((result) => result.target.name === 'admin');
      expect(admin.map((result) => result.status).toSorted()).toEqual(['failed', 'passed']);
      const memberLines = lines(log).filter((line) => line.includes('member'));
      expect(memberLines).toEqual(['bootstrap member#0 known=undefined fixtures worker', 'bootstrap member#0 known=undefined fixtures worker']);
      expect(lines(log)).toContain('teardown admin#0 account=admin-account runner');
      expect(outcome.exitCode).not.toBe(0);
      project.cleanup();
    },
    120_000,
  );
  it(
    'keeps what a failing bootstrap provided: the next worker starts from it, and the slot is torn down',
    async () => {
      const log = newLog();
      const { outcome, project } = await runProjectWithConfigFile(SUITE, { configSource: config(log, 'none', { target: 'member', how: 'throw' }) });
      const member = outcome.results.filter((result) => result.target.name === 'member');
      expect(member.map((result) => result.status)).toEqual(['skipped', 'skipped']);
      expect(outcome.report.run.errors.map((error) => error.code)).toContain('WORKER_INIT_FAILED');
      expect(lines(log).filter((line) => line.includes('member'))).toEqual([
        'bootstrap member#0 known=undefined fixtures worker',
        'bootstrap member#0 known=member-account fixtures worker',
        'teardown member#0 account=member-account runner',
      ]);
      project.cleanup();
    },
    120_000,
  );

  it(
    'keeps what bootstrap provided when its worker dies right after',
    async () => {
      const log = newLog();
      const { outcome, project } = await runProjectWithConfigFile(SUITE, { configSource: config(log, 'none', { target: 'member', how: 'crash' }) });
      const statuses = outcome.results
        .filter((result) => result.target.name === 'member')
        .map((result) => `${result.test.title} ${result.status}`)
        .toSorted();
      expect(statuses).toEqual(['fails once to replace the worker failed', 'reads what bootstrap provided passed']);
      const member = lines(log).filter((line) => line.includes('member'));
      expect(member[0]).toBe('bootstrap member#0 known=undefined fixtures worker');
      expect(member.slice(1, -1).every((line) => line === 'bootstrap member#0 known=member-account fixtures worker')).toBe(true);
      expect(member.at(-1)).toBe('teardown member#0 account=member-account runner');
      expect(member.filter((line) => line.startsWith('teardown'))).toHaveLength(1);
      project.cleanup();
    },
    120_000,
  );
  it(
    'leaves the steps and the screen of every failed bootstrap on a trace page its run error names',
    async () => {
      const log = newLog();
      const { outcome, project } = await runProjectWithConfigFile(SUITE, { configSource: config(log, 'none', { target: 'member', how: 'step' }) });
      const failures = outcome.report.run.errors.filter((error) => error.message.includes('bootstrap of target "member"'));
      // Two tries, two pages: the second does not write over the first.
      expect(failures).toHaveLength(2);
      const pages = failures.map((error) => /Its steps and the screen at the failure: (\S+trace\.md)/u.exec(error.message)?.[1]);
      expect(new Set(pages).size).toBe(2);
      for (const [index, error] of failures.entries()) {
        expect(error.message).toContain('failed on worker slot 0: sign-in did not reach home');
        const page = readFileSync(path.join(project.dir, pages[index]!), 'utf8');
        expect(page).toContain('Submit');
        expect(page).toContain('sign-in did not reach home');
        expect(page).toMatch(/tap/iu);
      }
      expect(outcome.results.filter((result) => result.target.name === 'member').map((result) => result.status)).toEqual(['skipped', 'skipped']);
      project.cleanup();
    },
    120_000,
  );

  it(
    'keeps the trace page of a bootstrap that failed once when the next try succeeds',
    async () => {
      const log = newLog();
      const { outcome, project } = await runProjectWithConfigFile(SUITE, { configSource: config(log, 'none', { target: 'member', how: 'step-once' }) });
      const failures = outcome.report.run.errors.filter((error) => error.message.includes('bootstrap of target "member"'));
      expect(failures).toHaveLength(1);
      const page = /Its steps and the screen at the failure: (\S+trace\.md)/u.exec(failures[0]!.message)?.[1];
      expect(readFileSync(path.join(project.dir, page!), 'utf8')).toContain('sign-in did not reach home');
      const member = outcome.results.filter((result) => result.target.name === 'member').map((result) => `${result.test.title} ${result.status}`).toSorted();
      expect(member).toEqual(['fails once to replace the worker failed', 'reads what bootstrap provided passed']);
      project.cleanup();
    },
    120_000,
  );
});
