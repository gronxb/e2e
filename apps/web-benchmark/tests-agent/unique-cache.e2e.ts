/**
 * `unique()` on the Saved Addresses scenario: the label typed in is different
 * on every run and appears in the list afterwards, the shape every creation
 * flow has. Marked, the step keys and records a slot for the label, so a
 * second run replays it with a fresh label and zero model calls; unmarked,
 * the value is in the key and every run misses.
 */

import { test } from '@e2e-dev/web';
import { expect, unique } from 'e2e';

test('act adds an address with a run-unique label', async ({ app, agent, screen }) => {
  const label = `Cabin ${Date.now().toString(36)}`;
  await app.open('/e/saved-addresses');
  /**
   * @compiled agent.act("add a new address labelled {label} at {line}")
   * @from "await agent.act('add a new address labelled {label} at {line}', {\n    params: { label: unique(label), line: '7 Pine Way, Bend' },\n  });"
   * @recording 9f03ade8aca3
   * @step 7e6f99066c5b.49ed432ec362
   * @recordedAt 2026-10-04
   * @compiledAt 2026-11-10
   * @verifiedAt 2026-11-10
   */
  await screen.getByTestId("label-input").fill(label);
  await screen.getByTestId("line-input").fill("7 Pine Way, Bend");
  await screen.getByTestId("add-button").tap();
  await expect(screen.getByTestId("toast")).toHaveText("Address saved");
  /** @end compiled */
  await expect(screen.getByTestId('address-list')).toContainText(label);
  await expect(screen.getByTestId('toast')).toHaveText('Address saved');
});
