/**
 * `agent.act()` against every scenario, one step each: the step gets the
 * catalog description as its goal and reads the rest off the screen; the
 * deterministic check on the scenario's success message decides the test.
 * Scenarios the harness cannot finish yet are declared and skipped with the
 * reason, so the gap stays visible in every run.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Device } from '@e2e-dev/mobile';
import type { Agent, AgentParam, App, Screen } from 'e2e';
import { credentials } from 'e2e';
import { expect, openScenario, test } from '../tests/fixtures.ts';

interface Scenario {
  /** The home-list row, which is also the scenario's screen title. */
  readonly name: string;
  readonly goal: string;
  /** What `success-message` shows at the end; a pattern when the message carries run-time data. */
  readonly success: string | RegExp;
  /**
   * Why the harness cannot finish this scenario yet. The test is declared and
   * skipped with the reason, and turns on the day the capability lands.
   */
  readonly gap?: string;
  /** The platforms whose fixture the scenario depends on; both by default. */
  readonly platforms?: readonly ('ios' | 'android')[];
  /** A step budget above the default, for a flow that legitimately needs more actions. */
  readonly maxSteps?: number;
  /**
   * The screen's tree is merged or hidden on purpose, so the success message
   * never enters it: the goal tells the model the screen lists nothing and
   * success is judged from a screenshot.
   */
  readonly pixels?: true;
  /** Puts the device in the state the scenario expects before it opens. */
  readonly prepare?: (fixtures: { device: Device; platform: string }) => void | Promise<void>;
  /** Values the goal refers to; a `Secret` is filled by the runner, never shown to the model. */
  readonly params?: () => Readonly<Record<string, AgentParam>>;
}

/**
 * A reused simulator keeps an earlier grant, and the recorded Allow tap then
 * has no button. CI's Android emulator starts without the grant.
 */
async function resetMicrophonePermission({ device, platform }: { device: Device; platform: string }): Promise<void> {
  if (platform === 'ios') await device.setPermission('microphone', 'reset');
}

/**
 * The photo the picker scenario expects in the library, added once to every
 * booted simulator. A marker in the simulator's own data directory keeps a
 * rerun from adding a copy, which would leave the picker with twins the
 * trace cache cannot tell apart, and goes with the library when the
 * simulator is erased.
 */
function seedReceiptPhoto(): void {
  const photo = resolve(import.meta.dirname, '../assets/icon.png');
  const booted = execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], { encoding: 'utf8' });
  const devices = JSON.parse(booted) as { devices: Record<string, { udid: string; state: string; dataPath: string }[]> };
  for (const runtime of Object.values(devices.devices)) {
    for (const device of runtime) {
      if (device.state !== 'Booted') continue;
      const marker = resolve(device.dataPath, 'tmp', 'e2e-mobile-benchmark-receipt');
      if (existsSync(marker)) continue;
      execFileSync('xcrun', ['simctl', 'addmedia', device.udid, photo]);
      writeFileSync(marker, photo);
    }
  }
}

