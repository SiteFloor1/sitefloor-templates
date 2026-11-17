// Financial advisers kit and the Statement look: the fee statement reworked for any amount, the FCA status line with
// the FRN linked to the register and the Financial Ombudsman's number on every page, what to bring beside each service,
// the pension dates that fail closed, the old-pensions list that stays on the device, and a Plus client without the
// Signature showpieces.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";

test.use({ reducedMotion: "reduce" });

const demo = site("demos/ifa");
const client = site("_fixtures/test-ifa-client");

test("the first screen: the photograph, the headline and the fee statement for the example amount", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".st-lead h1")).toHaveText("Every fee, in pounds, before you sign anything.");
  await expect(page.locator(".st-photo figcaption")).toHaveText("Photograph: AXP Photography, Pexels");
  await expect(page.locator("[data-st=firstYear]")).toHaveText("£5,625.00");
  await expect(page.locator(".if-st-basis")).toContainText("Investments can fall as well as rise");
  expect(await page.locator(".st-lead h1").evaluate((h) => getComputedStyle(h).fontWeight)).toBe("300");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the statement reworks any amount, applies the minimum, and says why it can't", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await page.getByRole("button", { name: "£1,000,000" }).click();
  await expect(page.locator("[data-st=initial]")).toHaveText("£15,000.00");
  await expect(page.locator("[data-st=monthly]")).toHaveText("£625.00");
  await page.fill("#if-st-amt", "50,000");
  await expect(page.locator("[data-st=initial]")).toHaveText("£1,500.00");
  await page.fill("#if-st-amt", "");
  await expect(page.locator("[data-st=firstYear]")).toHaveText("—");
  await expect(page.locator("[data-st-why]")).toHaveText("Type an amount in whole pounds.");
  await srv.close();
});

test("every page: the status line with the FRN linked to the register, and the Ombudsman's free number", async ({ page }) => {
  const srv = await start(demo);
  for (const path of ["/", "/fees", "/pensions", "/old-pensions"]) {
    await page.goto(srv.base + path);
    await expect(page.locator(".st-foot [data-frn]")).toHaveAttribute("href", "https://register.fca.org.uk/");
    await expect(page.locator(".st-foot [data-frn]")).toHaveText("000000");
    await expect(page.locator(".st-foot [data-fos-tel]")).toHaveAttribute("href", "tel:+448000234567");
    await expect(page.locator(".st-foot [data-fos-tel]")).toHaveText("0800 023 4567");
  }
  await srv.close();
});

test("what to bring sits beside each service", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("#services")).toContainText("What to bring");
  await expect(page.locator("#services")).toContainText("Your latest pension statements");
  await srv.close();
});

test("a topic page lists what to bring for its own service", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/mortgages");
  await expect(page.locator(".if-tp-side")).toContainText("payslips");
  await expect(page.locator(".if-tp-side")).not.toContainText("pension statements");
  await srv.close();
});

test("pension dates: a clear year gives two dates; a change-over year sends you to GOV.UK", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/pensions");
  await featuresStarted(page);
  await page.fill("[data-ms-yob]", "1980");
  await expect(page.locator(".if-ms-y")).toHaveText(["2037", "2048"]);
  await page.fill("[data-ms-yob]", "1972");
  await expect(page.locator(".if-ms-y")).toHaveCount(0);
  await expect(page.locator("[data-ms-note]")).toContainText("change-over");
  await page.fill("[data-ms-yob]", "1958");
  await expect(page.locator(".if-ms-y")).toHaveCount(0);
  await expect(page.locator("[data-ms-note]")).toContainText("before 1960");
  await page.fill("[data-ms-yob]", "19x");
  await expect(page.locator("[data-ms-note]")).toContainText("four figures");
  await srv.close();
});

test("old pensions: the list builds from what's typed, and nothing is sent", async ({ page }) => {
  const srv = await start(demo);
  const sent = [];
  page.on("request", (r) => { if (r.method() !== "GET") sent.push(r.url()); });
  await page.goto(srv.base + "/old-pensions");
  await featuresStarted(page);
  await page.locator('[name="employer"]').first().fill("Acme Ltd");
  await page.locator('[name="from"]').first().fill("1998");
  await expect(page.locator("[data-tr-out]")).toContainText("1. Acme Ltd (1998–?), workplace pension");
  await expect(page.locator("[data-tr-tools]")).toBeVisible();
  expect(sent).toEqual([]);
  await srv.close();
});

test("a Plus client: restricted advice said plainly, its own register entry, no Signature showpieces", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".st-reg")).toContainText("Restricted advice");
  await expect(page.locator(".st-foot [data-frn]")).toHaveAttribute("href", /register\.fca\.org\.uk\/s\/firm/);
  await expect(page.locator(".if-st")).toHaveCount(0);
  await expect(page.locator(".st-card-go .if-btn")).toBeVisible();
  expect(errors).toEqual([]);
  await srv.close();
});

test("on a phone the bar never covers the footer's last line, and the card never covers the photo credit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  const bar = await page.locator(".st-bar").boundingBox();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const credit = await page.locator(".st-photo figcaption").boundingBox();
  const card = await page.locator(".st-card").boundingBox();
  expect(credit && card && credit.y + credit.height <= card.y).toBeTruthy(); // the photo credit isn't under the card
  const by = await page.locator(".st-foot-by").boundingBox();
  expect(bar && by && by.y + by.height <= bar.y + 1).toBeTruthy();
  await srv.close();
});
