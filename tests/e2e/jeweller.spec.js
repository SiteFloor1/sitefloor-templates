// Jeweller kit and the Nacre look, as a customer uses them: a short home page with doors, one piece at a time, the tray and the
// appointment request, the ring sizer, a piece's page with only the client's facts, engraving inside the band, reminders,
// occasions and birthstones that move on by themselves. Times are UK (GMT after 25 October 2026).
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/jeweller");
const client = site("_fixtures/test-jeweller-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test.describe("the home page", () => {
  test("one still piece, the collections as doors into their pages, the box in conch, the appointment; six screens or fewer on a phone", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    await expect(page.locator("h1")).toHaveText("The Solitaire");
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.locator(".jw-door")).toHaveCount(4);
    await expect(page.locator(".jw-door").first()).toHaveAttribute("href", "/collection-engagement");
    await expect(page.locator(".jw-brand")).toBeVisible();
    await expect(page.locator(".nc-sh-xl")).toHaveCount(0);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(h).toBeLessThanOrEqual(844 * 6);
    expect(errors).toEqual([]);
    await srv.close(); await ctx.close();
  });
  test("a door opens its collection's page with every piece", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/collection-pearls");
    await expect(page.locator("h1")).toHaveText("Pearls");
    await expect(page.locator(".jw-col-grid .jw-card")).toHaveCount(2);
    await srv.close();
  });
});

