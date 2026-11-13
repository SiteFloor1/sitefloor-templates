// Restaurant features (menu, specials, live board, table request, The Table, The Room, The Pass, takeaway,
// events, private dining) and the Carte look's day and evening, as a customer uses them.
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/restaurant");
const client = site("_fixtures/test-restaurant-client");
const SHEET = /docs\.google\.com\/spreadsheets/;
// Thursday 29 Oct 2026 (GMT): lunch at 12:40, dinner at 19:20.
const LUNCH = new Date("2026-10-29T12:40:00Z");
const DINNER = new Date("2026-10-29T19:20:00Z");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test.describe("the menu and the Carte look", () => {
  test("shows the sitting on now, with the kitchen line, and filters by diet and allergy", async ({ page }) => {
    await page.clock.setFixedTime(LUNCH);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-mn-kitchen]")).toHaveText("Lunch · kitchen open until 2:30pm");
    await expect(page.locator("#mn-lunch")).toBeVisible();
    await expect(page.locator("#mn-dinner")).toBeHidden();
    const halloumi = page.locator('#mn-lunch [data-dish="halloumi"]');
    const hummus = page.locator('#mn-lunch [data-dish="hummus"]');
    await expect(halloumi).toContainText("Contains: milk");
    await page.locator('.mn label:has(input[name="mn-diet"][value="vegan"])').click();
    await expect(halloumi).toBeHidden();
    await expect(hummus).toBeVisible();
    await page.locator(".mn-avoid summary").click();
    await page.locator('.mn label:has(input[name="mn-avoid"][value="sesame"])').click();
    await expect(hummus).toBeHidden();
    await expect(page.locator("[data-mn-hidden]")).toContainText("hidden on this menu");
    expect(await page.evaluate(() => document.documentElement.dataset.mood)).toBe("day");
    await srv.close();
  });

  test("an evening visitor gets the evening colours before any script loads, within the CSP", async ({ page }) => {
    await page.clock.setFixedTime(DINNER);
    const blocked = [];
    page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) blocked.push(m.text()); });
    await page.route(/assets\/site-.*\.js$/, (r) => r.abort());
    await page.route(SHEET, (r) => r.abort());
    const srv = await start(client); // the Carte look
    await page.goto(srv.base + "/");
    expect(await page.evaluate(() => document.documentElement.dataset.mood)).toBe("evening");
    expect(blocked).toEqual([]);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(25, 17, 19)");
    await srv.close();
  });

  test("picking a sitting's tab previews it, and today's sold-out dish is marked", async ({ page }) => {
    await page.clock.setFixedTime(LUNCH);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.getByRole("tab", { name: /Dinner/ }).first().click();
    await expect(page.locator("#mn-dinner")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.mood)).toBe("evening");
    await expect(page.locator('#mn-dinner [data-dish="whole-bream"] [data-out]')).toBeVisible();
    await expect(page.locator("[data-sp-out]")).toHaveText("Sold out today: Whole sea bream");
    await expect(page.locator("[data-sp-list] li")).toHaveCount(2);
    await srv.close();
  });
});

test.describe("booking a table", () => {
  test("The Table and The Room fill in the request", async ({ page }) => {
    await page.clock.setFixedTime(LUNCH);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.locator("#table summary").click();
    await page.locator("#room summary").click();
    // The demo opens with six guests; guest 2 is vegan.
    const halloumi = page.locator('.tb-dish[data-sit="lunch"][data-dish="halloumi"]');
    await expect(halloumi.locator("[data-tb-why]")).toContainText("Not for guest 2 (not vegan)");
    await expect(page.locator("[data-tb-share]")).toContainText("work for the whole table");
    await page.locator('.tb-seat[data-i="0"]').click();
    await page.locator('[data-tb-avoid] label:has(input[value="milk"])').click();
    await expect(halloumi.locator("[data-tb-why]")).toContainText("guest 1 (has milk)");
    await page.locator('[data-table="b1"]').click();
    await expect(page.locator("[data-rm-choice]")).toHaveText("Booth 1 · Booths · seats 4");
    await expect(page.locator("[data-rm-fit]")).toContainText("seats 4; for 6");
    const send = page.locator("[data-tr-send]");
    await expect(page.locator("[data-tr-guests]")).toHaveValue("6");
    const text = await waText(send);
    expect(text).toContain("Table for 6");
    expect(text).toContain("Where we'd like to sit, if you can: Booth 1 (booths)");
    expect(text).toContain("Our group: 6 guests.");
    expect(text).toContain("milk (1)");
    await srv.close();
  });

  test("times stay inside the sittings, and today's past times are gone", async ({ page }) => {
    await page.clock.setFixedTime(DINNER);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const times = page.locator("[data-tr-times] input");
    await expect(times.first()).toHaveAttribute("value", "20:00"); // 7:20pm now: half an hour's notice, on the quarter hour
    await expect(times.last()).toHaveAttribute("value", "21:15"); // 30 minutes before 9:45pm last orders
    await srv.close();
  });
});

