// Cakes kit and the Atelier look, as a client uses them: the statement cake and the servings calculator on the first
// screen (the tiers built in type, the phone bar following), choose by the slice, is your date free (the demo's diary,
// and a client whose sheet can't be read: "ask us", never "free"), the order brief on WhatsApp, the venue check, and
// a page for each commission.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/cakes");
const client = site("_fixtures/test-cakes-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the first screen is the cake and the question; the answer is built in type and follows the guests", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator(".at-hero-f img")).toBeVisible();
  await expect(page.locator(".at-hero .ck-serve-q")).toHaveText("How many are you feeding?");
  await expect(page.locator("[data-sv-n]")).toHaveText("120");
  await expect(page.locator("[data-sv-tiers] .ck-tier")).toHaveText(["6 in", "8 in", "10 in"]);
  await expect(page.locator("[data-sv-from]")).toHaveText("£780");
  // bigger tiers are set bigger
  const sizes = await page.locator("[data-sv-tiers] .ck-tier").evaluateAll((all) => all.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  expect(sizes[0]).toBeLessThan(sizes[2]);
  await page.locator('[data-sv-step="-10"]').click();
  await page.locator('[data-sv-step="-10"]').click();
  await expect(page.locator("[data-sv-n]")).toHaveText("100");
  await page.locator("#sv-dessert").check();
  await expect(page.locator("[data-sv-portions]")).toHaveText(/dessert$/);
  await expect(page.locator("[data-sv-go]")).toHaveAttribute("href", /order\?guests=100&portion=dessert/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("on a phone the cake comes first, the bar carries the live answer and never covers the page", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-sv-bar]")).toHaveText("3 tiers · 120 guests");
  await page.locator('[data-sv-step="10"]').click();
  await expect(page.locator("[data-sv-bar]")).toHaveText(/· 130 guests$/);
  const bar = page.locator(".mbar");
  expect(await waText(bar.locator("a"))).toBe("Hello Pastillage, I have a question about a cake.");
  const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
  expect(pad).toBeGreaterThanOrEqual((await bar.boundingBox()).height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await srv.close();
});

test("on a phone the home page stays at about six screens, with three commissions and a link to the rest", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await expect(page.locator("#commissions .ck-piece")).toHaveCount(3);
  await expect(page.locator("#commissions .ck-more a")).toHaveAttribute("href", /commissions/);
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
  expect(screens).toBeLessThan(6.6);
  await srv.close();
});

test("choose by the slice outlines that flavour's layer and says what's in it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const band = page.locator("[data-fl-band]");
  await page.locator('[data-fl="vanilla"]').click();
  await expect(page.locator("[data-fl-now]")).toContainText("Vanilla bean sponge");
  await expect(band).toBeVisible();
  expect(await band.evaluate((e) => e.style.top)).toBe("50.8%");
  await expect(page.locator('[data-fl="vanilla"]')).toHaveAttribute("aria-pressed", "true");
  await srv.close();
});

test("is your date free: the diary's answer, and sooner than the notice is never promised", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/"); // Monday 19 October 2026
  const out = page.locator("[data-dc-result]");
  await page.locator("#dc-date").fill("2026-10-31");
  await expect(out).toHaveAttribute("data-state", "soon");
  await page.locator("#dc-date").fill("2027-06-12");
  await expect(out).toHaveAttribute("data-state", /^(booked|one|free)$/);
  await expect(out).toContainText("12 June 2027");
  expect(await waText(page.locator("[data-dc-go]"))).toContain("Saturday 12 June 2027");
  await srv.close();
});

test("a client whose diary sheet can't be read says 'ask us', never 'free'", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  await page.locator("#dc-date").fill("2027-08-14");
  await expect(page.locator("[data-dc-result]")).toHaveAttribute("data-state", "unknown");
  await expect(page.locator("[data-dc-result]")).toHaveText("Message us to check Saturday 14 August 2027.");
  await srv.close();
});

test("order a cake: guests from the calculator, a flavour per tier, one WhatsApp brief", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/order?guests=60&portion=finger");
  await expect(page.locator("[data-bb-cake]")).toHaveText("2 tiers, 6 and 8 in");
  await expect(page.locator("[data-bb-flavours] select")).toHaveCount(2);
  await page.locator("#bb-date").fill("2027-06-12");
  await page.locator("#bb-fl-0").selectOption("Honey & burnt butter");
  await page.locator("#bb-fl-1").selectOption("Vanilla & berries");
  await page.locator("#bb-venue").fill("Aynhoe Park");
  const text = await waText(page.locator("[data-bb-send]"));
  expect(text).toBe("Hello Pastillage, we'd like a cake.\nDate: Saturday 12 June 2027\nGuests: 60 (with coffee)\nCake: 2 tiers, 6 and 8 in\nFlavours, top to bottom: Honey & burnt butter; Vanilla & berries\nVenue: Aynhoe Park");
  await expect(page.locator("[data-bb-preview]")).toHaveText(text);
  await srv.close();
});

test("will you bring it to us: the studio's own area, or ask for the venue", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/delivery");
  await page.locator("#vc-postcode").fill("rg9 2ab");
  await page.locator("#delivery button[type=submit]").click();
  await expect(page.locator("[data-vc-result]")).toHaveText(/^Yes, we come to RG9 \(Home Counties\)\. Delivery and set-up from £90/);
  await page.locator("#vc-postcode").fill("YO1 7HH");
  await page.locator("#delivery button[type=submit]").click();
  await expect(page.locator("[data-vc-result]")).toHaveText("Send us the venue for YO1 and we'll quote within a day.");
  await srv.close();
});

test("each commission has its own page and a message naming the cake", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/commissions");
  await page.locator('a[href*="commission-verdure"]').first().click();
  await expect(page.locator("h1")).toHaveText("Verdure");
  expect(await waText(page.getByRole("link", { name: "Commission one like it" }))).toBe("Hello Pastillage, I'd love a cake like No. 22 Verdure. Could we talk about it?");
  await srv.close();
});
