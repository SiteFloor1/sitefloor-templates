// Bridal hair and makeup kit and the Cover look, as a client uses them: the cover's date, price and start time (the
// artist's diary simulated on the demo, the client's sheet failing closed), the name above or behind her head, the
// party quote and the morning moving together, travel by postcode, the trial window, the skin countdown, the looks'
// filters, and the pages without JavaScript.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/bridalbeauty");
const client = site("_fixtures/test-bridalbeauty-client");
const NOW = new Date("2026-11-09T10:00:00Z");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const pickDate = async (page, prefix, d, m, y) => {
  await page.selectOption(`#${prefix}-y`, String(y));
  await page.selectOption(`#${prefix}-m`, String(m));
  await page.selectOption(`#${prefix}-d`, String(d));
};
const coverDate = (page, ymd) => page.locator("[data-cv-date]").evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); }, ymd);

test("the home page keeps to the cover, this season, the packages and everyone in the chair", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids).toEqual(["cover", "season", "packages", "party"]);
  await expect(page.locator("h1")).toHaveText("Isolde");
  await expect(page.locator("#cover")).toHaveClass(/cv-behind/);
  await expect(page.locator(".cv-cut")).toHaveAttribute("aria-hidden", "true");
  await srv.close();
});

test("the cover answers her date, her price and her start time, and the party moves the start", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-cv-word]")).not.toBeEmpty(); // the next open Saturday
  await expect(page.locator("[data-cv-start]")).toHaveText("7:25am");
  await page.selectOption("[data-cv-svc]", "makeup");
  await expect(page.locator("[data-cv-price]")).toHaveText("£390");
  await page.selectOption("[data-cv-svc]", "hair-makeup");
  await page.selectOption("[data-cv-cer]", "12:00");
  await expect(page.locator("[data-cv-start]")).toHaveText("6:35am");
  await expect(page.locator("[data-cv-people]")).toHaveText("four of you, two artists");
  await page.selectOption("[data-cv-cer]", "14:00");
  await page.locator('#party [data-step="maid"] button[data-d="1"]').click();
  await expect(page.locator("[data-cv-start]")).toHaveText("6:15am");
  await expect(page.locator("[data-cv-early]")).toBeVisible();
  await expect(page.locator("[data-pt-total]")).toHaveText("£940");
  const quote = await waText(page.locator("[data-pt-ask]"));
  expect(quote).toContain("me (hair and makeup), 3 bridesmaids, 1 mother.");
  expect(quote).toContain("a 6:15am start");
  for (let i = 0; i < 4; i++) await page.locator('#party [data-step="maid"] button[data-d="1"]').click();
  await page.selectOption("[data-cv-cer]", "11:00");
  await expect(page.locator("[data-cv-an]")).toHaveText("an");
  await expect(page.locator("[data-cv-start]")).toHaveText("This one needs planning — message me.");
  await expect(page.locator("[data-pt-start]")).toHaveText("This one needs planning — message me.");
  await expect(page.locator("[data-cv-startlab]")).toBeHidden();
  expect(errors).toEqual([]);
  await srv.close();
});

test("a taken or held day says so, and never says booked", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const year = new Date().getUTCFullYear() + 1;
  await coverDate(page, `${year}-07-03`);
  const word = page.locator("[data-cv-word]");
  await expect(word).toHaveText(/^(Open|Taken|On hold)\.$/);
  await expect(page.locator("[data-cv-words]")).not.toContainText(/booked/i);
  const ask = await waText(page.locator("[data-cv-ask]"));
  expect(ask).toMatch(/^Hello Isolde, is .+ 2[0-9]{3} free for hair and makeup\?$/);
  await srv.close();
});

test("the morning page works back from the ceremony and gives everyone their time", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/morning");
  await expect(page.locator("[data-mo-start]")).toHaveText("7:25am");
  await expect(page.locator("[data-mo-rows] li")).toHaveCount(4);
  await expect(page.locator("[data-mo-rows] li.is-bride span")).toHaveText("10:55am");
  await expect(page.locator("[data-mo-leave]")).toHaveText("1:40pm");
  await expect(page.locator("[data-mo-ics]")).toBeHidden();
  // The times sit in their own column, clear of the names, on a laptop and on a phone; one person each.
  await expect(page.locator("[data-mo-rows] li b").first()).toHaveText("Bridesmaid 1");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    for (const li of await page.locator("[data-mo-rows] li").all()) {
      const [t, n] = await li.evaluate((el) => { const r = document.createRange(); r.selectNodeContents(el.children[0]); return [r.getBoundingClientRect().right, el.children[1].getBoundingClientRect().left]; });
      expect(n - t, `gap at ${width} px`).toBeGreaterThan(14);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `sideways scroll at ${width} px`).toBeLessThanOrEqual(0);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const y = new Date().getUTCFullYear() + 1;
  await pickDate(page, "mo", 14, 8, y);
  await expect(page.locator("[data-mo-ics]")).toBeVisible();
  await expect(page.locator("[data-mo-group]")).toBeVisible();
  const group = (await page.locator("[data-mo-group]").getAttribute("data-share-text")) ?? "";
  expect(group).toContain("You 10:55am. Dresses on at 1:10pm, out of the door at 1:40pm, ceremony 2pm.");
  await srv.close();
  expect(errors).toEqual([]);
});

