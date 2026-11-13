// Tailor kit and the Flannel look, as a client uses them: the cutting-room hero, the cloth book opening each weave full
// screen with a swatch request, the first-appointment request, the commission by code (demo simulated, the client's
// published sheet mocked), the trunk shows' calendar file, the lexicon filter and the wedding order-by, without JS too.
import { readFileSync } from "node:fs";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/tailor");
const client = site("_fixtures/test-tailor-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-hollis-test/pub?gid=0&single=true&output=csv";

test("the home page leads with the cutting room, then the cloth, the commission and what the house makes", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className.split(" ")[1]));
  expect(ids).toEqual(["fl-hero", "cloth", "commission", "garments"]);
  await expect(page.locator("h1")).toHaveText("The coat, cut to you.");
  await expect(page.locator(".fl-plate img")).toBeVisible();
  await expect(page.locator(".fl-stand img")).toBeVisible();
  // the display face is never set below 28px
  const small = await page.$$eval("*", (all) => all.filter((el) => el.checkVisibility() && getComputedStyle(el).fontFamily.startsWith('"Della Respira"') && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 28).map((el) => el.className));
  expect(small).toEqual([]);
  await srv.close();
});

test.describe("the cloth book", () => {
  test("a length opens its weave full screen; next and previous walk the book; the swatch request names the cloth", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    await page.click('[data-cb-open="midnight"]');
    const sheet = page.locator("[data-cb-weave]");
    await expect(sheet).toBeVisible();
    await expect(page.locator("[data-cb-name]")).toHaveText("Midnight");
    await expect(page.locator("[data-cb-cloth]")).toHaveText("Worsted");
    await expect(page.locator("[data-cb-weight]")).toHaveText("260 g");
    await expect(page.locator("[data-cb-season]")).toHaveText("All year");
    await expect(page.locator("[data-cb-count]")).toHaveText("2 of 6");
    expect(await page.locator("[data-cb-img]").getAttribute("src")).toContain("weave-midnight.webp");
    expect(await waText(page.locator("[data-cb-ask]"))).toContain("swatch of Midnight (worsted)");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("[data-cb-name]")).toHaveText("Navy windowpane");
    await page.click("[data-cb-prev]");
    await page.click("[data-cb-prev]");
    await expect(page.locator("[data-cb-name]")).toHaveText("Tobacco herringbone");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.locator('[data-cb-open="herringbone"]')).toBeFocused();
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("the cloth library filters by season; all-year cloths show in every season", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/cloth");
    await page.click('[data-cb-season-pick="summer"]');
    const names = await page.$$eval("[data-seasons]:not([hidden]) .tl-len-n", (all) => all.map((x) => /** @type {HTMLElement} */ (x).innerText));
    expect(names).toEqual(["Midnight", "Rust hopsack", "Oat"]);
    await page.click("[data-seasons]:not([hidden]) >> nth=1");
    await expect(page.locator("[data-cb-count]")).toHaveText("2 of 3");
    await srv.close();
  });

  test("on a phone the book scrolls inside itself, never the page", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    const srv = await start(demo);
    await p.goto(srv.base + "/");
    expect(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    expect(await p.$eval("[data-cb-book]", (b) => b.scrollWidth > b.clientWidth)).toBe(true);
    await srv.close();
    await ctx.close();
  });
});

test("the first-appointment request carries the garments and the time, and never says booked", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.click("[data-gm-open]");
  await expect(page.locator("[data-gm-sheet]")).toBeVisible();
  await page.locator("label.tl-chip", { hasText: "Overcoat" }).click();
  await page.locator("label.tl-chip", { hasText: "A Saturday" }).click();
  const text = await waText(page.locator("[data-gm-send]"));
  expect(text).toContain("I'm thinking of: Overcoat.");
  expect(text).toContain("Best for me: A Saturday.");
  expect(text).not.toMatch(/booked|confirmed/i);
  await srv.close();
});

