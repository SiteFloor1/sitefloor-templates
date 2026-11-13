// Smile kit and the Booth look, as a patient uses them: the booth strip within one phone screen with Book always in
// reach, the rules at body size, "tell me what you'd change" writing the message, the wedding dates, a treatment
// dated visit by visit, arriving re-timed, and the GDC lines on a client's site.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/smile");
const client = site("_fixtures/test-smile-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("on a phone the strip fits one screen and Book stays in the phone bar", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  const strip = await page.locator(".bt-strip").boundingBox();
  expect(strip?.height ?? 9999).toBeLessThanOrEqual(844);
  const book = page.locator(".mbar .bt-bar-go");
  await expect(book).toBeVisible();
  await page.mouse.wheel(0, 3000);
  await expect(book).toBeInViewport();
  expect(await waText(book)).toBe("Hi Marlie, I'd like to book a consultation.");
  await expect(page.locator(".bt-note")).toHaveText("Models, not patients.");
  await srv.close();
});

test("the rules, GDC numbers and complaints link are body size, never small print", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const body = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  for (const sel of ["#chooser .sm-rules", "#treatments .sm-gdc", ".bt-foot-reg"]) {
    const size = await page.locator(sel).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size, sel).toBeGreaterThanOrEqual(body);
  }
  await expect(page.locator("#chooser .sm-rules")).toContainText("never for anyone under 18");
  await expect(page.locator("#chooser .sm-rules a")).toHaveAttribute("href", /patient-information/);
  await srv.close();
});

test("tell me what you'd change writes the message to the studio", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const send = page.locator("[data-ch-send]");
  expect(await waText(send)).toContain("married next year");
  await page.locator("#chooser .sm-chip", { hasText: "A chipped tooth" }).click();
  await expect(page.locator("[data-ch-text]")).toHaveText(/chipped a front tooth/);
  expect(await waText(send)).toContain("chipped a front tooth");
  await expect(page.locator("#chooser .sm-chip", { hasText: "A chipped tooth" })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the wedding date gives every date to book, in UK order, and the message carries them", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.fill("[data-wd-date]", "2027-06-05");
  await page.locator("[data-wd-date]").dispatchEvent("change");
  await expect(page.locator('#wedding [data-step="consult"] [data-when]')).toHaveText("13 March");
  await expect(page.locator('#wedding [data-step="polish"] [data-when]')).toHaveText("29 May");
  await expect(page.locator("[data-wd-away]")).toHaveText("Saturday 5 June 2027 · 32 weeks away");
  const text = await waText(page.locator("[data-wd-send]"));
  expect(text).toContain("The day: Saturday 5 June 2027");
  expect(text).toContain("Consultation: Saturday 13 March 2027");
  await expect(page.locator("[data-wd-ics]")).toBeVisible();
  await srv.close();
});

test("a treatment, visit by visit, dated from the first visit", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/journey");
  await expect(page.locator('[data-jy-t="whitening-home"]')).toBeVisible();
  await expect(page.locator('[data-jy-t="bonding"]')).toBeHidden();
  await page.fill("[data-jy-start]", "2026-11-02");
  await page.locator("[data-jy-start]").dispatchEvent("change");
  await expect(page.locator('[data-jy-t="whitening-home"] [data-when]')).toHaveText(["Monday 2 November 2026", "Monday 16 November 2026", "Monday 7 December 2026"]);
  await page.locator(".sm-jy-pick .sm-chip", { hasText: "Composite bonding" }).click();
  await expect(page.locator('[data-jy-t="bonding"]')).toBeVisible();
  await srv.close();
});

test("arriving re-times the route to the appointment", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/studio");
  await expect(page.locator("[data-ar-time]")).toHaveText(["8.13", "8.15", "9.00"]);
  await page.locator("#arriving .sm-chip", { hasText: "18.00" }).click();
  await expect(page.locator("[data-ar-time]")).toHaveText(["17.58", "18.00", "18.45"]);
  await srv.close();
});

test("the gallery says model photographs aren't patients; a client's site shows every GDC line and the complaints route", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/smiles");
  await expect(page.locator(".sm-gal-cap").first()).toContainText("A model photograph, not a patient");
  await srv.close();
  const c = await start(client);
  await page.goto(c.base + "/patient-information");
  await expect(page.locator("main .sm-cl-line")).toHaveCount(2);
  await expect(page.locator("main .sm-gdc").first()).toHaveText("GDC 100001");
  await expect(page.getByRole("link", { name: "Dental Complaints Service" })).toHaveAttribute("href", "https://dcs.gdc-uk.org/");
  await expect(page.locator("main")).toContainText("A private practice.");
  await c.close();
});
