// Events kit and the Doors look, as a couple or a company uses them: the next free date and "Is your date free?",
// the brief that arrives on WhatsApp with the date already in it, the design visuals (always labelled), lay the table,
// the room drawn for their number, and the private proposal by code, from the demo and from a client's own sheet.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/maudry");
const client = site("_fixtures/test-events-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const DATES = /docs\.google\.com\/spreadsheets\/d\/e\/2PACX-events-dates/;
const PROPOSALS = /docs\.google\.com\/spreadsheets\/d\/e\/2PACX-events-proposals/;

test("the first screen shows the next free Saturday, and the date check answers in plain words", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator(".dr-hero [data-ed-next]")).toHaveText(/^\d{1,2} [A-Z][a-z]+$/);
  await expect(page.locator(".dr-hero [data-ed-next-wrap]")).toContainText("Next free Saturday");
  await page.click(".dr-hero [data-ed-open]");
  await page.fill(".dr-hero [data-ed-date]", "2027-06-05");
  await page.locator(".dr-hero [data-ed-form] button[type=submit]").click();
  await expect(page.locator(".dr-hero [data-ed-out]")).toHaveText(/^Saturday 5 June 2027 is (free|on hold|taken)/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the brief carries the date checked on the same page and only what was chosen", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/start.html");
  await page.locator("[data-eb='type']").selectOption("Launch");
  await page.fill("[data-eb='date']", "2027-03-20");
  await page.fill("[data-eb='guests']", "80");
  await page.fill("[data-eb='name']", "Sam");
  const text = await waText(page.locator("[data-eb-wa]"));
  expect(text).toContain("we're planning a launch.");
  expect(text).toContain("Date: Saturday 20 March 2027");
  expect(text).toContain("Guests: about 80");
  expect(text).not.toContain("Budget");
  await expect(page.locator("[data-ek-list] li").first()).toBeVisible();
  await srv.close();
});

test("design visuals are labelled on every view, and lay the table changes the dressing in one place", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const views = page.locator("#visuals [data-ev-show]");
  await expect(views).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await views.nth(i).click();
    await expect(views.nth(i)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#visuals .ev-label").first()).toHaveText("A design visual");
  }
  const lay = page.locator("#lay-the-table [data-el-show]");
  await expect(lay).toHaveCount(3);
  await lay.first().click();
  await expect(lay.first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#lay-the-table [data-el-view]:visible")).toHaveCount(1);
  await srv.close();
});

test("the room is redrawn for the number, and says so when it doesn't fit", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-room.html");
  await expect(page.locator("[data-rp-words]")).toHaveText(/^120 seated at \d+ long tables/);
  await page.locator("[data-rp-layout='round']").click();
  await expect(page.locator("[data-rp-words]")).toContainText("takes about");
  await page.locator("[data-rp-guests]").fill("60");
  await expect(page.locator("[data-rp-words]")).toHaveText(/^60 seated at 6 round tables/);
  await expect(page.locator("[data-rp-svg] circle").first()).toBeVisible();
  await srv.close();
});

test("the demo proposal opens with the sample code and links to its room", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-proposal.html");
  await page.click("[data-pr-try]");
  await expect(page.locator("[data-pr-out]")).toBeVisible();
  await expect(page.locator("[data-pr-set]:visible .ev-label").first()).toHaveText("A design visual");
  expect(await page.locator("[data-pr-room]").getAttribute("href")).toMatch(/your-room(\.html)?#room=[a-z-]+&guests=\d+&layout=(long|round|standing)$/);
  await srv.close();
});

test("a client's proposal comes from their sheet; an unknown code says so; the client never shows a sample code", async ({ page }) => {
  await page.route(PROPOSALS, (r) => r.fulfill({ status: 200, contentType: "text/csv",
    body: "code,visuals,room,guests,layout,date,updated\nCORRIN01,bath-dinner,hall,40,long,2027-05-15,2026-10-15\n" }));
  await page.route(DATES, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "date,status,updated\n2026-10-31,booked,2026-10-18\n" }));
  const srv = await start(client);
  await page.goto(srv.base + "/your-proposal.html");
  await expect(page.locator("[data-pr-try]")).toHaveCount(0);
  await page.fill("[data-pr-code]", "nothere1");
  await page.locator("[data-pr-form] button[type=submit]").click();
  await expect(page.locator("[data-pr-off]")).toBeVisible();
  await page.fill("[data-pr-code]", "corrin-01");
  await page.locator("[data-pr-form] button[type=submit]").click();
  await expect(page.locator("[data-pr-out]")).toBeVisible();
  await expect(page.locator("[data-pr-meta]")).toContainText("Saturday 15 May 2027 · 40 guests · long tables");
  await srv.close();
});
