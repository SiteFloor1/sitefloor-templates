// Pop-up kit and the Capsule look, as a brand uses them: the run's live line (and closed outside the run), timed entry
// that only ever links to the brand's booking page, the invitation, the queue and stock sheets failing closed, the
// tour's states, the countdown to the next opening, the responsible-drinking line, and the pages without JavaScript.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";

const demo = site("demos/chalden");
const client = site("_fixtures/test-popup-client");
// Thursday 10 June 2027, 14:30 BST: the London run (5 to 27 June) is open, 12pm to 8pm.
const THU_AFTERNOON = new Date("2027-06-10T13:30:00Z");
// Thursday 1 July 2027: after London, before Leeds (10 July).
const AFTER_RUN = new Date("2027-07-01T13:30:00Z");

test("the home page: the invitation in the hero, then the rooms, a time, the next opening, Instagram, questions, the address", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids).toEqual(["hero cp-hero", "rooms", "slots", "waitlist", "work", "questions", "visit"]);
  await expect(page.locator(".cp-hero [data-feature='popup-run']")).toHaveCount(1);
  await expect(page.locator(".cp-foot-drink a")).toHaveAttribute("href", "https://www.drinkaware.co.uk/");
  await srv.close();
});

test("the demo is always on now: its dates are days from today", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-run-left]")).toHaveText("On now, 13 days left");
  await expect(page.locator("[data-wait-head]")).toHaveText("days until Manchester");
  await expect(page.locator("[data-wait-count]")).toHaveText("44");
  expect(errors).toEqual([]);
  await srv.close();
});

test("during the run: open now until 8pm, and the queue from the brand's sheet", async ({ page }) => {
  await page.clock.setFixedTime(THU_AFTERNOON);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: r.request().url().includes("line") ? "minutes,updated_at\n20,2027-06-10 14:22\n" : "id,sold_out,updated_at\ncuvee,yes,2027-06-10 09:00\n" }));
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-run-line]")).toHaveText("Open now, until 8pm");
  await expect(page.locator("[data-run-left]")).toHaveText("On now, 17 days left");
  await expect(page.locator("[data-feature='popup-line']")).toHaveText("Queue about 20 minutes (at 2:22pm)");
  await srv.close();
});

test("the queue and the stock fail closed: an old or unreadable sheet shows nothing either way", async ({ page }) => {
  await page.clock.setFixedTime(THU_AFTERNOON);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: r.request().url().includes("line") ? "minutes,updated_at\n20,2027-06-10 11:00\n" : "id,sold_out,updated_at\ncuvee,yes,2027-06-01 09:00\n" }));
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-feature='popup-line']")).toBeHidden();
  await page.goto(srv.base + "/only-here");
  await featuresStarted(page);
  await expect(page.locator("[data-stock-state]")).toHaveText("Ask us what's left today.");
  await expect(page.locator("[data-sold-out]")).toBeHidden();
  await srv.close();
});

test("after the run the site never says open, and points to the next stop", async ({ page }) => {
  await page.clock.setFixedTime(AFTER_RUN);
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-run-line]")).toHaveText("Opens 10 July");
  await expect(page.locator("[data-run-place]")).toHaveText("The Corn Exchange, Leeds");
  await expect(page.locator(".cp-bar [data-status-text]")).toHaveText("Closed");
  await srv.close();
});

test("timed entry links each time to the brand's booking page, never says booked, and makes the invitation", async ({ page }) => {
  await page.clock.setFixedTime(THU_AFTERNOON);
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const days = page.locator("[data-slot-days] button");
  await expect(days.first()).toHaveAttribute("aria-pressed", "true");
  await expect(days.first()).toHaveText(/Thu\s*10/);
  const times = page.locator("[data-slot-times] a");
  await expect(times.first()).toHaveText("3pm"); // 2:30pm has gone
  await expect(times.first()).toHaveAttribute("href", "https://www.eventbrite.co.uk/e/ostrow-test?date=2027-06-10&time=15%3A00");
  await expect(page.locator("[data-day='2027-06-14']")).toBeDisabled(); // a Monday
  await expect(page.locator("#slots")).not.toContainText(/booked|few left|selling fast/i);
  await page.context().route("https://www.eventbrite.co.uk/**", (r) => r.fulfill({ status: 200, body: "booking page" }));
  await times.nth(1).click();
  const invite = page.locator("[data-feature='popup-invite']");
  await expect(invite).toBeVisible();
  await expect(invite.locator("[data-invite-wa]")).toHaveAttribute("href", /Thursday%2010%20June%20at%203%3A30pm/);
  await expect(invite).toContainText("Not a ticket");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the tour gives every stop its own state, and the countdown counts to the next opening", async ({ page }) => {
  await page.clock.setFixedTime(THU_AFTERNOON);
  const srv = await start(client);
  await page.goto(srv.base + "/tour");
  await featuresStarted(page);
  const t = page.locator("[data-tour]");
  await expect(t).toHaveCount(3);
  await expect(t.nth(0).locator("[data-tour-state]")).toHaveText("On now, 17 days left");
  await expect(t.nth(1).locator("[data-tour-state]")).toHaveText("Opens in 30 days");
  await expect(t.nth(2).locator("[data-tour-state]")).toHaveText("Ended 25 April");
  await t.nth(1).click();
  await expect(page.locator("[data-tour-detail]")).toContainText("The Corn Exchange, Leeds. 10 July to 25 July.");
  await expect(page.locator("[data-tour-detail] [data-act='wait']")).toHaveAttribute("href", /waitlist/);
  await page.goto(srv.base + "/waitlist");
  await featuresStarted(page);
  await expect(page.locator("[data-wait-count]")).toHaveText("30");
  await expect(page.locator("[data-wait-head]")).toHaveText("days until Leeds");
  await page.goto(srv.base + "/past");
  await featuresStarted(page);
  await expect(page.locator(".pps-item:visible h2")).toHaveText(["Bath"]);
  await expect(page.locator("[data-past-none]")).toBeHidden();
  await srv.close();
});

test("press, collaborations and past pop-ups show only the brand's own, and the pages work without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(client);
  await page.goto(srv.base + "/press");
  await expect(page.locator(".pxl-list a")).toHaveAttribute("href", "https://example.com/press/ostrow");
  await page.goto(srv.base + "/book");
  await expect(page.locator("[data-slot-times] a").first()).toHaveAttribute("href", /eventbrite\.co\.uk/);
  await srv.close();
  await ctx.close();
});
