// Lingerie features (private evening, fit passport, the tray, drop a hint, wedding dates, fit finder, the drop,
// the demo's two modes), as a customer uses them; and each page showing every photograph once.
import { readFileSync } from "node:fs";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/lingerie");
const client = site("_fixtures/test-lingerie-client");
const data = JSON.parse(readFileSync("sites/demos/lingerie/site.json", "utf8"));
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the private evening lists free evenings only, and the chosen one goes into the message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const list = page.locator("[data-eve-list] button");
  const free = data.evenings.sample.filter((e) => e.status === "free").length;
  await expect(list).toHaveCount(free);
  await expect(page.locator("[data-eve-list]")).not.toContainText("5 November"); // held
  await list.first().click();
  await page.locator("[data-eve-name]").fill("Clara");
  const text = await waText(page.locator("[data-eve-send]"));
  expect(text).toContain("6 November");
  expect(text).toContain("Clara");
  await srv.close();
});

test("a fit passport opens from its code, refuses a wrong one, and never names her", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/passport");
  await page.locator("[data-pass-code]").fill("AAAA");
  await page.locator("[data-pass-form] button[type=submit], [data-pass-form] button").first().click();
  await expect(page.locator("[data-pass-msg]")).toContainText("eight letters");
  await page.goto(srv.base + "/passport#" + data.passport.exampleCode.toLowerCase());
  await expect(page.locator("[data-pass-card]")).toBeVisible();
  await expect(page.locator("[data-pass-rows]")).toContainText("32DD");
  expect(await waText(page.locator("[data-pass-send]"))).toContain(data.passport.exampleCode);
  await srv.close();
});

test("pieces put on the tray travel to the fitting request on another page", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const first = page.locator(".ls-new [data-tray-add]").first();
  const name = await page.locator(".ls-new [data-piece]").first().getAttribute("data-name");
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-tray-count]")).toHaveText("1");
  await page.goto(srv.base + "/fitting");
  await expect(page.locator("[data-fit-tray-list]")).toContainText(name);
  expect(await waText(page.locator("[data-fit-send]"))).toContain(name);
  await srv.close();
});

test("drop a hint opens a sheet with the piece and sends to anyone, not the shop", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const card = page.locator(".ls-new [data-piece]").first();
  const name = await card.getAttribute("data-name");
  await card.locator("[data-hint]").click();
  await expect(page.locator("dialog.hint-sheet")).toBeVisible();
  await expect(page.locator("[data-hint-piece]")).toHaveText(name);
  await page.locator("[data-hint-size]").fill("32D");
  const href = await page.locator("[data-hint-send]").getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const text = new URL(href).searchParams.get("text");
  expect(text).toContain(name);
  expect(text).toContain("32D");
  await srv.close();
});

test("wedding dates work back from her day, and a late start says so", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/bridal");
  await page.locator("[data-dates-day]").fill("2027-06-12");
  await expect(page.locator("[data-dates-list] li")).toHaveCount(data.bridalTimeline.steps.length);
  await expect(page.locator("[data-dates-list]")).toContainText("20 February 2027"); // 16 weeks before
  await expect(page.locator("[data-dates-late]")).toBeHidden();
  expect(await waText(page.locator("[data-dates-send]"))).toContain("12 June 2027");
  await page.locator("[data-dates-day]").fill("2026-12-05");
  await expect(page.locator("[data-dates-late]")).toBeVisible();
  await srv.close();
});

test("the fit finder answers each problem with the question to ask", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/fitting");
  const p = data.fitFinder.problems[1];
  await page.locator(`[data-ff="${p.id}"]`).click();
  await expect(page.locator(".ls-ff, [data-feature=fit-finder]").first()).toContainText(p.means);
  await srv.close();
});

test("the drop counts down to the shop's own time, then goes live", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.locator('label[for="mr-online"]').click();
  await expect(page.locator("[data-drop-clock]")).toBeVisible();
  await expect(page.locator("[data-drop-when]")).toContainText("20 November");
  await page.clock.setFixedTime(new Date("2026-11-20T19:00:30Z")); // 7pm GMT
  await page.reload();
  await page.locator('label[for="mr-online"]').click();
  await expect(page.locator("[data-drop-clock]")).toBeHidden();
  await expect(page.locator("[data-drop-when]")).toHaveText("Live now");
  await srv.close();
});

test("the demo switches between boutique and online brand without a reload", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator('[data-shop="boutique"]').first()).toBeVisible();
  await page.locator('label[for="mr-online"]').click();
  await expect(page.locator('[data-shop="boutique"]').first()).toBeHidden();
  await expect(page.locator('[data-shop="online"]').first()).toBeVisible();
  await srv.close();
});

test("the online-brand client builds without the demo switch or sample data", async ({ page }) => {
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator("#mr-online")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Sample review");
  expect(errors).toEqual([]);
  await srv.close();
});

test("every page shows each photograph once", async ({ page }) => {
  const srv = await start(demo);
  for (const p of ["index", ...demo.pages.filter((x) => x !== "index"), ...(demo.unlisted ?? [])]) {
    await page.goto(srv.base + (p === "index" ? "/" : `/${p}`));
    const seen = await page.$$eval("img", (imgs) => imgs.filter((i) => i.checkVisibility()).map((i) => i.getAttribute("src")));
    const twice = seen.filter((s, i) => seen.indexOf(s) !== i);
    expect(twice, `${p} repeats a photograph`).toEqual([]);
  }
  await srv.close();
});

test("Valentine's takes over the home page on its dates and counts down to order-by", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(new Date("2027-02-08T10:00:00Z"));
  await page.goto(srv.base + "/");
  const to = page.locator('.to[data-to="valentines"]');
  await expect(to).toBeVisible();
  await expect(page.locator(".mr-hero")).toBeHidden();
  await expect(to.locator("[data-to-when]")).toContainText("3 days left to order for delivery: by Thursday 11 February, 4pm.");
  await page.clock.setFixedTime(new Date("2027-02-12T10:00:00Z"));
  await page.reload();
  await expect(to.locator("[data-to-when]")).toContainText("Delivery has closed. Collect in Mayfair until Sunday 14 February, 5pm.");
  await page.clock.setFixedTime(new Date("2027-02-15T10:00:00Z"));
  await page.reload();
  await expect(to).toBeHidden();
  await expect(page.locator(".mr-hero")).toBeVisible();
  await srv.close();
});

test("a hint from the takeover's edit carries that piece", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(new Date("2026-12-01T10:00:00Z"));
  await page.goto(srv.base + "/");
  const item = page.locator('.to[data-to="christmas"] li[data-piece]').first();
  const name = await item.getAttribute("data-name");
  await item.locator("[data-hint]").click();
  await expect(page.locator("[data-hint-piece]")).toHaveText(name);
  await srv.close();
});

test("the bridal party evening sends the evening, the party and their names", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/bridal");
  await page.locator("[data-party-list] button").first().click();
  await page.locator("[data-party-size]").selectOption("6");
  await page.locator("[data-party-wedding]").fill("2027-06-12");
  await page.locator("[data-party-names]").fill("Ana\nBea");
  const text = await waText(page.locator("[data-party-send]"));
  expect(text).toContain("bridal party evening on Friday 6 November");
  expect(text).toContain("6 of us");
  expect(text).toContain("Saturday 12 June 2027");
  expect(text).toContain("With: Ana, Bea.");
  await srv.close();
});