const SCENARIOS: readonly Scenario[] = [
  {
    name: 'Login Form',
    // The hint on screen shows the declared credential, which reaches the
    // model redacted, so the account comes in as params instead.
    goal: 'log in with the given username and password',
    success: 'Logged in successfully',
    params: () => {
      const account = credentials.user('benchmark');
      return { username: account.username, password: account.password };
    },
  },
  {
    name: 'Infinite Scroll List',
    goal: 'scroll the paginated list until Item 137 appears, then tap it',
    success: 'Found item 137',
    // Item 137 is the fifth page; that is a few dozen scrolls, more than the
    // default action budget.
    maxSteps: 60,
  },
  {
    name: 'Modal Flow',
    goal: 'open the modal, continue, and confirm the alert that follows',
    success: 'Flow completed',
  },
  {
    name: 'Bottom Tabs',
    goal: 'go to the Actions tab and complete the action there',
    success: 'Action completed',
  },
  {
    name: 'Text Input Variations',
    goal: 'fill the username, the 4-digit PIN, and at least ten characters of notes, then submit',
    success: 'Form submitted',
  },
  {
    name: 'Broken Accessibility',
    goal: 'complete the flow the screen describes until it says Access granted',
    success: 'Access granted',
    pixels: true,
  },
  {
    name: 'Vision Only',
    goal: 'complete the flow the screen describes until it says Sequence complete',
    success: 'Sequence complete',
    pixels: true,
  },
  {
    // The card is a plain View the tree does not list, so the swipe goes
    // through the device tool pack, a gap in the recording: replay performs
    // the long press and hands the swipe and the double tap to the model.
    name: 'Gestures',
    goal: 'long-press the first target, swipe the card left, then double-tap the last target',
    success: 'All gestures completed',
  },
  // "Scroll up" names the grammar verb the recording replays; a free-form
  // swipe from the device tool pack is a gap in the trace, and the model
  // reached for it when told to pull.
  {
    name: 'Async States',
    goal: 'wait for the screen to load, scroll up on the reward area to refresh it, then claim the reward',
    success: 'Reward claimed',
  },
  {
    name: 'Debounced Search',
    goal: 'search for Benchmark Target and select exactly that result once it loads',
    success: 'Selected Benchmark Target',
  },
  // Android only: scroll_to by text pages the list as one action and the
  // step replays. On iOS every page waits out a fling of a few seconds, the
  // row is over forty pages down, and the step runs past its timeout.
  {
    name: 'Huge Virtualized List',
    goal: 'scroll to Row 0512 and tap it; the list has 600 rows and off-screen rows are not in the tree',
    success: 'Found Row 0512',
    maxSteps: 80,
    platforms: ['android'],
  },
  // The values are spelled out so the recording replays: a value the model
  // composes after a screenshot is treated as read off the image and is a
  // gap in the trace, while one the goal names is the step's literal input.
  // The password is not the declared credential's, which the model would
  // see redacted.
  {
    name: 'Flattened Registration Form',
    goal: 'fill the registration form with first name Ada, last name Lovelace, email ada@example.com, and password Lovelace1815, then sign up until it says Account created',
    success: 'Account created',
    pixels: true,
  },
  // The account is read off the screenshot, so the typed values are a gap in
  // the recording by design and the model runs that part live: a secret can
  // only be typed into a listed field, and this screen lists none.
  {
    name: 'Flattened Login',
    goal: 'log in with the email and password the screen shows as a hint',
    success: 'Logged in successfully',
    pixels: true,
  },
  {
    name: 'Sticky Chrome Target',
    goal: 'scroll down to the Accept terms button under the sticky footer, accept the terms, then tap Continue in the footer',
    success: 'Terms accepted',
  },
  {
    name: 'WebView Accessibility',
    goal: 'read the coupon code inside the web view, enter it in the web form, accept the terms, and apply it',
    success: 'Coupon applied',
  },
  {
    name: 'Permission Prompt',
    goal: 'request microphone access and allow it in the system dialog',
    success: 'Microphone enabled',
    prepare: resetMicrophonePermission,
  },
  {
    name: 'Photo Picker',
    goal: 'choose a photo and pick the most recent one from the library so it is attached as the receipt',
    success: /^Receipt attached/,
    // The receipt is seeded with `xcrun simctl addmedia`; the emulator's
    // seeding (adb push and a media scan) is not written yet.
    platforms: ['ios'],
    prepare: seedReceiptPhoto,
  },
  {
    name: 'Product Catalog',
    goal: 'open Trail Mix 500 g (not a look-alike), set the quantity to 2, add it to the cart, then open the cart',
    success: 'Order ready: 2 × Trail Mix 500 g',
  },
  {
    name: 'Error Recovery',
    goal: 'retry the failed load, then delete the draft and confirm',
    success: 'Draft deleted',
  },
  {
    name: 'Choice Controls',
    goal: 'order a Medium pizza with exactly Cheese and Olives, enable rush delivery, dismiss the keyboard, and place the order',
    success: 'Order placed: Medium with Cheese, Olives (rush)',
  },
  // On Android the sheet is Stripe's Compose UI: the agent fills the card,
  // expiry, and CVC, but the postal-code field takes no input from
  // agent-device 0.21.13's fill and Pay stays disabled, on every run.
  {
    name: 'Stripe PaymentSheet',
    // Expiry and CVC are named so the recording replays: "any CVC" had the
    // model type the 123 the screen shows, a value read off the screen and so
    // a gap in the trace.
    goal: 'open the checkout and pay with the Stripe test card 4242 4242 4242 4242, expiry 12/34, CVC 123',
    success: 'Stripe test payment completed',
    maxSteps: 40,
    platforms: ['ios'],
  },
  // Android only: on iOS the fields the open keyboard covers stay covered
  // after the keyboard is dismissed (agent-device cannot dismiss the iOS
  // keyboard, and a tap while it is up only closes it), so the wizard stays
  // on its step in two runs out of three, on a Mac and on CI alike. Android
  // passed three live runs in a row.
  {
    name: 'Sequential Onboarding',
    goal: 'complete the signup wizard with the email, name, and phone the screen asks for, dismissing the keyboard before each Continue',
    success: 'Onboarding complete',
    platforms: ['android'],
  },
  {
    name: 'Apple Pay',
    goal: 'start the Apple Pay payment and authorize it in the sheet that appears; the sheet is not in the tree, use the screenshot',
    success: 'Payment complete: $8.99',
    platforms: ['ios'],
  },
  {
    name: 'Apple Pay Billing Address',
    goal: 'start the Apple Pay payment, fill the billing address the sheet asks for, and pay; the sheet is not in the tree, use the screenshot',
    success: 'Payment complete: $8.99',
    platforms: ['ios'],
    maxSteps: 40,
    // On the CI simulator the Apple Pay sheet completes without its
    // billing-address step (a fresh simulator has no Wallet state), so the
    // scenario's own check cannot hold there; a Mac at a desk passes.
    ...(process.env.CI === 'true'
      ? { gap: "the CI simulator's Apple Pay sheet skips the billing-address step, so the scenario cannot be completed there" }
      : {}),
  },
];

