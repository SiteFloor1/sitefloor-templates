// Driving kit and the Verge look: the four answers on the first screen (desktop, without scrolling), the phone rows that
// already show their answers and open in place, the planner following the gearbox, the progress card by code, and a
// client's free lessons closing (no times, asking still works) when the instructor's sheet can't be read.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/driving");
const client = site("_fixtures/test-driving-client");

test("on a desktop the four answers are on the first screen", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(srv.base + "/");
  for (const id of ["#prices", "#areas", "#slots", "#pass"]) await expect(page.locator(id)).toBeInViewport({ ratio: 0.95 });
  await expect(page.locator("#slots")).toHaveAttribute("data-state", "ok");
  await expect(page.locator("#slots .dv-slotlist li")).toHaveCount(3);
  expect(errors).toEqual([]);
  await srv.close();
});

test("on a phone every answer shows in its row, and a row opens in place", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  for (const id of ["#prices", "#areas", "#slots", "#pass"]) await expect(page.locator(`${id} .dv-mh`)).toBeInViewport();
  await expect(page.locator("#prices .dv-mh em")).toContainText("£38");
  await expect(page.locator("#pass .dv-mh em")).toContainText("weeks");
  await expect(page.locator("#areas .dv-body")).toBeHidden();
  await page.locator("#areas .dv-mh").click();
  await page.locator("#da-pc").fill("e14 9ge");
  await page.locator("#areas form button").click();
  await expect(page.locator("[data-da-out]")).toContainText("Yes, E14");
  await expect(page.locator(".mbar .vg-bar-book")).toBeInViewport();
  await srv.close();
});

test("when could I pass follows the gearbox and the hours, and says it's an estimate", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(new Date("2026-11-18T09:30:00Z")); // the day after the demo's gov.uk fees were checked
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-pp-when]")).toHaveText("12 weeks");
  await expect(page.locator("[data-pp-cost]")).toHaveText("£1,710");
  await page.locator("[data-dp-g=automatic]").click();
  await expect(page.locator("[data-pp-cost]")).toHaveText("£1,840");
  await page.locator("[data-pp-theory]").check();
  await expect(page.locator("[data-pp-cost]")).toHaveText("£1,820");
  await page.locator("[data-pp-plus]").click();
  await expect(page.locator("[data-pp-so]")).toHaveText("5");
  await expect(page.locator("#pass .dv-foot")).toContainText("An estimate from DVSA averages and our prices");
  // six months on, the stored fees are left out rather than shown stale
  await page.clock.setFixedTime(new Date("2027-06-01T09:30:00Z"));
  await page.reload();
  await expect(page.locator("[data-pp-cost]")).toHaveText("£1,620");
  await expect(page.locator("[data-pp-stale]")).toBeVisible();
  await srv.close();
});

test("the progress card opens with the demo's sample code", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/progress.html");
  await page.locator("[data-dg-example]").click();
  await expect(page.locator("[data-dg-card]")).toBeVisible();
  await expect(page.locator("[data-dg-skills] li")).toHaveCount(8);
  await expect(page.locator("[data-dg-skills] li").first()).toContainText("Independent");
  await page.locator("[data-dg-code]").fill("ZZZ");
  await page.locator("[data-dg-form] button").click();
  await expect(page.locator("[data-dg-msg]")).toContainText("6 to 12");
  await srv.close();
});

test("a client's free lessons whose sheet can't be read show no times, and asking still works", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (route) => route.abort());
  await page.goto(srv.base + "/");
  await expect(page.locator("#slots")).toHaveAttribute("data-state", "closed");
  await expect(page.locator("#slots .dv-slotlist li")).toHaveCount(0);
  await expect(page.locator("[data-ds-ask]")).toHaveAttribute("href", /wa\.me/);
  await srv.close();
});
