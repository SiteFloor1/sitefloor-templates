// Hol kit and the Arch look, as an owner and a guest use them: What it costs in the header of every page and the phone
// menu, the estimate re-worked from the company's own figures with its basis beside it, the plain question on plans
// without it, the changeover changing its photograph, the rules by region with their dates, the revenue review as one
// WhatsApp message, each home's free dates failing closed when the sheet is stale, and a guidebook opening only with
// its code.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";

const demo = site("demos/holiday-lets");
const client = site("_fixtures/test-hol-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL((await loc.getAttribute("href")) ?? "").searchParams.get("text") ?? "";
const THU = new Date("2026-11-26T10:30:00Z"); // a Thursday morning: the demo sheet was updated at 08:40

test("What it costs sits in the header of every page and in the phone menu", async ({ page }) => {
  const srv = await start(demo);
  for (const path of ["/", "/owners.html", "/homes.html", "/fees.html", "/rules.html", "/journal.html"]) {
    await page.goto(srv.base + path);
    await expect(page.locator(".ar-links a", { hasText: "What it costs" })).toHaveAttribute("href", /fees/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await page.click(".burger");
  await expect(page.locator("#mnav a", { hasText: "What it costs" })).toBeVisible();
  await srv.close();
});

test("the estimate: one sum from the company's own figures, re-worked by bedrooms and own weeks", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const you = page.locator('[data-se="you"]');
  await expect(you).toHaveText("£37,200");
  await expect(page.locator('[data-se="basis"]')).toContainText("from what our 11 two-bedroom homes earned in 2025");
  await page.locator(".st-est").locator('label:has(input[name=beds][value="3"])').click();
  await expect(you).toHaveText("£52,200");
  await expect(page.locator('[data-se="fee"]')).toHaveText("£13,050");
  await page.locator('label:has(input[name=own][value="2"])').click();
  await expect(page.locator('[data-se="basis"]')).toContainText("less 2 weeks of your own stays");
  await expect(page.locator(".st-basis")).toContainText("Before your running costs and tax");
  expect(errors).toEqual([]);
  await srv.close();
});

test("on Plus the estimate is gone and the plain question asks for a review", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.click('[data-demo-ribbon] [data-tier-pick="plus"]');
  await expect(page.locator(".st-est")).toBeHidden();
  await expect(page.locator(".ar-plain")).toBeVisible();
  await expect(page.locator(".ar-go a")).toHaveAttribute("href", /review/);
  await page.click('[data-demo-ribbon] [data-tier-pick="starter"]');
  await expect(page.locator("#turnover")).toBeHidden();
  await expect(page.locator("#fees")).toBeVisible();
  await expect(page.locator("#rules")).toBeVisible();
  await srv.close();
});

test("between guests: choosing a time opens its line and changes the photograph", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const step = page.locator('[data-st-step="3"]');
  await step.click();
  await expect(step).toHaveAttribute("aria-pressed", "true");
  await expect(step.locator(".st-det")).toBeVisible();
  await expect(page.locator("[data-st-photo]").nth(3)).toHaveClass(/on/);
  await expect(page.locator('[data-st-step="0"] .st-det')).toBeHidden();
  await srv.close();
});

test("rules where your home is: each region's lines, linked and dated", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await page.click('[data-st-region="london"]');
  const london = page.locator('[data-st-panel="london"]');
  await expect(london).toBeVisible();
  await expect(london).toContainText("90 nights a year without planning permission");
  await expect(london.locator("a").first()).toHaveAttribute("href", "https://www.legislation.gov.uk/ukpga/2015/20/section/44");
  await expect(london).toContainText("checked 26 November 2026");
  await expect(page.locator('[data-st-panel="england"]')).toBeHidden();
  await srv.close();
});

test("the revenue review becomes one WhatsApp message in the owner's words", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/review.html");
  await featuresStarted(page);
  await page.fill("input[name=where]", "TR2");
  await page.fill("input[name=sleeps]", "6");
  expect(await waText(page.locator("[data-sr-send]"))).toContain("Hello Tressa, I'd like a revenue review for my home.\nWhere: TR2\nBedrooms: 3\nSleeps: 6\nHow it's let now: Not let yet");
  await srv.close();
});

test("each home's free dates come from the sheet; a stale sheet shows none", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(THU);
  await page.goto(srv.base + "/homes.html");
  await featuresStarted(page);
  await expect(page.locator('[data-sc-free="glasshouse"]')).toHaveText(/^Next free: 30 Nov to 3 Dec/);
  await expect(page.locator("[data-sc-note]")).toHaveText("Free dates from our bookings sheet, updated today.");
  await page.goto(srv.base + "/homes.html#stale");
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator('[data-sc-free="glasshouse"]')).toBeHidden();
  await expect(page.locator("[data-sc-note]")).toContainText("aren't shown right now");
  await srv.close();
});

test("a guidebook opens only with its code, and a booking link can carry it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/guide-glasshouse.html");
  await featuresStarted(page);
  await expect(page.locator("[data-sg-body]")).toBeHidden();
  await page.fill("input[name=code]", "terrace4");
  await page.click("[data-sg-form] button");
  await expect(page.locator("[data-sg-wrong]")).toBeVisible();
  await page.fill("input[name=code]", "glass 7");
  await page.click("[data-sg-form] button");
  await expect(page.locator("[data-sg-body]")).toBeVisible();
  await expect(page.locator("[data-sg-body]")).toContainText("the password is on the card by the router");
  await page.goto(srv.base + "/guide-terrace?code=TERRACE4");
  await featuresStarted(page);
  await expect(page.locator("[data-sg-body]")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await srv.close();
});

test("the client fixture: owner stories real and dated, booking through the listing, no sample labels", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/stories.html");
  await expect(page.locator(".st-quotes li")).toContainText("A. Owner, 14 September 2026, Google");
  await page.goto(srv.base + "/homes.html");
  await expect(page.locator(".st-home .st-link").first()).toHaveAttribute("href", "https://www.airbnb.co.uk/rooms/000000");
  expect(await waText(page.locator(".st-home .st-link").nth(1))).toBe("Hello Harlyn, I'd like to book The Loft.");
  await expect(page.locator("body")).not.toContainText("Sample homes and prices");
  await srv.close();
});
