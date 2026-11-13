// Wealth kit and the Foreshore look, as a client uses them: the first screen (headline, plain line, the quiet "I am …"
// row and the FCA line), insights published from the firm's own sheet only once compliance has approved them, the
// meeting request that refuses account numbers, the family map that stays on the device, the offices' clocks, the
// timeline labelled an illustration, and the phone bar never covering text.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";

test.use({ reducedMotion: "reduce" });

const demo = site("demos/wealth");
const client = site("_fixtures/test-wealth-client");
const NOV = new Date("2026-11-04T10:15:00Z"); // a Wednesday, the office open, every demo insight published

const SHEET = [
  "Title,Category,Date,Summary,Body,Author,Photo,Approved,Approved by,Approved on",
  'Approved note,Families,2026-10-01,A note.,"One.\n\nTwo.",Ann,note,TRUE,R. Hale,2026-09-30',
  "Draft note,Families,2026-10-02,A draft.,Body.,Ann,note,,,",
  "Our funds outperform,Markets,2026-10-03,A promise.,Body.,Ann,note,TRUE,R. Hale,2026-10-02",
].join("\n");

test("the first screen: a short light headline, what the firm does, the quiet chooser and the FCA line", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.clock.setFixedTime(NOV);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero fs-hero", "services", "insights", "office"]); // advisers live on the people page on Signature
  await expect(page.locator(".fs-h1")).toHaveText("Wealth, looked after across generations.");
  await expect(page.locator(".fs-plain")).toHaveText("Private wealth management for families and business owners.");
  await expect(page.locator(".fs-hero .wm-reg-line")).toContainText("FRN 000000 (demo). When you invest, your capital is at risk.");
  expect(await page.locator(".fs-h1").evaluate((h) => getComputedStyle(h).fontWeight)).toBe("300");
  await expect(page.locator(".fs-top a[href*=check]")).toHaveText("Is this really us? Check a call or email");
  expect(errors).toEqual([]);
  await srv.close();
});

test("choosing a situation changes the line and the next step, and where you live changes how we meet", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const next = page.locator("[data-sit-next]");
  await page.selectOption("#sit-who", "sale");
  await expect(page.locator("[data-sit-line]")).toHaveText("Plan what happens to the money before you sell.");
  await expect(next).toHaveText("Talk to us about your sale");
  await expect(next).toHaveAttribute("href", /selling-a-business/);
  await page.selectOption("#sit-where", "abroad");
  await expect(page.locator("[data-sit-meet]")).toHaveText("We meet by video, or when you are next in London.");
  await expect(page.locator(".fs-hero-fig img")).toBeVisible(); // the photograph doesn't change
  await next.click();
  await expect(page.locator("h1")).toHaveText("Selling a business");
  await expect(page.locator(".wm-tl-note")).toContainText("An illustration");
  await srv.close();
});

test("the demo's insights come from its sample sheet: approved rows only, filtered, each opening by its link", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(NOV);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("#insights .wm-ins-card")).toHaveCount(3);
  await expect(page.locator("#insights .wm-ins-tag").first()).toHaveText("General information, not advice");
  await page.goto(srv.base + "/insights");
  await featuresStarted(page);
  const entries = page.locator(".wm-insp-e");
  await expect(entries).toHaveCount(6);
  for (const held of ["Pensions and inheritance tax", "beat the market", "Planning for the new year"]) await expect(page.locator(".wm-insp-list")).not.toContainText(held);
  await page.getByRole("button", { name: "Families", exact: true }).click();
  await expect(page.locator(".wm-insp-e:visible")).toHaveCount(2);
  await page.goto(srv.base + "/insights#leaving-a-gift-to-charity-in-your-will");
  await featuresStarted(page);
  await expect(page.locator("#leaving-a-gift-to-charity-in-your-will details")).toHaveAttribute("open", "");
  await expect(page.locator("#leaving-a-gift-to-charity-in-your-will .wm-insp-by")).toContainText("Approved for publication on 22 September 2026");
  await srv.close();
});