test("The Pass: one plate at a time, the next photo loads only when picked", async ({ page }) => {
  await page.clock.setFixedTime(LUNCH);
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const shish = page.locator('[data-ps-dish="shish"]');
  await expect(shish).toBeHidden();
  expect(await shish.locator("img").getAttribute("src")).toBeNull();
  if ((page.viewportSize()?.width ?? 1000) <= 760) {
    // On a phone the plates are stories: tap the plate's right edge for the next one.
    const plate = page.locator('[data-ps-dish="joojeh"] .ps-plate');
    const box = await plate.boundingBox();
    await plate.click({ position: { x: (box?.width ?? 300) * 0.96, y: 6 } });
    await expect(page.locator("[data-ps-bar].on")).toHaveCount(1);
  } else await page.locator('[data-ps-tab="shish"]').click();
  await expect(shish).toBeVisible();
  await expect(shish.locator("img")).toHaveAttribute("src", /pass-shish\.webp/);
  await expect(shish.locator(".ps-ticket")).toContainText("Allergens");
  await expect(shish.locator("[data-ps-who]")).toContainText("At your table:");
  await srv.close();
});

test("Maison: the fire loop starts after the page; the Menu Book opens, turns and shows a dish as a polaroid; the PDF menu downloads", async ({ page }) => {
  await page.clock.setFixedTime(LUNCH);
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  // The fire loop: its still paints first; the video starts only after the page has loaded.
  await expect(page.locator(".hf-poster")).toHaveAttribute("src", /hero-fire\.webp/);
  await expect(page.locator(".hf-vid")).toHaveAttribute("src", /hero-fire\.mp4/);
  // Pause (WCAG 2.2.2): stops the loop, and a paused visit doesn't load it again on the next page.
  const pause = page.locator(".mx [data-motion-pause]");
  await pause.click();
  await expect(pause).toHaveText("Play");
  await expect(pause).toHaveAttribute("aria-label", "Play the moving background");
  await expect(page.locator(".mx-glow")).toHaveAttribute("data-motion", "");
  expect(await page.evaluate(() => document.querySelector(".hf-vid").paused)).toBe(true);
  await page.reload();
  await expect(page.locator(".mx [data-motion-pause]")).toHaveText("Play");
  expect(await page.locator(".hf-vid").getAttribute("src")).toBeNull();
  await page.locator(".mx [data-motion-pause]").click();
  await expect(page.locator(".hf-vid")).toHaveAttribute("src", /hero-fire\.mp4/);
  await page.locator(".mx .btn[data-mb-open]").click();
  const dlg = page.locator("[data-mb-dlg]");
  await expect(dlg).toBeVisible();
  const count = page.locator("[data-mb-count]");
  await expect(count).toContainText(/of \d+/);
  const before = await count.textContent();
  await page.locator("[data-mb-next]").click();
  await expect(count).not.toHaveText(before ?? "");
  await expect(page.locator("[data-mb-book]")).toContainText("Whole sea bream");
  // A dish with a photo drops it onto the page like a polaroid; Escape lifts it away, then closes the book.
  await page.locator('.mbp-ph[data-mb-name="Joojeh with saffron rice"]').first().focus();
  await page.keyboard.press("Enter");
  const pol = page.locator("[data-mb-pol]");
  await expect(pol).toBeVisible();
  await expect(pol.locator("img")).toHaveAttribute("src", /pass-joojeh\.webp/);
  await expect(pol).toContainText("Joojeh with saffron rice");
  await page.keyboard.press("Escape");
  await expect(pol).toBeHidden();
  await expect(dlg).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
  const pdf = await page.request.get(srv.base + "/menu.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await srv.close();
});

test("the Menu Book's cover changes for the season before any script loads", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-30T19:00:00Z"));
  await page.route(/assets\/site-.*\.js$/, (r) => r.abort());
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  expect(await page.evaluate(() => document.documentElement.dataset.season)).toBe("festive");
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".mx-table .mb-season"), "::before").content)).toBe('"Christmas"');
  await srv.close();
});

