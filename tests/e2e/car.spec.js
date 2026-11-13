// Car studio features (Showroom, driver's seat view, protection planner, swatch library, model finder,
// next free bay, quote, aftercare), as a customer uses them.
import { readFileSync } from "node:fs";
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/car-studio");
const client = site("_fixtures/test-car-client");
const data = JSON.parse(readFileSync("sites/demos/car-studio/site.json", "utf8"));
const job = (id) => data.jobs.find((j) => j.id === id);
const SHEET = /docs\.google\.com\/spreadsheets/;
// The 3D cars are big and draw in software on CI; tests that only check prices and words skip them.
const no3d = (page) => page.route(/\.glb$/, (r) => r.abort());
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test.describe("the Showroom", () => {
  test("a build is priced from the studio's jobs and listed under the car", async ({ page }) => {
    await no3d(page);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-sr-read]")).toHaveText("As it left the factory");
    await page.locator('.sr label:has(input[name=wrap][value="nardo"])').click();
    await page.locator('.sr label:has(input[name=finish][value="satin"])').click();
    await page.locator('.sr label:has(input[name=dechrome])').click();
    await page.getByRole("tab", { name: "Tint" }).click();
    await page.locator('[data-sr-win="rear"] label:has(input[value="t20"])').click();
    const s = job("tint-rear").prices.saloon + job("wrap-satin").prices.saloon + job("dechrome").prices.saloon;
    await expect(page.locator("[data-sr-price]")).toHaveText(`£${s.toLocaleString("en-GB")}`);
    await expect(page.locator("[data-sr-read]")).toContainText("Wrap: Nardo grey, satin");
    await expect(page.locator("[data-sr-read]")).toContainText("De-chrome: yes");
    await srv.close();
  });

  test("an illegal front shade previews but stays out of the price and the message", async ({ page }) => {
    await no3d(page);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.getByRole("tab", { name: "Tint" }).click();
    await page.locator('[data-sr-win="rear"] label:has(input[value="t20"])').click();
    await page.locator('[data-sr-win="fronts"] label:has(input[value="t20"])').click();
    await expect(page.locator("[data-sr-refused]")).toBeVisible();
    await expect(page.locator("[data-sr-refused]")).toContainText("darker than the law allows");
    await expect(page.locator("[data-sr-price]")).toHaveText(`£${job("tint-rear").prices.saloon}`);
    expect(await waText(page.locator("[data-sr-send]"))).not.toContain("Front side windows");
    await srv.close();
  });

  test("the 3D car loads only when asked; vehicle and views still price and move it", async ({ page }) => {
    const srv = await start(demo);
    const asked = [];
    page.on("request", (r) => { if (/studio-3d-|\.glb/.test(r.url())) asked.push(r.url()); });
    await no3d(page); // asked for, then refused: drawing a 4 MB car in software slows every other test
    await page.goto(srv.base + "/");
    await page.waitForLoadState("networkidle");
    expect(asked, "nothing 3D loads with the page").toEqual([]);
    await expect(page.locator(".sr-poster")).toBeVisible();
    await expect(page.locator("[data-sr-go]")).toContainText(/MB/);
    await page.locator('.sr label:has(input[name=vehicle][value="van"])').click();
    await expect(page.locator("[data-sr-poster]")).toHaveAttribute("src", /car-van\.webp$/); // the picture follows the vehicle
    await page.getByRole("tab", { name: "Wheels" }).click();
    await expect(page.locator("[data-sr-stage]")).toHaveAttribute("data-view", "wheels");
    await expect(page.locator("#sr-p-wheels")).toBeVisible();
    await expect(page.locator("#sr-p-wrap")).toBeHidden();
    await page.locator('.sr input[name=make]').fill("Ford Transit Custom");
    expect(await waText(page.locator("[data-sr-send]"))).toContain("Ford Transit Custom, van");
    await page.getByRole("tab", { name: "Wrap" }).click();
    await page.locator('.sr label:has(input[name=wrap][value="black"])').click(); // asking for a colour opens the studio
    expect(await waText(page.locator("[data-sr-send]"))).toContain(`£${job("wrap-gloss").prices.van}`);
    await expect.poll(() => asked.some((u) => /car-van\.glb/.test(u)), { timeout: 20000 }).toBe(true); // the van's own car
    // When the car can't load, the button says so and the picture stays.
    await expect(page.locator(".sr-go")).toContainText("couldn't open", { timeout: 60000 });
    await expect(page.locator(".sr-poster")).toBeVisible();
    await srv.close();
  });

  test("opening the 3D shows how much of the car has downloaded", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const cdp = await page.context().newCDPSession(page); // a slow phone connection: the 2.5 MB car takes a while
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 100, downloadThroughput: 150_000, uploadThroughput: 50_000 });
    await page.locator("[data-sr-go]").click();
    await expect(page.locator("[data-sr-go]")).toContainText(/Opening the studio… \d{1,3}%/, { timeout: 20000 });
    await page.close();
    await srv.close();
  });

  test("chameleon films on the windscreen: legal ones are fittable, darker ones only previewed", async ({ page }) => {
    await no3d(page);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.getByRole("tab", { name: "Tint" }).click();
    const screen = page.locator('[data-sr-win="windscreen"]');
    await expect(screen.locator("label.sheen")).toHaveCount(3);
    await expect(screen.locator('label:has(input[value="cv"])')).not.toHaveClass(/nl/);
    await expect(screen.locator('label:has(input[value="cb"])')).toHaveClass(/nl/);
    await screen.locator('label:has(input[value="cv"])').click();
    await expect(page.locator("[data-sr-read]")).toContainText("Windscreen: Chameleon violet 76% tint");
    await srv.close();
  });

  test("a car first used before 1985: the windscreen rule changes to 70%", async ({ page }) => {
    await no3d(page);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.getByRole("tab", { name: "Tint" }).click();
    await expect(page.locator("[data-sr-rule]")).toContainText("Windscreen must let at least 75%");
    await page.locator(".sr-check", { hasText: "1985" }).click();
    await expect(page.locator("[data-sr-rule]")).toContainText("Windscreen must let at least 70%");
    await srv.close();
  });

  test("Starter view hides the Showroom and shows the still car with from prices", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.locator(".demo-ribbon [data-tier-pick=starter]").click();
    await expect(page.locator(".sr")).toBeHidden();
    await expect(page.locator(".sx-still")).toBeVisible();
    await expect(page.locator(".sx-sheet dd").first()).toHaveText(/^from £\d+/);
    await srv.close();
  });

  test("without JavaScript the drawing and a way to ask still show", async ({ browser }) => {
    const srv = await start(demo);
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(srv.base + "/");
    await expect(page.locator(".sr-poster")).toBeVisible();
    await expect(page.locator("[data-sr-go]")).toBeHidden();
    await expect(page.locator("[data-feature=showroom]")).not.toHaveAttribute("data-ready", "");
    await expect(page.locator(".sr-nojs")).toBeVisible();
    await ctx.close();
    await srv.close();
  });
});

