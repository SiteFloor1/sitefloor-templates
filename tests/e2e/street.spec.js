// Barber Street features (walk-in queue, memberships, loyalty, before/after, vouchers), as a customer uses them.
import { test, expect, site, start, OPEN_TIME, CLOSED_TIME } from "./helpers.js";

const demo = site("demos/barber-street");
const client = site("_fixtures/test-barber-street");
const SHEET = /docs\.google\.com\/spreadsheets/;
const csv = (rows) => (r) => r.fulfill({ status: 200, contentType: "text/csv", body: `Timestamp,Waiting\n${rows}\n` });

test.describe("walk-in queue", () => {
  test("demo: a live number, the wait, the hero line and today's row", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-q-waiting]")).toHaveText(/^\d+$/);
    await expect(page.locator("[data-q-wait]")).toHaveText(/No wait|Wait about/);
    await expect(page.locator("[data-q-hero]")).toHaveText(/^\d+ waiting · /);
    await expect(page.locator('[data-q-day="1"]')).toHaveClass(/today/);
    await expect(page.locator('[data-q-day="1"] .now')).toHaveCount(1);
    await srv.close();
  });

  test("client: fresh sheet gives the count, the wait and when you'd be in the chair", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, csv("19/10/2026 10:20:00,6\n19/10/2026 10:25:00,4"));
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-q-waiting]")).toHaveText("4");
    await expect(page.locator("[data-q-line] li")).toHaveCount(5); // four people and you
    await expect(page.locator("[data-q-wait]")).toHaveText("Wait about 30 min. Walk in now and you're in the chair by about 11am.");
    await expect(page.locator("[data-q-updated]")).toHaveText("Updated 5 min ago by the shop");
    await expect(page.locator("[data-q-hero]")).toHaveText("4 waiting · about 30 min");
    await expect(page.locator("[data-q-best]")).toContainText("quietest left today: 10am");
    await srv.close();
  });

  for (const [name, handler] of [
    ["stale", csv("19/10/2026 09:00:00,2")],
    ["unreachable", (r) => r.abort("failed")],
    ["malformed", (r) => r.fulfill({ status: 200, body: "nothing useful" })],
  ]) {
    test(`client: ${name} sheet hides the number and offers to ask; the usual chart stays`, async ({ page }) => {
      const srv = await start(client);
      await page.route(SHEET, handler);
      await page.goto(srv.base + "/");
      await expect(page.locator("[data-q-fallback]")).toBeVisible();
      await expect(page.locator("[data-q-live]")).toBeHidden();
      await expect(page.locator(".q-heat")).toBeVisible();
      await expect(page.locator("[data-q-hero]")).toBeHidden();
      await srv.close();
    });
  }

  test("closed: says so instead of a wait", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(CLOSED_TIME);
    await page.route(SHEET, csv("19/10/2026 18:55:00,3"));
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-q-wait]")).toHaveText("We're closed right now. The queue starts again when we open.");
    await srv.close();
  });
});

test.describe("will I make it?", () => {
  test("client: too tight with the live queue, then yes with more time; best time and reminder", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, csv("19/10/2026 10:25:00,4"));
    await page.goto(srv.base + "/#fit");
    // 10:30, clipper cut (15 min), from Leeds station (2 min) and back, done in 45 min; 4 waiting = 30 min wait
    await expect(page.locator("[data-fc-verdict]")).toHaveText("Too tight. About 4 min short.");
    await expect(page.locator("[data-fc-sub]")).toHaveText("Best time left today: 10:45am, usually quiet.");
    const remind = page.locator("[data-fc-remind]");
    await expect(remind).toHaveText("Remind me at 10:30am");
    await expect(remind).toHaveAttribute("download", "clipper-reminder.ics");
    await expect(page.locator("[data-fc-src]")).toContainText("Using the live queue: 4 waiting");
    await page.locator('input[name="fc-in"][value="60"]').check();
    await expect(page.locator("[data-fc-verdict]")).toHaveText("Yes. You'll be done by 11:17am.");
    await expect(page.locator("[data-fc-sub]")).toHaveText("11 min to spare once you're back. Leave by 10:41am at the latest.");
    await expect(page.locator("[data-fc-steps] li")).toHaveCount(5);
    await expect(page.locator("[data-fc-go]")).toHaveAttribute("href", /wa\.me\/442079460321\?text=.*on%20my%20way/);
    await expect(remind).toBeHidden();
    await srv.close();
  });

  test("client: without the live queue it uses the usual busyness and says so", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.goto(srv.base + "/#fit");
    await expect(page.locator("[data-fc-verdict]")).toHaveText("Probably. If there's no queue, you'll be done by 10:47am.");
    await expect(page.locator("[data-fc-sub]")).toHaveText("It's usually quiet at this hour. The live queue isn't available, so ask us before you set off.");
    await expect(page.locator("[data-fc-src]")).toHaveText("Live queue not available: these times assume there's no queue.");
    await expect(page.locator("[data-fc-steps]")).not.toContainText("min wait");
    await page.locator("[data-fc-time]").fill("10:40");
    await expect(page.locator('input[name="fc-in"][value="at"]')).toBeChecked();
    await expect(page.locator("[data-fc-verdict]")).toHaveText("Too tight. About 9 min short, even with no queue.");
    await srv.close();
  });

  test("closed: offers the next opening time as a reminder", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(CLOSED_TIME);
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.goto(srv.base + "/#fit");
    await expect(page.locator("[data-fc-verdict]")).toHaveText("Not today. We're closed right now.");
    await expect(page.locator("[data-fc-sub]")).toHaveText("We open tomorrow at 7:30am. Early is quietest.");
    await expect(page.locator("[data-fc-remind]")).toHaveText("Remind me at 7:15am");
    await srv.close();
  });
});

