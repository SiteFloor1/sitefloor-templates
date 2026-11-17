// Stalls kit and the Spun look, as a client uses them: the next stop and its countdown, the week's stops (Here now,
// cancelled, chosen), sold out today on the board, the board saved as a picture, party bookings that never say
// booked, the set-up card, the rain check, the stall's own sheets failing closed, the pitch finder, and the pages
// without JavaScript.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";

const demo = site("demos/stalls");
const client = site("_fixtures/test-stalls-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL(/** @type {string} */ (await loc.getAttribute("href"))).searchParams.get("text") ?? "";
// Saturday 24 October 2026, 14:30 BST: the stall is at Hackney (11:00 to 18:00).
const SAT_AFTERNOON = new Date("2026-10-24T13:30:00Z");

test("the home page keeps to the stall: the hero with the week, the board, a drop, posts, parties, questions, the pitch", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids).toEqual(["hero sp-hero", "menu", "drop", "posts", "work", "party", "questions", "visit"]);
  await expect(page.locator(".sp-hero #where")).toHaveCount(1);
  await expect(page.locator(".sp-hero img")).toHaveAttribute("src", /hero\.webp$/);
  await srv.close();
});

test("the next stop counts down from the stall's week, and choosing a ticket shows that stop", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/"); // Monday 19 October 2026, 10:30: nothing today; Wednesday at Shoreditch is next
  await featuresStarted(page);
  const next = page.locator("[data-feature='stalls-next']");
  await expect(next.locator("[data-next-where]")).toHaveText("Wednesday in Shoreditch");
  await expect(next.locator("[data-next-count]")).toHaveText("Opens in 2d 1h 30m");
  await expect(next.locator("[data-next-what]")).toHaveText("Lunch market, E1 · 12:00 till 15:00, or until we sell out.");
  await expect(next.locator("[data-next-dir]")).toHaveAttribute("href", /query=Lunch%20market%20Shoreditch%20E1$/);
  const tickets = page.locator(".sp-hero [data-where-pick]");
  await expect(tickets.first()).toHaveText(/Wed · Shoreditch/);
  await tickets.nth(2).click();
  await expect(tickets.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(next.locator("[data-next-where]")).toHaveText("Saturday in Hackney");
  expect(errors).toEqual([]);
  await srv.close();
});

test("while the stall trades: Here now, the closing time, and today's sold-out item struck through", async ({ page }) => {
  await page.clock.setFixedTime(SAT_AFTERNOON);
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-next-where]")).toHaveText("Here now in Hackney");
  await expect(page.locator("[data-next-count]")).toHaveText("Until 18:00");
  await expect(page.locator(".sp-hero [data-where-pick]").first()).toContainText("Here now");
  const biscoff = page.locator("[data-item='biscoff crunch']");
  await expect(biscoff).toHaveClass(/out/);
  await expect(biscoff.locator("[data-item-line]")).toHaveText("Sold out today at 13:10. Back next stop.");
  await expect(page.locator("[data-item='bubble waffle']")).not.toHaveClass(/out/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("Save the board makes a picture to post", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-feature='stalls-board']").click()]);
  expect(download.suggestedFilename()).toBe("fendle-board.png");
  await expect(page.locator("[data-feature='stalls-board']")).toHaveText("Saved. Post it!");
  await srv.close();
});

test("Where to find us lists the whole week, keeps a cancelled stop, and links each market", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/find-us");
  await featuresStarted(page);
  const off = page.locator(".st-where-full .st-stop.off");
  await expect(off).toHaveCount(1);
  await expect(off).toContainText("Cancelled");
  await expect(off).toContainText("Market closed for the fair");
  await expect(page.locator(".st-places .st-place")).toHaveCount(4);
  await expect(page.locator(".st-pitch")).toHaveCount(0); // client-only
  expect(errors).toEqual([]);
  await srv.close();
});

