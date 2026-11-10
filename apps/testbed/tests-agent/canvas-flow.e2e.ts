/**
 * A long pixels-only flow: ten digits and a confirm on a keypad that exists
 * only as canvas pixels, feedback included. Nothing in the tree names a key or
 * shows what was entered, so every action has to be placed and verified from
 * the screenshot; the DOM learns the result only when the drawn OK is pressed.
 */

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('act enters a ten-digit code on a keypad painted on a canvas', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas-flow');
  /**
   * @compiled agent.act("on the drawn keypad enter the code 3141592653 digit by digit, check the display…")
   * @from "await agent.act('on the drawn keypad enter the code 3141592653 digit by digit, check the display shows it, then press OK');"
   * @recording f8f2ddc3ca9b
   * @step 087d9ea60466.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.tapAt({ x: 363, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 113, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 113, y: 468 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 113, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 238, y: 468 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 363, y: 573 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 238, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 363, y: 468 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 238, y: 468 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 363, y: 363 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 363, y: 678 }); // a viewport point, recorded at 1280x720
  await expect(screen.getByRole("status", "Result")).toHaveText("code accepted: 3141592653");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('code accepted: 3141592653');
});