test.describe("other car features", () => {
  test("tint visualiser: each window takes its own shade on a car your size, and from the driver's seat", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const dv = page.locator("[data-dv]");
    await expect(dv.locator('[data-dv-body="saloon"]')).toBeVisible();
    await dv.locator('label:has(input[name=dv-fronts][value="t5"])').click();
    await expect(dv).toHaveAttribute("style", /--f-fronts: ?0\.81/);
    await expect(page.locator("[data-dv-law]")).toContainText("Front side windows: not legal");
    await dv.locator('label:has(input[name=dv-rear][value="t20"])').click();
    await expect(page.locator("[data-dv-law]")).toContainText("Rear windows: no legal limit");
    await dv.locator('label:has(input[name=dv-body][value="van"])').click();
    await expect(dv.locator('[data-dv-body="van"] img')).toHaveAttribute("src", /body-van\.webp$/); // loaded when picked
    await dv.locator('label:has(input[value="night"])').click();
    await expect(dv.locator('.dv-pov[data-w="rear"] .dv-shot[data-time="night"]')).toBeVisible();
    await dv.locator('label:has(input[name=dv-windscreen][value="cv"])').click();
    await expect(dv).toHaveClass(/sheen-windscreen/);
    await expect(page.locator("[data-dv-law]")).toContainText("meter");
    await srv.close();
  });

  test("protection planner: tapping a panel prices it; the full front pack is used when cheaper", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const pp = page.locator("[data-pp]");
    await pp.locator('[data-pp-car="top"] [data-panel="bonnet"]').click(); // tap the photo
    await pp.locator('label:has(input[value="wings"])').click(); // or the list
    await expect(page.locator("[data-pp-price]")).toHaveText(`£${job("ppf-full-front").prices.hatch.toLocaleString("en-GB")}`);
    await expect(page.locator("[data-pp-lines] li")).toHaveCount(1);
    await expect(page.locator("[data-pp-save]")).toContainText("saves £");
    await expect(pp.locator('[data-panel="bonnet"]').first()).toHaveClass(/on/);
    await page.getByRole("button", { name: "Whole car" }).click();
    await expect(page.locator("[data-pp-price]")).toHaveText(`£${job("ppf-full-car").prices.hatch.toLocaleString("en-GB")}`);
    await page.getByRole("button", { name: "From the side" }).click();
    await expect(page.locator('[data-pp-car="side"]')).toBeVisible();
    await srv.close();
  });

  test("swatch library, see it on the car, and quote message", async ({ page }) => {
    await no3d(page);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.locator('#finish label:has(input[value="chrome"])').click();
    await expect(page.locator("[data-sw]")).toHaveAttribute("data-finish", "chrome");
    await expect(page.locator("[data-sw-fin]")).toHaveText("Chrome");
    await expect(page.locator("[data-sw-note]")).toHaveText(/mirror/);
    await page.locator('#finish label:has(input[value="orange"])').click();
    await expect(page.locator("[data-sw-name]")).toHaveText("Sunset orange");
    await page.locator("[data-sw-try]").click();
    await expect(page.locator('#showroom input[name=wrap][value="orange"]')).toBeChecked();
    await expect(page.locator('#showroom input[name=finish][value="chrome"]')).toBeChecked();
    await page.locator('[data-qt] input[name=car]').fill("Audi A4 Avant");
    await page.locator('[data-qt] label:has(input[value="PPF"])').click();
    const msg = await waText(page.locator("[data-qt-send]"));
    expect(msg).toContain("Car: Audi A4 Avant, hatchback");
    expect(msg).toContain("Work: PPF");
    await srv.close();
  });

  test("model finder: exact jobs first, other posts of the make clearly as others, prices for its size", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-mf-verdict]")).toHaveText("Yes: 1 BMW M3 job below.");
    await page.locator('.mf label:has(input[value="bmwx5"])').click();
    await expect(page.locator("[data-mf-verdict]")).toHaveText(/No BMW X5 posted yet, but 3 other BMWs/);
    await expect(page.locator("[data-mf-all]")).toHaveAttribute("href", /work(\.html)?#bmw$/);
    await expect(page.locator("[data-mf-prices] dd").first()).toContainText(`£${job("tint-rear").prices.suv}`);
    await srv.close();
  });

  test("aftercare card saves a calendar file with the studio's steps", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.locator('#aftercare input[name=fitted]').fill("2026-10-19");
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#aftercare [data-ac-add]").click()]);
    const ics = readFileSync(await download.path(), "utf8");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261023T080000Z");
    await srv.close();
  });

  test("next free bay: demo shows a date; its deposit link explains itself", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-nb-date]")).toHaveText(/^(Wednesday|Thursday|Friday) \d+ October$/);
    await page.getByRole("link", { name: "Pay the deposit" }).click();
    await expect(page.locator("[data-tier-toast]")).toContainText("studio's own Stripe page");
    await srv.close();
  });

  test("next free bay on a client: a fresh sheet shows the day, an old one says message us", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "next_free,updated_at\n2026-10-21,2026-10-19 09:00\n" }));
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-nb-date]")).toHaveText("Wednesday 21 October");
    await expect(page.locator(".nb-off")).toBeHidden();
    await page.unroute(SHEET);
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "next_free,updated_at\n2026-10-21,2026-10-10 09:00\n" }));
    await page.reload();
    await expect(page.locator(".nb-off")).toBeVisible();
    await expect(page.locator("[data-nb-date]")).toHaveText("");
    await srv.close();
  });

  test("prices page: on a phone one vehicle size shows at a time", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const srv = await start(demo);
    await page.goto(srv.base + "/prices");
    const cell = page.locator(".cp-table tbody tr").first().locator("td");
    await expect(cell.locator("visible=true")).toHaveCount(1);
    await expect(cell.locator("visible=true")).toContainText(`£${job("tint-rear").prices.hatch}`);
    await page.locator('.cp-pick label:has(input[value="3"])').click();
    await expect(cell.locator("visible=true")).toContainText(`£${job("tint-rear").prices.suv}`);
    await srv.close();
  });
});

