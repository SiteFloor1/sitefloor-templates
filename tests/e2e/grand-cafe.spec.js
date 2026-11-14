// The grand café (the Salon look and the Grenat demo): the room by day and by candlelight, afternoon tea's concierge
// card with Your table, the salon plan, the seasonal stands, the tea sommelier, Give a sitting, the pâtisserie window
// and its box, candlelight tonight, cakes to order, the sittings and live music, and the pages they live on.
import { readFileSync } from "node:fs";
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/grand-cafe");
// Wednesday 28 Oct 2026 (GMT): 3:30pm is afternoon tea with the harp; 8:30pm is candlelight.
const TEA = new Date("2026-10-28T15:30:00Z");
const NIGHT = new Date("2026-10-28T20:30:00Z");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL(await loc.getAttribute("href") ?? "").searchParams.get("text") ?? "";

test.describe("the room", () => {
  test("by day the daylight room on cream; by candlelight the evening room on garnet; phones get their own crop", async ({ page, browser }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(TEA);
    await page.goto(srv.base + "/");
    await expect(page.locator("html")).toHaveAttribute("data-mood", "day");
    expect(await page.locator(".sa-room").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("hero-day.webp");
    await expect(page.locator(".sa-name")).toHaveText("Grenat");
    await page.clock.setFixedTime(NIGHT);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-mood", "evening");
    expect(await page.locator(".sa-room").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("hero-evening.webp");
    await expect(page.locator(".sa-room").getByRole("img")).toHaveAccessibleName(/^The salon by candlelight/);
    await expect(page.locator(".sa-room").getByRole("img")).toHaveCount(1);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const phone = await ctx.newPage();
    await phone.clock.setFixedTime(TEA);
    await phone.goto(srv.base + "/");
    expect(await phone.locator(".sa-room").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("hero-day-s.webp");
    await ctx.close();
    await srv.close();
  });

  test("the sittings mark afternoon tea as now; on What's on the harp is playing; by night, the harp tomorrow", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(TEA);
    await page.goto(srv.base + "/");
    await expect(page.locator('[data-si="tea"]')).toHaveAttribute("data-state", "now");
    await expect(page.locator("[data-si-line]")).toHaveText("Afternoon tea · kitchen open until 6pm");
    await page.goto(srv.base + "/events");
    await expect(page.locator("[data-mu-now]")).toHaveText("Playing now: the harp, until 6pm");
    await page.clock.setFixedTime(NIGHT);
    await page.reload();
    await expect(page.locator("[data-mu-now]")).toHaveText("Next: the harp, tomorrow from 3pm");
    await srv.close();
  });
});

test.describe("afternoon tea", () => {
  test("the concierge card and Your table send one request: each guest's tea, needs and place card, the champagne, the words for the plate", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(TEA);
    await page.goto(srv.base + "/");
    const card = page.locator("#book");
    await expect(card.locator("[data-tr-times] option").first()).toHaveText("4pm");
    const yt = page.locator("#your-table");
    await yt.getByRole("button", { name: "Guest 2" }).click();
    await yt.getByLabel("Name for the place card").fill("Clara");
    await expect(yt.getByRole("button", { name: "Clara" })).toHaveAttribute("aria-pressed", "true");
    await yt.getByLabel("With a glass of champagne").check();
    await yt.getByLabel("Vegan").check();
    await yt.locator(".yt-avoid summary").click();
    await yt.getByLabel("Sesame").check();
    await expect(yt.locator('[data-dish="opera"]')).toHaveAttribute("data-state", "swap");
    await expect(yt.locator('[data-dish="opera"] [data-yt-why]')).toContainText("not vegan");
    await expect(yt.locator('[data-dish="delice"]')).not.toHaveAttribute("data-state");
    await expect(yt.locator("[data-yt-note]")).toContainText("made differently for you");
    await yt.getByLabel("The occasion").selectOption("birthday");
    await yt.getByLabel("Words for the plate").fill("Happy birthday, Clara");
    await yt.getByLabel("Rosé champagne, the bottle").check();
    await expect(yt.locator(".yt-card-n")).toHaveText(["Guest 1", "Clara"]);
    await expect(card.locator("[data-tr-group]")).toContainText("Guest 2 (Clara): vegan, no sesame");
    const text = await waText(card.locator("[data-tr-send]"));
    expect(text).toContain("Table for 2");
    expect(text).toContain("Afternoon tea (1), With a glass of champagne (1)");
    expect(text).toContain("Place cards: Guest 1, Clara.");
    expect(text).toContain("For the table: Rosé champagne, the bottle, £110.");
    expect(text).toContain("on the plate: “Happy birthday, Clara”");
    await srv.close();
  });

  test("on a phone the card's choices show whole words, even where the browser can't size them to the word", async ({ browser }) => {
    const srv = await start(demo);
    const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(TEA);
    await p.goto(srv.base + "/");
    for (const sizing of ["content", "fixed"]) {
      await p.addStyleTag({ content: `.sa-sentence select { field-sizing: ${sizing} !important; }` });
      for (const s of await p.locator(".sa-sentence select").all()) {
        const { scroll, client } = await s.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
        expect(scroll, `${sizing}: a choice is clipped`).toBeLessThanOrEqual(client + 1);
      }
    }
    await ctx.close();
    await srv.close();
  });

  test("the tea sommelier: three answers, one tea from the library", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/afternoon-tea");
    const ts = page.locator("#sommelier");
    await expect(ts.locator("[data-ts-name]")).toHaveText("The Grenat blend");
    await ts.getByLabel("Evening").check();
    await ts.getByLabel("Without").check();
    await ts.getByLabel("Light").check();
    await expect(ts.locator("[data-ts-name]")).toHaveText("Chamomile flowers");
    await expect(ts.locator("[data-ts-brew]")).toHaveText("5 minutes at 98°C.");
    await expect(ts.locator("[data-ts-pairs]")).toHaveText("With the pomegranate tart.");
    await srv.close();
  });

  test("Give a sitting: the card is set as you write, paid by the shop's own Stripe link, the names sent on WhatsApp", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/gifts");
    const gs = page.locator("#give");
    await gs.getByLabel("Afternoon tea for two, with champagne").check();
    await gs.getByLabel("For", { exact: true }).fill("Clara");
    await gs.getByLabel("From", { exact: true }).fill("Sam");
    await gs.getByLabel("A line for the card").fill("Happy birthday");
    await expect(gs.locator("[data-gs-cto]")).toHaveText("Clara");
    await expect(gs.locator("[data-gs-what]")).toHaveText("Afternoon tea for two, with champagne");
    await expect(gs.locator("[data-gs-pay]")).toHaveAttribute("href", "https://buy.stripe.com/test_grenatChampagneTwo");
    await expect(gs.locator("[data-gs-pay]")).toHaveText("Pay £168 by card");
    const text = await waText(gs.locator("[data-gs-send]"));
    expect(text).toContain("For: Clara");
    expect(text).toContain("On the card: “Happy birthday”");
    await srv.close();
  });
});

