// Tourism kit and the Logbook look, as a traveller uses them: the journey of the month (the clock is fixed on
// 19 October 2026, so October's pick opens), another journey from the index with its map and local time, the year
// drawn, the shortlist sent on WhatsApp, a journey page with daylight and typical weather, the trip builder, the
// checklist kept in the browser, the private trip page on the demo, and a client's trip page read from its sheet.
import { test, expect, site, start, featuresStarted } from "./helpers.js";

const demo = site("demos/larrow");
const client = site("_fixtures/test-tourism-client");
const waText = async (/** @type {any} */ loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page opens on this month's journey, and the index opens another in place", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const shown = page.locator(".lb-first [data-logbook]:visible");
  await expect(shown).toHaveCount(1);
  await expect(shown).toHaveAttribute("data-journey", "atacama-slowly");
  await expect(shown.locator("[data-lb-month]")).toHaveText("Journey of the month · October");
  const index = page.locator("[data-tm-index] li");
  await expect(index.first()).toContainText("The Atacama, slowly");
  await expect(index.first()).toContainText("this month");
  await page.locator("[data-tm-open='dunes-to-waterholes']").click();
  const nam = page.locator(".lb-first [data-logbook]:visible");
  await expect(nam).toHaveAttribute("data-journey", "dunes-to-waterholes");
  await expect(nam.locator("[data-lb-month]")).toHaveText("From the logbook");
  await expect(nam.locator("[data-local-time]")).toHaveText(/^Local time \d\d:\d\d · 1 hour ahead of London$/);
  await nam.getByRole("button", { name: /Etosha/ }).click();
  await expect(nam.locator("[data-lb-title]")).toHaveText("Etosha");
  await expect(nam.locator("[data-lb-days]")).toHaveText("Days 7–12");
  await expect(nam.locator("[data-lb-cap]")).toHaveText("Photograph: Etosha");
  await expect(nam.locator("[data-lb-route]")).toHaveCSS("stroke-dashoffset", "0px");
  await srv.close();
});

test("the year drawn opens on October and says how many journeys fit, or that none does", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const f = page.locator("#finder");
  await expect(f.locator(".tf-key")).toHaveText("The solid line is when we'd go.");
  await expect(f.locator("[data-tf-found]")).toHaveText("3 journeys fit October.");
  await expect(f.locator("tbody tr").first()).not.toHaveClass(/off/);
  await f.getByRole("button", { name: "Family" }).click();
  await expect(f.locator("[data-tf-found]")).toHaveText("2 journeys fit October.");
  await f.getByRole("button", { name: "February" }).click();
  await f.getByRole("button", { name: "Just me" }).click();
  await f.getByRole("button", { name: "About a week" }).click();
  await expect(f.locator("[data-tf-found]")).toHaveText("Nothing fits February as it stands. Tell us anyway: most of our trips are made to order.");
  await expect(f.locator("tbody tr.off")).toHaveCount(5);
  await srv.close();
});

test("kept journeys go to the operator in one WhatsApp message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const list = page.locator("#journeys");
  await expect(list.locator("[data-shortlist]")).toBeHidden();
  await list.locator("[data-keep='desert-to-ice']").click();
  await list.locator("[data-keep='kyoto-leaves']").click();
  await expect(list.locator("[data-keep='kyoto-leaves']")).toHaveAttribute("aria-pressed", "true");
  await expect(list.locator("[data-short-words]")).toHaveText("Your shortlist: Desert to ice, Kyoto in the leaf season.");
  expect(await waText(list.locator("[data-short-send]"))).toBe("Hello Larrow, these are the journeys we like:\n· Desert to ice (11 nights)\n· Kyoto in the leaf season (10 nights)\nCould we talk about dates?");
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator("#journeys [data-keep='desert-to-ice']")).toHaveText("Kept");
  await page.locator("#journeys [data-short-clear]").click();
  await expect(page.locator("#journeys [data-shortlist]")).toBeHidden();
  await srv.close();
});

