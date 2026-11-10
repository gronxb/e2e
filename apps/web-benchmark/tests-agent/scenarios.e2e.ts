/**
 * `agent.act()` against the task scenarios whose semantics survive in the
 * accessibility tree. Each step gets the catalog description as its goal and
 * reads the rest off the page; the deterministic check on the scenario's
 * success message decides the test. Scenarios that need pixels (canvas, image
 * and CSS-content UIs, the aria-hidden flow, the onboarding wizard), native
 * dialogs, a second tab, or a file the agent first downloads are left out:
 * the grammar has no verb for them yet.
 */

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import type { Agent, App, Screen } from 'e2e';

interface Scenario {
  readonly slug: string;
  readonly goal: string;
  readonly success: string;
  /**
   * Why the grammar cannot finish this scenario yet. The test is declared and
   * skipped with the reason, so the gap stays visible in every run and the
   * scenario turns on the day the verb lands.
   */
  readonly gap?: string;
  /** A step budget above the default, for a flow that legitimately needs more actions. */
  readonly maxSteps?: number;
}

const SCENARIOS: readonly Scenario[] = [
  {
    slug: 'shadow-dom-form',
    goal: 'fill the form buried in the nested shadow roots and submit it to get access',
    success: 'Access granted',
  },
  {
    slug: 'lying-labels',
    goal: 'send the payment; the visible text on the controls is the truth, the accessible names are not',
    success: 'Payment sent',
  },
  {
    slug: 'iframe-form',
    goal: 'read the coupon code shown in one frame and apply it through the form in the other frame',
    success: 'Coupon applied',
  },
  {
    slug: 'infinite-scroll',
    goal: 'scroll the feed until the Golden Ticket loads, then claim it',
    success: 'Golden Ticket claimed',
    // Item 138 of 200 arrives after seven lazy loads; that is about thirty
    // scrolls, more than the default action budget of 25.
    maxSteps: 60,
  },
  {
    slug: 'virtualized-table',
    goal: 'scroll the windowed table until the Golden Row (row 4322) is rendered, then claim it',
    success: 'Golden Row claimed',
  },
  {
    slug: 'overlay-trap',
    goal: 'dismiss the cookie banner and the overlay in the way, then press Continue',
    success: 'You made it past the overlay',
  },
  {
    slug: 'sticky-chrome',
    goal: 'scroll down to the accept button and accept the terms',
    success: 'Terms accepted',
  },
  {
    slug: 'async-states',
    goal: 'wait for the page to finish loading, read the verification code it shows, enter it, and submit once the button enables',
    success: 'Code verified successfully',
  },
  {
    slug: 'debounced-search',
    goal: 'search for trail mix and add exactly the item the page asks for to the cart',
    success: 'Added Trail Mix 500 g to the cart',
  },
  {
    slug: 'hover-menu',
    goal: 'find Redeem voucher under the Account menu and redeem the voucher',
    success: 'Voucher redeemed',
  },
  {
    slug: 'drag-and-drop',
    goal: 'drag the right items into the dropzone in the order the page asks for',
    success: 'Items dropped in the right order',
  },
  {
    slug: 'kanban-board',
    goal: 'move the cards so the board matches the goal layout the page describes, then submit the board',
    success: 'Board matches the goal',
  },
  {
    slug: 'context-menu-trap',
    goal: 'rename the file report.pdf to summary.pdf in the file manager',
    success: 'File renamed to summary.pdf',
  },
  {
    slug: 'stale-dom',
    goal: 'click the Tap me button three times; the list rebuilds itself every second',
    success: 'Target clicked 3 times',
  },
  {
    slug: 'otp-auto-advance',
    goal: 'enter the 6-digit code the page shows into the segmented code inputs and verify it',
    success: 'Code verified',
  },
  {
    slug: 'date-picker',
    goal: 'book an appointment for the exact date the page requires, navigating the calendar to it',
    success: 'Appointment booked for September 17, 2026',
  },
  {
    slug: 'rich-text-editor',
    goal: 'type "release approved" into the editor, make exactly the word approved bold, and check the document',
    success: 'Document approved',
  },
  {
    slug: 'playbook-cleanup',
    goal: 'delete the playbook named "Launch Approval Draft", confirm the removal, then search for its exact name to verify it is gone',
    success: 'No playbooks match "Launch Approval Draft".',
  },
  {
    slug: 'promo-storefront',
    goal: 'buy any one product, dismissing the promotional overlays that get in the way, until the order is confirmed',
    success: 'Order confirmed',
  },
  {
    slug: 'gift-card-purchase',
    goal: 'buy a gift card for friend@example.com and complete the purchase',
    success: 'Gift card sent to friend@example.com',
  },
];

