// Gym kit and the After dark look, as a member sees them: the count in the hero (live while fresh, "usually" otherwise),
// classes that book in the club's own app, prices that include every mandatory fee, the corporate rate found by
// company, and the Hyrox plan from a UK date.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/gym");
const client = site("_fixtures/test-gym-client");
// Monday 19 Oct 2026, 10:30 BST, the helpers' fixed time.
const SHEET = "https://docs.google.com/**";

test("the hero shows one number and its line; on a phone the day pass stays in the phone bar", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await expect(page.locator(".gc-n")).toHaveText(/^\d+$/);
  await expect(page.locator("[data-gc-line]")).toHaveText(/in the club/);
  await page.mouse.wheel(0, 3000);
  await expect(page.locator(".mbar .ad-bar-pass")).toBeInViewport();
  expect(errors).toEqual([]);
  await srv.close();
});

test("a client whose door-count sheet can't be read says \"usually\", never a live figure", async ({ page }) => {
  const srv = await start(client);
  await page.route(SHEET, (r) => r.abort());
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-gc-line]")).toHaveText("usually in the club on a Monday at 10am.");
  await expect(page.locator(".gc-n")).toHaveText("30");
  await expect(page.locator("[data-left]:not([hidden])")).toHaveCount(0);
  await srv.close();
});

test("a fresh door count shows with its age; an old one is ignored", async ({ page }) => {
  const srv = await start(client);
  let stamp = "2026-10-19 10:28";
  await page.route(SHEET, (r) => {
    const body = r.request().url().includes("count") ? `updated_at,count\n${stamp},12` : "date,time,class,left,updated_at\n";
    return r.fulfill({ status: 200, contentType: "text/csv", body });
  });
  await page.goto(srv.base + "/");
  await expect(page.locator(".gc-n")).toHaveText("12");
  await expect(page.locator("[data-gc-line]")).toHaveText("in the club, counted 2 minutes ago.");
  await expect(page.locator("[data-gc-say]")).toHaveText("Quieter than a usual Monday.");
  stamp = "2026-10-19 10:05";
  await page.reload();
  await expect(page.locator("[data-gc-line]")).toHaveText(/^usually in the club/);
  await srv.close();
});

test("every class books in the club's own app", async ({ page }) => {
  const srv = await start(client);
  await page.route(SHEET, (r) => r.abort());
  await page.goto(srv.base + "/");
  const books = page.locator("#classes .gy-book");
  expect(await books.count()).toBeGreaterThan(0);
  for (const href of await books.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) expect(href).toMatch(/^https:\/\/app\.glofox\.com\//);
  await srv.close();
});

test("membership prices are the totals, the joining fee in, never a monthly price with the fee beside it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/memberships");
  const prices = page.locator(".gm-price");
  await expect(prices.first()).toHaveText("£1,578 for 12 months, joining fee included");
  await expect(prices.nth(1)).toContainText("£179 the first month, joining fee included");
  await expect(prices.nth(1)).toContainText("then £149 a month");
  for (const t of await prices.allTextContents()) expect(t).not.toMatch(/\+/);
  await srv.close();
});

test("the corporate rate is found by company, however it's typed", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/corporate");
  await page.fill("#gc2-q", "northmill digital ltd");
  await expect(page.locator("[data-gc2-out]")).toHaveText("Northmill Digital has the Partner rate.");
  await expect(page.locator('[data-rate="partner"]')).toHaveClass(/is-yours/);
  await page.fill("#gc2-q", "Acme Widgets");
  await expect(page.locator("[data-gc2-ask]")).toBeVisible();
  await srv.close();
});

test("the Hyrox plan reads a UK date and refuses the US order", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/hyrox");
  const date = page.locator("#gh-date");
  await expect(date).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
  await date.fill("13/03/2027");
  await expect(page.locator("[data-gh-weeks]")).toHaveText(/^\w+ weeks\. Here's how we'd use them\.$/);
  await expect(page.locator(".gh-p")).toHaveCount(4);
  await expect(page.locator(".gh-p").last()).toContainText("12 Mar");
  await expect(page.locator("[data-gh-cal]")).not.toHaveClass(/is-off/);
  await date.fill("03/13/2027");
  await expect(page.locator("[data-gh-err]")).toHaveText("Type the date as day, month, year: 14/03/2027.");
  await expect(page.locator("[data-gh-cal]")).toHaveClass(/is-off/);
  await srv.close();
});