test("a client's insights come from its published sheet, approved rows only; if the sheet fails the page says so", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: SHEET }));
  await page.goto(srv.base + "/insights");
  await featuresStarted(page);
  await expect(page.locator(".wm-insp-e")).toHaveCount(1);
  await expect(page.locator(".wm-insp-e h2")).toHaveText("Approved note");
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 500, body: "" }));
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("#insights [data-ins-off]")).toBeVisible();
  await srv.close();
});

test("Arrange a meeting refuses account numbers and writes the request into the visitor's own email", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/meeting");
  await featuresStarted(page);
  await page.fill("#meet-name", "Ann Example");
  await page.fill("#meet-reach", "ann@example.com");
  await page.fill("#meet-when", "Account 12345678, any morning");
  await page.getByRole("button", { name: "Send by email" }).click();
  await expect(page.locator("[data-meet-err]")).toContainText("Please don't send account, card or sort-code numbers");
  await expect(page.locator("#meet-when")).toBeFocused();
  await page.fill("#meet-when", "Any morning");
  await page.getByRole("button", { name: "Send by email" }).click();
  await expect(page.locator("[data-meet-err]")).toBeHidden();
  await expect(page.locator("[data-meet-done]")).toBeVisible();
  await expect(page.locator(".wm-bring li")).toHaveCount(4);
  await srv.close();
});

test("the family map stays on the device, by generation, and can be cleared", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/family");
  await featuresStarted(page);
  await page.fill("#fm-name", "Margaret");
  await page.selectOption("#fm-gen", "0");
  await page.getByRole("button", { name: "Add to the map" }).click();
  await page.fill("#fm-aname", "Hart & Co");
  await page.getByRole("button", { name: "Add adviser" }).click();
  await expect(page.locator('[data-fm-gen="0"] li')).toContainText("Margaret");
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator('[data-fm-gen="0"] li')).toContainText("Margaret");
  await expect(page.locator("[data-fm-adv] li")).toContainText("Solicitor: Hart & Co");
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page.locator("[data-fm-empty]")).toBeVisible();
  await srv.close();
});

test("each office shows its own time now, and the band says when the office opens", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: SHEET }));
  await page.clock.setFixedTime(NOV);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator('#office [data-office-time="0"]').first()).toHaveText("10:15");
  await expect(page.locator('#office [data-office-state="0"]')).toHaveText("in Bath now. Open now");
  await expect(page.locator('#office [data-office-time="1"]')).toHaveText("11:15");
  await page.goto(srv.base + "/people");
  await expect(page.locator(".wm-ppl")).toContainText("ABM01234");
  await srv.close();
});

test("on a phone the bar never covers the last of the page", async ({ browser }) => {
  const srv = await start(demo);
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(srv.base + "/");
  await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await p.waitForFunction(() => Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 2);
  const bar = await p.locator(".mbar").boundingBox();
  const credit = await p.locator("footer .by").boundingBox();
  expect(credit.y + credit.height).toBeLessThanOrEqual(bar.y + 1);
  expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await p.close();
  await srv.close();
});

test("each adviser has a page: photo, what they look after, the FCA register, and a booking link that picks them", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.goto(srv.base + "/people");
  await page.getByRole("link", { name: "Priya Nair" }).first().click();
  await expect(page.locator("h1")).toHaveText("Priya Nair");
  await expect(page.locator(".wm-adv-fig img")).toBeVisible();
  await expect(page.locator(".wm-adv a[href^='https://register.fca.org.uk']")).toBeVisible();
  await expect(page.locator(".wm-adv")).toContainText("PXN00000");
  await page.getByRole("link", { name: /^Book time with Priya/ }).click();
  await featuresStarted(page);
  await expect(page.locator("#meet-adviser")).toHaveValue("Priya Nair");
  expect(errors).toEqual([]);
  await srv.close();
});

