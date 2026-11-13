// Nails kit and the Quail look, as a client uses them: the shade on the hand (photographed shades on every plan, any
// shade from the masks on Signature, on hands in three skin tones), the card and every Book following the shade, the
// next free time, build your set, the bridal dates, the infill reminder, "your usual", the client's sheet failing
// closed, and the pages without JavaScript.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/nail-salon");
const client = site("_fixtures/test-nails-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const pickDate = async (page, prefix, d, m, y) => {
  await page.selectOption(`#${prefix}-y`, String(y));
  await page.selectOption(`#${prefix}-m`, String(m));
  await page.selectOption(`#${prefix}-d`, String(d));
};

test("the home page keeps to the hand, the edit, the menu, the salon and the visit", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids[0]).toBe("hero ql-hero");
  expect(ids.filter((x) => x !== "edit").slice(1)).toEqual(["menu", "salon", "visit"]);
  for (const moved of ["#build", "#infill", "#parties", "#bridal-dates", "#finishes", "#gel-or-biab"]) await expect(page.locator(moved)).toHaveCount(0);
  await srv.close();
});

test.describe("the shade on the hand", () => {
  test("a photographed shade fades in; the card and every Book follow it", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-sh-name]")).toHaveText("Petal");
    await page.click('[data-sh-pick="scarlet"]');
    await expect(page.locator("[data-sh-name]")).toHaveText("Scarlet");
    await expect(page.locator("[data-sh-no]")).toHaveText("No. 41");
    await expect(page.locator("[data-sh-layer].on")).toHaveAttribute("src", /hand-light-scarlet\.webp$/);
    for (const sel of [".ql-nav a[data-sh-book]", ".ql-under a[data-sh-book]", ".mbar a[data-sh-book]"]) {
      expect(await waText(page.locator(sel))).toBe("Hello Verrall, I'd like to book in Scarlet (No. 41).");
    }
    await expect(page.locator(".ql-under a[data-sh-book]")).toHaveClass(/is-dark/);
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("Signature lays any shade into the nails, on every hand", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    await page.click('[data-sh-pick="lilac"]');
    await expect(page.locator("[data-sh-canvas]")).toHaveClass(/on/);
    await page.click('[data-sh-hand="deep"]');
    await expect(page.locator("[data-sh-canvas]")).toHaveAttribute("aria-label", /Two hands .* shown in Lilac/);
    // Back to the shade the deep hand was photographed in: the photo itself, no recolour.
    await page.click('[data-sh-pick="petal"]');
    await page.click('[data-sh-hand="light"]');
    await expect(page.locator("[data-sh-layer].on")).toHaveAttribute("src", /hand-light\.webp$/);
    await expect(page.locator("[data-sh-canvas]")).not.toHaveClass(/on/);
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("on the Plus plan the masks and the extra shades step back", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.click('[data-sh-pick="sage"]');
    await page.click('[data-demo-ribbon] [data-tier-pick="plus"]');
    await expect(page.locator("[data-sh-hands]")).toHaveClass(/tier-off/);
    await expect(page.locator("[data-sh-pick]:not(.tier-off)")).toHaveCount(5);
    await expect(page.locator("[data-sh-canvas]")).not.toHaveClass(/on/);
    await expect(page.locator("[data-sh-name]")).toHaveText("Petal");
    await srv.close();
  });
});

test("the next free time is worded and fails safe", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/"); // Monday 10:30; the salon is closed on Mondays and opens at 10:00 on Tuesday
  await expect(page.locator("[data-ns-when]")).toHaveText("Tomorrow, 11:00");
  await expect(page.locator("[data-ns-off]")).toBeHidden();
  await srv.close();

  const c = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(c.base + "/");
  await expect(page.locator("[data-ns-off]")).toHaveText("Message us for a time");
  await expect(page.locator("[data-ns-on]")).toBeHidden();
  await c.close();
});

