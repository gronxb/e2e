import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runProjectWithConfigFile } from '../helpers/run-project.ts';

/**
 * A worker-path config whose targets log every bootstrap and teardown to
 * `log`. `failing` throws before providing; `afterProvide` provides, then
 * fails as a sign-in would (`throw`, every time) or kills its worker
 * (`crash`, the first time only).
 */
const config = (log: string, failing: string, afterProvide: { target: string; how: 'throw' | 'crash' } | undefined = undefined) => `import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
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
});