test.describe("your commission, by code", () => {
  test("the demo code shows the stages, the next fitting to the calendar and the cloth's weave", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.click("[data-cm-try]");
    await expect(page.locator('[data-cm-stage="0"]')).toHaveClass(/done/);
    await expect(page.locator('[data-cm-stage="2"]')).toHaveClass(/now/);
    await expect(page.locator('[data-cm-stage="2"]')).toHaveAttribute("aria-current", "step");
    await expect(page.locator('[data-cm-stage="3"]')).toHaveClass(/todo/);
    await expect(page.locator("[data-cm-next]")).toHaveText("Forward fitting: Thursday 22 October 2026, 11:00.");
    expect(page.url()).toMatch(/#FL4K7M2Q$/);
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("[data-cm-ics]")]);
    expect(download.suggestedFilename()).toBe("fitting-FL4K7M2Q.ics");
    const ics = readFileSync(await download.path(), "utf8");
    expect(ics).toContain("DTSTART:20261022T100000Z"); // 11:00 in London (BST)
    expect(ics).toContain("SUMMARY:Forward fitting · Fennick & Lowe");
    // the evening-before reminder: 18:00 BST on Wednesday 21 October
    expect(ics).toContain("TRIGGER;VALUE=DATE-TIME:20261021T170000Z");
    expect(ics).toContain("DESCRIPTION:Forward fitting at Fennick & Lowe tomorrow. Bring the shoes and shirt you'll wear with it and your order card.");
    await expect(page.locator("[data-cm-remind]")).toBeVisible();
    await page.click("[data-cm-cloth]");
    await expect(page.locator("[data-cb-name]")).toHaveText("Tobacco herringbone");
    await srv.close();
  });

  test("an unknown code says to call; the link with a code opens it", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.fill("[data-cm-code]", "ZZ99ZZ99");
    await page.click(".tl-cm-row button");
    await expect(page.locator("[data-cm-off]")).toContainText("We can't find that code");
    await page.goto(srv.base + "/#FL4K7M2Q");
    await expect(page.locator('[data-cm-stage="2"]')).toHaveClass(/now/);
    await srv.close();
  });

  test("a client reads the house's sheet, and refuses one that holds anything else", async ({ page }) => {
    const srv = await start(client);
    let body = "code,stage,next_fitting,cloth,updated_at\nHV8M3K2P,baste,2026-10-27 15:30,windowpane,2026-10-18 10:00\n";
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body }));
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-cm-try]")).toHaveCount(0); // no demo code on a client site
    await page.fill("[data-cm-code]", "hv8m-3k2p");
    await page.click(".tl-cm-row button");
    await expect(page.locator('[data-cm-stage="1"]')).toHaveClass(/now/);
    await expect(page.locator("[data-cm-next]")).toHaveText("Baste fitting: Tuesday 27 October 2026, 15:30.");
    await expect(page.locator("[data-cm-cloth]")).toHaveText("Your cloth: Navy windowpane");
    body = "code,stage,updated_at,name\nHV8M3K2P,baste,2026-10-18 10:00,Mr Hollis\n";
    await page.click(".tl-cm-row button");
    await expect(page.locator("[data-cm-off]")).toContainText("isn't loading");
    await srv.close();
  });
});

test("trunk shows: soonest first with UK dates, each to the calendar, a slot asked for on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/trunk-shows");
  await expect(page.locator(".tl-tv-city")).toHaveText(["Edinburgh", "New York", "Leeds"]);
  await expect(page.locator(".tl-tv-when").first()).toHaveText("19–21 November 2026");
  expect(await waText(page.locator(".tl-tv-row").first().locator("a"))).toContain("when you're in Edinburgh");
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-tv-ics]").first().click()]);
  const ics = readFileSync(await download.path(), "utf8");
  expect(ics).toContain("DTSTART;VALUE=DATE:20261119");
  expect(ics).toContain("DTEND;VALUE=DATE:20261122");
  await srv.close();
});

test("the lexicon filters by kind", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/lexicon");
  await page.click('[data-lx-kind="pocket"]');
  await expect(page.locator("[data-kind]:visible .tl-lx-t")).toHaveText(["Flap pocket", "Ticket pocket"]);
  await page.click('[data-lx-kind=""]');
  await expect(page.locator("[data-kind]:visible")).toHaveCount(12);
  await srv.close();
});

