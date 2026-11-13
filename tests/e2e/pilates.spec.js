// Pilates kit and the Dune look, as a client uses them: a short home page, today's classes with the room's reformers,
// the waitlist on a full class, the week into the calendar, the class finder, gift cards, the reformer clip loading
// only on tap, retreats dropping off when they finish, a phone bar that never covers the page, and a client site whose
// sheet can't be read (no places shown, Book still works).
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/pilates");
const client = site("_fixtures/test-pilates-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page is short: the hero and today, the week, the intro card, the ways in, and visit", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero du-hero", "timetable", "intro", "sec-more", "visit"]);
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
  expect(screens).toBeLessThan(7.5);
  expect(errors).toEqual([]);
  await srv.close();
});

test("today's classes run from now, each with the room's reformers and a Book message naming the class", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/"); // Monday 19 October, 10.30
  const slots = page.locator(".pl-today .pl-slot");
  await expect(slots).toHaveCount(4);
  await expect(page.locator("[data-tt-label]")).toHaveText("Today");
  await expect(slots.first().locator(".pl-slot-t")).toHaveText("12.30");
  await expect(slots.first().locator(".pl-slot-c")).toHaveText("Tempo");
  await expect(slots.nth(3).locator(".pl-slot-t")).toHaveText("Tue 20, 7.00");
  await expect(slots.first().locator(".pl-six")).toHaveAttribute("aria-label", /of 6 reformers booked/);
  expect(await waText(slots.first().locator("a"))).toBe("Hello Ottoline, I'd like to book Tempo on Monday 19 October at 12.30.");
  await srv.close();
});

test("a full class becomes the waitlist, with the class in the message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const full = page.locator("#timetable .pl-row[data-full]").first();
  await expect(full).toBeVisible();
  const link = full.locator("a[data-tt-wait]");
  await expect(link).toHaveText("Waitlist");
  expect(await waText(link)).toBe("Hello Ottoline, please add me to the waitlist for Sculpt on Monday 19 October at 18.00.");
  await expect(page.locator(".pl-wait")).toBeVisible();
  await expect(page.locator(".pl-key")).toBeVisible();
  await srv.close();
});

test("the week: day tabs switch the rows, and ticked classes go to the calendar in one file", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.click('#timetable [data-day="2026-10-21"]');
  await expect(page.locator('[data-tt-rows="2026-10-21"]')).toBeVisible();
  await expect(page.locator('[data-tt-rows="2026-10-19"]')).toBeHidden();
  await expect(page.locator('[data-tt-rows="2026-10-21"] .pl-row')).toHaveCount(5);
  const add = page.locator("[data-yw-add]");
  await expect(add).toBeDisabled();
  await page.locator('[data-tt-rows="2026-10-21"] [data-yw-pick]').nth(1).check();
  await page.locator('[data-tt-rows="2026-10-21"] [data-yw-pick]').nth(3).check();
  await expect(page.locator("[data-yw-count]")).toHaveText("2 classes ticked.");
  const [dl] = await Promise.all([page.waitForEvent("download"), add.click()]);
  const text = await (await dl.createReadStream()).toArray().then((c) => Buffer.concat(c).toString());
  expect(dl.suggestedFilename()).toBe("ottoline-classes.ics");
  expect(text).toContain("DTSTART;TZID=Europe/London:20261021T091500");
  expect(text).toContain("SUMMARY:Pre & postnatal · Ottoline");
  expect(text.match(/BEGIN:VEVENT/g)?.length).toBe(2);
  await srv.close();
});

test("find your first class names the studio's class and its next times", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/classes");
  await expect(page.locator("[data-cf-class]")).toHaveText("Sculpt");
  await page.click('label:has(#cf-new-no)');
  await expect(page.locator("[data-cf-class]")).toHaveText("Foundation");
  await expect(page.locator("[data-cf-times] li")).toHaveCount(3);
  await page.click('label:has(#cf-preg-yes)');
  await expect(page.locator("[data-cf-class]")).toHaveText("Pre & postnatal");
  await expect(page.locator("[data-cf-text]")).toContainText("Tell your teacher");
  await srv.close();
});

