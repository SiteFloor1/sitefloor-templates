// Residences kit and the Turndown look, as a guest and a tenant use them: the stay bar's totals with every fee in them
// and the long let priced by the month with its GOV.UK sources, the cards re-pricing to the same stay, a home's detail,
// the quote link, the long-let deposit caps, the client's own sheet, floor plan and 3D tour, and every list failing
// closed when the sheet is stale or can't be read.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";
import { COLUMNS } from "../../src/kits/residences/lib/homes.js";

const demo = site("demos/residences");
const client = site("_fixtures/test-residences-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL((await loc.getAttribute("href")) ?? "").searchParams.get("text") ?? "";
const MON = new Date("2026-11-16T10:30:00Z"); // a Monday morning: the demo sheet was updated at 09:15
const row = (/** @type {Record<string, string>} */ o) => COLUMNS.map((c) => o[c] ?? "").join(",");
const sheet = (/** @type {string} */ at) => [COLUMNS.join(","),
  row({ ref: "4W", name: "Four West", floor: "4", status: "free", beds: "2", baths: "2", size_m2: "112", free_from: "now", stays: "both", night: "640", clean: "220", min_nights: "3", rent_pcm: "7950", faces: "270", side: "Courtyard", updated_at: at }),
  row({ ref: "5E", name: "Five East", floor: "5", status: "let", updated_at: at })].join("\n");

test("Fees sits in the header of every page and in the phone menu", async ({ page }) => {
  const srv = await start(demo);
  for (const path of ["/", "/residences.html", "/concierge.html", "/fees.html"]) {
    await page.goto(srv.base + path);
    await expect(page.locator(".td-r a", { hasText: "Fees" })).toHaveAttribute("href", /fees/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await page.click(".burger");
  await expect(page.locator("#mnav a", { hasText: "Fees" })).toBeVisible();
  await srv.close();
});

test("the stay bar: every fee in the total, a long let priced by the month, the cards re-priced to the same stay", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.clock.setFixedTime(MON);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const bar = page.locator(".rs");
  await expect(bar.locator("[data-rs-home]")).toHaveValue("4W");
  // 14 nights × £640 + the £220 clean
  await expect(bar.locator("[data-rs-price] b")).toHaveText("£9,180 for 14 nights");
  await expect(page.locator(".rh-card", { hasText: "Four West" }).locator(".rh-price")).toHaveText("£9,180 for 14 nights");
  await bar.locator("[data-rs-len]").fill("6");
  await expect(bar.locator("[data-rs-lenv]")).toHaveText("Long let");
  await expect(bar.locator("[data-rs-price] b")).toHaveText("£7,950 a month");
  const note = bar.locator("[data-rs-price] .rs-note");
  await expect(note).toContainText("A rolling tenancy with no end date, so it's priced by the month");
  await expect(note).toContainText("Only the payments the Tenant Fees Act permits can be charged");
  // £7,950 a month is £95,400 a year: six weeks' deposit, rounded down
  await expect(note).toContainText("a refundable deposit of up to £11,007");
  await expect(note.locator("a")).toHaveCount(2);
  for (const a of await note.locator("a").all()) await expect(a).toHaveAttribute("href", /^https:\/\/www\.gov\.uk\//);
  await expect(page.locator(".rh-card", { hasText: "The Penthouse" }).locator(".rh-price")).toHaveText("Nightly only");
  expect(await waText(bar.locator("[data-rs-go]"))).toContain("Four West (4W), on a long let.");
  await expect(page.locator(".rh-card").first().locator(".rh-sun")).toHaveText(/^Sun on the windows today, \d\d:\d\d to \d\d:\d\d$/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("a home's detail: the total, the tenancy terms with their sources, quiet notes and an enquiry", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(MON);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await page.locator(".rh-card", { hasText: "Five East" }).locator("button").click();
  const d = page.locator("[data-rh-dialog]");
  await expect(d).toBeVisible();
  await expect(d.locator(".rh-d-money")).toContainText("£9,880 for 14 nights");
  await expect(d.locator(".rh-d-money")).toContainText("Only the payments the Tenant Fees Act permits can be charged");
  await expect(d.locator(".rh-d-quiet")).toContainText("Acoustic double glazing");
  expect(await waText(d.locator(".rh-d-ask"))).toBe("Hello Sevrell, I'd like to ask about Five East (5E), for 14 nights.");
  await expect(d.locator(".rh-d-quote")).toHaveAttribute("href", /quote(\.html)?#5E-14$/);
  await d.locator(".rh-d-close").click();
  await expect(d).toBeHidden();
  await srv.close();
});

test("the quote link shows today's total and says it isn't a booking", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(MON);
  await page.goto(srv.base + "/quote.html#4W-14");
  await expect(page.locator(".rq-total")).toHaveText("£9,180");
  await expect(page.locator(".rq")).toContainText("Not a booking.");
  await page.goto(srv.base + "/quote.html#4W-2");
  await expect(page.locator(".rq")).toContainText("That stay isn't offered for this home.");
  await srv.close();
});

test("long lets: the deposit caps from a rent, and nothing worked out above the assured-tenancy limit", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/long-lets.html");
  const rent = page.locator("[data-rlg-rent]");
  await rent.fill("3000"); // £36,000 a year: five weeks
  await expect(page.locator("[data-rlg-out]")).toContainText("Deposit, at most (5 weeks)£3,461");
  await expect(page.locator("[data-rlg-out]")).toContainText("Holding deposit, at most£692");
  await rent.fill("9000");
  await expect(page.locator("[data-rlg-out]")).toContainText("isn't an assured tenancy");
  await srv.close();
});

test("a stale sheet lists nothing and disables the stay bar: the page says to ask", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(MON);
  await page.goto(srv.base + "/#stale");
  await featuresStarted(page);
  await expect(page.locator(".rs")).toHaveClass(/rs-stale/);
  await expect(page.locator(".rh-card")).toHaveCount(0);
  await expect(page.locator("[data-rh-updated]")).toContainText("ask us on WhatsApp");
  await srv.close();
});

test("a client's own sheet: shown when fresh, nothing when old or unreadable; its floor plan and 3D tour", async ({ page }) => {
  const srv = await start(client);
  await page.clock.setFixedTime(MON);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: sheet("2026-11-16 09:00") }));
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".rh-card")).toHaveCount(1);
  await page.locator(".rh-card button").click();
  const d = page.locator("[data-rh-dialog]");
  await expect(d.locator(".rh-d-plan")).toHaveAttribute("alt", "Floor plan of Four West");
  await page.route("https://my.matterport.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<p>tour</p>" }));
  await d.locator(".rh-d-tour").click();
  await expect(d.locator("iframe.rh-d-frame")).toHaveAttribute("src", "https://my.matterport.com/show/?m=TESTtour01");
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: sheet("2026-11-13 09:00") }));
  await page.goto(srv.base + "/residences.html");
  await featuresStarted(page);
  await expect(page.locator(".rh-card")).toHaveCount(0);
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".rh-card")).toHaveCount(0);
  await srv.close();
});
