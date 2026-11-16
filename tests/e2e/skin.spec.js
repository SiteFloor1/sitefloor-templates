// Skin kit and the Palm look, as a client uses them: the photograph and "How does your skin feel today?" within reach
// on a phone, each word's printed card in the clinic's own words with the booking message, the ritual adding up, the
// gift card drawn as it's typed, the treatment rhythm saved to the calendar, the patch-test day, and a client's site.
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/skin-clinic");
const client = site("_fixtures/test-skin-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("each word shows its own card, in the clinic's words, and books with the choice in the message", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await expect(page.locator("h1")).toHaveText("How does your skin feel today?");
  await expect(page.locator(".mbar .pm-bar-go")).toBeVisible();
  await expect(page.locator(".sk-card:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "uneven" }).click();
  const card = page.locator(".sk-card:visible");
  await expect(card.locator(".sk-card-t")).toHaveText("Light peel");
  await expect(card).toContainText("45 minutes · £80");
  await expect(card).toContainText("Yes, 48 hours before. We book it with you.");
  await expect(card).toContainText("Cool water only. No make-up, retinol or scrubs for 48 hours.");
  expect(await waText(card.locator(".sk-card-go"))).toBe("Hello Clémence, I'd like to book the Light peel (45 minutes, £80). My skin feels uneven today.");
  await expect(page.getByRole("button", { name: "uneven" })).toHaveAttribute("aria-pressed", "true");
  await srv.close();
});

test("the ritual adds up its minutes and price, and sends the whole ritual", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/rituals.html");
  await page.getByLabel(/Long facial/).check();
  await page.getByLabel(/A scalp ritual/).check();
  await page.getByLabel(/A brow shape/).check();
  await expect(page.locator("[data-rt-total]")).toHaveText("2 hours · £178");
  expect(await waText(page.locator("[data-rt-send]"))).toBe("Hello Clémence, I'd like to book a ritual: Long facial with a scalp ritual and a brow shape. That's 120 minutes, £178.");
  await srv.close();
});

test("the gift card is drawn as it's typed; on the demo the gift goes to WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/gifts.html");
  await page.getByLabel(/An hour/).check();
  await page.getByRole("textbox", { name: "For", exact: true }).fill("Ana");
  await page.getByRole("textbox", { name: "From", exact: true }).fill("Sam");
  await expect(page.locator("[data-gc-to]")).toHaveText("A gift for Ana");
  await expect(page.locator("[data-gc-day]")).toHaveText("An hour");
  await expect(page.locator("[data-gc-from]")).toHaveText("With love from Sam");
  await expect(page.locator("[data-sd-buy]")).toHaveText("Buy this gift · £95");
  expect(await waText(page.locator("[data-sd-buy]"))).toBe("Hello Clémence, I'd like to give the An hour (£95). It's for Ana, from Sam.");
  await srv.close();
});

test("the treatment rhythm lists only days ahead and saves them as one calendar file", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/courses.html");
  await page.locator("[data-rh-item]").selectOption("peel");
  await expect(page.locator("[data-rh-list] li")).toHaveCount(6);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-rh-ics]").click()]);
  expect(dl.suggestedFilename()).toBe("peel-rhythm.ics");
  await page.locator("[data-rh-date]").fill("2020-01-01");
  await page.locator("[data-rh-date]").dispatchEvent("change");
  await expect(page.locator("[data-rh-list] li")).toHaveCount(0);
  await expect(page.locator("[data-rh-ics]")).toBeHidden();
  await srv.close();
});

test("the patch-test day comes from the clinic's rule; a past date offers nothing", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/first-visit.html");
  const d = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  await page.locator("[data-pt-date]").fill(d);
  await page.locator("[data-pt-date]").dispatchEvent("change");
  await expect(page.locator("[data-pt-out]")).toContainText("Your patch test: on or before");
  await expect(page.locator("[data-pt-ics]")).toBeVisible();
  await page.locator("[data-pt-date]").fill("2020-01-01");
  await page.locator("[data-pt-date]").dispatchEvent("change");
  await expect(page.locator("[data-pt-out]")).toHaveText("That date has passed.");
  await expect(page.locator("[data-pt-ics]")).toBeHidden();
  await srv.close();
});

test("a Plus client gets the finder and its own pages, never a demo's showpieces", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await expect(page.locator("h1")).toHaveText("How does your skin feel today?");
  await expect(page.locator("#reviews")).toBeVisible();
  for (const p of ["rituals", "gifts", "bridal", "journal"]) expect((await page.request.get(`${srv.base}/${p}.html`)).status()).toBe(404);
  await srv.close();
});
