/**
 * `agent.act()` against a real model: multi-action flows planned and executed
 * by the default ToolLoopAgent executor, verified deterministically after.
 */

import { test } from '@e2e-dev/web';
import { expect, credentials } from 'e2e';

test('act drives a multi-action todo flow', async ({ browser, agent, screen }) => {
  await browser.goto('/todos');
  /**
   * @compiled agent.act("add two todos named \"Buy milk\" and \"Walk the dog\", then mark \"Buy milk\" as done")
   * @from "await agent.act('add two todos named \"Buy milk\" and \"Walk the dog\", then mark \"Buy milk\" as done');"
   * @recording 2ed774a71a05
   * @step 465304d5a002.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("textbox", "New todo").fill("Buy milk");
  await screen.getByRole("button", "Add").tap();
  await screen.getByRole("textbox", "New todo").fill("Walk the dog");
  await screen.getByRole("button", "Add").tap();
  await screen.getByRole("checkbox", "Buy milk").check();
  await expect(screen.getByRole("status", "Remaining")).toHaveText("1 remaining");
  await expect(screen.getByRole("checkbox", "Buy milk")).toBeChecked();
  await expect(screen.getByTestId("todo-list")).toBeVisible();
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('1 remaining');
  await expect(screen.getByText('Buy milk')).toBeVisible();
  await expect(screen.getByText('Walk the dog')).toBeVisible();
});

test('act completes the workspace wizard end to end', async ({ browser, agent, screen }) => {
  await browser.goto('/wizard');
  /**
   * @compiled agent.act("create a workspace named \"Atlas\" on the Pro plan by walking through the wizard")
   * @from "await agent.act('create a workspace named \"Atlas\" on the Pro plan by walking through the wizard');"
   * @recording 5c78342c2fb8
   * @step 5890c8d5bdef.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("textbox", "Workspace name").fill("Atlas");
  await screen.getByRole("button", "Next").tap();
  await screen.getByRole("combobox", "Plan").selectOption("Pro");
  await screen.getByRole("button", "Next").tap();
  await screen.getByRole("button", "Create workspace").tap();
  await expect(screen.getByRole("status", "Summary")).toHaveText("Created \"Atlas\" on the Pro plan");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('Created "Atlas" on the Pro plan');
});

test('act signs in with a secret credential', async ({ browser, agent, screen }) => {
  await browser.goto('/login');
  // The password is a Secret: the model sees only its name and purpose, and
  // the fill runs through the authorized type_secret tool.
  /**
   * @compiled agent.act("sign in with the given credentials")
   * @from "await agent.act('sign in with the given credentials', {\n    params: { username: 'admin', password: credentials.user('admin').password },\n  });"
   * @recording 0e43fbd0aae6
   * @step 9b8b261db162.765b14d129ea
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("textbox", "Username").fill(credentials.user("admin").username);
  await screen.getByRole("textbox", "Password").fill(credentials.user("admin").password);
  await screen.getByRole("button", "Sign in").tap();
  await expect(screen.getByRole("status", "Greeting")).toHaveText("Welcome back, admin!");
  /** @end compiled */
  await expect(screen.getByRole('status')).toHaveText('Welcome back, admin!');
});

test('act taps a pin painted on a canvas through the pixel tier', async ({ browser, agent, screen }) => {
  await browser.goto('/canvas');
  // The pins exist only as canvas pixels: nothing in the tree names them, so
  // the model has to describe the target and let the vision tier place the tap.
  await agent.act('pick the red pin on the map');
  await expect(screen.getByRole('status')).toHaveText('picked the red pin');
});