test("the wedding party planner: a larger party starts earlier, one cloth for everyone, all to the calendar and WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/weddings");
  await page.selectOption("#wo-y", "2027");
  await page.selectOption("#wo-m", "6");
  await page.selectOption("#wo-d", "12");
  await expect(page.locator("[data-wo-first]")).toHaveText("First appointment by Saturday 20 February 2027.");
  await expect(page.locator('[data-step="collect"] [data-when]')).toHaveText("Saturday 29 May 2027");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("[data-wo-ics]")]);
  expect(download.suggestedFilename()).toBe("wedding-party-2027-06-12.ics");
  const woIcs = readFileSync(await download.path(), "utf8");
  expect(woIcs.split("BEGIN:VALARM").length - 1).toBe(2); // the baste and forward fittings only
  await expect(page.locator("[data-wo-remind]")).toBeVisible();
  await page.selectOption("#wo-size", "5");
  await page.locator(".tl-wo-c", { hasText: "Midnight" }).click();
  await expect(page.locator("[data-wo-first]")).toHaveText("First appointment by Saturday 6 February 2027.");
  await expect(page.locator("[data-wo-party-note]")).toHaveText("For 5 of you we start 2 weeks earlier, to measure and cut everyone.");
  await expect(page.locator('[data-step="baste"] [data-when]')).toHaveText("Saturday 20 March 2027");
  const text = await waText(page.locator("[data-wo-send]"));
  expect(text).toContain("suits for 5 of us");
  expect(text).toContain("The cloth for everyone: Midnight.");
  expect(text).toContain("First appointment: Saturday 6 February 2027");
  await page.selectOption("#wo-y", "2026");
  await page.selectOption("#wo-m", "12");
  await page.selectOption("#wo-d", "5");
  await expect(page.locator("[data-wo-late]")).toBeVisible();
  await expect(page.locator("[data-wo-first]")).toContainText("That day has passed.");
  await srv.close();
});

test("without JavaScript: the lengths link to their weave, the commission gives the phone number, the request is a WhatsApp link", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const p = await ctx.newPage();
  const srv = await start(demo);
  await p.goto(srv.base + "/");
  expect(await p.locator('[data-cb-open="midnight"]').getAttribute("href")).toContain("weave-midnight.webp");
  await expect(p.locator(".tl-cm-plain")).toBeVisible();
  await expect(p.locator("[data-cm-form]")).toBeHidden();
  expect(await p.locator("[data-gm-open]").getAttribute("href")).toMatch(/^https:\/\/wa\.me\//);
  await srv.close();
  await ctx.close();
});

test("the swatch set: up to five cloths, one WhatsApp message, kept when the page is opened again", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/cloth");
  for (const id of ["midnight", "flannel"]) {
    await page.click(`[data-cb-open="${id}"]`);
    await page.click("[data-cb-add]");
    await expect(page.locator("[data-cb-add]")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
  }
  await expect(page.locator("[data-cb-set-count]")).toHaveText("2 of 5");
  const text = await waText(page.locator("[data-cb-set-ask]"));
  expect(text).toContain("Could you send me swatches of these cloths?");
  expect(text).toContain("· Midnight (worsted)");
  expect(text).toContain("· Charcoal (flannel)");
  await page.goto(srv.base + "/");
  await expect(page.locator("#cloth [data-cb-set-count]")).toHaveText("2 of 5");
  for (const id of ["herringbone", "windowpane", "hopsack"]) { await page.click(`[data-cb-open="${id}"]`); await page.click("[data-cb-add]"); await page.keyboard.press("Escape"); }
  await page.click('[data-cb-open="linen"]');
  await expect(page.locator("[data-cb-add]")).toBeDisabled();
  await expect(page.locator("[data-cb-add]")).toHaveText("Your set is full (5)");
  await srv.close();
});

test("the specification card follows the choices, travels in its link and sends the photographs' choices on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/specification");
  await page.locator(".tl-chip", { hasText: "Dinner suit" }).click();
  await page.locator(".tl-sp-o", { hasText: "Shawl" }).click();
  await page.locator(".tl-sp-o", { hasText: "Double breasted" }).click();
  await page.locator(".tl-sp-o", { hasText: "Jetted" }).click();
  await page.locator(".tl-sp-c", { hasText: "Midnight" }).click();
  await expect(page.locator("[data-sp-for]")).toHaveText("For a dinner suit");
  await expect(page.locator("[data-sp-list] li")).toHaveCount(4);
  await expect(page.locator("[data-sp-list] li").first()).toContainText("Shawl");
  const text = await waText(page.locator("[data-sp-send]"));
  expect(text).toContain("My specification for a dinner suit:");
  expect(text).toContain("Lapel: Shawl");
  expect(text).toContain("Fastening: Double breasted");
  expect(text).toContain("Cloth: Midnight (worsted)");
  const link = /The card: (\S+)/.exec(text)?.[1] ?? "";
  expect(link).toContain("#spec=");
  await page.goto(srv.base + "/");
  await page.goto(srv.base + "/specification" + link.slice(link.indexOf("#")));
  await expect(page.locator('input[name="sp-lapel"][value="shawl"]')).toBeChecked();
  await expect(page.locator('input[name="sp-cloth"][value="midnight"]')).toBeChecked();
  await expect(page.locator("[data-sp-for]")).toHaveText("For a dinner suit");
  expect(errors).toEqual([]);
  await srv.close();
});