test("the work page opens on the make from the model finder's link", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/work#porsche");
  await expect(page.locator('[data-gallery-chips] button[data-tag="porsche"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-gallery-count]")).toHaveText(/of 3$/);
  await srv.close();
});

test("tint page: every shade, the law for each window and tint prices per vehicle", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/window-tint");
  await expect(page.locator(".tp-ladder li")).toHaveCount(data.tint.shades.length);
  await expect(page.locator(".tp-ladder li", { hasText: "35%" })).toContainText("Not on the front");
  await expect(page.locator(".tp-ladder li", { hasText: "70%" })).toContainText("Front side windows");
  await expect(page.locator(".tp-rules")).toContainText("At least 70%");
  await expect(page.locator(".tp-table tbody tr")).toHaveCount(Object.keys(data.tint.jobs).length);
  await expect(page.locator(".tp-screen")).toContainText("at least 75%");
  await expect(page.locator(".tp-screen figcaption")).toHaveText(["No film", "Chameleon violet 76%"]);
  await expect(page.locator(".tp-lights a")).toHaveAttribute("href", /mot-inspection-manual/);
  await srv.close();
});

test("PPF page: film samples, packs and parts priced from the studio's jobs, close-ups, questions", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/ppf");
  await expect(page.locator(".pf-filmgrid article")).toHaveCount(data.ppfPage.films.length);
  await expect(page.locator(".pf-filmgrid img")).toHaveCount(data.ppfPage.films.filter((f) => f.src).length);
  await expect(page.locator(".pf-packs article")).toHaveCount(data.protection.packs.length);
  await expect(page.locator(".pf-parts dl div", { hasText: "Grille" })).toContainText(`from £${Math.min(...Object.values(job("ppf-grille").prices))}`);
  await expect(page.locator(".pf-parts dl div", { hasText: "Rear lights" })).toBeVisible();
  await expect(page.locator(".pf-photos img")).toHaveCount(data.ppfPage.details.length);
  await expect(page.locator(".pf-qs details")).toHaveCount(data.questions.filter((q) => q.topic === "PPF").length);
  await page.goto(srv.base + "/");
  await expect(page.locator(".pp-more a")).toHaveAttribute("href", /ppf/);
  await srv.close();
});