test("a journey page: day by day, daylight for the month chosen, and typical weather with its source", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/journey-desert-to-ice");
  await featuresStarted(page);
  await expect(page.locator("h1")).toHaveText("Desert to ice");
  const day = page.locator(".lb-day");
  await expect(day.locator("[data-dl-month]")).toHaveValue("10");
  await expect(day.locator("[data-dl-when]")).toHaveText("Mid-October 2026");
  await expect(day.locator("[data-dl-stop]")).toHaveCount(4);
  await expect(day.locator("[data-dl-out]").first()).toHaveText(/^Sunrise \d\d:\d\d · sunset \d\d:\d\d · 1\d h \d+ min of light$/);
  await day.locator("[data-dl-month]").selectOption("1");
  await expect(day.locator("[data-dl-when]")).toHaveText("Mid-January 2027");
  const wx = page.locator(".lb-wx");
  await expect(wx.locator("caption")).toContainText("Open-Meteo, ERA5 reanalysis");
  await expect(wx.locator("caption")).toContainText("Not a forecast.");
  await srv.close();
});

test("the trip builder adds regions within the operator's nights and sends one message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/plan");
  await featuresStarted(page);
  const send = page.locator("[data-tb-send]");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "One night more in The Atacama" }).click();
  await expect(page.locator("[data-tb-region='atacama'] [data-tb-n]")).toHaveText("3");
  await page.getByRole("button", { name: "One night more in Torres del Paine" }).click();
  await page.getByRole("button", { name: "One night more in Torres del Paine" }).click();
  await expect(page.locator("[data-tb-total]")).toHaveText("7 nights in all");
  await page.locator("[data-tb-month]").selectOption("11");
  expect(await waText(send)).toBe("Hello Larrow, we're thinking of a trip in November (two of us):\n· The Atacama, 3 nights\n· Torres del Paine, 4 nights\n7 nights in all. Could you suggest how to put it together?");
  await page.getByRole("button", { name: "One night fewer in The Atacama" }).click();
  await expect(page.locator("[data-tb-region='atacama'] [data-tb-n]")).toHaveText("0");
  await srv.close();
});

test("the checklist links gov.uk and keeps its ticks in this browser", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/ready");
  await featuresStarted(page);
  await expect(page.locator(".tc-gov a").first()).toHaveAttribute("href", "https://www.gov.uk/foreign-travel-advice/chile");
  await expect(page.locator("[data-tc-done]")).toHaveText("0 of 6 done.");
  await page.locator("[data-tc-item]").nth(0).check();
  await page.locator("[data-tc-item]").nth(2).check();
  await expect(page.locator("[data-tc-done]")).toHaveText("2 of 6 done.");
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator("[data-tc-item]").nth(2)).toBeChecked();
  await expect(page.locator("[data-tc-done]")).toHaveText("2 of 6 done.");
  await srv.close();
});

test("the demo's trip page opens the sample code and refuses any other", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-trip");
  await featuresStarted(page);
  await page.locator("[data-tt-try]").click();
  await expect(page.locator("[data-tt-name]")).toHaveText("The Atacama, slowly");
  await expect(page.locator("[data-tt-when]")).toHaveText("42 days to go");
  await expect(page.locator("[data-tt-meta]")).toHaveText("From Monday 30 November 2026 · 7 nights · 2 travelling");
  await expect(page.locator("[data-tt-journey]")).toHaveAttribute("href", /journey-atacama-slowly/);
  await page.locator("[data-tt-code]").fill("ZZZ9999");
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("[data-tt-off]")).toHaveText("We can't find that code. Check it against our email, or call us.");
  await expect(page.locator("[data-tt-out]")).toBeHidden();
  await srv.close();
});

test("a client's trip page reads its sheet, and asks them to call when a row is stale", async ({ page }) => {
  const srv = await start(client);
  const sheet = "https://docs.google.com/spreadsheets/d/e/2PACX-test/pub?output=csv";
  const body = "code,journey,start,travellers,updated\nCOR2201,desert-to-ice,2027-01-12,3,2026-10-18\nCOR9000,desert-to-ice,2027-01-12,2,2026-08-01";
  await page.route(sheet, (r) => r.fulfill({ status: 200, contentType: "text/csv", body }));
  await page.goto(srv.base + "/your-trip#COR2201");
  await featuresStarted(page);
  await expect(page.locator("[data-tt-name]")).toHaveText("Desert to ice");
  await expect(page.locator("[data-tt-meta]")).toHaveText("From Tuesday 12 January 2027 · 11 nights · 3 travelling");
  await expect(page.locator("[data-tt-demo], .tt-demo")).toHaveCount(0);
  await page.locator("[data-tt-code]").fill("COR9000");
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("[data-tt-off]")).toHaveText("We haven't updated this for a while, so it may be out of date. Please call us for the latest.");
  await srv.close();
});
