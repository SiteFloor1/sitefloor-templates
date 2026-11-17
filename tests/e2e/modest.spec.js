// Modest kit and the Taroub look, as a customer uses them: the hem line opening on 2″ heels like its photograph, her
// length reaching the look bar, the chart only when asked, the Eid last order dates counted on the day, the length
// guide, a private appointment request, the look's total and its Stripe link, the family list kept in the link, and
// a client's site with the fabric library.
import { test, expect, site, start, featuresStarted } from "./helpers.js";

const demo = site("demos/taroub");
const client = site("_fixtures/test-modest-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the hem line opens on 2″ heels, answers as she changes it, and sets the look bar's length", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await expect(page.locator("h1")).toHaveText("The Layl");
  const hem = page.locator("#hem");
  await expect(hem.locator("[data-hem-shoe]")).toHaveText("2″ heels");
  await expect(hem.locator("[data-hem-out]")).toHaveText("Wear the 58. It stops 1″ above the floor in 2″ heels.");
  await expect(hem.locator(".md-ruler .ln.on")).toHaveText("58");
  await expect(hem.locator(".md-chart")).toBeHidden();
  await hem.getByRole("button", { name: "Half an inch less" }).click();
  await hem.getByRole("button", { name: "Half an inch less" }).click();
  await expect(hem.locator("[data-hem-out]")).toHaveText("Wear the 56. It stops 2″ above the floor in 2″ heels.");
  await expect(page.locator(".mbar [data-look-length]")).toHaveText("56");
  await hem.locator("[data-hem-shoe]").click();
  await expect(hem.locator("[data-hem-out]")).toHaveText("Wear the 58. It stops 1″ above the floor in 3″ heels.");
  await hem.getByRole("button", { name: "Only know your height?" }).click();
  await expect(hem.locator(".md-chart")).toBeVisible();
  await expect(hem.locator("tr.is-lit td").last()).toHaveText("58");
  await srv.close();
});

test("Eid last order dates count back from the expected window, worked out on the day", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const eid = page.locator("#eid");
  await expect(eid.locator("[data-eid-when]")).toHaveText("Eid al-Fitr is expected between 8 March 2027 and 12 March 2027, when the moon is sighted.");
  const rows = eid.locator("[data-eid-rows] tr");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("UK delivery");
  await expect(rows.nth(1)).toContainText("Order by Wednesday 3 March 2027");
  await expect(rows.nth(1)).toContainText("in 135 days");
  await srv.close();
});

test("the length guide gives her length and the pieces that come in it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/length");
  await page.getByLabel("Shoulder to floor, in inches").fill("55");
  await page.getByLabel("In", { exact: true }).selectOption({ label: "flats" });
  await expect(page.locator("[data-len-out]")).toHaveText("Wear the 54. It stops 1″ above the floor.");
  await expect(page.locator("[data-len-pieces] li")).toHaveCount(4);
  await expect(page.locator("[data-len-pieces]")).toContainText("The Misk in the 54");
  await srv.close();
});

test("a private appointment is sent as a request with the day, time, how many and why", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/appointments");
  await expect(page.locator("[data-ap-days] label").first()).toHaveText("Tuesday 20 October");
  await page.getByLabel("Saturday 24 October").check();
  await page.getByLabel("13:00").check();
  await page.getByLabel("How many of you").selectOption("3");
  await page.getByLabel("What it's for").selectOption("Eid");
  expect(await waText(page.locator("[data-ap-send]"))).toBe("Hello Taroub, I'd like to request a private appointment on Saturday 24 October 2026 at 13:00, for 3 people. It's for: Eid.");
  await expect(page.locator(".md-ap-note")).toContainText("This is a request: we confirm by message.");
  await srv.close();
});

test("complete the look totals the set; the Stripe link shows only for the set as priced", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/the-look");
  const set = page.locator("form[data-set='layl-set']");
  await expect(set.locator("[data-set-total]")).toHaveText("£373");
  await expect(set.locator(".pl-btn")).toBeVisible();
  await set.getByLabel("Length of The Layl").selectOption("56");
  await set.getByLabel("Inner slip").check();
  await expect(set.locator("[data-set-total]")).toHaveText("£418");
  await expect(set.locator(".pl-btn")).toBeHidden();
  await expect(set.locator("[data-set-paynote]")).toBeVisible();
  expect(await waText(set.locator("[data-set-send]"))).toBe("Hello Taroub, I'd like to order The Layl, complete: The Layl in the 56, Long jersey hijab, Inner slip. That's £418.");
  await expect(page.locator(".mbar [data-look-total]")).toHaveText("£418");
  await srv.close();
});

test("the family list lives in the link, totals, and goes to the shop as one order", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/eid#Mum~layl~56|Huda~misk~0");
  const rows = page.locator("[data-fam-rows] li");
  await expect(rows).toHaveCount(2);
  await expect(page.locator("[data-fam-total]")).toHaveText("£605");
  await page.getByRole("button", { name: "Add someone" }).click();
  await rows.nth(2).getByLabel("Name").fill("Sara");
  await rows.nth(2).getByLabel("Piece").selectOption("ghalia");
  await rows.nth(2).getByLabel("Length").selectOption("58");
  await expect(page.locator("[data-fam-total]")).toHaveText("£945");
  expect(new URL(page.url()).hash).toBe("#Mum~layl~56|Huda~misk~0|Sara~ghalia~58");
  expect(await waText(page.locator("[data-fam-send]"))).toBe("Hello Taroub, our family's Eid order:\nMum: The Layl, the 56\nHuda: The Misk, length to check\nSara: The Ghalia, the 58\nThat's £945 for 3 pieces.");
  await srv.close();
});

test("nothing jumps while pages start, with slow fonts and scripts; no page scrolls sideways on a small phone", async ({ browser }) => {
  const srv = await start(demo);
  for (const [path, width] of /** @type {[string, number][]} */ ([["/appointments", 390], ["/length", 390], ["/", 390], ["/eid", 1024], ["/story", 1024], ["/length", 1024]])) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.route("**/*.woff2", async (r) => { await new Promise((x) => setTimeout(x, 600)); await r.continue(); });
    await page.route("**/assets/site-*.js", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    await page.addInitScript(() => {
      const w = /** @type {any} */ (window); w.__cls = 0;
      new PerformanceObserver((l) => { for (const e of /** @type {any[]} */ (l.getEntries())) if (!e.hadRecentInput) w.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(srv.base + path);
    await featuresStarted(page);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => /** @type {any} */ (window).__cls), `${path} at ${width} px`).toBeLessThan(0.05);
    await page.close();
  }
  const small = await browser.newPage({ viewport: { width: 320, height: 640 } });
  for (const path of ["/privacy", "/", "/eid", "/the-look", "/appointments"]) {
    await small.goto(srv.base + path);
    expect(await small.evaluate(() => document.documentElement.scrollWidth), `${path} at 320 px`).toBeLessThanOrEqual(320);
  }
  await small.close();
  await srv.close();
});

test("a client's site: the fabric library, no demo payment links, and the look bar on desktop", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/fabrics");
  await expect(page.locator("h1")).toHaveText("The fabrics");
  await expect(page.locator(".md-fab-list li")).toHaveCount(1);
  await page.goto(srv.base + "/the-look");
  await expect(page.locator(".pl-btn")).toHaveCount(0);
  await expect(page.locator(".mbar .tr-bar-items")).toBeVisible();
  await srv.close();
});