test("gift cards: the card follows the words, Pay goes to that card's link, WhatsApp carries the details", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/gifts");
  await page.click('label:has(#gc-private)');
  await page.fill("#gc-to", "Sam");
  await page.fill("#gc-from", "Alex");
  await page.fill("#gc-line", "Happy birthday");
  await expect(page.locator("[data-gc-name]")).toHaveText("A private session");
  await expect(page.locator("[data-gc-to]")).toHaveText("For Sam");
  await expect(page.locator("[data-gc-pay]")).toHaveAttribute("href", "https://buy.stripe.com/test_ottoline_giftpriv");
  const text = await waText(page.locator("[data-gc-send]"));
  expect(text).toContain("Card: A private session");
  expect(text).toContain('On the card: "Happy birthday"');
  await srv.close();
});

test("the reformer clip: the picture first, the film fetched only on tap, captions from the studio", async ({ page }) => {
  const srv = await start(demo);
  const asked = [];
  page.on("request", (r) => { if (r.url().endsWith(".mp4")) asked.push(r.url()); });
  await page.goto(srv.base + "/classes");
  await page.locator("#reformer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(asked).toEqual([]);
  await expect(page.locator("[data-rc-poster]")).toBeVisible();
  await expect(page.locator("[data-rc-list] li")).toHaveCount(4);
  await page.click("[data-rc-play]");
  await expect(page.locator("[data-rc-video]")).toHaveAttribute("src", /reformer\.mp4$/);
  await srv.close();
});

test("a retreat that has finished drops off", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(new Date("2027-05-20T09:00:00Z"));
  await page.goto(srv.base + "/retreats");
  await expect(page.locator(".pl-ret-i:visible")).toHaveCount(1);
  await expect(page.locator(".pl-ret-i:visible h2")).toHaveText("The Cotswolds");
  await srv.close();
});

test("the phone bar never covers the page: the footer ends where the bar begins", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await expect(page.locator(".du-bar [data-tt-bar-name]")).toHaveText("12.30 Tempo");
  expect(await page.evaluate(() => document.documentElement.scrollWidth), "nothing wider than the phone, the hero's settle included").toBe(390);
  // Scroll instantly (the page scrolls smoothly) and measure again until late images have settled.
  await expect.poll(() => page.evaluate(() => {
    scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
    return (document.querySelector(".foot")?.getBoundingClientRect().bottom ?? 0) - (document.querySelector(".mbar")?.getBoundingClientRect().top ?? 0);
  })).toBeLessThanOrEqual(1);
  await srv.close();
});

test("a client site whose sheet can't be read shows no places, and Book still works", async ({ page }) => {
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  await page.waitForTimeout(500);
  await expect(page.locator(".pl-today .pl-six:visible")).toHaveCount(0);
  await expect(page.locator(".pl-key")).toBeHidden();
  await expect(page.locator(".pl-today .pl-slot").first().locator(".pl-slot-l")).toHaveText("45 min");
  expect(await waText(page.locator(".pl-today .pl-slot a").first())).toContain("Tempo on Monday 19 October at 12.30");
  expect(errors).toEqual([]);
  await srv.close();
});

test("without JavaScript the week from the build still shows, with Book links", async ({ browser }) => {
  const srv = await start(demo);
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(srv.base + "/");
  await expect(page.locator("#timetable .pl-row a.pl-row-go").first()).toHaveAttribute("href", /wa\.me/);
  await ctx.close();
  await srv.close();
});

