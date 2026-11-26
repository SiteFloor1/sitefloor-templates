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

test("the class finder narrows the list and says how many fit", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/classes");
  await expect(page.locator("[data-gcf-n]")).toHaveText("Six classes");
  await page.getByRole("button", { name: "Strength" }).click();
  await expect(page.locator("[data-gcf-n]")).toHaveText("One class");
  await expect(page.locator(".gcf-c:not([hidden]) h2")).toHaveText("Barbell club");
  await page.getByRole("button", { name: "Strength" }).click(); // pressed again: let go
  await page.getByRole("button", { name: "Mobility" }).click();
  await page.getByRole("button", { name: "Before ten" }).click();
  await expect(page.locator(".gcf-c:not([hidden]) h2")).toHaveText("Mobility");
  await expect(page.getByRole("button", { name: "Mobility" })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the club tour shows one room at a time, chosen from the list or with the arrow keys", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/club");
  const panels = page.locator('[role="tabpanel"]');
  await expect(panels.filter({ visible: true })).toHaveCount(1);
  await page.getByRole("tab", { name: /Changing rooms/ }).click();
  await expect(page.locator("#gtu-p-changing")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#gtu-p-rig")).toBeVisible();
  await expect(page.getByRole("tab", { name: /The rig/ })).toBeFocused();
  await srv.close();
});

test("personal training prices are pack totals, every fee in; events go into the calendar", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/training");
  await expect(page.locator(".gpt-total").last()).toHaveText("£480 for eight sessions, race assessment fee included");
  await page.goto(srv.base + "/events");
  const first = page.locator(".gev-e").first();
  await expect(first.locator(".gev-act a").last()).toHaveAttribute("href", /^events\/[a-z-]+\.ics$/);
  const ics = await page.request.get(srv.base + "/" + await first.locator(".gev-act a").last().getAttribute("href"));
  expect(await ics.text()).toMatch(/BEGIN:VEVENT[\s\S]*DTSTART:\d{8}T\d{6}Z/);
  await srv.close();
});