test("takeaway: total, the order's allergens and the WhatsApp order", async ({ page }) => {
  await page.clock.setFixedTime(LUNCH);
  const srv = await start(demo);
  await page.goto(srv.base + "/takeaway");
  const send = page.locator("[data-od-send]");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  const plus = (id) => page.locator(`.od-item[data-dish="${id}"] [data-od-plus]`).click();
  await plus("hummus"); await plus("hummus"); await plus("mixed-grill");
  await expect(page.locator("[data-od-total]")).toHaveText("£33");
  await expect(page.locator("[data-od-all]")).toHaveText("Allergens in this order: Gluten, Milk, Mustard, Sesame.");
  await page.locator("[data-od-name]").fill("Sam");
  await expect(send).toHaveAttribute("aria-disabled", "false");
  const text = await waText(send);
  expect(text).toContain("2 × Hummus, £14");
  expect(text).toContain("Total: £33");
  expect(text).toMatch(/Collection: \d{1,2}(:\d{2})?pm/);
  expect(text).toContain("Allergens in this order: Gluten, Milk, Mustard, Sesame");
  await srv.close();
});

test("events: past events drop off by themselves; calendar file in UTC", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-20T10:00:00Z"));
  const srv = await start(demo);
  await page.goto(srv.base + "/events");
  await expect(page.locator('[data-ev="bonfire"]')).toBeHidden();
  await expect(page.locator('[data-ev="persian-feast"]')).toBeHidden();
  await expect(page.locator('[data-ev="sunday-lamb"]')).toBeVisible();
  const download = page.waitForEvent("download");
  await page.locator('[data-ev-ics="sunday-lamb"]').click();
  const file = await (await download).path();
  const { readFileSync } = await import("node:fs");
  expect(readFileSync(file, "utf8")).toContain("DTSTART:20261206T130000Z");
  await srv.close();
});

test("private dining: set menu total against the minimum spend, in the enquiry", async ({ page }) => {
  await page.clock.setFixedTime(LUNCH);
  const srv = await start(demo);
  await page.goto(srv.base + "/private-dining");
  await page.locator("[data-pd-menusel]").selectOption("feast");
  await page.locator("[data-pd-guests]").fill("12");
  await expect(page.locator("[data-pd-sum]")).toHaveText("The feast: £456 for 12; the room's minimum spend is £500.");
  await page.locator("[data-pd-guests]").fill("14");
  await expect(page.locator("[data-pd-sum]")).toHaveText("The feast: £532 for 14, which covers the £500 minimum spend.");
  expect(await waText(page.locator("[data-pd-send]"))).toContain("Guests: 14");
  await srv.close();
});

test.describe("a client's live sheet", () => {
  test("today's specials and walk-in tables show; old rows and an old walk-in line don't", async ({ page }) => {
    await page.clock.setFixedTime(DINNER);
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "kind,name,price,note,updated_at\ntables,free,,,2026-10-29 19:10\nspecial,Lamb neck,19,,2026-10-29 11:00\nspecial,Yesterday's soup,6,,2026-10-28 11:00\nsoldout,hummus,,,2026-10-29 18:00\n" }));
    const srv = await start(client);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-sp-list] li")).toHaveCount(1);
    await expect(page.locator("[data-sp-list]")).toContainText("Lamb neck");
    await expect(page.locator("[data-tn-tables]")).toHaveText("Walk-in tables free now");
    await expect(page.locator('#mn-dinner [data-dish="hummus"]')).toHaveClass(/is-out/);
    await page.unroute(SHEET);
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "kind,name,price,note,updated_at\ntables,free,,,2026-10-29 17:30\n" }));
    await page.reload();
    await expect(page.locator("[data-tn-tables]")).toHaveText("Ask us");
    await expect(page.locator("[data-sp-off]")).toBeVisible();
    await srv.close();
  });

  test("an unreadable sheet says to ask, and never shows old data", async ({ page }) => {
    await page.clock.setFixedTime(DINNER);
    await page.route(SHEET, (r) => r.fulfill({ status: 500, body: "" }));
    const srv = await start(client);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-sp-off]")).toBeVisible();
    await expect(page.locator("[data-tn-tables]")).toHaveText("Ask us");
    await expect(page.locator("[data-tn-off]")).toBeVisible();
    await srv.close();
  });
});
