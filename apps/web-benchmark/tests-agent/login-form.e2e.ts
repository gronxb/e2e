/**
 * `agent.act()` against a real model on the Login Form scenario. The password
 * is a Secret: the model sees only its name and purpose, and the fill runs
 * through the authorized secret tool. The deterministic check after the step
 * is what makes the test pass or fail; the model only drives.
 */

import { test } from '@e2e-dev/web';
import { expect, credentials } from 'e2e';

test('act signs in with the benchmark account', async ({ app, agent, screen }) => {
  const account = credentials.user('benchmark');
  await app.open('/e/login-form');
  /**
   * @compiled agent.act("log in with the given credentials")
   * @from "await agent.act('log in with the given credentials', {\n    params: { email: account.username, password: account.password },\n  });"
   * @recording d9508413b3c3
   * @step c26456300e1d.10cf8df51d5b
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("email-input").fill(credentials.user("benchmark").username);
  await screen.getByTestId("password-input").fill(credentials.user("benchmark").password);
  await screen.getByTestId("login-button").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Logged in successfully");
  await expect(screen.getByTestId("logout-button")).toBeVisible();
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText('Logged in successfully');
});