test("Signature pages: classes, teachers, exercises and retreats link to each other", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/classes");
  await page.click('.pl-types-list a:has-text("Foundation")');
  await expect(page).toHaveURL(/class-foundation$/);
  await expect(page.locator("[data-cp-times] li")).toHaveCount(5);
  await expect(page.locator("[data-cp-times] li").first()).toContainText("Tue 20, 9.15");
  await page.click('.pl-cls-t a:has-text("Anna")');
  await expect(page.locator(".pl-tch-wk")).toContainText("Mondays");
  await page.goto(srv.base + "/method");
  await expect(page.locator(".pl-mv-lib li")).toHaveCount(6);
  await page.click('.pl-mv-lib a:has-text("Mermaid")');
  await expect(page.locator(".pl-ex-facts")).toContainText("Springs");
  await page.goto(srv.base + "/retreats");
  await page.click('.pl-ret-n a:has-text("Santorini")');
  await expect(page.locator("[data-rt-days]")).toHaveText("· in 163 days");
  await expect(page.locator(".pl-rt-facts")).toContainText("4 of 10 left");
  expect(errors).toEqual([]);
  await srv.close();
});

test("reformer settings: the link opens the card, the phone keeps it, and teachers can make one", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/settings");
  await expect(page.locator("[data-rs-card]")).toBeHidden();
  await page.click("[data-rs-example]");
  await expect(page.locator("[data-rs-who]")).toHaveText("Leah's reformer");
  await expect(page.locator("[data-rs-footbar]")).toHaveText("Position 2 of 4");
  await page.click("[data-rs-keep]");
  await page.goto(srv.base + "/settings");
  await expect(page.locator("[data-rs-who]")).toHaveText("Leah's reformer");
  await page.click("[data-rs-forget]");
  await expect(page.locator("[data-rs-card]")).toBeHidden();
  await page.click(".pl-set-make summary");
  await page.fill("#rs-name", "Sam");
  await page.fill("#rs-s-red", "2");
  await page.fill("#rs-f", "3");
  const link = await page.inputValue("[data-rs-link]");
  expect(link).toContain("#n=Sam&s-red=2&f=3");
  await page.goto(link);
  await expect(page.locator("[data-rs-who]")).toHaveText("Sam's reformer");
  await srv.close();
});

test("the class passport opens by code and says so when a code is unknown", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/passport");
  await page.fill("#pp-code", "otto24");
  await page.click(".pl-pass-f button");
  await expect(page.locator("[data-pp-msg]")).toHaveText("Codes are 8 to 12 letters and numbers.");
  await page.fill("#pp-code", "nope9999");
  await page.click(".pl-pass-f button");
  await expect(page.locator("[data-pp-msg]")).toContainText("isn't on our list");
  await page.click("[data-pp-try]");
  await expect(page.locator("[data-pp-left]")).toHaveText("4 classes");
  await expect(page.locator("[data-pp-next]")).toHaveText("Your 50th class, 3 to go");
  await expect(page.locator("[data-pp-holes] span")).toHaveCount(4);
  await srv.close();
});

test("packs: the cheapest way to pay changes with how often you come", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/classes");
  await page.locator("#pk-n-1").check();
  await expect(page.locator("[data-pk-list] li").first().locator("b")).toHaveText("Ten classes");
  await page.locator("#pk-n-4").check();
  await expect(page.locator("[data-pk-list] li").first().locator("b")).toHaveText("Unlimited");
  await expect(page.locator("[data-pk-list] li[data-best] em")).toHaveText("Best for you");
  await srv.close();
});

test("workshops go into the calendar at the studio's time; private hire carries the details", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/workshops");
  await expect(page.locator(".pl-ws-i:visible")).toHaveCount(3);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-ws-ics]").first().click()]);
  const text = await (await dl.createReadStream()).toArray().then((c) => Buffer.concat(c).toString());
  expect(text).toContain("DTSTART;TZID=Europe/London:20261121T100000");
  await page.goto(srv.base + "/hire");
  await page.click('label:has(#hr-celebration)');
  await page.fill("#hr-date", "2026-12-12");
  await page.fill("#hr-n", "6");
  const t = await waText(page.locator("[data-hire-send]"));
  expect(t).toContain("For: A celebration");
  expect(t).toContain("Date: Saturday 12 December 2026");
  expect(t).toContain("People: 6");
  await srv.close();
});
