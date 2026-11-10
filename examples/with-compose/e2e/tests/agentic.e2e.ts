import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

// Agent steps call the model in e2e.config.ts. Without a key these tests are skipped.
const skip = process.env.AI_GATEWAY_API_KEY ? false : 'set AI_GATEWAY_API_KEY to run agent tests';

test('the agent gets a greeting', { skip }, async ({ app, agent, screen }) => {
  await app.open();

  // The agent works out which field and button to use.
  /**
   * @compiled agent.act("get the app to greet {name}")
   * @from "await agent.act('get the app to greet {name}', { params: { name: 'Grace' } });"
   * @recording e34dad06baa7
   * @step 9dadd2295d82.71e0d496a8c9
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("name").fill("Grace"); // recorded inside "e2e"
  await screen.getByTestId("greet").tap(); // recorded inside "e2e"
  await expect(screen.getByTestId("greeting")).toBeVisible();
  /** @end compiled */

  // Pair each agent step with a check that does not depend on the model.
  await expect(screen.getByTestId('greeting')).toHaveText('hello, Grace!');
  await agent.assert('the app greets Grace by name');
});

test('the agent finds the empty-name error', { skip }, async ({ app, agent, screen }) => {
  await app.open();

  /**
   * @compiled agent.act("press greet without typing a name")
   * @from "await agent.act('press greet without typing a name');"
   * @recording 0e6e15e49ae0
   * @step baea30ef819e.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("greet").tap(); // recorded inside "e2e"
  await expect(screen.getByTestId("error")).toBeVisible();
  /** @end compiled */

  await expect(screen.getByTestId('error')).toHaveText('enter a name first.');
  await agent.assert('the app asks for a name');
});