test("chip test: stones chip the bare paint, never the film", async ({ page }) => {
  await no3d(page);
  const srv = await start(demo);
  await page.goto(srv.base + "/#chip-test");
  await page.locator("[data-ct-drive]").click();
  await expect.poll(async () => Number(await page.locator("[data-ct-paint]").textContent()), { timeout: 8000 }).toBeGreaterThan(0);
  await expect(page.locator("[data-ct-film]")).toHaveText("0");
  await expect(page.locator("#chip-test .ct-price")).toContainText(`from £${Math.min(...Object.values(job("ppf-full-front").prices)).toLocaleString("en-GB")}`);
  await page.locator("[data-ct-reset]").click();
  await expect(page.locator("[data-ct-paint]")).toHaveText("0");
  await srv.close();
});

test("your car, live: the demo car moves on; an unknown code says message us", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-car#DEMO24");
  await expect(page.locator("[data-jt-stage]")).toHaveText("Fitting");
  await expect(page.locator('[data-jt-step][aria-current="step"]')).toContainText("Fitting");
  await page.locator("#jt-code").fill("ZZZZ99");
  await page.getByRole("button", { name: "Show my car" }).click();
  await expect(page.locator("[data-jt-off]")).toBeVisible();
  expect(await waText(page.locator("[data-jt-ask]"))).toContain("ZZZZ99");
  await srv.close();
});

test("your car, live on a client: reads the studio's sheet, fails closed when it's old", async ({ page }) => {
  const srv = await start(client);
  const body = (t) => `code,stage,updated_at,note,photo\nK7M2QX,ready,${t},All done,\n`;
  await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: body("2026-10-19 10:15") }));
  await page.goto(srv.base + "/your-car#k7m2qx");
  await expect(page.locator("[data-jt-stage]")).toHaveText("Ready to collect");
  await expect(page.locator("[data-jt-note]")).toHaveText("All done");
  expect(await waText(page.locator("[data-jt-way]"))).toContain("on my way");
  await page.unroute(SHEET);
  await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: body("2026-10-15 10:15") }));
  await page.reload();
  await expect(page.locator("[data-jt-why]")).toContainText("haven't updated");
  await expect(page.locator("[data-jt-card]")).toBeHidden();
  await srv.close();
});

test("team page shows the team without booking a person", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/team");
  await expect(page.getByText(/Book with/)).toHaveCount(0);
  await expect(page.locator(".team-book")).toBeVisible();
  await expect(page.locator(".yrs").first()).toContainText("years in the trade");
  await srv.close();
});