test("travel goes by postcode; the trial window and the skin dates come from her wedding", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/bridal");
  await page.fill("[data-tv-pc]", "sw4 0ab");
  await expect(page.locator("[data-tv-out]")).toHaveAttribute("data-state", "free");
  await page.fill("[data-tv-pc]", "GU1 1AA");
  await expect(page.locator("[data-tv-out]")).toContainText("£60");
  await page.fill("[data-tv-pc]", "S1 2HE");
  await expect(page.locator("[data-tv-out]")).toHaveAttribute("data-state", "ask");
  const y = new Date().getUTCFullYear() + 1;
  await page.goto(srv.base + "/trials");
  await pickDate(page, "tr", 14, 8, y);
  await expect(page.locator("[data-tr-out]")).toContainText(`17 July ${y}`);
  await page.goto(srv.base + "/skin");
  await pickDate(page, "sk", 14, 8, y);
  await expect(page.locator('[data-step="morning"] [data-sk-date]')).toContainText(`14 August ${y}`);
  await expect(page.locator("[data-sk-ics]")).toBeVisible();
  await expect(page.locator(".bb-sk-note")).toContainText("clinician");
  await srv.close();
});

test("the looks filter by finish and hair, and each asks for that look by name", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/looks");
  const shown = page.locator(".bb-lk-grid > li:not([hidden])");
  await expect(shown).toHaveCount(9);
  await page.locator('.bb-lk-filters button', { hasText: /^Natural/ }).click();
  await expect(shown).toHaveCount(2);
  expect(await waText(shown.first().locator("a"))).toMatch(/"(Bare skin, under lace|Clean skin, low knot)"/);
  await srv.close();
});

test("a client puts the name above her head, reads its own sheet, fails closed, and ships no demo code", async ({ page }) => {
  const srv = await start(client);
  await page.clock.setFixedTime(NOW);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "date,status,updated_at\n2027-06-12,taken,2026-11-02 09:00\n2027-06-19,held,\n" }));
  await page.goto(srv.base + "/");
  await expect(page.locator("#cover")).toHaveClass(/cv-above/);
  await expect(page.locator(".cv-cut")).toHaveCount(0);
  await coverDate(page, "2027-06-12");
  await expect(page.locator("[data-cv-word]")).toHaveText("Taken.");
  await coverDate(page, "2027-06-19");
  await expect(page.locator("[data-cv-word]")).toHaveText("On hold.");
  await coverDate(page, "2027-06-26");
  await expect(page.locator("[data-cv-word]")).toHaveText("Open.");
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.reload();
  await coverDate(page, "2027-06-12");
  await expect(page.locator("[data-cv-word]")).toHaveText("Ask me.");
  await expect(page.locator("#party")).toHaveCount(0); // Signature only
  const assets = path.join(client.outDir, "assets");
  const js = readdirSync(assets).filter((f) => f.endsWith(".js")).map((f) => readFileSync(path.join(assets, f), "utf8")).join("\n");
  expect(js).not.toMatch(/simulated|DEMO ONLY/);
  expect(readFileSync(path.join(client.outDir, "_headers"), "utf8")).toMatch(/connect-src [^;]*https:\/\/docs\.google\.com/);
  await srv.close();
});

test("guide pages price their examples from the packages; the journal opens each piece; the menu lists them all", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/bridal-party");
  await expect(page.locator("h1")).toHaveText("Everyone in the chair");
  await expect(page.locator(".bb-ph .kick, .bb-ph-k")).toHaveCount(0);
  await expect(page.locator(".bb-gd-tot b")).toHaveText("£1,240");
  await page.goto(srv.base + "/visit");
  await expect(page.locator(".pv-hero .kick")).toBeHidden();
  await expect(page.locator(".pv-hero .crumb")).toBeHidden();
  expect(await page.$$eval("main *", (all) => all.filter((e) => e.checkVisibility() && getComputedStyle(e).textTransform === "uppercase" && e.textContent.trim()).map((e) => e.textContent.trim()))).toEqual([]);
  await page.goto(srv.base + "/abroad");
  await expect(page.locator(".bb-gd-sum li").first()).toContainText("Hair and makeup£520");
  await expect(page.locator(".bb-gd-tot b")).toHaveText("£1,210");
  await page.goto(srv.base + "/asian-bridal");
  await expect(page.locator(".bb-gd-lk > li")).toHaveCount(3);
  await page.goto(srv.base + "/journal");
  await expect(page.locator(".bb-jn-list > li")).toHaveCount(3);
  await page.locator(".bb-jn-list a").first().click();
  await expect(page).toHaveURL(/journal-skin-before-the-day/);
  await expect(page.locator(".bb-gd-text").last()).toContainText("clinician");
  await page.click(".burger");
  for (const name of ["The bridal party", "Asian bridal", "Small weddings", "Weddings abroad", "Editorial and events", "About", "Journal"])
    await expect(page.locator("#mnav a", { hasText: name })).toHaveCount(1);
  await srv.close();
});

test("without JavaScript the cover, the prices, the morning's first plan and every skin step still show", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".cv-ph").first()).toBeVisible();
  await expect(page.locator("[data-cv-start]")).toHaveText("7:25am");
  await expect(page.locator("[data-pt-total]")).toHaveText("£805");
  await page.goto(srv.base + "/morning");
  await expect(page.locator("[data-mo-start]")).toHaveText("7:25am");
  await page.goto(srv.base + "/skin");
  await expect(page.locator(".bb-sk-list li")).toHaveCount(7);
  await page.goto(srv.base + "/looks");
  await expect(page.locator(".bb-lk-grid > li")).toHaveCount(9);
  await srv.close();
  await ctx.close();
});