test("the party check answers from the diary, never says booked, and fills the WhatsApp message", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/book-us");
  await featuresStarted(page);
  const out = page.locator("[data-pd-out]");
  await page.fill("[data-pd-date]", "2026-10-24");
  await expect(out).toHaveAttribute("data-state", "taken");
  await expect(out).not.toContainText(/booked/i);
  await page.fill("[data-pd-date]", "2026-11-07");
  await expect(out).toHaveAttribute("data-state", "few");
  await page.fill("[data-pd-date]", "2026-11-14");
  await expect(out).toHaveAttribute("data-state", "open");
  await page.selectOption("[data-pd-kind]", "Birthday");
  await page.fill("[data-pd-guests]", "40");
  await page.fill("[data-pd-pc]", "e8 4qj");
  expect(await waText(page.locator("[data-pd-ask]"))).toBe("Hello Fendle, could you come to our party?\nIt's for: Birthday\nDate: Saturday 14 November 2026\nGuests: about 40\nPostcode: E8 4QJ");
  await page.fill("[data-pd-date]", "2026-10-01");
  await expect(out).toHaveAttribute("data-state", "past");
  // The set-up card follows, ready to send.
  expect(await waText(page.locator(".st-setup a.st-text"))).toMatch(/^Fendle: what we need on the day\nPitch: 3 m × 3 m, on level ground/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the client's sheets fail closed: the usual week, marked, and the stall's own line", async ({ page }) => {
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.route("https://api.open-meteo.com/**", (r) => r.abort());
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".sp-hero [data-where-state]")).toHaveAttribute("data-state", "usual");
  await expect(page.locator(".sp-hero [data-where-fallback]")).toBeVisible();
  await expect(page.locator("[data-next-what]")).toHaveText(/^Usually /);
  await expect(page.locator(".st-item.out")).toHaveCount(0);
  await expect(page.locator("[data-feature='stalls-rain']")).toBeHidden();
  expect(errors).toEqual([]);
  await srv.close();
});

test("the client's own sheet and forecast: this week's stops, sold out, rain, and the pitch finder", async ({ page }) => {
  await page.clock.setFixedTime(SAT_AFTERNOON);
  await page.route("https://docs.google.com/**", (r) => {
    const url = r.request().url();
    const body = url.includes("stops")
      ? "date,place,open,close,status,note,updated_at\n2026-10-24,kirkgate,10:00,16:00,on,,2026-10-22 08:00\n2026-10-30,headrow,17:00,21:00,cancelled,Too windy,2026-10-22 08:00\n2026-10-31,kirkgate,10:00,16:00,on,,2026-10-22 08:00"
      : url.includes("sold") ? "date,item,time\n2026-10-24,Matcha,13:05\n2026-10-23,Berry,15:00"
      : "date,status,updated_at\n2026-11-07,taken,2026-10-22 08:00";
    return r.fulfill({ status: 200, contentType: "text/csv", body });
  });
  await page.route("https://api.open-meteo.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ hourly: { time: Array.from({ length: 24 }, (_, h) => `2026-10-24T${String(h).padStart(2, "0")}:00`), precipitation_probability: Array.from({ length: 24 }, (_, h) => (h >= 15 ? 75 : 5)) } }) }));
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-next-where]")).toHaveText("Here now in Kirkgate");
  await expect(page.locator(".sp-hero [data-where-state]")).toHaveAttribute("data-state", "fresh");
  await expect(page.locator(".sp-hero .st-stop.off")).toContainText("Cancelled");
  await expect(page.locator("[data-item='matcha']")).toHaveClass(/out/);
  await expect(page.locator("[data-item='berry']")).not.toHaveClass(/out/);
  await expect(page.locator("[data-feature='stalls-rain']")).toHaveText("Rain likely from 15:00, by the forecast.");
  await page.goto(srv.base + "/find-us");
  await expect(page.locator(".st-pitch figcaption")).toHaveText("Look for the pink awning by the clock.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("without JavaScript the pages still say where the stall usually is and what it sells", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-next-what]")).toHaveText(/^Usually /);
  await expect(page.locator(".sp-hero [data-where-pick]").first()).toBeVisible();
  await expect(page.locator(".st-item")).toHaveCount(5);
  await page.goto(srv.base + "/allergens");
  await expect(page.locator(".st-chart tbody tr")).toHaveCount(5);
  await expect(page.locator(".st-rating")).toHaveText("5 out of 5");
  await page.goto(srv.base + "/book-us");
  expect(await waText(page.locator("[data-pd-ask]"))).toBe("Hello Fendle, could you come to our party?");
  await ctx.close();
  await srv.close();
});
