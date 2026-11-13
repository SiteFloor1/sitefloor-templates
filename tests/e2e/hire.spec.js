// Car hire kit and the Datum look, as a customer uses them: the fleet on the home page and "free this weekend?", the
// postcode checker, the fleet filters (with and without JavaScript), a car's calendar by keyboard and its quote, the
// deposit reference, the chauffeur journey planner, the spec dial, Delivered tonight, the fleet calendar, where's my
// deposit and the handover checklist. Every test runs at Monday 19 Oct 2026, 10:30 BST unless it says otherwise.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/car-hire");
const client = site("_fixtures/test-hire-client");
const SHEET = /docs\.google\.com\/spreadsheets/;
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
/** The fixture's availability tab: the M3 taken 30 Oct–1 Nov; updated this morning. */
const fresh = "car,from,to,updated_at\nbmw-m3,2026-10-30,2026-11-01,2026-10-19 08:00\n";
const old = "car,from,to,updated_at\nbmw-m3,2026-10-30,2026-11-01,2026-10-01 08:00\n";
const sheet = (body) => async (route) => route.fulfill({ status: 200, contentType: "text/csv", body });

test.describe("the home page", () => {
  test("leads with one class: one large car, two beside it, the rules and the range strip", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const fleet = page.locator("#fleet");
    await expect(fleet.locator(".hr-rail .is-lead")).toContainText("Performance");
    await expect(fleet.locator(".hr-car.is-lead h3")).toHaveText("Porsche 911 GT3 RS");
    await expect(fleet.locator(".hr-car.is-side")).toHaveCount(2);
    await expect(fleet.locator(".hr-car.is-lead .hr-facts")).toContainText("£7,500");
    await expect(fleet.locator(".hr-car.is-lead .hr-facts")).toContainText("30 or over, five years' full licence, up to six points");
    await expect(fleet.locator(".hr-range .hr-car h3")).toHaveText(["Ferrari SF90 Stradale", "Rolls-Royce Cullinan", "Mercedes-AMG G 63"]);
    // fix 2: the large car's column ends with the two beside it
    const lead = await fleet.locator(".hr-car.is-lead").boundingBox();
    const side = await fleet.locator(".hr-car.is-side").last().boundingBox();
    expect(Math.abs((lead.y + lead.height) - (side.y + side.height))).toBeLessThan(40);
    await expect(page.locator(".dt-indie")).toHaveText("Independent hire company, not affiliated with any manufacturer.");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("free this weekend? comes from the Sheet; old or unreadable data says ask us, never free", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, sheet(fresh));
    await page.goto(srv.base + "/");
    await expect(page.locator('[data-weekend="bmw-m3"]')).toHaveAttribute("data-state", "free");
    await page.unroute(SHEET);
    await page.route(SHEET, sheet(old));
    await page.reload();
    await expect(page.locator('[data-weekend="bmw-m3"]')).toHaveAttribute("data-state", "ask");
    await expect(page.locator('[data-weekend="bmw-m3"]')).toContainText("ask us");
    await page.unroute(SHEET);
    await page.route(SHEET, (r) => r.abort());
    await page.reload();
    await expect(page.locator('[data-weekend="audi-rs3"]')).toHaveAttribute("data-state", "ask");
    await srv.close();
  });

  test("the postcode checker: in a zone with its fee, outside the zones, or not a postcode", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const pc = page.locator("#delivery");
    await pc.locator("[data-pc-in]").fill("sw11 4nq");
    await pc.getByRole("button", { name: "Check" }).click();
    await expect(pc.locator("[data-pc-out]")).toHaveText("SW11 is in Zone one: delivery and collection £60.");
    await pc.locator("[data-pc-in]").fill("M1 1AA");
    await pc.getByRole("button", { name: "Check" }).click();
    await expect(pc.locator("[data-pc-out]")).toContainText("M1 is outside our delivery zones");
    await pc.locator("[data-pc-in]").fill("hello");
    await pc.getByRole("button", { name: "Check" }).click();
    await expect(pc.locator("[data-pc-out]")).toContainText("doesn't read as a UK postcode");
    await srv.close();
  });

  test("the request is a request, dated in full, never a booking", async ({ page }) => {
    const srv = await start(client);
    await page.goto(srv.base + "/");
    await page.context().route("https://wa.me/**", (r) => r.abort());
    const form = page.locator("#request");
    await form.locator("[data-rq-car]").selectOption("Audi RS3");
    await form.locator("[data-rq-from]").fill("2026-11-06");
    await form.locator("[data-rq-to]").fill("2026-11-09");
    const sent = page.context().waitForEvent("request", (r) => r.url().startsWith("https://wa.me/"));
    await form.getByRole("button", { name: "Request on WhatsApp" }).click();
    const text = new URL((await sent).url()).searchParams.get("text") ?? "";
    expect(text).toContain("I'd like to request the Audi RS3.");
    expect(text).toContain("From Friday 6 November 2026 to Monday 9 November 2026.");
    expect(text).toContain("I understand this is a request until you confirm.");
    await srv.close();
  });
});

