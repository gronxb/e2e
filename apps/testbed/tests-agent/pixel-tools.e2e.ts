/**
 * The pixel tools against a real model: the executor works from the tree,
 * asks for a screenshot when the tree lacks what it needs, and then acts at
 * points in it. The drawn keypad, wizard, and form are the natural fit
 * (nothing there is marked up); the todo flow is an ordinary marked-up page
 * where the tree alone should carry the step.
 */

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('enters a code on the drawn keypad through points', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas-flow');
  /**
   * @compiled agent.act("on the drawn keypad enter the code 31415 digit by digit, check the display show…")
   * @from "await agent.act('on the drawn keypad enter the code 31415 digit by digit, check the display shows it, then press OK');"
   * @recording 6e9e0aede920
   * @step e413f5bca779.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.tapAt({ x: 363, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 113, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 113, y: 468 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 113, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 238, y: 468 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 363, y: 677 }); // a viewport point, recorded at 1280x720
  await expect(screen.getByRole("status", "Result")).toHaveText("code accepted: 31415");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('code accepted: 31415');
});

test('walks the drawn wizard through points', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas-wizard');
  /**
   * @compiled agent.act("complete all eight steps of the drawn wizard: on each screen tap the shape its …")
   * @from "await agent.act('complete all eight steps of the drawn wizard: on each screen tap the shape its instruction names, then tap Next');"
   * @recording 10f3d3c641a3
   * @step 8825726050a3.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.tapAt({ x: 362, y: 405 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 482, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 242, y: 400 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 362, y: 400 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 242, y: 400 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 362, y: 400 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 362, y: 400 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 482, y: 400 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await expect(screen.getByRole("status", "Wizard result")).toHaveText("wizard done: ok,ok,ok,ok,ok,ok,ok,ok");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('wizard done: ok,ok,ok,ok,ok,ok,ok,ok');
});

test('drives a marked-up todo page from the tree', async ({ browser, agent, screen }) => {
  await browser.goto('/todos');
  const { summary } = await agent.act('add two todos named "Buy milk" and "Walk the dog", then mark "Buy milk" as done');
  await expect(screen.getByRole('status')).toHaveText('1 remaining');
  await expect(screen.getByText('Buy milk')).toBeVisible();
  await expect(screen.getByText('Walk the dog')).toBeVisible();
  expect(summary).not.toContain('screenshot');
});

test('picks a canvas pin; the bare canvas opens with a screenshot', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas');
  /**
   * @compiled agent.act("pick the red pin on the map")
   * @from "await agent.act('pick the red pin on the map');"
   * @recording a6729ee0bd15
   * @step aca2203ecb1c.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.tapAt({ x: 392, y: 272 }); // a viewport point, recorded at 1280x720
  await expect(screen.getByRole("status", "Picked")).toHaveText("picked the red pin");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('picked the red pin');
});

test('fills a form drawn on a canvas through type_at and the keyboard', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas-form');
  await agent.act('fill the drawn form: Name is Ada, City is Oslo, then press Submit');
  await expect(screen.getByRole('status')).toHaveText('submitted: name=Ada city=Oslo');
});
