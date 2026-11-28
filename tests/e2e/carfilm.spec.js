// Carfilm kit and the Viewfinder look, as a client uses them: the viewfinder's guides and readout (tonight's light on
// the studio's road, calculated), the format switch snapping the frame, the roads list choosing the readout's road,
// delivery dates, the shot list on WhatsApp, the planner (its cloud forecast is switched off until the shared weather function lands),
// the share card, the work by car, and a Plus client without the Signature showpieces.
import { test, expect, site, start, OPEN_TIME } from "./helpers.js";
import { evening, eveningLine, dayLight, deliveryDate, shortDay } from "../../src/kits/carfilm/lib/carfilm.js";

const demo = site("demos/kerrow");
const client = site("_fixtures/test-carfilm-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const BOX_HILL = { lat: 51.2557, lon: -0.3075 }, HARDKNOTT = { lat: 54.403, lon: -3.205 };

test("the viewfinder shows tonight's light on the studio's road, calculated, and another road when chosen", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const mon = page.locator(".cf-mon");
  await expect(mon.locator(".cf-frame")).toBeVisible();
  await expect(mon.locator("[data-tc]")).toHaveText(/^\d\d:\d\d:\d\d:\d\d$/);
  const tonight = eveningLine(evening(OPEN_TIME.getTime(), BOX_HILL.lat, BOX_HILL.lon).light);
  await expect(mon.locator("[data-when]")).toHaveText("Tonight");
  await expect(mon.locator("[data-gold]")).toHaveText(tonight.gold);
  await expect(mon.locator("[data-sunset]")).toHaveText(tonight.sunset);
  await mon.locator("[data-road]").selectOption("hardknott");
  await expect(mon.locator("[data-gold]")).toHaveText(eveningLine(evening(OPEN_TIME.getTime(), HARDKNOTT.lat, HARDKNOTT.lon).light).gold);
  await srv.close();
});

test("after tonight's blue hour the readout moves to tomorrow", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-19T20:30:00Z"));
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".cf-mon [data-when]")).toHaveText("Tomorrow");
  await expect(page.locator(".cf-mon [data-day]")).toHaveText(shortDay("2026-10-20"));
  await srv.close();
});

test("the format switch snaps the frame to each shape, and the frame moves with the arrow keys", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const frame = page.locator(".cf-frame");
  const ratio = async () => { const b = await frame.boundingBox(); return b.width / b.height; };
  expect(Math.abs((await ratio()) - 2.39)).toBeLessThan(0.03);
  await page.getByRole("button", { name: "Vertical, 9:16" }).click();
  await expect(page.getByRole("button", { name: "Vertical, 9:16" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(ratio).toBeLessThan(0.6);
  const x0 = (await frame.boundingBox()).x;
  await frame.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await frame.boundingBox()).x).toBeGreaterThan(x0);
  await page.getByRole("button", { name: "Listing, 4:3" }).click();
  await expect.poll(async () => Math.abs((await ratio()) - 4 / 3)).toBeLessThan(0.03);
  await srv.close();
});

test("a road in the list shows its light in the viewfinder's readout", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.locator("[data-road-id='snake-pass']").click();
  await expect(page.locator(".cf-mon [data-road]")).toHaveValue("snake-pass");
  await expect(page.locator("[data-road-id='snake-pass']")).toHaveAttribute("aria-pressed", "true");
  await srv.close();
});

test("delivery dates count the studio's working days from the shoot date", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/packages");
  await page.locator("[data-ta-date]").fill("2026-12-23");
  const row = page.locator("[data-ta='drive']");
  await expect(row.locator("[data-ta-photos]")).toHaveText(shortDay(deliveryDate("2026-12-23", 5, ["mon", "tue", "wed", "thu", "fri"], "E14 3QT")));
  await expect(row.locator("[data-ta-photos]")).toHaveText("Mon 4 Jan");
  await srv.close();
});

test("the shot list goes to the studio with the shots chosen", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/book");
  await expect(page.locator("[data-sl-count]")).toHaveText("3 shots on your list");
  await page.getByRole("button", { name: "Wheels turning" }).click();
  await expect(page.locator("[data-sl-count]")).toHaveText("4 shots on your list");
  const text = await waText(page.locator("[data-sl-send]"));
  expect(text).toContain("- Wheels turning");
  expect(text).toContain("- Lamps lit");
  await srv.close();
});

test("the planner gives the light for a road and date, with no forecast line while the forecast is switched off", async ({ page }) => {
  const met = [];
  page.on("request", (r) => { if (/met\.no/.test(r.url())) met.push(r.url()); });
  const srv = await start(demo);
  await page.goto(srv.base + "/golden-hour");
  await page.locator("[data-pl-date]").fill("2026-10-21");
  await expect(page.locator("[data-pl-gold]")).toHaveText(eveningLine(dayLight("2026-10-21", BOX_HILL.lat, BOX_HILL.lon)).gold);
  expect(await waText(page.locator("[data-pl-hold]"))).toContain("Box Hill, Zig Zag Road on Wed 21 Oct");
  await expect(page.locator("[data-forecast]")).toHaveCount(0);
  expect(met, "no browser calls MET Norway").toEqual([]);
  await srv.close();
});

test("the share card is saved as a picture of the plan", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/golden-hour");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Share this plan" }).click()]);
  expect(dl.suggestedFilename()).toBe("golden-hour-2026-10-19.png");
  await srv.close();
});

test("the work by car shows one group at a time", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/portfolio");
  const all = await page.locator(".cf-pf-grid li").count();
  await page.getByRole("button", { name: "Classics" }).click();
  await expect(page.locator(".cf-pf-grid li:visible")).toHaveCount(2);
  await page.getByRole("button", { name: "All" }).click();
  await expect(page.locator(".cf-pf-grid li:visible")).toHaveCount(all);
  await srv.close();
});

test("a Plus client has the viewfinder and tonight's light, without the Signature showpieces", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await expect(page.locator(".cf-frame")).toBeVisible();
  await expect(page.locator(".cf-fmt")).toHaveCount(0);
  await expect(page.locator(".cf-mon [data-gold]")).not.toHaveText("");
  await expect(page.locator("a[href$='golden-hour']")).toHaveCount(0);
  const res = await page.goto(srv.base + "/golden-hour");
  expect(res?.status()).toBe(404);
  await srv.close();
});