test.describe("one piece at a time, the tray and the appointment", () => {
  test("a card opens its piece full screen; arrows step through; Escape closes", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/pieces");
    await page.locator('#drawer-engagement [data-open="oval-halo"]').click();
    const view = page.locator("dialog.jw-view");
    await expect(view).toBeVisible();
    await expect(view.locator('[data-slide="oval-halo"]')).toBeVisible();
    await expect(view.locator('[data-slide="oval-halo"] img')).toHaveAttribute("src", /oval-halo\.webp$/);
    await expect(view.locator('[data-slide="oval-halo"] .jw-facts')).toContainText("18ct rose gold");
    await page.keyboard.press("ArrowRight");
    await expect(view.locator('[data-slide="emerald-cut"]')).toBeVisible();
    await expect(view.locator("[data-view-count]")).toHaveText(/^3 of \d+$/);
    await page.keyboard.press("Escape");
    await expect(view).toBeHidden();
    expect(errors).toEqual([]);
    await srv.close();
  });
  test("set aside up to three; the tray and the request name them, and it's kept on the device", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/pieces");
    const view = page.locator("dialog.jw-view");
    for (const id of ["the-solitaire", "oval-halo", "starburst"]) {
      if (id === "starburst") await page.locator("#drawer-anniversary summary").click();
      await page.locator(`.jw-vit [data-open="${id}"]`).click();
      await view.locator(`[data-slide="${id}"] [data-tray]`).click();
      await expect(view.locator(`[data-slide="${id}"] [data-tray]`)).toHaveAttribute("aria-pressed", "true");
      await page.keyboard.press("Escape");
    }
    await page.locator('.jw-vit [data-open="sapphire-halo"]').click();
    await view.locator('[data-slide="sapphire-halo"] [data-tray]').click();
    await expect(page.locator("[data-tray-say]")).toHaveText(/holds 3/);
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-tray-n]")).toHaveText("3");
    await page.goto(srv.base + "/");
    const req = page.locator("#appointment [data-appt-send]");
    await page.locator("#appointment summary").click();
    await page.locator("#appointment [data-appt-name]").fill("Sam");
    expect(await waText(req)).toMatch(/I'd like to see: The Solitaire, The Oval Halo, The Starburst[\s\S]*My name: Sam/);
    await page.reload();
    await expect(page.locator("[data-tray-n]")).toHaveText("3");
    await page.locator("[data-tray-toggle]").click();
    await page.locator('[data-tray-remove="oval-halo"]').click();
    await expect(page.locator("[data-tray-n]")).toHaveText("2");
    expect(await waText(page.locator("[data-tray-send]"))).toMatch(/The Solitaire, The Starburst/);
    await srv.close();
  });
  test("See it in person adds that piece; the day comes from the date picker, inside the house's hours and notice", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-10T10:00:00Z")); // a Tuesday
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.locator('.nc-hero a[data-see="the-solitaire"]').click();
    await expect(page.locator("#appointment [data-appt-list]")).toHaveText("The Solitaire");
    const appt = page.locator("#appointment");
    await expect(appt.locator("[data-dr-cal] table")).toBeVisible();
    await expect(appt.locator('[data-dr-cal] [data-day="2026-11-15"]')).toHaveAttribute("aria-label", /Sunday 15 November, closed/);
    await appt.locator("[data-dr-from]").fill("2026-11-14");
    await expect.poll(() => appt.locator('[data-dr-from-time] option[value="18:00"]').evaluate((o) => /** @type {HTMLOptionElement} */ (o).disabled)).toBe(true);
    await appt.locator("[data-dr-from]").fill("2026-11-17"); // a Tuesday, closing at 6pm: an hour from 6pm doesn't fit
    await expect.poll(() => appt.locator('[data-dr-from-time] option[value="18:00"]').evaluate((o) => /** @type {HTMLOptionElement} */ (o).disabled)).toBe(true);
    await appt.locator("[data-dr-from]").fill("2026-11-19"); // a Thursday, open until 8pm
    await expect.poll(() => appt.locator('[data-dr-from-time] option[value="18:00"]').evaluate((o) => /** @type {HTMLOptionElement} */ (o).disabled)).toBe(false);
    await appt.locator("[data-dr-from]").fill("2026-11-14");
    await appt.locator("[data-dr-from-time]").selectOption("12:00");
    expect(await waText(appt.locator("[data-appt-send]"))).toMatch(/The day I'd like: Saturday 14 November at 12:00, or the nearest you can offer[\s\S]*The Solitaire/);
    await appt.locator("[data-dr-from]").fill("2026-11-15");
    expect(await waText(appt.locator("[data-appt-send]"))).not.toMatch(/The day I'd like/);
    await srv.close();
  });
  test("without JavaScript a card is a link to its page and the request is a plain WhatsApp link", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const srv = await start(demo);
    await page.goto(srv.base + "/pieces");
    await expect(page.locator('#drawer-engagement a[data-open="oval-halo"]')).toHaveAttribute("href", "/piece-oval-halo");
    await page.locator("#drawer-pearls summary").click();
    await expect(page.locator("#drawer-pearls .jw-slot").first()).toBeVisible();
    await expect(page.locator("#drawer-engagement .jw-slot").first()).toBeHidden();
    await page.goto(srv.base + "/occasion-valentines");
    const sl = page.locator('[data-sl="valentines"]');
    await expect(sl.locator('[data-sl-panel="0"]')).toBeVisible();
    await sl.locator('label:has(input[value="1"])').click();
    await expect(sl.locator('[data-sl-panel="0"]')).toBeHidden();
    await expect(sl.locator('[data-sl-panel="1"]')).toBeVisible();
    await page.goto(srv.base + "/");
    await expect(page.locator("#appointment [data-appt-send]")).toHaveAttribute("href", /^https:\/\/wa\.me\/447700900628\?text=/);
    await expect(page.locator("#appointment fieldset").first()).toBeHidden();
    await srv.close(); await ctx.close();
  });
});