test.describe("the fleet", () => {
  test("filters work without JavaScript (plain radio buttons)", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const srv = await start(demo);
    await page.goto(srv.base + "/fleet");
    const all = await page.locator(".hr-fl-list > [data-car]").count();
    expect(all).toBe(20);
    await page.locator('label[for="fl-seats-7"]').click();
    await expect(page.locator(".hr-fl-list > [data-car]:visible")).toHaveCount(1); // the X5
    await page.locator('label[for="fl-seats-any"]').click();
    await page.locator('label[for="fl-cls-supercar"]').click();
    await expect(page.locator(".hr-fl-list > [data-car]:visible")).toHaveCount(4);
    await srv.close(); await ctx.close();
  });

  test("with JavaScript: search by make and model, sort by price, and the count", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/fleet");
    await page.locator("[data-fl-q]").fill("ferrari");
    await expect(page.locator("[data-fl-count]")).toHaveText("2 cars");
    await page.locator("[data-fl-q]").fill("");
    await page.locator("[data-fl-sort]").selectOption("low");
    await expect(page.locator(".hr-fl-list > [data-car]").first()).toHaveAttribute("data-car", "mercedes-c-class");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("the spec dial turns by keyboard, filters the fleet and lines the cars up in one row", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/fleet");
    const dial = page.getByRole("slider");
    await page.locator('[data-sd-mode="power"]').click();
    await expect(dial).toBeFocused();
    await dial.press("ArrowRight"); await dial.press("ArrowRight"); await dial.press("ArrowRight"); // 600+
    await expect(dial).toHaveAttribute("aria-valuetext", "Power: 600+ bhp");
    await expect(page.locator("#fl-power-600")).toBeChecked();
    const shown = await page.locator(".hr-fl-list > [data-car]:visible").count();
    await expect(page.locator("[data-sd-row] li")).toHaveCount(shown);
    await expect(page.locator("[data-sd-count]")).toHaveText(`${shown} cars fit`);
    await dial.press("Home");
    await expect(dial).toHaveAttribute("aria-valuetext", "Power: Any bhp");
    await srv.close();
  });

  test("the fleet calendar shows a fortnight from the business's own today; a free day opens that car's dates", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/fleet");
    const cal = page.locator("[data-feature='fleet-calendar']");
    await expect(cal.locator("[data-fcal-status]")).toContainText("Monday 19 October 2026 to Sunday 1 November 2026");
    await expect(cal.locator('td[data-state="free"] a').first()).toHaveAttribute("href", /\/cars\/.+#dates$/);
    await expect(cal.locator('td[data-state="taken"]').first()).toBeAttached();
    await cal.getByRole("button", { name: "Later fortnight" }).click();
    await expect(cal.locator("[data-fcal-status]")).toContainText("Monday 2 November 2026");
    await srv.close();
  });
});

