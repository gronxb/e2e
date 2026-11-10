/**
 * The grammar verbs beyond tap and type against a real model: hover, the tap
 * variants, drag, check, upload, scroll into view, and back, each on the
 * playground control built for its deterministic twin. Every step is pinned
 * by a locator check, so a model that reached the goal another way still
 * passes and one that only claimed to does not.
 */

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('hover reveals the card menu and the agent archives the card', async ({ browser, agent, screen }) => {
  await browser.goto('/board');
  /**
   * @compiled agent.act("archive the Design review card; the archive action shows when the card actions …")
   * @from "await agent.act('archive the Design review card; the archive action shows when the card actions are hovered');"
   * @recording 6086452cfd20
   * @step 8d604282acfa.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByText("Design review").hover();
  await screen.getByText("Card actions").hover();
  await screen.getByRole("button", "Archive card").tap();
  await expect(screen.getByRole("status", "Board state")).toHaveText("Design review is archived");
  /** @end compiled */
  await expect(screen.getByLabel('Board state')).toHaveText('Design review is archived');
});

test('a right-click opens the file menu and the agent renames the file', async ({ browser, agent, screen }) => {
  await browser.goto('/controls');
  /**
   * @compiled agent.act("open the context menu of report.pdf with a right-click and choose Rename")
   * @from "await agent.act('open the context menu of report.pdf with a right-click and choose Rename');"
   * @recording 02a09b10779b
   * @step 33ef20f18871.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByText("report.pdf").secondaryTap();
  await screen.getByRole("menuitem", "Rename").tap();
  await expect(screen.getByRole("status", "File state")).toHaveText("renamed");
  /** @end compiled */
  await expect(screen.getByRole('status', 'File state')).toHaveText('renamed');
});

test('a long press and a double tap are chosen over a plain tap', async ({ browser, agent, screen }) => {
  await browser.goto('/controls');
  const gesture = screen.getByRole('status', 'Gesture state');
  /**
   * @compiled agent.act("long-press the Hold me button until the gesture state reads long-pressed")
   * @from "await agent.act('long-press the Hold me button until the gesture state reads long-pressed');"
   * @recording 4c035932063d
   * @step 16f2496d2a84.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("button", "Hold me").longPress();
  await expect(screen.getByRole("status", "Gesture state")).toHaveText("long-pressed");
  /** @end compiled */
  await expect(gesture).toHaveText('long-pressed');
  /**
   * @compiled agent.act("double-tap the Tap me twice button")
   * @from "await agent.act('double-tap the Tap me twice button');"
   * @recording 31ff6cca09a2
   * @step 1795ce85b12b.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("button", "Tap me twice").doubleTap();
  await expect(screen.getByRole("status", "Gesture state")).toHaveText("double-tapped");
  /** @end compiled */
  await expect(gesture).toHaveText('double-tapped');
});

test('a drag moves the card into the done column', async ({ browser, agent, screen }) => {
  await browser.goto('/board');
  /**
   * @compiled agent.act("move the Design review card into the Done column")
   * @from "await agent.act('move the Design review card into the Done column');"
   * @recording 5c14d38a0541
   * @step a46f56142600.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByText("Design review").dragTo(screen.getByRole("region", "Done column"));
  await expect(screen.getByRole("status", "Board state")).toHaveText("Design review is done");
  /** @end compiled */
  await expect(screen.getByLabel('Board state')).toHaveText('Design review is done');
});

test('check sets the checkbox and the radio without flipping them back', async ({ browser, agent, screen }) => {
  await browser.goto('/controls');
  /**
   * @compiled agent.act("agree to the terms and pick the Medium size, then confirm both are set")
   * @from "await agent.act('agree to the terms and pick the Medium size, then confirm both are set');"
   * @recording 879f8101e52d
   * @step 077a7733bfaa.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("checkbox", "Agree to terms").check();
  await screen.getByRole("radio", "Medium").check(); // recorded inside "Size"
  await expect(screen.getByRole("radio", "Medium")).toBeChecked();
  await expect(screen.getByRole("checkbox", "Agree to terms")).toBeChecked();
  /** @end compiled */
  await expect(screen.getByLabel('Agree to terms')).toBeChecked();
  await expect(screen.getByRole('radio', 'Medium')).toBeChecked();
});

test('upload attaches the named project files', async ({ browser, agent, screen }) => {
  await browser.goto('/controls');
  /**
   * @compiled agent.act("attach both files to the Attachments input")
   * @from "await agent.act('attach both files to the Attachments input', {\n    params: { files: ['fixtures/attachment.txt', 'fixtures/second.txt'] },\n  });"
   * @recording 37e9f832d315
   * @step 6eb8c4cb34d6.38fc51716f1b
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("button", "Attachments").setInputFiles(["fixtures/attachment.txt","fixtures/second.txt"]);
  await expect(screen.getByRole("status", "Attachments state")).toHaveText("attachment.txt, second.txt");
  await expect(screen.getByRole("button", "Attachments")).toBeVisible();
  /** @end compiled */
  await expect(screen.getByLabel('Attachments state')).toHaveText('attachment.txt, second.txt');
});

test('scroll_to brings the footnote into view', async ({ browser, agent, screen }) => {
  await browser.goto('/controls');
  /**
   * @compiled agent.act("bring the Footnote paragraph at the bottom of the page into view")
   * @from "await agent.act('bring the Footnote paragraph at the bottom of the page into view');"
   * @recording 5ff94f6f160e
   * @step 60d7d1c1109f.44136fa355b3
   * @recordedAt 2026-11-10
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByText("Footnote").scrollIntoView();
  await expect(screen.getByRole("status", "Footnote state")).toHaveText("in view");
  /** @end compiled */
  await expect(screen.getByLabel('Footnote state')).toHaveText('in view');
});

test('back returns to the previous page', async ({ browser, agent }) => {
  await browser.goto('/controls');
  await agent.act('open the Docs link, then go back to the controls page');
  await expect(browser).toHaveURL('/controls');
});
