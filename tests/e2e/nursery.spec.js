// Nursery kit and The atelier wall look, as a parent uses them: the work on the walls (turned by hand), places room by
// room (simulated on the demo, the client's sheet failing closed) with the phone bar following the chosen age, fees with
// every extra optional, what a week costs with funded hours taken off as gov.uk sets them, when funding can start, visit
// times and the request, term dates and settling in into the calendar, and no page jumping when the font arrives late.
// Every page's clock is Monday 19 October 2026, 10.30am in London (helpers.js).
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/nursery");
const client = site("_fixtures/test-nursery-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL(/** @type {string} */ (await loc.getAttribute("href"))).searchParams.get("text") ?? "";

test("the home page keeps to the work, places, fees, the week, a visit, questions and the nursery", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids).toEqual(["hero cp-hero", "places", "fees", "week", "look-round", "questions", "visit"]);
  await srv.close();
});

test("the work turns only when the parent turns it, caption and all", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const wall = page.locator("[data-feature='nursery-wall']");
  await expect(wall.locator(".nu-label-one:visible .nu-title")).toHaveText("A sky a day, for a fortnight");
  await page.waitForTimeout(1500);
  await expect(wall.locator(".nu-label-one:visible .nu-title")).toHaveText("A sky a day, for a fortnight"); // nothing turns by itself
  await wall.getByRole("button", { name: "Next piece" }).click();
  await expect(wall.locator(".nu-label-one:visible .nu-title")).toHaveText("Stones, sorted three ways");
  await expect(wall.locator(".nu-label-one:visible")).toContainText("Mathematics");
  await expect(wall.locator("img.nu-piece:visible")).toHaveAttribute("src", /stones\.webp$/);
  await wall.getByRole("button", { name: "Previous piece" }).click();
  await wall.getByRole("button", { name: "Previous piece" }).click();
  await expect(wall.locator(".nu-label-one:visible .nu-title")).toHaveText("The book corner, after lunch");
  expect(errors).toEqual([]);
  await srv.close();
});

test("tapping an age names the room and its next place; every room shows six months and asks on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const places = page.locator("#places");
  await expect(places.locator("[data-nu-answer]")).toHaveText("Garden room, 3 months to 2. Next place: December 2026.");
  await expect(places.locator("[data-nu-month='garden|2026-10'] b")).toHaveText("Full");
  await expect(places.locator("[data-nu-month='garden|2026-12'] b")).toHaveText("1 free");
  await places.getByRole("button", { name: "3", exact: true }).click();
  await expect(places.locator("[data-nu-answer]")).toHaveText("Orchard, 3 to school. Next place: February 2027.");
  await expect(places.locator(".nu-work.is-on")).toHaveAttribute("data-nu-room", "orchard");
  expect(await waText(places.locator("[data-nu-room='orchard'] [data-nu-ask]"))).toBe("Hello Alnwood, is there a place in the Orchard (3 to school) from February 2027?");
  await expect(page.locator("[data-nu-bar-text]")).toHaveText("Orchard, February 2027");
  await expect(places).toContainText("Sample places");
  await srv.close();
});

test("a client's places sheet that can't be read shows no numbers, only the question", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  const places = page.locator("#places");
  await expect(places.locator("[data-nu-answer]")).toHaveText("Garden room, 3 months to 2.");
  await expect(places.locator("[data-nu-months]:visible")).toHaveCount(0);
  expect(await waText(places.locator("[data-nu-room='garden'] [data-nu-ask]"))).toBe("Hello Test Nursery, is there a place in the Garden room (3 months to 2)?");
  await expect(page.locator("[data-feature='nursery-today']")).toBeHidden();
  await srv.close();
});

test("fees show every price with what it includes, and every extra as optional", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const fees = page.locator("#fees");
  await expect(fees).toContainText("£95 a day");
  await expect(fees).toContainText("Every price includes care, learning, nappies");
  await expect(fees.locator(".nu-extras")).toContainText("Optional, never a condition of a place or of funded hours");
  await expect(fees.getByRole("link", { name: "free childcare for working parents" })).toHaveAttribute("href", "https://www.gov.uk/free-childcare-if-working");
  await srv.close();
});

