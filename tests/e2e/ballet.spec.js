// Ballet kit and The round look, as a client uses them: the class finder on the first screen (tap an age, the class,
// day, time and trial message follow), the year's ring (still) and its calendar file, places left (simulated on the
// demo, the client's sheet failing closed), the trial page's two rows of taps, uniform tabs, catch-ups, where she'll go
// next, show day by code, and the pages without JavaScript.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/ballet");
const client = site("_fixtures/test-ballet-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL(/** @type {string} */ (await loc.getAttribute("href"))).searchParams.get("text") ?? "";

test("the home page keeps to the hero, the trial class, what to wear, reviews, questions and the studio", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids).toEqual(["hero rd-hero", "trial", "uniform", "reviews", "questions", "visit"]);
  await expect(page.locator(".rd-dome-img")).toHaveAttribute("src", /stage\.webp$/);
  await srv.close();
});

test("tapping an age shows its classes and points both trial buttons at the first of them", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const finder = page.locator(".rd-hero [data-feature='ballet-finder']");
  await expect(finder.locator("[aria-pressed='true']")).toHaveText("3–4");
  await expect(finder.locator("[data-bt-answer]")).toContainText("Little ballet");
  await finder.getByRole("button", { name: "Age 7–8" }).click();
  await expect(finder.locator("[data-bt-answer] .bt-class")).toHaveCount(2); // Ballet two and Boys' ballet
  await expect(finder.locator("[data-bt-answer]")).toContainText("Thursdays 4.30pm · 1 hour");
  const msg = "Hello Wrenna, could my child (age 7 to 8) try Ballet two, Thursdays 4.30pm?";
  expect(await waText(finder.locator("[data-bt-trial]"))).toBe(msg);
  expect(await waText(page.locator("#trial [data-bt-trial]"))).toBe(msg);
  for (const part of [".rd-hero", "#trial"]) await expect(page.locator(part)).not.toContainText(/booked/i);
  expect(errors).toEqual([]);
  await srv.close();
});

test("places left come from the demo's sheet, with the waiting list for a full class", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const answer = page.locator(".rd-hero [data-bt-answer]");
  await expect(answer).toContainText("Tuesday 4.00pm: 2 places left");
  const full = answer.getByRole("link", { name: "Full: join the list" });
  expect(await waText(full)).toBe("Hello Wrenna, the Saturday 10.00am class is full. Could we join the waiting list?");
  await page.goto(srv.base + "/timetable.html");
  await expect(page.locator("[data-pk='little|sat|10:00']")).toHaveText("Full: join the list");
  await srv.close();
});

test("the ring of dates is still, starts at the next date, and the year goes into one calendar file", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ring = page.locator(".rd-frieze");
  await expect(ring).toContainText("winter showcase");
  expect(await page.locator(".rd-dome-ring").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect(page.locator("[data-bt-next]")).toContainText("Winter showcase");
  const download = page.waitForEvent("download");
  await page.locator("[data-bt-ics]").click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("wrenna-dates.ics");
  await expect(page.locator("[data-bt-done]")).toContainText("dates, ready to open in your calendar");
  await srv.close();
});

test("the trial page: age and day in two taps, and the message names that session", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/trial.html");
  const pickers = page.locator("[data-bt-pickers]");
  await pickers.getByRole("button", { name: "Age 5–6" }).click();
  await pickers.getByRole("button", { name: "Saturday 11.00am" }).click();
  await expect(pickers.locator("[data-bt-chosen]")).toHaveText("Ballet one, 45 minutes");
  expect(await waText(page.locator(".bt-trial-page [data-bt-trial]"))).toBe("Hello Wrenna, could my child (age 5 to 6) try Ballet one, Saturday 11.00am?");
  expect(errors).toEqual([]);
  await srv.close();
});

test("uniform tabs show one class's list at a time and move with the arrow keys", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/uniform.html");
  const tabs = page.getByRole("tab");
  await tabs.nth(0).click();
  await tabs.nth(0).press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#uni-p-one")).toBeVisible();
  await expect(page.locator("#uni-p-little")).toBeHidden();
  await srv.close();
});

test("catch-ups offer the class's other session, with a message, never a booking", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/timetable.html");
  await page.selectOption("#cu-missed", "one|wed|16:15");
  const list = page.locator("[data-cu-list]");
  await expect(list.locator("li")).toHaveCount(1);
  expect(await waText(list.getByRole("link"))).toBe("Hello Wrenna, we missed Ballet one, Wednesday 4.15pm. Could we come to Ballet one, Saturday 11.00am, instead?");
  await page.selectOption("#cu-missed", "three|mon|17:00");
  await expect(list).toContainText("No other class at this level this week");
  await srv.close();
});

test("where she'll go next follows the age tapped", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/classes.html");
  await page.locator("[data-path-age='12']").click();
  await expect(page.locator("[data-path-list] li")).toHaveText(["Ages 12–14Ballet four", "Ages 15–18Senior ballet"]);
  await srv.close();
});

test("show day answers a sample code and says plainly when a code is unknown", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/show-day.html");
  await page.fill("#sd-code", "lb tue");
  await page.getByRole("button", { name: "Show me" }).click();
  const out = page.locator("[data-sd-out]");
  await expect(out).toContainText("Little ballet (Tuesday)");
  await expect(out).toContainText("4.30pm from the foyer");
  await page.fill("#sd-code", "XX-1");
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(out).toContainText("No up-to-date details for the code XX-1.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("a client's sheet that can't be read shows no places, and the client site carries no demo code", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  await expect(page.locator(".rd-hero [data-bt-answer]")).toContainText("Little ballet");
  await page.waitForTimeout(500);
  await expect(page.locator("[data-pk]:visible")).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toMatch(/simulated|Fictional school|sample codes/i);
  await srv.close();
});

test("without JavaScript the finder, the year and every list still read", async ({ browser }) => {
  const srv = await start(demo);
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(srv.base + "/");
  await expect(page.locator(".rd-hero [data-bt-answer]")).toContainText("Little ballet");
  await expect(page.locator(".rd-frieze")).toContainText("winter showcase");
  await page.goto(srv.base + "/timetable.html");
  await expect(page.locator(".bt-tt-day")).toHaveCount(5);
  await page.goto(srv.base + "/shows.html");
  await expect(page.getByRole("link", { name: "Tickets" })).toHaveAttribute("href", "https://example.com/wrenna-tickets");
  await ctx.close();
  await srv.close();
});