async function complete(
  scenario: Scenario,
  { app, agent, screen }: { app: App; agent: Agent; screen: Screen },
): Promise<void> {
  await app.open(`/e/${scenario.slug}`);
  await agent.act(
    `Complete this scenario as the page instructs: ${scenario.goal}`,
    scenario.maxSteps === undefined ? undefined : { maxSteps: scenario.maxSteps },
  );
  await expect(screen.getByTestId('success-message')).toHaveText(scenario.success);
}

// Demo only: each scenario is declared as its own test so e2e compile can pin its recording.
for (const scenario of SCENARIOS) {
  if (scenario.gap !== undefined) test.skip(`act completes ${scenario.slug}`, (fixtures) => complete(scenario, fixtures));
}

test("act completes shadow-dom-form", { tags: ["shadow-dom-form"] }, async ({ app, agent, screen }) => {
  await app.open("/e/shadow-dom-form");
  await agent.act("Complete this scenario as the page instructs: fill the form buried in the nested shadow roots and submit it to get access");
  await expect(screen.getByTestId('success-message')).toHaveText("Access granted");
});

test("act completes lying-labels", { tags: ["lying-labels"] }, async ({ app, agent, screen }) => {
  await app.open("/e/lying-labels");
  await agent.act("Complete this scenario as the page instructs: send the payment; the visible text on the controls is the truth, the accessible names are not");
  await expect(screen.getByTestId('success-message')).toHaveText("Payment sent");
});

test("act completes iframe-form", { tags: ["iframe-form"] }, async ({ app, agent, screen }) => {
  await app.open("/e/iframe-form");
  await agent.act("Complete this scenario as the page instructs: read the coupon code shown in one frame and apply it through the form in the other frame");
  await expect(screen.getByTestId('success-message')).toHaveText("Coupon applied");
});

test("act completes infinite-scroll", { tags: ["infinite-scroll"] }, async ({ app, agent, screen }) => {
  await app.open("/e/infinite-scroll");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: scroll the feed until the Golden …")
   * @from "await agent.act(\"Complete this scenario as the page instructs: scroll the feed until the Golden Ticket loads, then claim it\", { maxSteps: 60 });"
   * @recording ddc615c1f8fe
   * @step 5693e0682199.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("feed").scrollUntilVisible(screen.getByText("Golden Ticket"), { direction: "down", timeout: 11656 });
  await screen.getByTestId("claim-button").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Golden Ticket claimed");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Golden Ticket claimed");
});

test("act completes virtualized-table", { tags: ["virtualized-table"] }, async ({ app, agent, screen }) => {
  await app.open("/e/virtualized-table");
  await agent.act("Complete this scenario as the page instructs: scroll the windowed table until the Golden Row (row 4322) is rendered, then claim it");
  await expect(screen.getByTestId('success-message')).toHaveText("Golden Row claimed");
});

test("act completes overlay-trap", { tags: ["overlay-trap"] }, async ({ app, agent, screen }) => {
  await app.open("/e/overlay-trap");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: dismiss the cookie banner and the…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: dismiss the cookie banner and the overlay in the way, then press Continue\");"
   * @recording 3aa75b32cb01
   * @step 6705af9140f9.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("accept-cookies-button").tap();
  await screen.getByRole("button", "× close overlay").tap();
  await screen.getByTestId("continue-button").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("You made it past the overlay");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("You made it past the overlay");
});

test("act completes sticky-chrome", { tags: ["sticky-chrome"] }, async ({ app, agent, screen }) => {
  await app.open("/e/sticky-chrome");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: scroll down to the accept button …")
   * @from "await agent.act(\"Complete this scenario as the page instructs: scroll down to the accept button and accept the terms\");"
   * @recording f2ab7c5f57db
   * @step 507883318a86.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("accept-button").scrollIntoView();
  await screen.getByTestId("accept-button").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Terms accepted");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Terms accepted");
});

test("act completes async-states", { tags: ["async-states"] }, async ({ app, agent, screen }) => {
  await app.open("/e/async-states");
  await agent.act("Complete this scenario as the page instructs: wait for the page to finish loading, read the verification code it shows, enter it, and submit once the button enables");
  await expect(screen.getByTestId('success-message')).toHaveText("Code verified successfully");
});