test("will I make it, before opening: plans from today's opening time", async ({ page }) => {
  const srv = await start(client);
  await page.clock.setFixedTime(new Date("2026-10-20T06:00:00Z")); // Tuesday 7:00, opens 7:30
  await page.route(SHEET, (r) => r.abort("failed"));
  await page.goto(srv.base + "/#fit");
  await expect(page.locator("[data-fc-verdict]")).toHaveText("Too tight. About 2 min short, even with no queue.");
  await page.locator('input[name="fc-in"][value="60"]').check();
  await expect(page.locator("[data-fc-verdict]")).toHaveText("Yes, if you're here for 7:30am. You'll be done by 7:45am.");
  await expect(page.locator("[data-fc-steps] li").first()).toHaveText("7:28amLeave Leeds station");
  await expect(page.locator("[data-fc-src]")).toHaveText("Planned from our opening time, 7:30am. Times are estimates.");
  await srv.close();
});

test("without JavaScript: the queue card offers to ask, and controls that need scripts are hidden", async ({ browser }) => {
  const srv = await start(client);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-q-fallback]")).toBeVisible();
  await expect(page.locator("[data-q-live]")).toBeHidden();
  await expect(page.locator("[data-fc-form]")).toBeHidden();
  await expect(page.locator("[data-fc-verdict]")).toHaveText("Message us and we'll tell you if you can fit a cut in.");
  await expect(page.locator(".vc-fields")).toBeHidden();
  await expect(page.locator("[data-vc-order]")).toBeVisible();
  await expect(page.locator("[data-mb-range]")).toBeHidden();
  await expect(page.locator("[data-ly-range]")).toBeHidden();
  await context.close();
  await srv.close();
});

test.describe("offers", () => {
  let srv;
  test.beforeAll(async () => { srv = await start(client); });
  test.afterAll(async () => { await srv.close(); });
  test.beforeEach(async ({ page }) => { await page.route(SHEET, (r) => r.abort("failed")); });

  test("memberships: the slider re-scores the plans against paying each time", async ({ page }) => {
    await page.goto(srv.base + "/#memberships");
    await expect(page.locator("[data-mb-payg]")).toHaveText("£23.11"); // a £16 fade every 3 weeks
    await expect(page.locator(".mb-plan.best")).toHaveCount(0);
    await page.locator("[data-mb-range]").fill("1");
    await expect(page.locator(".mb-q")).toHaveText("I get a skin fade every 1 week");
    await expect(page.locator("[data-mb-payg]")).toHaveText("£69.33");
    await expect(page.locator(".mb-plan.best h3")).toHaveText("Sharp");
    await expect(page.locator('[data-mb-plan="1"] [data-mb-save]')).toHaveText("You'd save £19 a month");
    await expect(page.locator('[data-mb-plan="1"] .btn')).toHaveAttribute("href", /wa\.me\/442079460321\?text=.*Sharp/);
  });

  test("loyalty: free cuts a year from the shop's own price", async ({ page }) => {
    await page.goto(srv.base + "/#loyalty");
    await expect(page.locator("[data-ly-out]")).toHaveText("A clipper cut every 3 weeks is 17 cuts a year: 2 free, worth £24.");
    await page.locator("[data-ly-range]").fill("1");
    await expect(page.locator(".ly-q")).toHaveText("I come in every 1 week");
    await expect(page.locator("[data-ly-out]")).toHaveText("A clipper cut every week is 52 cuts a year: 6 free, worth £72.");
    await expect(page.locator("[data-ly-stamps] li.on")).toHaveCount(8);
  });

  test("before/after: a slider that works with the keyboard", async ({ page }) => {
    await page.goto(srv.base + "/#before-after");
    const range = page.locator("[data-ba-range]");
    await expect(page.locator("[data-ba]")).toHaveAttribute("data-ba-ready", "");
    await range.focus();
    await range.fill("50");
    await page.keyboard.press("ArrowRight");
    await expect(range).toHaveValue("51");
    await expect(page.locator(".ba-frame")).toHaveAttribute("style", /--ba: 51%/);
  });

  test("vouchers: the preview follows the form and the order message has every detail", async ({ page }) => {
    await page.goto(srv.base + "/#vouchers");
    await page.locator('input[name="vc-amount"][value="25"]').check();
    await page.locator("[data-vc-to]").fill("Sam");
    await page.locator("[data-vc-from]").fill("Alex");
    await page.locator("[data-vc-note]").fill("Happy birthday!");
    await expect(page.locator("[data-vc-show-amount]")).toHaveText("£25");
    await expect(page.locator("[data-vc-show-to]")).toHaveText("For Sam, from Alex");
    const href = decodeURIComponent((await page.locator("[data-vc-order]").getAttribute("href")) ?? "");
    expect(href).toContain('£25 gift voucher for Sam, from Alex. Message for the card: "Happy birthday!"');
    await page.locator('input[name="vc-amount"][value="custom"]').check();
    await page.locator("[data-vc-custom]").fill("5");
    await expect(page.locator("[data-vc-err]")).toBeVisible();
    await expect(page.locator("[data-vc-order]")).toHaveAttribute("aria-disabled", "true");
  });
});

test("Street demo shows its own features, not Fade District's", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(OPEN_TIME);
  await page.goto(srv.base + "/");
  for (const id of ["walk-in-queue", "fit-a-cut", "memberships", "loyalty", "before-after", "vouchers"]) await expect(page.locator(`[data-feature="${id}"]`)).toHaveCount(1);
  for (const id of ["chair-board", "build-your-cut", "photo-band"]) await expect(page.locator(`[data-feature="${id}"]`)).toHaveCount(0);
  await expect(page.locator("main > section").nth(1)).toHaveAttribute("id", "queue");
  await srv.close();
});