test.describe("a piece's page", () => {
  test("only the client's facts: a client's hallmark and certificate show; a demo says its specs are the demo's", async ({ page }) => {
    const c = await start(client);
    await page.goto(c.base + "/piece-ring-a");
    await expect(page.locator("h1")).toHaveText("The Bath Solitaire");
    await expect(page.locator(".jw-pp-t .jw-facts")).toContainText("Hallmarked at the Birmingham Assay Office");
    await expect(page.locator(".jw-pp-t .jw-facts")).toContainText("GIA report supplied with the stone");
    await expect(page.locator(".jw-pp-t")).toContainText("From £4,200");
    await page.goto(c.base + "/piece-ring-b");
    await expect(page.locator(".jw-pp-t .jw-facts")).toHaveCount(0);
    await expect(page.locator(".jw-pp-t")).toContainText("Price on request");
    await c.close();
    const d = await start(demo);
    await page.goto(d.base + "/piece-the-solitaire");
    await expect(page.locator(".jw-pp-t")).toContainText("Demo specs and price for a fictional house");
    await expect(page.locator("body")).not.toContainText(/hallmark|GIA|conflict-free|ethical/i);
    await d.close();
  });
  test("on a hand at true size after matching a bank card", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/piece-the-solitaire");
    const hand = page.locator('[data-feature="on-a-hand"]');
    await hand.locator("[data-hand-true]").click();
    await hand.locator("[data-cal-range]").fill("428");
    await hand.locator("[data-cal-done]").click();
    await expect(hand.locator("[data-hand-fig]")).toHaveClass(/is-true/);
    await expect(hand.locator("[data-hand-fig] img")).toHaveCSS("width", "700px"); // 140 mm × 5 px/mm
    await srv.close();
  });
  test("engraving: the words follow the band as they're typed, within the house's limit, and go with the request", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/wedding-bands");
    const eng = page.locator('[data-feature="inside-the-band"]');
    await eng.locator("[data-eng-text]").fill("For ever, J & M");
    await expect(eng.locator("[data-eng-show]")).toHaveText("For ever, J & M");
    await eng.locator('label:has(input[value="block"])').click();
    await expect(eng.locator("[data-eng-svg]")).toHaveAttribute("data-style", "block");
    expect(await waText(eng.locator("[data-eng-send]"))).toMatch(/engraved inside: "For ever, J & M", in Block capitals lettering/);
    await expect(eng.locator("[data-eng-text]")).toHaveAttribute("maxlength", "24");
    await srv.close();
  });
  test("pair it: choosing a band words the request for that pair", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/piece-oval-halo");
    const pair = page.locator('[data-feature="pair-it"]');
    expect(await waText(pair.locator("[data-pair-send]"))).toMatch(/The Oval Halo with The Two Tone Bands/);
    await srv.close();
  });
});

test.describe("ring size, reminders, occasions and birthstones", () => {
  test("ring size from a length, and from a ring on a calibrated screen", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/ring-size");
    await page.locator("[data-rs-mm]").fill("52.5");
    await expect(page.locator("[data-rs-out]")).toHaveText(/UK M–N/);
    await expect(page.locator('tr[data-size="M"]')).toHaveClass(/is-hit/);
    await page.locator("[data-rs-cal] [data-cal-range]").fill("428");
    await page.locator("[data-rs-cal] [data-cal-done]").click();
    await page.locator("[data-rs-dia]").fill("17.35");
    await expect(page.locator("[data-rs-ring-out]")).toHaveText(/17\.4 mm inside\. About a UK O/);
    await expect(page.locator("[data-rs-circle]")).toHaveCSS("width", "86.75px");
    await expect(page.locator(".jw-sizes")).toContainText("checked 29 October 2026");
    await srv.close();
  });
  test("the anniversary reminder is a yearly calendar file in UTC", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/gifts");
    const form = page.locator("[data-anni-form]");
    await form.locator("[data-anni-date]").fill("2019-06-20");
    await form.locator('label:has(input[name="anni-weeks"][value="2"])').click();
    const [dl] = await Promise.all([page.waitForEvent("download"), form.locator('button[type="submit"]').click()]);
    const ics = await (await import("node:fs")).promises.readFile(await dl.path(), "utf8");
    expect(ics).toMatch(/DTSTART:2027060\dT090000Z/);
    expect(ics).toContain("RRULE:FREQ=YEARLY");
    await srv.close();
  });
  test("occasions: past ones drop off and the next leads; this month's stone moves on", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-02T10:00:00Z"));
    const srv = await start(demo);
    await page.goto(srv.base + "/occasions");
    await expect(page.locator('section[data-to="2026-11-09"]')).toBeHidden();
    await expect(page.locator(".jw-occ.is-lead h2")).toHaveText("Christmas");
    await expect(page.locator('section[data-to="2027-01-01"]')).toBeVisible();
    await page.goto(srv.base + "/birthstones");
    await expect(page.locator('[data-month-row="12"]')).toHaveClass(/is-now/);
    await expect(page.locator('[data-month-row="10"]')).not.toHaveClass(/is-now/);
    await srv.close();
  });
});