test.describe("a car's page", () => {
  test("the calendar works by keyboard; the quote shows every part; the request and deposit carry the same reference", async ({ page }) => {
    const srv = await start(client);
    const errors = watchErrors(page);
    await page.route(SHEET, sheet(fresh));
    await page.goto(srv.base + "/cars/bmw-m3");
    await expect(page.locator(".hr-spec")).toContainText("503");
    const grid = page.getByRole("grid");
    const today = grid.locator('[data-day="2026-10-19"]');
    await today.focus();
    await expect(today).toHaveAttribute("aria-label", /Monday 19 October, too soon/);
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight"); // Friday 23
    await expect(grid.locator('[data-day="2026-10-23"]')).toBeFocused();
    await page.keyboard.press("Enter");
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight"); // Monday 26
    await page.keyboard.press("Enter");
    await expect(grid.locator('[data-day="2026-10-26"]')).toHaveAttribute("aria-selected", "true");
    await page.locator("[data-dr-from-time]").selectOption("09:00");
    await page.locator("[data-dr-to-time]").selectOption("09:00");
    const quote = page.locator("[data-q-out]");
    await expect(quote).toContainText("Weekend rate");
    await expect(quote.locator("tfoot")).toContainText("£800");
    await expect(quote).toContainText("Deposit £2,000, returned");
    await page.locator('[data-q-extra][value="driver"]').check();
    await expect(quote.locator("tfoot")).toContainText("£860");
    const text = await waText(page.locator("[data-q-send]"));
    expect(text).toContain("Reference: bmw-m3_2026-10-23_2026-10-26");
    expect(text).toContain("I understand this is a request until you confirm.");
    expect(text).not.toMatch(/\b(booked|confirmed|reserved)\b/i);
    await expect(page.locator('[data-pay="deposit-2000"]')).toHaveAttribute("href", /client_reference_id=bmw-m3_2026-10-23_2026-10-26/);
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("days taken on the Sheet can't be chosen; the driver checker reads the rules back", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, sheet(fresh));
    await page.goto(srv.base + "/cars/bmw-m3");
    await expect(page.locator('[data-day="2026-10-31"]')).toHaveAttribute("data-state", "taken");
    const dc = page.locator("[data-feature='driver-check']");
    await dc.locator("[data-dc-age]").fill("24");
    await dc.locator("[data-dc-years]").fill("4");
    await dc.locator("[data-dc-points]").fill("0");
    await expect(dc.locator("[data-dc-out]")).toHaveText("Drivers need to be 25 or over.");
    await dc.locator("[data-dc-age]").fill("26");
    await expect(dc.locator("[data-dc-out]")).toContainText("Your answers fit our rules for this car");
    await srv.close();
  });
});