test("every page is reachable from the menu on a wide screen; the header keeps to five", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".fl-links a")).toHaveCount(5);
  await page.click(".fl-menu");
  await expect(page.locator("#mnav")).toBeVisible();
  const links = await page.$$eval("#mnav nav a", (all) => all.map((a) => a.getAttribute("href")));
  for (const p of ["/what-we-make", "/weddings", "/specification", "/bespoke", "/journal", "/vouchers", "/the-house", "/alterations-and-care", "/lexicon", "/trunk-shows"]) expect(links).toContain(p);
  await srv.close();
});

test("the garment pages and the journal: a page each, with the house's price and sources where facts are general", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/what-we-make");
  await expect(page.locator(".tl-wm-t")).toHaveText(["Suits", "Overcoats", "Dinner suits", "Shirts"]);
  await page.click("text=Overcoats");
  await expect(page.locator("h1")).toHaveText("Overcoats");
  await expect(page.locator(".tl-gp-price")).toContainText("From £4,600");
  await page.goto(srv.base + "/shirts");
  await expect(page.locator(".tl-gp-price")).toContainText("From £280");
  await page.goto(srv.base + "/bespoke");
  await expect(page.locator(".tl-ex-src a")).toHaveCount(2);
  await page.goto(srv.base + "/journal");
  await expect(page.locator(".tl-jn-t")).toHaveText(["Choosing cloth by season", "What to wear to a wedding", "Looking after a suit"]);
  await srv.close();
});

test("a specification link cut short still opens the card with what it can read", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/specification#spec=for:Overcoat,lapel:peak,cloth:midnight%");
  await expect(page.locator("[data-sp-for]")).toHaveText("For an overcoat");
  await expect(page.locator('input[name="sp-lapel"][value="peak"]')).toBeChecked();
  await expect(page.locator("[data-sp-send]")).toHaveAttribute("href", /wa\.me/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("on a phone the home page stays at about six screens", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto(srv.base + "/");
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
  expect(screens).toBeLessThan(6.6);
  await srv.close();
});

test("the specification card: a shirt gets its collar, a coat its lapel", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/specification");
  await expect(page.locator('[data-sp-group="collar"]')).toBeHidden();
  await page.locator(".tl-chip", { hasText: "Shirt" }).click();
  await expect(page.locator('[data-sp-group="collar"]')).toBeVisible();
  await expect(page.locator('[data-sp-group="lapel"]')).toBeHidden();
  await page.locator(".tl-sp-o", { hasText: "Button-down" }).click();
  await expect(page.locator("[data-sp-for]")).toHaveText("For a shirt");
  const text = await waText(page.locator("[data-sp-send]"));
  expect(text).toContain("Collar: Button-down");
  expect(text).not.toContain("Lapel");
  expect(page.url()).toContain("collar:button-down");
  expect(page.url()).not.toContain("lapel:");
  await srv.close();
});

test("from your pattern: the order slip waits for a code, then sends code, garment, cloth and change on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/from-your-pattern");
  await expect(page.locator("[data-ro-send]")).toHaveAttribute("aria-disabled", "true");
  await page.fill("#ro-code", "FL4");
  await expect(page.locator("#ro-code")).toHaveAttribute("aria-invalid", "false");
  await page.locator("#ro-changes").focus();
  await expect(page.locator("#ro-code")).toHaveAttribute("aria-invalid", "true");
  await page.fill("#ro-code", "fl4k-7m2q");
  await expect(page.locator("[data-ro-send]")).not.toHaveAttribute("aria-disabled", /.*/);
  await page.locator(".tl-chip", { hasText: "Trousers" }).click();
  await page.selectOption("#ro-cloth", "flannel");
  await page.fill("#ro-changes", "A touch longer");
  const text = await waText(page.locator("[data-ro-send]"));
  expect(text).toContain("I'd like to order again from my pattern: a pair of trousers.");
  expect(text).toContain("Order code: FL4K7M2Q");
  expect(text).toContain("Cloth: Charcoal (flannel)");
  expect(text).toContain("Change: A touch longer");
  expect(await page.locator("input, textarea, select").evaluateAll((all) => all.map((x) => x.getAttribute("name") || x.id))).not.toContain("measurements");
  expect(errors).toEqual([]);
  await srv.close();
});
