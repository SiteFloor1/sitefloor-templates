// Garden kit and the Almanac look, as a client uses them: the year in twelve plants opening on the visitor's month and
// driving the studio's month, the next start hiding when it is out of date, gardens by kind, "ready by", the planting
// palette, the sample table, maintenance plans, a garden through the year and where the sun falls; without JS too.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/garden");
const client = site("_fixtures/test-garden-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page opens on the year, the visitor's month open, and the studio's month follows a tap", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className.split(" ")[1]));
  expect(ids.slice(0, 4)).toEqual(["al-hero", "month", "services", "gardens"]);
  await expect(page.locator("[data-month]")).toHaveCount(12);
  // the test clock is 19 October
  await expect(page.locator('[data-month="10"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-cal-month="10"]')).toBeVisible();
  await page.click('[data-month="3"]');
  await expect(page.locator('[data-month="3"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-cal-month="3"] h2')).toHaveText("March is when gardens start.");
  await expect(page.locator('[data-cal-month="10"]')).toBeHidden();
  expect(await page.locator('[data-month="3"] img').getAttribute("src")).toContain("m03.webp");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-month="4"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-month="4"]')).toBeFocused();
  expect(errors).toEqual([]);
  await srv.close();
});

test("the next start shows only while it is fresh, judged on the visitor's clock", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(new Date("2026-11-09T10:00:00Z"));
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-cal-next]")).toHaveText(/Next design start January · next build April/);
  await page.clock.setFixedTime(new Date("2027-02-01T10:00:00Z"));
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-cal-next]")).toBeHidden();
  await srv.close();
});

test("the phone bar names the visitor's month on the home page, and the booking line", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".mbar [data-month-name]")).toHaveText("October");
  expect(await waText(page.locator(".mbar .al-bar-go"))).toContain("Hello Tollgarth");
  await page.goto(srv.base + "/planting.html");
  await expect(page.locator(".mbar .al-bar-month")).toHaveText("The garden year");
  await srv.close();
});

test("the gardens page: a kind shows only that kind, and each garden links to its story", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/gardens.html");
  await page.click('[data-style="roof"]');
  await expect(page.locator(".gd-gc:visible")).toHaveCount(1);
  await expect(page.locator(".gd-gc:visible .gd-gc-n")).toHaveText("A roof garden");
  await page.click('[data-style="courtyard"]');
  await expect(page.locator(".gd-gc:visible")).toHaveCount(1);
  await page.click(".gd-gc:visible a");
  await expect(page).toHaveURL(/islington-courtyard(\.html)?$/);
  await expect(page.locator(".gd-st-lists")).toContainText("Reclaimed brick");
  await srv.close();
});

test("ready by: the day to get in touch, from the studio's own weeks, in the WhatsApp message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/calendar.html");
  await page.selectOption("[data-sb-month]", { label: "June 2027" });
  await expect(page.locator("[data-sb-out]")).toHaveText("Get in touch by Tuesday 12 January 2027. That leaves our usual 20 weeks for design, the wait for a build slot, and the build.");
  expect(await waText(page.locator("[data-sb-send]"))).toContain("I'd like the garden ready by June 2027.");
  await page.selectOption("[data-sb-month]", { label: "December 2026" });
  await expect(page.locator("[data-sb-out]")).toContainText("sooner than our usual 20 weeks");
  await srv.close();
});

test("the planting palette narrows by month and by sun or shade", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/planting.html");
  await page.click('[data-pp-month="1"]');
  await page.click('[data-pp-light="shade"]');
  await expect(page.locator(".gd-pp-i:visible .gd-pp-n")).toHaveText(["Snowdrop", "Lenten rose"]);
  await page.click('[data-pp-month="7"]');
  await expect(page.locator("[data-pp-none]")).toBeVisible();
  await srv.close();
});

test("the sample table: a sample becomes its garden; ticked samples go into the message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/materials.html");
  const brick = page.locator('[data-mt-id="brick"]');
  await brick.click();
  await expect(brick).toHaveAttribute("aria-pressed", "true");
  expect(await brick.locator(".gd-mt-g").getAttribute("src")).toContain("g-walled.webp");
  await expect(brick.locator(".gd-mt-used")).toHaveText("A walled garden, Islington");
  await page.check('[data-mt-want][value="Reclaimed brick"]');
  await page.check('[data-mt-want][value="Oak, air-dried"]');
  await expect(page.locator("[data-mt-count]")).toHaveText("2 samples in your message.");
  expect(await waText(page.locator("[data-mt-send]"))).toContain("Could I see samples of: Reclaimed brick, Oak, air-dried?");
  await srv.close();
});