test("act completes debounced-search", { tags: ["debounced-search"] }, async ({ app, agent, screen }) => {
  await app.open("/e/debounced-search");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: search for trail mix and add exac…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: search for trail mix and add exactly the item the page asks for to the cart\");"
   * @recording ed226f92f03c
   * @step e5044d8a420a.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("search-input").fill("trail mix");
  await screen.getByTestId("option-trail-mix-500-g").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Added Trail Mix 500 g to the cart");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Added Trail Mix 500 g to the cart");
});

test("act completes hover-menu", { tags: ["hover-menu"] }, async ({ app, agent, screen }) => {
  await app.open("/e/hover-menu");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: find Redeem voucher under the Acc…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: find Redeem voucher under the Account menu and redeem the voucher\");"
   * @recording a0db42fa84bc
   * @step 4d2bd092cafa.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("menu-account").hover();
  await screen.getByText("Billing ›").hover();
  await screen.getByText("Redeem voucher").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Voucher redeemed");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Voucher redeemed");
});

test("act completes drag-and-drop", { tags: ["drag-and-drop"] }, async ({ app, agent, screen }) => {
  await app.open("/e/drag-and-drop");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: drag the right items into the dro…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: drag the right items into the dropzone in the order the page asks for\");"
   * @recording 877837d0e2e6
   * @step 24ea40459eba.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("drag-banana").dragTo(screen.getByTestId("dropzone"));
  await screen.getByTestId("drag-cherry").dragTo(screen.getByTestId("dropzone"));
  await expect(screen.getByTestId("success-message")).toHaveText("Items dropped in the right order");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Items dropped in the right order");
});

test("act completes kanban-board", { tags: ["kanban-board"] }, async ({ app, agent, screen }) => {
  await app.open("/e/kanban-board");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: move the cards so the board match…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: move the cards so the board matches the goal layout the page describes, then submit the board\");"
   * @recording d074cdb59fb3
   * @step 79f28df97954.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("card-fix-payment-bug").dragTo(screen.getByTestId("column-done"));
  await screen.getByTestId("card-refactor-onboarding").dragTo(screen.getByTestId("column-in-progress"));
  await screen.getByTestId("submit-board").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Board matches the goal");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Board matches the goal");
});

test("act completes context-menu-trap", { tags: ["context-menu-trap"] }, async ({ app, agent, screen }) => {
  await app.open("/e/context-menu-trap");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: rename the file report.pdf to sum…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: rename the file report.pdf to summary.pdf in the file manager\");"
   * @recording d737be304170
   * @step 63530e281eaf.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByText("report.pdf").secondaryTap();
  await screen.getByRole("button", "More actions for report.pdf").tap();
  await screen.getByRole("button", "Rename").tap();
  await screen.getByRole("textbox", "New file name").fill("summary.pdf");
  await screen.getByRole("button", "Save").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("File renamed to summary.pdf");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("File renamed to summary.pdf");
});

test("act completes stale-dom", { tags: ["stale-dom"] }, async ({ app, agent, screen }) => {
  await app.open("/e/stale-dom");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: click the Tap me button three tim…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: click the Tap me button three times; the list rebuilds itself every second\");"
   * @recording f599e53124d7
   * @step c7958b2326b3.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("target-button").tap();
  await screen.getByTestId("target-button").tap();
  await screen.getByTestId("target-button").tap();
  await expect(screen.getByTestId("progress")).toHaveText("Progress: 3 / 3");
  await expect(screen.getByTestId("success-message")).toHaveText("Target clicked 3 times");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Target clicked 3 times");
});

test("act completes otp-auto-advance", { tags: ["otp-auto-advance"] }, async ({ app, agent, screen }) => {
  await app.open("/e/otp-auto-advance");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: enter the 6-digit code the page s…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: enter the 6-digit code the page shows into the segmented code inputs and verify it\");"
   * @recording 1d59459d7a88
   * @step c878aa968fdb.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("otp-input-0").fill("4");
  await screen.getByTestId("otp-input-1").fill("9");
  await screen.getByTestId("otp-input-2").fill("3");
  await screen.getByTestId("otp-input-3").fill("0");
  await screen.getByTestId("otp-input-4").fill("2");
  await screen.getByTestId("otp-input-5").fill("7");
  await expect(screen.getByTestId("success-message")).toHaveText("Code verified");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Code verified");
});

