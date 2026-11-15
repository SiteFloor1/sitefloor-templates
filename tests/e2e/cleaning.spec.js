// Cleaning kit and the Plumb look, as a customer uses them: the first screen says what the company is and shows the
// strip; the strip, the bill and the message always show the same minutes and price; the postcode check and its free
// days (failing closed on a client's stale sheet); the move-out planner; offices out of hours; the optional 3D.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/cleaning");
const client = site("_fixtures/test-cleaning-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`);

test("at 1440×900 the first screen shows the word cleaning, the photograph and the room strip", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(srv.base + "/");
  await expect(page.locator("h1")).toContainText("Home cleaning in south-west London.");
  await expect(page.locator("h1")).toContainText("Every room timed, every visit the same.");
  for (const sel of [".pl-band img", ".cl-st-say", ".cl-rooms"]) {
    const box = await page.locator(sel).boundingBox();
    expect(box && box.y + box.height, sel).toBeLessThanOrEqual(900);
  }
  await expect(page.locator(".cl-st-say")).toHaveText("A two-bedroom home with two bathrooms, fortnightly: 2 h 25, £60. Change it to yours.");
  await srv.close();
});

test("the strip, its ruler, the bill and the message agree, whatever is chosen", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const check = async () => {
    const mins = await page.locator(".cl-room").evaluateAll((els) => els.map((e) => Number(e.style.getPropertyValue("--m"))));
    const total = mins.reduce((a, b) => a + b, 0);
    const fig = (await page.locator("[data-st-fig]").textContent()) ?? "";
    const price = (await page.locator("[data-bill-price]").textContent()) ?? "";
    expect(fig).toBe(`${fmt(total)}, ${price}`);
    await expect(page.locator(".cl-r-end")).toHaveText(fmt(total));
    await expect(page.locator("#bill .cl-sum td")).toHaveText(fmt(total));
    expect(await waText(page.locator("[data-bill-send]"))).toContain(fig);
    return { total, price };
  };
  expect(await check()).toEqual({ total: 145, price: "£60" });
  await page.locator(".cl-st-ctl label", { hasText: "3" }).first().click();
  await page.locator(".cl-st-ctl label", { hasText: "Weekly" }).click();
  expect(await check()).toEqual({ total: 160, price: "£64" });
  await page.locator("#bill .cl-extras label", { hasText: "Inside the oven" }).click();
  expect(await check()).toEqual({ total: 220, price: "£88" });
  await expect(page.locator(".cl-room.cl-extra")).toHaveCount(1);
  await expect(page.locator(".cl-st-say")).toContainText("Your three-bedroom home");
  await page.locator(".cl-room", { hasText: "Bathroom" }).first().click();
  await expect(page.locator("[data-st-detail] h2")).toContainText("Bathroom");
  await expect(page.locator("[data-st-detail]")).toContainText("Toilet inside and out");
  expect(errors).toEqual([]);
  await srv.close();
});

test("on a phone the strip runs downward, each room as tall as its minutes, and Get a price stays in reach", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  const kitchen = await page.locator(".cl-room[data-id=kitchen]").boundingBox();
  const hall = await page.locator(".cl-room[data-id=hall]").boundingBox();
  expect(kitchen.height).toBeGreaterThan(hall.height * 1.8);
  expect(hall.y).toBeGreaterThan(kitchen.y);
  const photo = await page.locator(".pl-band img").boundingBox();
  const h1 = await page.locator("h1").boundingBox();
  expect(photo.y).toBeLessThan(h1.y);
  const go = page.locator(".pl-bar .pl-bar-go");
  await page.mouse.wheel(0, 2500);
  await expect(go).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await srv.close();
});

test("the postcode check answers yes with a free day, or not yet", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.fill("[data-areas-in]", "sw4 7aa");
  await page.locator("[data-areas-form] button").click();
  await expect(page.locator("[data-areas-out]")).toHaveText(/^Yes, we clean in SW4\. (Next free: \w+day \d{1,2} \w+\.|Ask us for the next free day\.)$/);
  await page.fill("[data-areas-in]", "E1 6AN");
  await page.locator("[data-areas-form] button").click();
  await expect(page.locator("[data-areas-out]")).toHaveText("We don't clean in E1 yet.");
  await srv.close();
});

test("a client's out-of-date sheet never gives a date", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ body: "district,date,updated_at\nBS1,2099-01-05,2020-01-01\n", contentType: "text/csv" }));
  await page.goto(srv.base + "/");
  await page.fill("[data-areas-in]", "BS1 4XE");
  await page.locator("[data-areas-form] button").click();
  await expect(page.locator("[data-areas-out]")).toHaveText("Yes, we clean in BS1. Ask us for the next free day.");
  await expect(page.locator("#reviews")).toBeVisible();
  await srv.close();
});

test("the move-out planner gives the clean and the book-by day, and the message carries them", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/end-of-tenancy");
  const day = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 40); return d.toISOString().slice(0, 10); });
  await page.fill("[data-mo-date]", day);
  await page.locator("[data-mo-date]").dispatchEvent("change");
  await expect(page.locator("[data-mo-out]")).toBeVisible();
  await expect(page.locator("[data-mo-note]")).toHaveText(/\d+ days to book\./);
  expect(await waText(page.locator("[data-mo-send]"))).toMatch(/Check-out: .*\nClean: /);
  await page.locator(".cl-ten-room label").first().click();
  await expect(page.locator("[data-ten-count]")).toHaveText(/^1 of \d+ done$/);
  await expect(page.locator(".cl-ten-side")).toContainText("tenancy deposit protection");
  await srv.close();
});

test("offices: your hours, our window and the survey message, from the same minutes", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/offices");
  await expect(page.locator("[data-off-say]")).toHaveText("You open at 08:00. We're in from 05:37 and gone by 07:45.");
  await expect(page.locator("[data-off-total]")).toHaveText("2 h 08");
  await page.locator("[data-off-open]").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-off-say]")).toHaveText("You open at 08:30. We're in from 06:07 and gone by 08:15.");
  await page.locator(".cl-day .cl-seg label", { hasText: "Evenings" }).click();
  await expect(page.locator("[data-off-say]")).toHaveText("You close at 18:00. We arrive at 18:15 and lock up by 20:23.");
  expect(await waText(page.locator("[data-off-send]"))).toContain("About 2 h 08 a night.");
  await expect(page.locator(".cl-off")).not.toContainText("£");
  await srv.close();
});

test("the 3D loads only on tap and is labelled an illustration", async ({ page }) => {
  const srv = await start(demo);
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(srv.base + "/");
  expect(requests.some((u) => /model-3d/.test(u))).toBe(false);
  await expect(page.locator(".cl-3d-row")).toContainText("An illustration of a two-bedroom flat");
  await page.locator("[data-3d-open]").click();
  await expect(page.locator("[data-3d-stage]:visible, [data-3d-msg]:visible").first()).toBeVisible();
  if (await page.locator("[data-3d-stage]").isVisible()) await expect(page.locator(".cl-3d-tag")).toHaveText("Illustration, not your home");
  await srv.close();
});
