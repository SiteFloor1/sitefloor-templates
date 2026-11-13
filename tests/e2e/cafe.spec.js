// Café features on the restaurant kit (the counter's fresh-out tags, Your usual, the glass case, how busy now,
// Can I work here?, the seat finder, the brunch builder, the regulars' board) and the Counter look, as a customer
// uses them on the Morrow demo and the Counter client fixture.
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/cafe");
const client = site("_fixtures/test-cafe-client");
const SHEET = /docs\.google\.com\/spreadsheets/;
// Wednesday 28 Oct 2026 (GMT): 8:30 (a tray of cardamom knots came out at 8:10), 11:50 (almond croissants sold
// out at 11:40), 18:00 (closed).
const MORNING = new Date("2026-10-28T08:30:00Z");
const NOON = new Date("2026-10-28T11:50:00Z");
const EVENING = new Date("2026-10-28T18:00:00Z");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL(await loc.getAttribute("href") ?? "").searchParams.get("text") ?? "";

test.describe("the counter", () => {
  test("the hero tags each bake on the counter photo, and the slip lists the case with its tags", async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const knot = page.locator('.cn-spot[data-bake="cardamom-knot"]');
    await expect(knot).toHaveAttribute("data-state", "fresh");
    await expect(knot).toContainText("Fresh out 8:10am");
    await expect(page.locator('.cn-spot[data-bake="butter-croissant"]')).toContainText("Baked 7:20am");
    await expect(page.locator('.sp-bakes [data-bake="cardamom-knot"]')).toContainText("Fresh out 8:10am");
    await expect(page.locator('.sp-bakes [data-bake="almond-croissant"] [data-bake-tag]')).toHaveText("");
    await expect(page.locator(".sp-board li")).toHaveCount(8);
    await expect(page.locator(".cn-now")).toContainText("Open now");
    await srv.close();
  });

  test("a bake that sells out is marked everywhere, and can't be added to an order", async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator('.sp-bakes [data-bake="almond-croissant"]')).toHaveAttribute("data-state", "out");
    await expect(page.locator('.tc-item[data-bake="almond-croissant"] [data-bake-tag]')).toHaveText("Sold out");
    await page.getByRole("button", { name: "Add to my order" }).click();
    await expect(page.locator('[name="bake"][value="almond-croissant"]')).toBeDisabled();
    await expect(page.locator('[name="bake"][value="butter-croissant"]')).toBeEnabled();
    await srv.close();
  });
});

test.describe("Your usual", () => {
  test("builds a drink from the café's prices, saves it on the phone and orders it ahead on WhatsApp", async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const yu = page.locator("#usual");
    await yu.locator('label:has(input[name="drink"][value="flat-white"])').click();
    await yu.locator('label:has(input[name="milk"][value="oat"])').click();
    await yu.getByRole("button", { name: "One more extra shot" }).click();
    await expect(yu.locator("[data-yu-price]")).toHaveText("£4.50");
    await expect(yu.locator("[data-yu-all]")).toContainText("Contains: gluten");
    await expect(yu.locator("[data-yu-all]")).toContainText("not labelled gluten-free");
    // A drink that comes in one size only offers that size.
    await yu.locator('label:has(input[name="drink"][value="espresso"])').click();
    await expect(yu.locator('[data-yu-size="regular"]')).toBeHidden();
    await expect(yu.locator("[data-yu-milks]")).toBeHidden();
    await yu.locator('label:has(input[name="drink"][value="flat-white"])').click();
    await yu.locator('label:has(input[name="milk"][value="oat"])').click();
    await yu.getByRole("button", { name: "Save as my usual" }).click();
    await expect(yu.locator("[data-yu-saved]")).toContainText("Saved: Oat flat white");

    await page.reload();
    await expect(page.locator("[data-yu-back]")).toBeVisible();
    await expect(page.locator("[data-yu-back-name]")).toHaveText("Oat flat white");
    await expect(page.locator(".cn-usual [data-usual-name]")).toHaveText("Oat flat white");
    await page.getByRole("button", { name: "Order my usual" }).click();
    await expect(page.locator("[data-yu-lines] li")).toHaveCount(1);
    await page.locator('label:has(input[name="bake"][value="cardamom-knot"])').click();
    await page.locator("[data-yu-who]").fill("Sam");
    await expect(page.locator("[data-yu-total]")).toHaveText("£8.10");
    const text = await waText(page.locator("[data-yu-send]"));
    expect(text).toContain("1 × Flat white (regular, oat milk, 1 extra shot, to take away), £4.50");
    expect(text).toContain("1 × Cardamom knot, £3.60");
    expect(text).toContain("Total: £8.10");
    expect(text).toContain("Collection: about 8:40am");
    expect(text).toContain("Name: Sam");
    expect(text).toContain("Allergens in this order: Gluten, Eggs, Milk");
    await srv.close();
  });

  test("closed for the day: no times to pick, and it says when ordering opens", async ({ page }) => {
    await page.clock.setFixedTime(EVENING);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.getByRole("button", { name: "Add to my order" }).click();
    await expect(page.locator("[data-yu-closed]")).toHaveText("We're closed for orders now. Order ahead from 7:30am tomorrow.");
    await expect(page.locator("[data-yu-send]")).toBeHidden();
    await expect(page.locator(".bz-word")).toHaveText("Closed");
    await srv.close();
  });
});

