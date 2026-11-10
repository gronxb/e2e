/**
 * A long pixels-only flow of a different shape: eight drawn screens, each
 * naming one of four drawn shapes and offering a drawn Next. The shapes rotate
 * between screens, so the model has to read every new screen from its
 * screenshot rather than replay positions; the DOM shows the picks at the end.
 */

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('act walks an eight-screen wizard painted on a canvas', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas-wizard');
  /**
   * @compiled agent.act("complete all eight steps of the drawn wizard: on each screen tap the shape its …")
   * @from "await agent.act('complete all eight steps of the drawn wizard: on each screen tap the shape its instruction names, then tap Next');"
   * @recording 2b862c35ca08
   * @step 8825726050a3.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.tapAt({ x: 362, y: 405 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 482, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 242, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 362, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 242, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 362, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 362, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 482, y: 402 }); // a viewport point, recorded at 1280x720
  await screen.tapAt({ x: 472, y: 562 }); // a viewport point, recorded at 1280x720
  await expect(screen.getByRole("status", "Wizard result")).toHaveText("wizard done: ok,ok,ok,ok,ok,ok,ok,ok");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('wizard done: ok,ok,ok,ok,ok,ok,ok,ok');
});