test.describe("the Signature showpieces", () => {
  test("Delivered tonight: the car arrives, the quote assembles, and the confirmation says request sent, not booked", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const dt = page.locator("[data-feature='delivered-tonight']");
    await dt.locator("[data-dt-car]").selectOption("audi-rs6-avant"); // free on the demo's sheet that weekend
    await expect(dt.locator("[data-dt-photo]")).toHaveAttribute("src", /car-audi-rs6-avant/);
    await dt.locator("[data-dt-pc]").fill("SW11 4NQ");
    await dt.locator("[data-dr-from]").fill("2026-10-23");
    await dt.locator("[data-dr-to]").fill("2026-10-26");
    await dt.locator("[data-dr-from-time]").selectOption("18:00");
    await dt.locator("[data-dr-to-time]").selectOption("18:00");
    await expect(dt.locator("[data-dt-total]")).toHaveText("£1,010"); // weekend £950 + zone one £60
    await expect(dt.locator('[data-dt-step="key"]')).toHaveAttribute("data-on", "true");
    await page.route("https://wa.me/**", (r) => r.abort());
    await dt.locator("[data-dt-send]").click();
    await expect(dt.locator("[data-dt-sent]")).toBeVisible();
    await expect(dt.locator("[data-dt-sent]")).toContainText("Request sent, not booked");
    await expect(dt.locator("[data-dt-sent]")).toContainText("Reference audi-rs6-avant_2026-10-23_2026-10-26");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("the journey planner: hours from the customer's own times, the client's minimum, and the card", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/chauffeur");
    const jp = page.locator("[data-feature='journey-planner']");
    await jp.locator("[data-jp-car]").selectOption("rolls-royce-cullinan");
    await jp.locator("[data-jp-title]").fill("Amara and Theo");
    await expect(jp.locator("[data-jp-span]")).toHaveText("10 h 30 min, 13:00 to 23:30");
    await expect(jp.locator("[data-jp-hours]")).toHaveText("10.5 hours");
    await expect(jp.locator("[data-jp-quote]")).toHaveText("£2,520 (£240 an hour)");
    await expect(jp.locator("[data-jp-card-title]")).toHaveText("Amara and Theo");
    const times = jp.locator("[data-jp-time]");
    await times.nth(1).fill("13:30"); await times.nth(2).fill("14:00"); await times.nth(3).fill("14:30");
    await expect(jp.locator("[data-jp-hours]")).toHaveText("3 hours (our minimum)");
    expect(await waText(jp.locator("[data-jp-send]"))).toContain("request until you confirm");
    await srv.close();
  });

  test("where's my deposit: by reference only, from held to returned", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/deposit?ref=dh-4821");
    await expect(page.locator("[data-dep-out]")).toContainText("DH-4821: held on");
    await page.locator("[data-dep-ref]").fill("DH-0000");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.locator("[data-dep-out]")).toContainText("We can't find DH-0000");
    await srv.close();
  });

  test("the handover checklist records collection and return on the phone and lists what changed", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/handover-check?ref=DH-4821&car=bmw-m5");
    const hc = page.locator("[data-feature='handover-check']");
    await expect(hc.locator("[data-hc-car]")).toHaveValue("bmw-m5");
    await hc.getByLabel("Front bumper").fill("Stone chip, left");
    await hc.locator("[data-hc-miles]").fill("12034");
    await hc.getByRole("button", { name: "Record this moment" }).click();
    await expect(hc.locator('[data-hc-sum="collection"]')).toContainText("Full · 12,034 miles · 1 marked");
    await hc.locator('label[for="hc-when-back"]').click();
    await expect(hc.getByLabel("Front bumper")).toHaveValue("");
    await hc.getByLabel("Front bumper").fill("Stone chip, left");
    await hc.getByLabel("Mirrors").fill("Scuff, right mirror");
    await hc.locator("[data-hc-fuel]").evaluate((el) => { el.value = "6"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await hc.locator("[data-hc-miles]").fill("12410");
    await hc.getByRole("button", { name: "Record this moment" }).click();
    await expect(hc.locator("[data-hc-diff]")).toContainText('Mirrors: new, "Scuff, right mirror"');
    await expect(hc.locator("[data-hc-diff]")).toContainText("Fuel: Full at collection, 3/4 at return");
    await expect(hc.locator("[data-hc-diff]")).toContainText("Driven: 376 miles");
    await page.reload(); // kept on this phone
    await expect(hc.locator('[data-hc-sum="back"]')).toContainText("3/4 · 12,410 miles · 2 marked");
    expect(await waText(hc.locator("[data-hc-send]"))).toContain("Reference: DH-4821");
    await srv.close();
  });
});

test("the site never claims a booking: requests and deposits only", async ({ page }) => {
  const srv = await start(demo);
  for (const p of ["/", "/fleet", "/cars/porsche-911-gt3-rs", "/chauffeur", "/weddings", "/long-term", "/before-your-hire"]) {
    await page.goto(srv.base + p);
    const text = (await page.locator("main").innerText()).replace(/not booked|isn't a booking|nothing is booked until|not a booking/gi, "");
    expect(text, p).not.toMatch(/\b(booked|booking|reserved|confirmed)\b/i);
  }
  await srv.close();
});