test.describe("cakes to order", () => {
  test("the first day is after the cake's notice; over £60 the order asks for the £20 deposit", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(TEA);
    await page.goto(srv.base + "/takeaway");
    const day = page.locator("[data-od-day]");
    await page.getByRole("button", { name: "Add Three-tier fig and honey" }).click();
    await expect(day.locator("option").first()).toHaveText("Wednesday 4 November (the first we can make it)");
    await expect(page.locator("[data-od-deposit]")).toBeVisible();
    await expect(page.locator("[data-od-deposit]")).toHaveText("Pay the £20 deposit by card");
    const text = await waText(page.locator("[data-od-send]"));
    expect(text).toContain("Collection: Wednesday 4 November, ");
    expect(text).toContain("Deposit: £20, paying by card online");
    await page.getByRole("button", { name: "One fewer Three-tier fig and honey" }).click();
    await expect(page.locator("[data-od-deposit]")).toBeHidden();
    await srv.close();
  });
});

test("without JavaScript: the stand and the window with every piece's allergens, the tea library, the salon's places, and plain links to give a sitting", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator('#your-table [data-dish="salmon"]')).toContainText("Contains gluten, fish, milk");
  await expect(page.locator("#your-table .yt-who")).toBeHidden();
  await expect(page.locator("#book .sa-nojs a")).toBeVisible();
  await expect(page.locator("#window .wn-a").first()).toHaveText("Contains gluten, eggs, milk");
  await expect(page.locator("#window .wn-plain a")).toBeVisible();
  await page.goto(srv.base + "/afternoon-tea");
  await page.locator(".ts-lib summary").click();
  await expect(page.locator(".ts-lib")).toContainText("Silver Needle");
  await expect(page.locator("#salon .spl-list")).toContainText("Beneath the glass roof");
  await page.goto(srv.base + "/gifts");
  await expect(page.locator("#give .gs-plain a").first()).toHaveAttribute("href", /buy\.stripe\.com\/test_/);
  await ctx.close();
  await srv.close();
});