test.describe("the glass case, busyness, work and the board", () => {
  test("tapping a bake shows its allergens and asks for one to be put aside", async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const knot = page.locator('.tc-item[data-bake="cardamom-knot"]');
    await knot.scrollIntoViewIfNeeded();
    await expect(knot.locator("img")).toHaveAttribute("src", /bake-knot\.webp/);
    await knot.click();
    await expect(knot).toHaveAttribute("aria-pressed", "true");
    const info = page.locator("[data-tc-info]");
    await expect(info).toContainText("Cardamom knot");
    await expect(info).toContainText("Contains: gluten, eggs, milk.");
    await info.getByLabel("I'll be there in about").selectOption("30");
    const text = await waText(info.getByRole("link", { name: "Put one aside for me" }));
    expect(text).toContain("1 × Cardamom knot, £3.60");
    expect(text).toContain("I'll be there in about 30 minutes.");
    await srv.close();
  });

  test("how busy: staff's word while fresh, the usual hour otherwise; laptop hours and the board", async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-bz-src]")).toHaveText("Right now, from the counter");
    await expect(page.locator(".bz-word")).toHaveText("Steady");
    await expect(page.locator("[data-bz-line]")).toContainText("About a four-minute queue");
    await expect(page.locator('[data-bz-day="3"] td.is-now')).toHaveCount(1);
    await expect(page.locator("[data-wh-win]")).toHaveText("10am–12pm and 2pm–4pm");
    await expect(page.locator(".rb-card")).toHaveCount(4);
    await expect(page.locator(".rb-card").first()).toContainText("Saturday-morning jazz");
    await srv.close();
  });
});

test.describe("seats and brunch, sent with the table request", () => {
  test("a seat with a socket by the window, and two brunch plates, go with a weekend request", async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.locator(".sf-needs").getByRole("button", { name: "A socket" }).click();
    await page.locator(".sf-needs").getByRole("button", { name: "By the window" }).click();
    await expect(page.locator("[data-sf-count]")).toHaveText("1 seat has all of that.");
    await page.locator('[data-sf-seat="window-bench"]').click();
    await expect(page.locator("[data-sf-choice]")).toHaveText("The window bench · 6 seats");

    const bb = page.locator("#brunch");
    await bb.locator('label:has(input[value="eggs-royale"])').click();
    await bb.locator('label:has(input[value="bacon"])').click();
    await bb.getByRole("button", { name: "+ Add a plate" }).click();
    await bb.locator('label:has(input[value="eggs-avocado"])').click();
    await expect(bb.locator("[data-bb-total]")).toHaveText("£28.50");
    await bb.getByRole("link", { name: "Add to my table request" }).click();

    const tr = page.locator("#book");
    // Weekdays are walk-in: the first day offered is Saturday.
    await expect(tr.locator("[data-tr-day] option").first()).toHaveText(/^Sat,? 31 Oct$/);
    await expect(tr.locator("[data-tr-seat]")).toContainText("the window bench (by the window, a socket)");
    await expect(tr.locator("[data-tr-brunch]")).toHaveText("Pre-ordered: 2 plates, £28.50");
    const text = await waText(tr.locator("[data-tr-send]"));
    expect(text).toContain("We'd like to pre-order:\nPlate 1: Eggs royale with streaky bacon, £17");
    expect(text).toContain("Brunch total: £28.50");
    expect(text).toContain("Where we'd like to sit, if you can: the window bench");
    await srv.close();
  });
});

test.describe("a café client on the Counter look", () => {
  test("reads its live sheet within the CSP, tags its bakes, and says nothing when the sheet fails", async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    const blocked = [];
    page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) blocked.push(m.text()); });
    await page.route(SHEET, (r) => r.fulfill({ contentType: "text/csv", body: "kind,name,price,note,updated_at\nfresh,cardamom-knot,,,2026-10-28 08:15\nsoldout,scone,,,2026-10-28 08:20\nboard,Guest roaster,,A washed Ethiopian,2026-10-27 08:00\n" }));
    const srv = await start(client);
    await page.goto(srv.base + "/");
    await expect(page.locator(".cn-arch")).toHaveCount(0);
    await expect(page.locator('.sp-bakes [data-bake="cardamom-knot"]')).toContainText("Fresh out 8:15am");
    await expect(page.locator('.sp-bakes [data-bake="scone"]')).toContainText("Sold out");
    await expect(page.locator(".rb-card")).toHaveCount(1);
    await expect(page.locator("#usual")).toBeVisible();
    expect(blocked).toEqual([]);
    await page.unroute(SHEET);
    await page.route(SHEET, (r) => r.abort());
    await page.reload();
    await expect(page.locator("[data-sp-off]")).toHaveText("Ask us what's fresh.");
    await expect(page.locator(".sp-bakes [data-state]")).toHaveCount(0);
    await expect(page.locator("[data-rb-off]")).toBeVisible();
    await srv.close();
  });

  test("without JavaScript: the price list, a plain WhatsApp link and the case's names and allergens", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator(".yu-nojs a")).toBeVisible();
    await page.locator(".yu-list summary").click();
    await expect(page.locator(".yu-table")).toContainText("Flat white");
    await expect(page.locator(".yu-extras")).toContainText("Oat milk +£0.40");
    await expect(page.locator('.tc-item[data-bake="cardamom-knot"]')).toContainText("Cardamom knot");
    await expect(page.locator("#case button")).toHaveCount(0);
    await expect(page.locator("#case .tc-hint")).toBeHidden();
    await expect(page.locator(".sf-all")).toBeVisible();
    await ctx.close();
    await srv.close();
  });
});

test("the loyalty card works out free coffees a year from the café's own flat white price", async ({ page }) => {
  await page.clock.setFixedTime(MORNING);
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ly = page.locator("#loyalty");
  await expect(ly.locator("[data-ly-out]")).toHaveText("A flat white 5 times a week is 260 a year: 32 free, worth £112.");
  await ly.locator("[data-ly-range]").fill("2");
  await expect(ly.locator("[data-ly-out]")).toHaveText("A flat white 2 times a week is 104 a year: 13 free, worth £45.50.");
  await srv.close();
});