test("what a week costs: funded hours come off as gov.uk sets them, and the quote goes to WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const week = page.locator("#week");
  // Three full days, 30 funded hours: 1,140 hours over 51 weeks is 22.35 a week; 7.65 paid at £9.50.
  await expect(week.locator("[data-nu-total]")).toHaveText("£308.75");
  await expect(week.locator("[data-nu-sum]")).toContainText("22.35 hours a week");
  await week.getByRole("button", { name: "3 and 4", exact: true }).click();
  await week.getByRole("button", { name: /^15 hours/ }).click();
  await expect(week.locator("[data-nu-total]")).toHaveText("£760");
  await week.getByRole("button", { name: "Wednesday: off" }).click(); // off, then a morning
  await expect(week.locator("[data-nu-total]")).toHaveText("£961.88");
  await week.getByRole("button", { name: "Under 9 months" }).click();
  await expect(week.getByRole("button", { name: /^15 hours/ })).toBeDisabled();
  await expect(week.getByRole("button", { name: /^30 hours/ })).toBeDisabled();
  await expect(week.locator("[data-nu-total]")).toHaveText("£1,413.13");
  await expect(week.locator("[data-nu-optional]")).toContainText("Lunch and snacks is optional");
  expect(await waText(week.locator("[data-nu-quote]"))).toBe("Hello Alnwood, could you check a quote? Mon full day, Tue full day, Wed morning, Thu full day; no funded hours. Your website shows £1,413.13 a month.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("when funding can start: the term after the age is reached, linked to gov.uk", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/fees.html");
  await page.locator("[data-nu-dob]").fill("2026-05-14");
  await page.getByRole("button", { name: "Work it out" }).click();
  const out = page.locator("[data-nu-start-out]");
  await expect(out).toContainText("From Thursday 1 April 2027"); // 9 months on 14 Feb 2027: the term from 1 April
  await expect(out).toContainText("From Saturday 1 September 2029"); // three on 14 May 2029: the term from 1 September
  await expect(page.locator("#week")).toBeVisible(); // the week tool follows on the fees page
  await srv.close();
});

test("visit times follow the weekly pattern from today, and the request names the time and the age", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/look-round.html");
  const slots = page.locator("[data-nu-slots] .nu-slot");
  await expect(slots).toHaveCount(4);
  await expect(slots.first()).toContainText("Tue 20 Oct");
  await slots.nth(1).click();
  await page.locator("[data-nu-visit-age]").selectOption("2");
  expect(await waText(page.locator("[data-nu-visit-send]"))).toBe("Hello Alnwood, could we visit on Thursday 22 October 2026 at 4.30pm? My child is 2.");
  await srv.close();
});

test("a day with us marks the moment under way", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/day.html");
  await expect(page.locator(".nu-moment.is-now h2")).toHaveText("Work at the tables"); // 10.30am on a Monday
  await srv.close();
});

test("term dates go into one calendar file; settling in falls on the next open weekdays", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/term-dates.html");
  await expect(page.locator("[data-nu-terms] li").first()).toContainText("Last day before Christmas");
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Add every date to your calendar" }).click()]);
  expect(file.suggestedFilename()).toBe("alnwood-dates.ics");

  await page.goto(srv.base + "/settling-in.html");
  await page.locator("[data-nu-start-day]").fill("2026-10-23"); // a Friday
  await page.locator("[data-nu-start-day]").dispatchEvent("change");
  const days = page.locator("[data-nu-ses-date]");
  await expect(days.nth(0)).toHaveText("Fri 23 Oct");
  await expect(days.nth(1)).toHaveText("Mon 26 Oct");
  expect(await waText(page.locator("[data-nu-settle-send]"))).toContain("we'd like to start on Friday 23 October 2026");
  await srv.close();
});

// Every page on a phone while Gentium is held back: headings and intros keep their space, so the page mustn't move
// when the font arrives. Limit 0.02 on the kit's own pages, stricter than the shared 0.1; the privacy page's shared
// words differ site by site (a line of a paragraph can rewrap), so it is held to 0.05.
const PAGES = {
  demo: ["/", "/rooms.html", "/fees.html", "/look-round.html", "/day.html", "/food.html", "/ofsted.html", "/getting-ready.html",
    "/term-dates.html", "/settling-in.html", "/the-work.html", "/learning.html", "/outdoors.html", "/our-team.html", "/journal.html", "/visit.html", "/privacy.html"],
  client: ["/", "/rooms.html", "/fees.html", "/look-round.html", "/day.html", "/visit.html", "/privacy.html"],
};
for (const [name, s] of /** @type {const} */ ([["demo", demo], ["client", client]])) {
  for (const width of [360, 390]) {
    test(`${name}: no page jumps on a ${width}px phone when the font arrives late`, async ({ browser }) => {
      test.setTimeout(120_000);
      const srv = await start(s);
      const ctx = await browser.newContext({ viewport: { width, height: 800 } });
      await ctx.route(/\.woff2$/, async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
      await ctx.route("https://docs.google.com/**", (r) => r.abort());
      await ctx.addInitScript(() => {
        /** @type {any} */ (window).__cls = 0;
        new PerformanceObserver((l) => { for (const e of /** @type {any[]} */ (l.getEntries())) if (!e.hadRecentInput) /** @type {any} */ (window).__cls += e.value; })
          .observe({ type: "layout-shift", buffered: true });
      });
      const out = [];
      for (const path of PAGES[name]) {
        const page = await ctx.newPage();
        await page.goto(srv.base + path);
        await page.waitForTimeout(2200);
        out.push([path, await page.evaluate(() => /** @type {any} */ (window).__cls)]);
        await page.close();
      }
      expect(out.filter(([path, cls]) => cls >= (path === "/privacy.html" ? 0.05 : 0.02)), JSON.stringify(out)).toEqual([]);
      await ctx.close();
      await srv.close();
    });
  }
}