test("build your set adds up the salon's figures and sends every choice", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/menu");
  for (const [name, value] of [["bs-system", "biab"], ["bs-length", "long"], ["bs-finish", "chrome"], ["bs-art", "two"]]) await page.check(`input[name=${name}][value=${value}]`, { force: true });
  await page.selectOption("[data-bs-shade]", "petal");
  await expect(page.locator("[data-bs-total]")).toHaveText("2 hours · £96");
  expect(await waText(page.locator("[data-bs-send]"))).toBe("Hello Verrall, I'd like to book: BIAB, almond, long, Chrome, Petal (No. 14), Level two. About 2 hours, £96 on your menu.");
  await srv.close();
});

test("the bridal dates come from one wedding date, in UK order, with a calendar file", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/bridal");
  await pickDate(page, "bt", 12, 6, 2027);
  await expect(page.locator('[data-step="trial"] [data-bt-date]')).toHaveText("Saturday 1 May 2027");
  await expect(page.locator('[data-step="final"] [data-bt-date]')).toHaveText("Thursday 10 June 2027");
  await expect(page.locator("[data-bt-ics]")).toBeVisible();
  expect(await waText(page.locator("[data-bt-ask]"))).toContain("my wedding is on Saturday 12 June 2027");
  // The party form shares the wedding date.
  await expect(page.locator("#pa-d")).toHaveValue("12");
  await srv.close();
});

test("the infill reminder words the day and offers it to the calendar", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/menu");
  await pickDate(page, "in", 20, 10, 2026);
  await page.check("input[name=in-weeks][value='4']", { force: true });
  await expect(page.locator("[data-in-out]")).toHaveText("Your infill: Tuesday 17 November 2026.");
  const href = await page.locator("[data-in-ics]").getAttribute("href");
  expect(href).toMatch(/^blob:/);
  await srv.close();
});

test("your usual is remembered on this phone only, and can be forgotten", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/shades");
  await page.evaluate(() => {
    document.addEventListener("click", (e) => e.preventDefault(), true); // stay on the page
    document.querySelector('a[data-usual^="Claret"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await page.goto(srv.base + "/");
  await expect(page.locator("#usual")).toBeVisible();
  await expect(page.locator("[data-yu-what]")).toHaveText("Claret (No. 45)");
  expect(await waText(page.locator("[data-yu-book]"))).toBe("Hello Verrall, I'd like my usual again: Claret (No. 45).");
  await page.click("[data-yu-forget]");
  await expect(page.locator("#usual")).toBeHidden();
  await srv.close();
});

test("a Plus client fades between its own photos, reads its own sheet, and ships no demo code", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-sh-hands]")).toHaveCount(0);
  await expect(page.locator("[data-sh-pick]")).toHaveCount(3);
  await page.click('[data-sh-pick="red"]');
  await expect(page.locator("[data-sh-layer].on")).toHaveAttribute("src", /hand-red\.webp$/);
  const assets = path.join(client.outDir, "assets");
  const js = readdirSync(assets).filter((f) => f.endsWith(".js")).map((f) => readFileSync(path.join(assets, f), "utf8")).join("\n");
  expect(js).not.toMatch(/simulated|DEMO ONLY/);
  expect(readFileSync(path.join(client.outDir, "_headers"), "utf8")).toMatch(/connect-src [^;]*https:\/\/docs\.google\.com/);
  await srv.close();
});

test("without JavaScript every shade and set shows and the hand stays as photographed", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/shades");
  await expect(page.locator(".nl-lib-s")).toHaveCount(JSON.parse(readFileSync("sites/demos/nail-salon/site.json", "utf8")).shades.items.length);
  await expect(page.locator("[data-sl-filter]")).toBeHidden();
  await page.goto(srv.base + "/art");
  await expect(page.locator(".nl-art-i:visible")).toHaveCount(4);
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-sh-layer].on")).toHaveAttribute("src", /hand-light\.webp$/);
  await expect(page.locator("[data-ns-off]")).toBeVisible();
  await srv.close();
  await ctx.close();
});
