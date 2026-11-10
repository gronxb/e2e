/**
 * The agent verbs the hard scenarios never reach, each on the plain control
 * built for it: check, on a radio the pick replaces too, the long press and the double click, a context menu
 * that opens on right-click only, a file input, the browser history, a scroll
 * into view. One step per verb, so a red test names the verb, and a locator
 * check pins each outcome the way the deterministic twin reads it.
 */

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const TAGS = { tags: ['control-inventory'] };

test.describe('control inventory', () => {
  test.beforeEach(async ({ app }) => {
    await app.open('/e/control-inventory');
  });

  test('check sets the checkbox and the radio', TAGS, async ({ agent, screen }) => {
    /**
     * @compiled agent.act("agree to the terms and pick the Medium size")
     * @from "await agent.act('agree to the terms and pick the Medium size');"
     * @recording 1f2ad4f61f8c
     * @step 31e69bd3b8b5.44136fa355b3
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByRole("checkbox", "Agree to terms").check(); // recorded inside "Toggles"
    await screen.getByRole("radio", "Medium").check(); // recorded inside "Size"
    await expect(screen.getByRole("status", "Toggles state")).toHaveText("terms agreed, size Medium");
    await expect(screen.getByRole("checkbox", "Agree to terms")).toBeChecked();
    await expect(screen.getByRole("radio", "Medium")).toBeChecked();
    /** @end compiled */
    await expect(screen.getByLabel('Toggles state')).toHaveText('terms agreed, size Medium');
  });

  test('check picks a radio the pick replaces with its summary', TAGS, async ({ agent, screen }) => {
    /**
     * @compiled agent.act("pick Express delivery")
     * @from "await agent.act('pick Express delivery');"
     * @recording 5577eea54bd7
     * @step df853ab2fc82.44136fa355b3
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByRole("radio", "Express").tap(); // recorded inside "Delivery"
    await expect(screen.getByRole("status", "Delivery state")).toHaveText("Express");
    /** @end compiled */
    await expect(screen.getByLabel('Delivery state')).toHaveText('Express');
  });

  test('a long press and a double click are chosen over a plain tap', TAGS, async ({ agent, screen }) => {
    /**
     * @compiled agent.act("long-press the Hold me button until its state reads long-pressed, then double-c…")
     * @from "await agent.act('long-press the Hold me button until its state reads long-pressed, then double-click the Double-click me button');"
     * @recording 414d83190b19
     * @step 9fe8b7fcfeb1.44136fa355b3
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByRole("button", "Hold me").longPress(); // recorded inside "Gestures"
    await screen.getByRole("button", "Double-click me").doubleTap(); // recorded inside "Gestures"
    await expect(screen.getByRole("status", "Hold state")).toHaveText("long-pressed");
    await expect(screen.getByRole("status", "Double-click state")).toHaveText("double-clicked");
    /** @end compiled */
    await expect(screen.getByLabel('Hold state')).toHaveText('long-pressed');
    await expect(screen.getByLabel('Double-click state')).toHaveText('double-clicked');
  });

  test('a right-click opens the file menu and Rename renames the file', TAGS, async ({ agent, screen }) => {
    /**
     * @compiled agent.act("rename report.pdf to summary.pdf; its menu opens on right-click")
     * @from "await agent.act('rename report.pdf to summary.pdf; its menu opens on right-click');"
     * @recording e4472e79abcc
     * @step cb3da13c6963.44136fa355b3
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByText("report.pdf").secondaryTap(); // recorded inside "Files"
    await screen.getByText("report.pdf").secondaryTap();
    await screen.getByRole("menuitem", "Rename").tap(); // recorded inside "report.pdf"
    await expect(screen.getByRole("status", "File state")).toHaveText("report.pdf renamed to summary.pdf");
    /** @end compiled */
    await expect(screen.getByLabel('File state')).toHaveText('report.pdf renamed to summary.pdf');
  });

  test('upload attaches the named project files', TAGS, async ({ agent, screen }) => {
    /**
     * @compiled agent.act("attach both files to the Attachments input")
     * @from "await agent.act('attach both files to the Attachments input', {\n      params: { files: ['fixtures/attachment.txt', 'fixtures/second.txt'] },\n    });"
     * @recording 5e8767c8a91f
     * @step 6eb8c4cb34d6.38fc51716f1b
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByRole("button", "Attachments").tap(); // recorded inside "Files"
    await screen.getByRole("button", "Attachments").setInputFiles(["fixtures/attachment.txt","fixtures/second.txt"]); // recorded inside "Files"
    await expect(screen.getByRole("status", "Attachments state")).toHaveText("attachment.txt, second.txt");
    await expect(screen.getByRole("button", "Attachments")).toBeVisible();
    /** @end compiled */
    await expect(screen.getByLabel('Attachments state')).toHaveText('attachment.txt, second.txt');
  });

  test('back returns from the details view to the inventory', TAGS, async ({ agent, screen, browser, app }) => {
    /**
     * @compiled agent.act("open the details, then return to the inventory through the browser history")
     * @from "await agent.act('open the details, then return to the inventory through the browser history');"
     * @recording d2a64638fa64
     * @step b654f62f1b06.44136fa355b3
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByRole("button", "Open details").tap(); // recorded inside "Navigation"
    await app.back();
    await expect(screen.getByRole("status", "Navigation state")).toHaveText("back on the inventory");
    /** @end compiled */
    await expect(browser).toHaveURL('/e/control-inventory');
    await expect(screen.getByLabel('Navigation state')).toHaveText('back on the inventory');
  });

  test('scroll_to brings the footnote into view', TAGS, async ({ agent, screen }) => {
    /**
     * @compiled agent.act("bring the Footnote paragraph at the bottom of the page into view")
     * @from "await agent.act('bring the Footnote paragraph at the bottom of the page into view');"
     * @recording 4c6e069d9f35
     * @step 60d7d1c1109f.44136fa355b3
     * @recordedAt 2026-10-04
     * @compiledAt 2026-11-10
     * @verifiedAt 2026-11-10
     */
    await screen.getByText("Footnote").scrollIntoView();
    await expect(screen.getByRole("status", "Footnote state")).toHaveText("in view");
    /** @end compiled */
    await expect(screen.getByLabel('Footnote state')).toHaveText('in view');
  });
});