test("maintenance plans: a plan's year, its visits and the question with size and postcode", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/maintenance.html");
  await page.click('[data-mp-plan="seasonal"]');
  const plan = page.locator('[data-mp-show="seasonal"]');
  await expect(plan).toBeVisible();
  await expect(page.locator('[data-mp-show="monthly"]')).toBeHidden();
  await expect(plan.locator(".gd-mp-on")).toHaveCount(4);
  await expect(plan.locator(".gd-mp-facts")).toContainText("£240 a visit");
  await expect(page.locator('[data-mp-show="essential"] .gd-mp-facts')).toContainText("Priced after we've seen the garden");
  await page.fill("[data-mp-size]", "10 × 20 m");
  await page.fill("[data-mp-postcode]", "tw9 2qq");
  const text = await waText(page.locator("[data-mp-send]"));
  expect(text).toContain("I'm interested in the Seasonal plan.");
  expect(text).toContain("Postcode: TW9 2QQ");
  await srv.close();
});

test("a garden through the year (a client's own photographs) opens on the nearest month and moves on a tap", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await expect(page.locator('[data-ty-tick="9"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-ty-shot="9"]')).toHaveAttribute("data-ty-on", "");
  await page.click('[data-ty-tick="3"]');
  await expect(page.locator('[data-ty-shot="3"]')).toHaveAttribute("data-ty-on", "");
  await expect(page.locator('[data-ty-shot="9"]')).not.toHaveAttribute("data-ty-on", "");
  await srv.close();
});

test("home: four gardens, the sun turned and seen in December; reviews on the studio's page, questions on Start", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator("#gardens .gd-gc")).toHaveCount(4);
  await expect(page.locator("#gardens a.go")).toHaveText("Every garden");
  await expect(page.locator("#reviews, #questions, #visit, .ba")).toHaveCount(0);
  const day = page.locator("#sun [data-ss-day]");
  await expect(day).toHaveText(/^On 21 June /);
  const june = await day.textContent();
  await page.click('#sun [data-ss-facing="N"]');
  await expect(day).not.toHaveText(june ?? "");
  await page.click('#sun [data-ss-month="12"]');
  await expect(day).toHaveText(/^On 21 December /);
  await page.goto(srv.base + "/team.html");
  await expect(page.locator("#reviews")).toHaveCount(1);
  expect(errors).toEqual([]);
  await srv.close();
});

test("where the sun falls: the answer follows the facing and month, in plan and 3D; a tapped spot gets its plants", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/where-the-sun-falls.html");
  await expect(page.locator("[data-ss-day]")).toContainText("On 21 October");
  await expect(page.locator("[data-ss-form]")).toBeVisible();
  await page.check('input[name=ss-facing][value="S"]', { force: true });
  await page.check('input[name=ss-month][value="12"]', { force: true });
  await expect(page.locator("[data-ss-day]")).toHaveText(/^On 21 December the part by the house gets about [\d.]+ hours? of sun, the far end (no direct sun|about half an hour)\./);
  await expect(page.locator(".gd-ss-svg .gd-ss-cells polygon")).toHaveCount(8 * 18);
  await page.click('[data-ss-view="3d"]');
  await expect(page.locator(".gd-ss-svg .gd-ss-fence3")).toHaveCount(3);
  await page.click('[data-ss-view="plan"]');
  const box = await page.locator(".gd-ss-svg .gd-ss-cells").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.15);
  await expect(page.locator("[data-ss-spot-words]")).toHaveText(/^This spot gets about [\d.]+ hours of sun on 21 June and .* on 21 December: (full sun|part shade|shade)\.$/);
  await expect(page.locator("[data-ss-plants] li").first()).toBeVisible();
  expect(await waText(page.locator("[data-ss-send]"))).toContain("My garden faces south and is about 8 × 18 m.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the planning guide says England only, the day it was checked, and its sources", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/permission.html");
  await expect(page.locator(".gd-pg-when")).toHaveText("England only. Checked 5 November 2026 against GOV.UK. A guide, not a decision.");
  await expect(page.locator(".gd-pg-src a")).toHaveCount(2);
  await srv.close();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the year shows the build month, home's gardens and sun drawing show, and the sun study draws the example garden", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator('[data-month][aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator("#gardens .gd-gc:visible")).toHaveCount(4);
    expect(await page.locator("#sun .gd-ss-cells polygon").count()).toBeGreaterThan(50);
    await page.goto(srv.base + "/where-the-sun-falls.html");
    await expect(page.locator("[data-ss-day]")).toHaveText(/^On 21 June /);
    expect(await page.locator(".gd-ss-svg .gd-ss-cells polygon").count()).toBeGreaterThan(50);
    await expect(page.locator("[data-ss-form]")).toBeHidden();
    await srv.close();
  });
});

test("a client site: the year, before/after and the sun study work, with no demo bar", async ({ page }) => {
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-month]")).toHaveCount(12);
  await expect(page.getByText("Fictional business.")).toHaveCount(0);
  await expect(page.locator("#before-after [data-ba-ready]")).toHaveCount(1);
  await page.goto(srv.base + "/where-the-sun-falls.html");
  await expect(page.locator("[data-ss-day]")).toContainText("On 21 October");
  expect(errors).toEqual([]);
  await srv.close();
});