test("act completes date-picker", { tags: ["date-picker"] }, async ({ app, agent, screen }) => {
  await app.open("/e/date-picker");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: book an appointment for the exact…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: book an appointment for the exact date the page requires, navigating the calendar to it\");"
   * @recording be7d29826231
   * @step dcf88f9a5a9a.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("date-input").tap();
  await screen.getByTestId("next-month-button").tap();
  await screen.getByTestId("next-month-button").tap();
  await screen.getByTestId("next-month-button").tap();
  await screen.getByTestId("day-button-17").tap();
  await screen.getByTestId("confirm-button").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Appointment booked for September 17, 2026");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Appointment booked for September 17, 2026");
});

test("act completes rich-text-editor", { tags: ["rich-text-editor"] }, async ({ app, agent, screen }) => {
  await app.open("/e/rich-text-editor");
  await agent.act("Complete this scenario as the page instructs: type \"release approved\" into the editor, make exactly the word approved bold, and check the document");
  await expect(screen.getByTestId('success-message')).toHaveText("Document approved");
});

test("act completes playbook-cleanup", { tags: ["playbook-cleanup"] }, async ({ app, agent, screen }) => {
  await app.open("/e/playbook-cleanup");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: delete the playbook named \"Launch…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: delete the playbook named \\\"Launch Approval Draft\\\", confirm the removal, then search for its exact name to verify it is gone\");"
   * @recording 7f3b94974695
   * @step 423676dde621.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("button", "More actions for Launch Approval Draft").tap(); // recorded inside "Launch Approval Draft"
  await screen.getByRole("menuitem", "Delete").tap(); // recorded inside "Launch Approval Draft"
  await screen.getByRole("button", "Remove").tap(); // recorded inside "Remove Playbook"
  await screen.getByRole("searchbox", "Search playbooks").fill("Launch Approval Draft");
  await expect(screen.getByRole("searchbox", "Search playbooks")).toHaveValue("Launch Approval Draft");
  await expect(screen.getByTestId("success-message")).toHaveText("No playbooks match \"Launch Approval Draft\".");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("No playbooks match \"Launch Approval Draft\".");
});

test("act completes promo-storefront", { tags: ["promo-storefront"] }, async ({ app, agent, screen }) => {
  await app.open("/e/promo-storefront");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: buy any one product, dismissing t…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: buy any one product, dismissing the promotional overlays that get in the way, until the order is confirmed\");"
   * @recording c93dae157862
   * @step 1bf3aabb828b.44136fa355b3
   * @recordedAt 2026-10-06
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("buy-headphones").tap(); // recorded inside "Wireless Headphones"
  await expect(screen.getByTestId("success-message")).toHaveText("Order confirmed");
  await expect(screen.getByTestId("deal-headphones")).toBeVisible();
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Order confirmed");
});

test("act completes gift-card-purchase", { tags: ["gift-card-purchase"] }, async ({ app, agent, screen }) => {
  await app.open("/e/gift-card-purchase");
  /**
   * @compiled agent.act("Complete this scenario as the page instructs: buy a gift card for friend@exampl…")
   * @from "await agent.act(\"Complete this scenario as the page instructs: buy a gift card for friend@example.com and complete the purchase\");"
   * @recording 325c3192f769
   * @step 58b82e08250d.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("amount-25").tap();
  await screen.getByTestId("recipient-input").fill("friend@example.com");
  await screen.getByTestId("buy-button").tap();
  await expect(screen.getByTestId("success-message")).toHaveText("Gift card sent to friend@example.com");
  /** @end compiled */
  await expect(screen.getByTestId('success-message')).toHaveText("Gift card sent to friend@example.com");
});

test('act filters the list and the URL carries the filter', async ({ app, agent, browser, screen }) => {
  await app.open('/e/filter-deep-link');
  /**
   * @compiled agent.act("filter the product list down to the mug")
   * @from "await agent.act('filter the product list down to the mug');"
   * @recording 618740e5f3cb
   * @step c54ac6f470b1.44136fa355b3
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("filter-input").fill("mug");
  await expect(screen.getByTestId("filter-input")).toHaveValue("mug");
  /** @end compiled */
  await expect(browser).toHaveURL('/e/filter-deep-link?q=mug');
});