test.describe("occasions, the vitrine and the bridal party", () => {
  test("an occasion's page: its photograph and name, three within a budget, and the gift arranged with the card", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/occasion-valentines");
    await expect(page.locator("h1")).toHaveText("Valentine's");
    await expect(page.locator(".jw-oc-hero img")).toHaveAttribute("fetchpriority", "high");
    const sl = page.locator('[data-sl="valentines"]');
    await expect(sl.locator('[data-sl-panel="0"] li').first()).toHaveAttribute("data-sl-item", /^Pearl Studs, £480/);
    const card = page.locator('[data-feature="the-card"]');
    await card.locator('label:has(input[value="The Solitaire"])').click();
    await card.locator("[data-tc-text]").fill("Yes, always");
    await expect(card.locator("[data-tc-show]")).toHaveText("Yes, always");
    await card.locator("[data-tc-by]").fill("2027-02-13");
    expect(await waText(card.locator("[data-tc-send]"))).toMatch(/arrange a gift for Valentine's[\s\S]*The piece: The Solitaire[\s\S]*Saturday 13 February[\s\S]*"Yes, always"/);
    await page.goto(srv.base + "/occasions");
    await expect(page.locator('.jw-occ-n a[href="/occasion-valentines"]')).toHaveCount(1);
    await expect(page.locator(".jw-od-a")).toHaveCount(5);
    expect(errors).toEqual([]);
    await srv.close();
  });
  test("the anniversary page's reminder carries the three in the chosen band", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/occasion-anniversaries");
    const form = page.locator("[data-anni-form]");
    await form.locator("[data-anni-date]").fill("2019-06-20");
    await form.locator('[data-sl] label:has(input[value="2"])').click();
    const [dl] = await Promise.all([page.waitForEvent("download"), form.locator('button[type="submit"]').click()]);
    const ics = (await (await import("node:fs")).promises.readFile(await dl.path(), "utf8")).replace(/\r\n /g, "");
    expect(ics).toMatch(/Your shortlist from Aldous Marr:\\n/);
    expect(ics).toContain("The Sapphire Halo");
    await srv.close();
  });
  test("a bridal party order counts the pieces, adds up at the listed prices and names each role", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/bridal-party");
    const rows = page.locator("[data-bp-row]");
    await rows.nth(0).locator("[data-bp-n]").fill("5");
    await rows.nth(1).locator("[data-bp-piece]").selectOption("pearl-strand");
    await rows.nth(1).locator("[data-bp-n]").fill("1");
    await expect(page.locator("[data-bp-sum]")).toHaveText("6 pieces · £5,000 at our listed prices, before any engraving");
    await page.locator("[data-bp-date]").fill("2027-06-12");
    expect(await waText(page.locator("[data-bp-send]"))).toMatch(/The wedding: Saturday 12 June[\s\S]*5 × Pearl Studs, for bridesmaids[\s\S]*1 × The Double Strand, for maid of honour/);
    await srv.close();
  });
});