/** Demo only: each scenario is declared as its own test so e2e compile can pin its recording. */
function scenarioNamed(name: string): Scenario {
  return SCENARIOS.find((scenario) => scenario.name === name)!;
}

function optionsFor(name: string) {
  const scenario = scenarioNamed(name);
  return {
    tags: [scenario.name],
    ...(scenario.gap === undefined ? {} : { skip: scenario.gap }),
    ...(scenario.platforms === undefined ? {} : { platforms: scenario.platforms }),
  };
}

async function checkOutcome(scenario: Scenario, { agent, screen }: { agent: Agent; screen: Screen }): Promise<void> {
  if (scenario.pixels === true) {
    // The tree is merged or hidden on purpose, so the message is judged from pixels.
    await agent.assert(`the screen shows the text "${String(scenario.success)}"`, { vision: 'only' });
    return;
  }
  await expect(screen.getByTestId('success-message')).toHaveText(scenario.success);
}

test("act completes Login Form", optionsFor("Login Form"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Login Form");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: log in with the given username and password", { params: scenario.params!() });
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Infinite Scroll List", optionsFor("Infinite Scroll List"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Infinite Scroll List");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: scroll the paginated list until Item 137 appears, then tap it", { maxSteps: 60 });
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Modal Flow", optionsFor("Modal Flow"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Modal Flow");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  /**
   * @compiled agent.act("Complete this scenario as the screen instructs: open the modal, continue, and c…")
   * @from "await agent.act(\"Complete this scenario as the screen instructs: open the modal, continue, and confirm the alert that follows\");"
   * @recording ebb768ec01a4
   * @step 32bf25d16daf.44136fa355b3
   * @recordedAt 2026-10-30
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("open-modal-button").tap();
  await screen.getByTestId("continue-button").tap();
  await screen.getByRole("button", "Confirm").tap(); // recorded inside "Confirm action"
  await expect(screen.getByTestId("success-message")).toBeVisible();
  /** @end compiled */
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Bottom Tabs", optionsFor("Bottom Tabs"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Bottom Tabs");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  /**
   * @compiled agent.act("Complete this scenario as the screen instructs: go to the Actions tab and compl…")
   * @from "await agent.act(\"Complete this scenario as the screen instructs: go to the Actions tab and complete the action there\");"
   * @recording f3878ab8a2c7
   * @step e537c4fc2097.44136fa355b3
   * @recordedAt 2026-10-30
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("tab-actions").tap();
  await screen.getByTestId("complete-action-button").tap();
  await expect(screen.getByTestId("tab-home")).toBeVisible();
  await expect(screen.getByTestId("tab-actions")).toBeVisible();
  await expect(screen.getByTestId("success-message")).toBeVisible();
  /** @end compiled */
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Text Input Variations", optionsFor("Text Input Variations"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Text Input Variations");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  /**
   * @compiled agent.act("Complete this scenario as the screen instructs: fill the username, the 4-digit …")
   * @from "await agent.act(\"Complete this scenario as the screen instructs: fill the username, the 4-digit PIN, and at least ten characters of notes, then submit\");"
   * @recording 6d77b84d705d
   * @step fbc47cae1853.44136fa355b3
   * @recordedAt 2026-10-30
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("username-input").fill("tester");
  await screen.getByTestId("pin-input").fill("1234");
  await screen.getByTestId("notes-input").fill("These are at least ten characters of notes.");
  await screen.getByTestId("submit-button").tap();
  await expect(screen.getByTestId("success-message")).toBeVisible();
  /** @end compiled */
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Broken Accessibility", optionsFor("Broken Accessibility"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Broken Accessibility");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: complete the flow the screen describes until it says Access granted. The screen lists nothing useful; take a screenshot and work from it.");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Vision Only", optionsFor("Vision Only"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Vision Only");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: complete the flow the screen describes until it says Sequence complete. The screen lists nothing useful; take a screenshot and work from it.");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Gestures", optionsFor("Gestures"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Gestures");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: long-press the first target, swipe the card left, then double-tap the last target");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Async States", optionsFor("Async States"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Async States");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: wait for the screen to load, scroll up on the reward area to refresh it, then claim the reward");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Debounced Search", optionsFor("Debounced Search"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Debounced Search");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  /**
   * @compiled agent.act("Complete this scenario as the screen instructs: search for Benchmark Target and…")
   * @from "await agent.act(\"Complete this scenario as the screen instructs: search for Benchmark Target and select exactly that result once it loads\");"
   * @recording 7df0802b8a1f
   * @step c212f90679a6.44136fa355b3
   * @recordedAt 2026-10-09
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("search-input").tap();
  await screen.getByTestId("search-input").fill("Benchmark Target");
  await screen.getByTestId("result-Benchmark Target").tap();
  await screen.getByTestId("result-Benchmark Target").tap();
  await expect(screen.getByTestId("success-message")).toBeVisible();
  /** @end compiled */
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Huge Virtualized List", optionsFor("Huge Virtualized List"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Huge Virtualized List");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: scroll to Row 0512 and tap it; the list has 600 rows and off-screen rows are not in the tree", { maxSteps: 80 });
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Flattened Registration Form", optionsFor("Flattened Registration Form"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Flattened Registration Form");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: fill the registration form with first name Ada, last name Lovelace, email ada@example.com, and password Lovelace1815, then sign up until it says Account created. The screen lists nothing useful; take a screenshot and work from it.");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Flattened Login", optionsFor("Flattened Login"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Flattened Login");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: log in with the email and password the screen shows as a hint. The screen lists nothing useful; take a screenshot and work from it.");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Sticky Chrome Target", optionsFor("Sticky Chrome Target"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Sticky Chrome Target");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  /**
   * @compiled agent.act("Complete this scenario as the screen instructs: scroll down to the Accept terms…")
   * @from "await agent.act(\"Complete this scenario as the screen instructs: scroll down to the Accept terms button under the sticky footer, accept the terms, then tap Continue in the footer\");"
   * @recording 54cafd3addc2
   * @step c8995bcdba36.44136fa355b3
   * @recordedAt 2026-10-30
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.scrollUntilVisible(screen.getByText("Accept terms"), { direction: "down", timeout: 12235 });
  await screen.getByTestId("accept-terms").tap();
  await screen.getByTestId("continue-button").tap();
  await expect(screen.getByTestId("success-message")).toBeVisible();
  /** @end compiled */
  await checkOutcome(scenario, { agent, screen });
});