test.describe("the pâtisserie window", () => {
  test("a sold-out piece can't go in; the box fills to six, then pay by the shop's Stripe link and send it to collect", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(TEA);
    await page.goto(srv.base + "/");
    const wn = page.locator("#window");
    await expect(wn.locator('[data-dish="eclair-fraise"] [data-out]')).toBeVisible();
    await expect(wn.getByRole("button", { name: "Add Éclair fraise to the box" })).toBeDisabled();
    await expect(wn.locator("[data-wn-pay]")).toHaveAttribute("aria-disabled", "true");
    for (let i = 0; i < 4; i++) await wn.getByRole("button", { name: "Add Dôme chocolat to the box" }).click();
    for (let i = 0; i < 2; i++) await wn.getByRole("button", { name: "Add Tarte au citron to the box" }).click();
    await expect(wn.locator("[data-wn-left]")).toHaveText("The box is full.");
    await expect(wn.getByRole("button", { name: "Add Mûre to the box" })).toBeDisabled();
    await wn.getByLabel("Name for the box").fill("Clara");
    await expect(wn.locator("[data-wn-pay]")).toHaveAttribute("href", "https://buy.stripe.com/test_grenatBoxSix");
    await expect(wn.locator("[data-wn-pay]")).toHaveText("Pay £42 by card");
    const text = await waText(wn.locator("[data-wn-send]"));
    expect(text).toContain("The Grenat box of six, £42");
    expect(text).toContain("4 × Dôme chocolat");
    expect(text).toContain("2 × Tarte au citron");
    expect(text).toContain("To collect: Wednesday 28 October");
    expect(text).not.toContain("Today");
    expect(text).toContain("Name: Clara");
    await wn.getByLabel("The Grenat box of twelve").check();
    await expect(wn.locator("[data-wn-left]")).toHaveText("6 more to choose.");
    await expect(wn.locator("[data-wn-pay]")).toHaveAttribute("href", "https://buy.stripe.com/test_grenatBoxTwelve");
    await expect(wn.locator("[data-wn-send]")).toHaveAttribute("aria-disabled", "true");
    await page.clock.setFixedTime(new Date("2026-10-28T23:40:00Z"));
    await page.reload();
    await expect(page.locator("[data-wn-when] option").first()).toHaveText("Tomorrow, Thursday 29 October");
    await srv.close();
  });
});

test.describe("the pages", () => {
  test("afternoon tea: the place on the salon plan goes with the request; the next seasonal stand leads", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(TEA);
    await page.goto(srv.base + "/afternoon-tea");
    await page.locator("#salon").getByRole("button", { name: "Beneath the glass roof" }).click();
    await expect(page.locator("#book [data-tr-seat]")).toHaveText("Where: Beneath the glass roof. A preference; we'll do our best.");
    expect(await waText(page.locator("#book [data-tr-send]"))).toContain("Beneath the glass roof");
    await page.locator("#salon").getByRole("button", { name: "Beneath the glass roof" }).click();
    await expect(page.locator("#book [data-tr-seat]")).toBeHidden();
    await expect(page.locator(".st-item").first()).toHaveAttribute("data-st", "christmas");
    await expect(page.locator('.st-item[data-st="christmas"] [data-st-state]')).toHaveText("Next");
    await srv.close();
  });

  test("the home page leads with the tea room and the window; the rest live on their pages, each in the menu", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(NIGHT);
    await page.goto(srv.base + "/");
    for (const id of ["#book", "#your-table", "#window", "#tonight"]) await expect(page.locator(id)).toHaveCount(1);
    for (const id of ["#sommelier", "#give", "#salon", "#seasons", "#questions"]) await expect(page.locator(id)).toHaveCount(0);
    await expect(page.locator("[data-tn-tables]")).toHaveText("A few walk-in tables left");
    for (const href of ["/afternoon-tea", "/gifts", "/events", "/visit"]) await expect(page.locator(`#mnav a[href="${href}"]`)).toHaveCount(1);
    await page.goto(srv.base + "/visit");
    await expect(page.locator(".dc")).toContainText("Smart, never stiff.");
    await expect(page.locator("#questions")).toContainText("Do I need to book?");
    await page.goto(srv.base + "/events");
    // The page lists the evenings from the build's day on (UTC, as the build counts it), so the first one depends on
    // when this runs: compare with the demo's own list rather than a fixed title.
    const items = JSON.parse(readFileSync(new URL("../../sites/demos/grand-cafe/site.json", import.meta.url), "utf8")).events.items;
    const today = new Date().toISOString().slice(0, 10);
    const next = items.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) await expect(page.locator("[data-ev]").first()).toContainText(next.title);
    await srv.close();
  });
});