test("events show only approved, upcoming rows, each with its approval, a reply and a calendar file", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.clock.setFixedTime(NOV);
  await page.goto(srv.base + "/events");
  await featuresStarted(page);
  const rows = page.locator(".wm-ev-e");
  await expect(rows).toHaveCount(4);
  for (const held of ["new tax year", "Beat inflation", "Autumn markets"]) await expect(page.locator(".wm-ev-list")).not.toContainText(held);
  await expect(rows.first().locator("h2")).toHaveText("Passing on a family business");
  await expect(rows.first().locator(".wm-ev-by")).toHaveText("Approved by compliance on 28 October 2026.");
  const cal = rows.first().getByRole("link", { name: "Add to calendar" });
  await expect(cal).toHaveAttribute("download", /\.ics$/);
  const [dl] = await Promise.all([page.waitForEvent("download"), cal.click()]);
  const ics = await (await import("node:fs/promises")).readFile(await dl.path(), "utf8");
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).toContain("DTSTART:20261119T180000Z"); // GMT in November
  await expect(rows.first().getByRole("link", { name: "Reply to attend" })).toHaveAttribute("href", /^mailto:events@lyallharrow\.example/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the documents checklist: pick a moment, see only its papers, tick them, and it opens straight from a moment's page", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.goto(srv.base + "/selling-a-business");
  await page.getByRole("link", { name: /documents to gather/ }).click();
  await featuresStarted(page);
  await expect(page.locator("#doc-for")).toHaveValue("selling-a-business");
  const shown = page.locator("[data-doc-set]:visible");
  await expect(shown).toHaveCount(1);
  await expect(shown).toContainText("shareholders' agreement");
  await page.selectOption("#doc-for", "retiring");
  await expect(page.locator("[data-doc-set]:visible")).toContainText("State Pension forecast");
  await page.locator("[data-doc-set]:visible input[type=checkbox]").first().check();
  await expect(page.locator(".wm-doc-note")).toContainText("not advice");
  expect(await page.locator(".wm-doc").innerText()).not.toMatch(/£|\d+\s?%/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the letter-of-wishes guide names a source for every section and says it is general information", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/letter-of-wishes");
  const sections = page.locator(".wm-wg-s");
  const n = await sections.count();
  expect(n).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < n; i++) await expect(sections.nth(i).locator(".wm-wg-from a").first()).toHaveAttribute("href", /^https:\/\//);
  await expect(page.locator(".wm-wg-not")).toContainText("general information about England and Wales, not legal or financial advice");
  await srv.close();
});

test("no page jumps on a phone while its scripts load slowly", async ({ browser }) => {
  test.setTimeout(120_000);
  const { readdirSync } = await import("node:fs");
  const pages = readdirSync("dist/demos/wealth").filter((f) => f.endsWith(".html")).map((f) => "/" + f.replace(/(index)?\.html$/, ""));
  const srv = await start(demo);
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  // Scripts held back 1.5 s; counting starts once the web fonts have actually swapped in (document.fonts.ready resolves
  // before they even start loading), so a machine without the size-matched fallback (Arial, Helvetica or Liberation
  // Sans, as on CI) isn't mistaken for a script shift. Font swaps have their own 0.1 limit in all-sites.spec.js.
  // A failure names what moved.
  await p.route("**/assets/*.js", async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); await r.continue(); });
  await p.addInitScript(() => {
    const w = /** @type {any} */ (window); w.__cls = 0; w.__src = []; let on = false;
    const start = () => requestAnimationFrame(() => requestAnimationFrame(() => { on = true; }));
    document.fonts.addEventListener("loadingdone", start, { once: true });
    setTimeout(start, 1200); // before the scripts arrive, whatever the fonts do
    new PerformanceObserver((l) => { for (const e of /** @type {any[]} */ (l.getEntries())) if (on && !e.hadRecentInput) { w.__cls += e.value; w.__src.push(...e.sources.map((/** @type {any} */ s) => s.node?.className || s.node?.nodeName)); } }).observe({ type: "layout-shift", buffered: true });
  });
  const worst = [];
  for (const path of pages) {
    await p.goto(srv.base + path);
    await featuresStarted(p);
    await p.waitForTimeout(300);
    const [cls, src] = await p.evaluate(() => [/** @type {any} */ (window).__cls, /** @type {any} */ (window).__src.join(", ")]);
    if (cls > 0.02) worst.push(`${path} ${cls.toFixed(3)} (${src})`);
  }
  expect(worst).toEqual([]);
  await p.close();
  await srv.close();
});