test("act completes WebView Accessibility", optionsFor("WebView Accessibility"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("WebView Accessibility");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  /**
   * @compiled agent.act("Complete this scenario as the screen instructs: read the coupon code inside the…")
   * @from "await agent.act(\"Complete this scenario as the screen instructs: read the coupon code inside the web view, enter it in the web form, accept the terms, and apply it\");"
   * @recording ccabb5584107
   * @step 60e9576a643a.44136fa355b3
   * @recordedAt 2026-10-09
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByRole("textbox", "Coupon code").fill("TA-BENCH-50");
  await screen.getByRole("switch", "I accept the terms").check();
  await screen.getByRole("button", "Apply coupon").tap();
  await expect(screen.getByRole("textbox", "Coupon code")).toHaveValue("TA-BENCH-50");
  await expect(screen.getByRole("switch", "I accept the terms")).toBeChecked();
  await expect(screen.getByLabel("Vertical scroll bar, 2 pages")).toHaveValue("0%");
  /** @end compiled */
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Permission Prompt", optionsFor("Permission Prompt"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Permission Prompt");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: request microphone access and allow it in the system dialog");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Photo Picker", optionsFor("Photo Picker"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Photo Picker");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: choose a photo and pick the most recent one from the library so it is attached as the receipt");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Product Catalog", optionsFor("Product Catalog"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Product Catalog");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: open Trail Mix 500 g (not a look-alike), set the quantity to 2, add it to the cart, then open the cart");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Error Recovery", optionsFor("Error Recovery"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Error Recovery");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: retry the failed load, then delete the draft and confirm");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Choice Controls", optionsFor("Choice Controls"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Choice Controls");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: order a Medium pizza with exactly Cheese and Olives, enable rush delivery, dismiss the keyboard, and place the order");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Stripe PaymentSheet", optionsFor("Stripe PaymentSheet"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Stripe PaymentSheet");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: open the checkout and pay with the Stripe test card 4242 4242 4242 4242, expiry 12/34, CVC 123", { maxSteps: 40 });
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Sequential Onboarding", optionsFor("Sequential Onboarding"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Sequential Onboarding");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: complete the signup wizard with the email, name, and phone the screen asks for, dismissing the keyboard before each Continue");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Apple Pay", optionsFor("Apple Pay"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Apple Pay");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: start the Apple Pay payment and authorize it in the sheet that appears; the sheet is not in the tree, use the screenshot");
  await checkOutcome(scenario, { agent, screen });
});

test("act completes Apple Pay Billing Address", optionsFor("Apple Pay Billing Address"), async ({ agent, app, device, platform, screen }) => {
  const scenario = scenarioNamed("Apple Pay Billing Address");
  await scenario.prepare?.({ device, platform });
  await openScenario({ app, device, screen }, scenario.name);
  await agent.act("Complete this scenario as the screen instructs: start the Apple Pay payment, fill the billing address the sheet asks for, and pay; the sheet is not in the tree, use the screenshot", { maxSteps: 40 });
  await checkOutcome(scenario, { agent, screen });
});
